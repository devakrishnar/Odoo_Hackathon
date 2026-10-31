import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Users retrieved successfully', { users });
  } catch (err) {
    next(err);
  }
});

export default router;
