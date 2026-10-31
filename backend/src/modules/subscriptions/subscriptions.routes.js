import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';
import { subscriptionsService } from './subscriptions.service.js';

const router = Router();

// GET all subscriptions (role-aware: customers see their own, staff/admin see all)
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

// GET subscription detail by ID (with customer ownership verification)
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

// POST convert quotation to subscription
router.post('/convert/:quotationId', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.convertFromQuotation(req.params.quotationId, req.user);
    return successResponse(res, 'Quotation converted into active subscription successfully', { subscription }, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

// POST direct subscription creation
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.createSubscription(req.body);
    return successResponse(res, 'Subscription created successfully', { subscription }, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

// POST lifecycle action (e.g., /api/subscriptions/:id/pause, resume, renew, cancel)
router.post('/:id/:action', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { action } = req.params;
    const { reason } = req.body;
    const subscription = await subscriptionsService.updateStatus(req.params.id, action, req.user, reason);
    return successResponse(res, `Subscription ${action} action applied successfully`, { subscription });
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

export default router;
