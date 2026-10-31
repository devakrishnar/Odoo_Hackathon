import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';
import { quotationsService } from './quotations.service.js';

const router = Router();

// GET all quotations (role-aware: customers see their own, staff/admin see all)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      where.customerId = customer ? customer.id : 'none';
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        items: { include: { plan: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Quotations retrieved successfully', { quotations });
  } catch (err) {
    next(err);
  }
});

// GET quotation by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const quotation = await quotationsService.getQuotationById(req.params.id, req.user);
    return successResponse(res, 'Quotation retrieved successfully', { quotation });
  } catch (err) {
    return errorResponse(res, err.message, [], 404);
  }
});

// POST /request — Customer submits a self-service quotation request
router.post('/request', authenticateToken, async (req, res, next) => {
  try {
    const { planId, quantity = 1, notes } = req.body;

    if (!planId) {
      return errorResponse(res, 'Plan ID is required', [], 400);
    }

    const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
    if (!customer) {
      return errorResponse(res, 'Customer record not found for authenticated user', [], 404);
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    });
    if (!plan) {
      return errorResponse(res, 'Selected plan not found', [], 404);
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const unitPrice = Number(plan.price);
    const lineTotal = unitPrice * qty;

    const staffUser = await prisma.user.findFirst({ where: { role: { in: ['STAFF', 'ADMIN'] } } });
    const createdById = staffUser ? staffUser.id : req.user.id;
    const quotationNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customer.id,
        createdById,
        status: 'DRAFT',
        validUntil,
        subtotal: lineTotal,
        taxAmount: 0.0,
        discountAmount: 0.0,
        totalAmount: lineTotal,
        currency: plan.currency || 'USD',
        notes: notes || `Customer online quote request for ${plan.name} (Qty: ${qty})`,
        terms: 'Standard subscription service agreement. Billing cycles apply as configured.',
        items: {
          create: {
            planId: plan.id,
            description: `${plan.product?.name || 'Product'} - ${plan.name}`,
            quantity: qty,
            unitPrice: unitPrice,
            lineTotal: lineTotal,
          },
        },
      },
      include: {
        items: { include: { plan: true } },
      },
    });

    return successResponse(res, 'Quotation request submitted successfully', { quotation }, 201);
  } catch (err) {
    next(err);
  }
});

// POST / — Staff/Admin creates a quotation manually
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const quotation = await quotationsService.createQuotation(req.user.id, req.body);
    return successResponse(res, 'Quotation created successfully', { quotation }, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

// POST /:id/accept — Customer accepts an issued quotation
router.post('/:id/accept', authenticateToken, async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', [], 404);
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      if (!customer || quotation.customerId !== customer.id) {
        return errorResponse(res, 'Forbidden: You cannot accept quotations for another customer.', [], 403);
      }
    }

    if (quotation.status !== 'SENT') {
      return errorResponse(
        res,
        `Quotation cannot be accepted because it is currently ${quotation.status}. Only quotations sent by staff can be accepted.`,
        [],
        400
      );
    }

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: 'ACCEPTED' },
    });

    return successResponse(res, 'Quotation accepted successfully', { quotation: updated });
  } catch (err) {
    next(err);
  }
});

// POST /:id/confirm — Staff/Admin marks a quotation as accepted
router.post('/:id/confirm', authenticateToken, async (req, res, next) => {
  try {
    const quotation = await quotationsService.updateStatus(req.params.id, 'ACCEPTED', req.user);
    return successResponse(res, 'Quotation confirmed and accepted', { quotation });
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

// PATCH /:id/status — Staff/Admin updates quotation status
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const quotation = await quotationsService.updateStatus(req.params.id, status, req.user);
    return successResponse(res, `Quotation marked as ${status}`, { quotation });
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

export default router;
