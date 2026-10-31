import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Discounts retrieved successfully', { discounts });
  } catch (err) {
    next(err);
  }
});

export default router;
