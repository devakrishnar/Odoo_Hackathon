import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  code: z.string().min(1, 'Product code is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
});

// GET /api/products - List products with plans/variants
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        plans: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Products retrieved successfully', { products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id - Single product with plans
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        plans: true,
      },
    });

    if (!product) {
      return errorResponse(res, 'Product not found', [], 404);
    }

    return successResponse(res, 'Product retrieved successfully', { product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products - Create product (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const validated = productSchema.parse(req.body);

    const existing = await prisma.product.findUnique({
      where: { code: validated.code.toUpperCase() },
    });
    if (existing) {
      return errorResponse(res, 'Product code already exists', [], 409);
    }

    const product = await prisma.product.create({
      data: {
        ...validated,
        code: validated.code.toUpperCase(),
      },
      include: { plans: true },
    });

    return successResponse(res, 'Product created successfully', { product }, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, category, active } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Product not found', [], 404);
    }

    if (code && code.toUpperCase() !== existing.code) {
      const codeCheck = await prisma.product.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (codeCheck) {
        return errorResponse(res, 'Product code already exists', [], 409);
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(active !== undefined && { active }),
      },
      include: { plans: true },
    });

    return successResponse(res, 'Product updated successfully', { product: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id/status - Toggle active/deactivate (Admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Product not found', [], 404);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: Boolean(active) },
    });

    return successResponse(res, `Product ${updated.active ? 'activated' : 'deactivated'} successfully`, { product: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id - Delete product if not referenced
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id }, include: { plans: true } });
    if (!existing) {
      return errorResponse(res, 'Product not found', [], 404);
    }

    // Check if plans have active subscriptions or quotations
    const planIds = existing.plans.map(p => p.id);
    const subCount = await prisma.subscriptionItem.count({ where: { planId: { in: planIds } } });
    if (subCount > 0) {
      // Soft-deactivate instead
      const deactivated = await prisma.product.update({
        where: { id },
        data: { active: false },
      });
      return successResponse(res, 'Product has active subscriptions so it was deactivated instead of deleted', { product: deactivated });
    }

    await prisma.product.delete({ where: { id } });
    return successResponse(res, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
