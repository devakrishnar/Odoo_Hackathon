import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/dashboard-metrics', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const [totalCustomers, activeSubscriptions, totalInvoices, totalPayments] = await Promise.all([
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.count(),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return successResponse(res, 'Dashboard metrics retrieved', {
      totalCustomers,
      activeSubscriptions,
      totalInvoices,
      totalRevenue: totalPayments._sum.amount || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
