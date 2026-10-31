import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      where.customerId = customer ? customer.id : 'none';
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Invoices retrieved successfully', { invoices });
  } catch (err) {
    next(err);
  }
});

export default router;
