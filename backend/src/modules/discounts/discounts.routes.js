import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

const discountSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  name: z.string().min(1, 'Discount name is required'),
  description: z.string().optional().nullable(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  value: z.number().min(0, 'Value must be positive'),
  maxDiscountAmount: z.number().min(0).optional().nullable(),
  validFrom: z.string().or(z.date()),
  validTo: z.string().or(z.date()),
  active: z.boolean().optional().default(true),
  usageLimit: z.number().int().min(1).optional().nullable(),
});

// GET /api/discounts - List all discounts (Admin & Staff)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const enrichedDiscounts = discounts.map(d => {
      let computedStatus = 'ACTIVE';
      if (!d.active) {
        computedStatus = 'INACTIVE';
      } else if (new Date(d.validTo) < now) {
        computedStatus = 'EXPIRED';
      } else if (d.usageLimit !== null && d.usedCount >= d.usageLimit) {
        computedStatus = 'EXHAUSTED';
      }
      return {
        ...d,
        computedStatus,
      };
    });

    return successResponse(res, 'Discounts retrieved successfully', { discounts: enrichedDiscounts });
  } catch (err) {
    next(err);
  }
});

// GET /api/discounts/:id - Single discount
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const discount = await prisma.discount.findUnique({
      where: { id: req.params.id },
    });

    if (!discount) {
      return errorResponse(res, 'Discount not found', [], 404);
    }

    return successResponse(res, 'Discount retrieved successfully', { discount });
  } catch (err) {
    next(err);
  }
});

// POST /api/discounts - Create discount (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const validated = discountSchema.parse({
      ...req.body,
      value: Number(req.body.value),
      maxDiscountAmount: req.body.maxDiscountAmount != null && req.body.maxDiscountAmount !== '' ? Number(req.body.maxDiscountAmount) : null,
      usageLimit: req.body.usageLimit != null && req.body.usageLimit !== '' ? Number(req.body.usageLimit) : null,
      validFrom: req.body.validFrom ? new Date(req.body.validFrom) : new Date(),
      validTo: req.body.validTo ? new Date(req.body.validTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const existing = await prisma.discount.findUnique({
      where: { code: validated.code.toUpperCase() },
    });
    if (existing) {
      return errorResponse(res, 'Discount code already exists', [], 409);
    }

    const discount = await prisma.discount.create({
      data: {
        ...validated,
        code: validated.code.toUpperCase(),
        validFrom: new Date(validated.validFrom),
        validTo: new Date(validated.validTo),
      },
    });

    return successResponse(res, 'Discount created successfully', { discount }, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/discounts/:id - Update discount (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, type, value, maxDiscountAmount, validFrom, validTo, active, usageLimit } = req.body;

    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Discount not found', [], 404);
    }

    if (code && code.toUpperCase() !== existing.code) {
      const codeCheck = await prisma.discount.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (codeCheck) {
        return errorResponse(res, 'Discount code already exists', [], 409);
      }
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(value !== undefined && { value: Number(value) }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount: maxDiscountAmount != null ? Number(maxDiscountAmount) : null }),
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validTo && { validTo: new Date(validTo) }),
        ...(active !== undefined && { active }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit != null ? Number(usageLimit) : null }),
      },
    });

    return successResponse(res, 'Discount updated successfully', { discount: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/discounts/:id/status - Toggle active (Admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Discount not found', [], 404);
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: { active: Boolean(active) },
    });

    return successResponse(res, `Discount ${updated.active ? 'activated' : 'deactivated'} successfully`, { discount: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/discounts/:id - Delete discount (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Discount not found', [], 404);
    }

    await prisma.discount.delete({ where: { id } });
    return successResponse(res, 'Discount deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
