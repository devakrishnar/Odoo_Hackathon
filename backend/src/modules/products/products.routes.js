import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { plans: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Products retrieved successfully', { products });
  } catch (err) {
    next(err);
  }
});

export default router;
