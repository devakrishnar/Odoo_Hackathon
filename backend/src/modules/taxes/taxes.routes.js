import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const router = Router();

// In-memory tax rule repository (persisted in server runtime)
let taxes = [
  {
    id: 'tax-1',
    name: 'Standard GST / VAT',
    rate: 18.0,
    country: 'Global / Standard',
    type: 'PERCENTAGE',
    status: 'ACTIVE',
    description: 'Standard value-added tax applied to recurring SaaS plans.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tax-2',
    name: 'Reduced Digital Service Tax',
    rate: 5.0,
    country: 'Regional / Tech Exempt',
    type: 'PERCENTAGE',
    status: 'ACTIVE',
    description: 'Concessional tax rate for educational and certified NGO subscriptions.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tax-3',
    name: 'Zero Tax (Export / B2B)',
    rate: 0.0,
    country: 'International B2B',
    type: 'ZERO_RATED',
    status: 'ACTIVE',
    description: 'Reverse charge applicable for cross-border enterprise customers.',
    createdAt: new Date().toISOString(),
  },
];

// GET /api/taxes - List all tax rules (Admin & Staff)
router.get('/', authenticateToken, async (req, res) => {
  return successResponse(res, 'Tax rules retrieved successfully', { taxes });
});

// GET /api/taxes/:id - Get tax rule
router.get('/:id', authenticateToken, async (req, res) => {
  const tax = taxes.find((t) => t.id === req.params.id);
  if (!tax) {
    return errorResponse(res, 'Tax rule not found', [], 404);
  }
  return successResponse(res, 'Tax rule retrieved', { tax });
});

// POST /api/taxes - Create tax rule (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { name, rate, country, type, description } = req.body;

  if (!name || rate === undefined || rate === null) {
    return errorResponse(res, 'Tax name and rate are required', [], 400);
  }

  const numRate = Number(rate);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return errorResponse(res, 'Tax rate must be a percentage between 0 and 100', [], 400);
  }

  const newTax = {
    id: `tax-${Date.now()}`,
    name: name.trim(),
    rate: numRate,
    country: country ? country.trim() : 'Global',
    type: type || 'PERCENTAGE',
    status: 'ACTIVE',
    description: description || '',
    createdAt: new Date().toISOString(),
  };

  taxes.unshift(newTax);
  return successResponse(res, 'Tax rule created successfully', { tax: newTax }, 201);
});

// PUT /api/taxes/:id - Update tax rule (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const index = taxes.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, 'Tax rule not found', [], 404);
  }

  const { name, rate, country, type, status, description } = req.body;

  if (rate !== undefined && (isNaN(Number(rate)) || Number(rate) < 0 || Number(rate) > 100)) {
    return errorResponse(res, 'Tax rate must be a percentage between 0 and 100', [], 400);
  }

  taxes[index] = {
    ...taxes[index],
    ...(name && { name: name.trim() }),
    ...(rate !== undefined && { rate: Number(rate) }),
    ...(country && { country: country.trim() }),
    ...(type && { type }),
    ...(status && { status }),
    ...(description !== undefined && { description }),
  };

  return successResponse(res, 'Tax rule updated successfully', { tax: taxes[index] });
});

// DELETE /api/taxes/:id - Delete tax rule (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const index = taxes.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, 'Tax rule not found', [], 404);
  }

  taxes.splice(index, 1);
  return successResponse(res, 'Tax rule deleted successfully');
});

export default router;

