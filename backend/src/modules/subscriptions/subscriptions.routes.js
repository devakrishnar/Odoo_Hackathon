import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      where.customerId = customer ? customer.id : 'none';
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: true,
        items: { include: { plan: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Subscriptions retrieved successfully', { subscriptions });
  } catch (err) {
    next(err);
  }
});

// Get Subscription detail with customer ownership verification
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: {
          include: {
            plan: {
              include: { product: true },
            },
          },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            dueDate: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
          },
        },
      },
    });

    if (!subscription) {
      return errorResponse(res, 'Subscription not found', [], 404);
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      if (!customer || subscription.customerId !== customer.id) {
        return errorResponse(res, 'Forbidden: You cannot view subscriptions for other accounts.', [], 403);
      }
    }

    return successResponse(res, 'Subscription details retrieved successfully', { subscription });
  } catch (err) {
    next(err);
  }
});

export default router;

