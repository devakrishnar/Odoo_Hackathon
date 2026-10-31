import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { config } from '../../config/env.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(9, 'Password must be more than 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
    ),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional().default('STAFF'),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  expectedRole: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional(),
});

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', [], 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    let customerProfile = null;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          passwordHash,
          firstName: validated.firstName,
          lastName: validated.lastName,
          role: validated.role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      if (validated.role === 'CUSTOMER') {
        // Also check if customer profile exists with this email
        const existingCustomer = await tx.customer.findUnique({
          where: { email: validated.email },
        });

        if (existingCustomer) {
          customerProfile = await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              userId: newUser.id,
              name: `${validated.firstName} ${validated.lastName}`.trim(),
              companyName: validated.companyName || existingCustomer.companyName,
              phone: validated.phone || existingCustomer.phone,
              address: validated.address || existingCustomer.address,
            },
          });
        } else {
          customerProfile = await tx.customer.create({
            data: {
              userId: newUser.id,
              name: `${validated.firstName} ${validated.lastName}`.trim(),
              email: validated.email,
              companyName: validated.companyName || null,
              phone: validated.phone || null,
              address: validated.address || null,
            },
          });
        }
      }

      return newUser;
    });

    return successResponse(
      res,
      'User registered successfully',
      {
        user: {
          ...user,
          customerProfile,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, expectedRole } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid email or password', [], 401);
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Account is inactive or suspended', [], 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', [], 401);
    }

    if (expectedRole && user.role !== expectedRole) {
      return errorResponse(
        res,
        `Access denied. You cannot log in here with the role '${user.role}'.`,
        [],
        403
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerProfile?.id || null,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    return successResponse(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerProfile: user.customerProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        customerProfile: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', [], 404);
    }

    return successResponse(res, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return successResponse(res, 'Logged out successfully');
};

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return successResponse(
        res,
        'If your email is registered, password reset instructions have been generated.',
        { email }
      );
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'PASSWORD_RESET' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    return successResponse(
      res,
      'Password reset instructions sent. Token provided for development verification.',
      {
        resetToken,
        email: user.email,
      }
    );
  } catch (error) {
    next(error);
  }
};

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(9, 'Password must be more than 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
    ),
});

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return errorResponse(res, 'Invalid or expired password reset token', [], 400);
    }

    if (decoded.purpose !== 'PASSWORD_RESET') {
      return errorResponse(res, 'Invalid token purpose', [], 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash },
    });

    return successResponse(res, 'Password has been reset successfully. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

