import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

// Password policy matching auth.controller.js (official problem statement):
// - More than 8 characters (minimum 9)
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;

const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email address is required'),
  password: z
    .string()
    .min(9, 'Password must be more than 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
    ),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'INACTIVE'" }),
  }),
});

// Shared select fields — never expose passwordHash
const userSelectFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
};

// ─────────────────────────────────────────────────
// GET /api/users — List all users (Admin only)
// ─────────────────────────────────────────────────
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelectFields,
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Users retrieved successfully', { users });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/users — Create a new STAFF account (Admin only)
// ─────────────────────────────────────────────────
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    // Validate input fields
    const validated = createStaffSchema.parse(req.body);

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(res, 'A user with this email already exists.', [], 409);
    }

    // Hash password using existing bcrypt implementation
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // Create user — ALWAYS set role to STAFF on the backend, never trust frontend
    const newUser = await prisma.user.create({
      data: {
        email: validated.email.toLowerCase(),
        passwordHash,
        firstName: validated.firstName.trim(),
        lastName: validated.lastName.trim(),
        role: 'STAFF', // Strictly enforced on backend
      },
      select: userSelectFields,
    });

    return successResponse(res, 'Staff account created successfully', { user: newUser }, 201);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// PATCH /api/users/:id/status — Activate/Deactivate staff (Admin only)
// ─────────────────────────────────────────────────
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate requested status
    const { status } = updateStatusSchema.parse(req.body);

    // Prevent admin from changing their own status
    if (req.user.id === id) {
      return errorResponse(res, 'You cannot change your own account status.', [], 403);
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });

    if (!targetUser) {
      return errorResponse(res, 'User not found.', [], 404);
    }

    // Do not allow modifying another ADMIN account through staff management
    if (targetUser.role === 'ADMIN') {
      return errorResponse(
        res,
        'Cannot modify another admin account through staff management.',
        [],
        403
      );
    }

    // Update the status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: userSelectFields,
    });

    return successResponse(
      res,
      `User status updated to ${status} successfully`,
      { user: updatedUser }
    );
  } catch (err) {
    next(err);
  }
});

export default router;
