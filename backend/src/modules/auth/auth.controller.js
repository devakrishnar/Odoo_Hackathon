import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { config } from '../../config/env.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional().default('STAFF'),
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

    const user = await prisma.user.create({
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

    return successResponse(res, 'User registered successfully', { user }, 201);
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
