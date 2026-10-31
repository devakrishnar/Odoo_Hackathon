import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

const planSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Plan name is required'),
  code: z.string().min(1, 'Plan code is required'),
  description: z.string().optional().nullable(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).default('MONTHLY'),
  price: z.number().min(0, 'Price must be positive or zero'),
  currency: z.string().default('USD'),
  trialDays: z.number().int().min(0).default(0),
  active: z.boolean().optional().default(true),
});

// GET /api/plans - List all plans (Accessible to authenticated users)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { productId, active } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (active !== undefined) where.active = active === 'true';

    const plans = await prisma.plan.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, code: true, category: true, active: true },
        },
      },
      orderBy: { price: 'asc' },
    });
    return successResponse(res, 'Subscription plans retrieved successfully', { plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/:id - Single plan
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
      include: { product: true },
    });

    if (!plan) {
      return errorResponse(res, 'Plan not found', [], 404);
    }

    return successResponse(res, 'Plan retrieved successfully', { plan });
  } catch (err) {
    next(err);
  }
});

// POST /api/plans - Create plan (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const validated = planSchema.parse({
      ...req.body,
      price: Number(req.body.price),
      trialDays: req.body.trialDays != null ? Number(req.body.trialDays) : 0,
    });

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: validated.productId } });
    if (!product) {
      return errorResponse(res, 'Associated product not found', [], 404);
    }

    // Check code unique
    const existing = await prisma.plan.findUnique({
      where: { code: validated.code.toUpperCase() },
    });
    if (existing) {
      return errorResponse(res, 'Plan code already exists', [], 409);
    }

    const plan = await prisma.plan.create({
      data: {
        ...validated,
        code: validated.code.toUpperCase(),
        price: validated.price,
      },
      include: { product: true },
    });

    return successResponse(res, 'Plan created successfully', { plan }, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/plans/:id - Update plan (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, billingCycle, price, currency, trialDays, active, productId } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Plan not found', [], 404);
    }

    if (code && code.toUpperCase() !== existing.code) {
      const codeCheck = await prisma.plan.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (codeCheck) {
        return errorResponse(res, 'Plan code already exists', [], 409);
      }
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(billingCycle && { billingCycle }),
        ...(price !== undefined && { price: Number(price) }),
        ...(currency && { currency }),
        ...(trialDays !== undefined && { trialDays: Number(trialDays) }),
        ...(active !== undefined && { active }),
        ...(productId && { productId }),
      },
      include: { product: true },
    });

    return successResponse(res, 'Plan updated successfully', { plan: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/plans/:id/status - Toggle active (Admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Plan not found', [], 404);
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: { active: Boolean(active) },
      include: { product: true },
    });

    return successResponse(res, `Plan ${updated.active ? 'activated' : 'deactivated'} successfully`, { plan: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plans/:id - Delete or de-activate plan (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Plan not found', [], 404);
    }

    const hasSub = await prisma.subscriptionItem.count({ where: { planId: id } });
    if (hasSub > 0) {
      const deactivated = await prisma.plan.update({
        where: { id },
        data: { active: false },
      });
      return successResponse(res, 'Plan is used in subscriptions and has been deactivated instead of deleted', { plan: deactivated });
    }

    await prisma.plan.delete({ where: { id } });
    return successResponse(res, 'Plan deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
