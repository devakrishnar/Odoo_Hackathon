import { Router } from 'express';
import { authenticateToken, authorizeRoles, enforceCustomerOwnership } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

// Get customers (Admin & Staff get all; Customer gets only own profile)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: req.user.id },
      });
      return successResponse(res, 'Customer profile retrieved', { customers: customer ? [customer] : [] });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: { select: { id: true, status: true, totalAmount: true } },
      },
    });
    return successResponse(res, 'Customers list retrieved', { customers });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateToken, enforceCustomerOwnership('id'), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        subscriptions: true,
        invoices: true,
        quotations: true,
      },
    });
    return successResponse(res, 'Customer details retrieved', { customer });
  } catch (err) {
    next(err);
  }
});

export default router;
