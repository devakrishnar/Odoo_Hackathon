import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      include: { product: true },
      orderBy: { price: 'asc' },
    });
    return successResponse(res, 'Subscription plans retrieved successfully', { plans });
  } catch (err) {
    next(err);
  }
});

export default router;
