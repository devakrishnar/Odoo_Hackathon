import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateToken, authorizeRoles, enforceCustomerOwnership } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

// Zod schema for creating customer (Admin/Staff)
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Valid email address is required'),
  companyName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Get customers (Admin & Staff get all; Customer gets only own profile)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: req.user.id },
      });
      return successResponse(res, 'Customer profile retrieved', { customers: customer ? [customer] : [] });
    }

    const { search, status, page, limit } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { companyName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const take = limit ? parseInt(limit) : undefined;
    const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : undefined;

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            select: { id: true, subscriptionNumber: true, status: true, totalAmount: true, createdAt: true },
          },
          invoices: {
            select: { id: true, invoiceNumber: true, status: true, totalAmount: true, paidAmount: true, balanceAmount: true },
          },
          payments: {
            select: { id: true, paymentNumber: true, amount: true, status: true, paidAt: true },
          },
        },
      }),
    ]);

    return successResponse(res, 'Customers list retrieved', {
      customers,
      pagination: {
        total,
        page: page ? parseInt(page) : 1,
        limit: take || total,
        totalPages: take ? Math.ceil(total / take) : 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Create Customer (Admin & Staff)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const validated = createCustomerSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({
      where: { email: validated.email.toLowerCase() },
    });
    if (existing) {
      return errorResponse(res, 'Customer with this email already exists', [], 409);
    }

    const customer = await prisma.customer.create({
      data: {
        ...validated,
        email: validated.email.toLowerCase(),
      },
    });

    return successResponse(res, 'Customer created successfully', { customer }, 201);
  } catch (err) {
    next(err);
  }
});

// Update Customer (Admin & Staff)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, companyName, email, phone, taxId, address, city, state, postalCode, country, status, notes } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Customer not found', [], 404);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(companyName !== undefined && { companyName }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone !== undefined && { phone }),
        ...(taxId !== undefined && { taxId }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return successResponse(res, 'Customer updated successfully', { customer: updated });
  } catch (err) {
    next(err);
  }
});

// Get current authenticated customer profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!customer) {
      return errorResponse(res, 'Customer profile not found for authenticated user', [], 404);
    }

    return successResponse(res, 'Customer profile retrieved', { customer });
  } catch (err) {
    next(err);
  }
});

// Update customer profile (Self)
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return errorResponse(res, 'Customer profile not found', [], 404);
    }

    const { name, companyName, phone, taxId, address, city, state, postalCode, country } = req.body;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: name !== undefined ? name : customer.name,
        companyName: companyName !== undefined ? companyName : customer.companyName,
        phone: phone !== undefined ? phone : customer.phone,
        taxId: taxId !== undefined ? taxId : customer.taxId,
        address: address !== undefined ? address : customer.address,
        city: city !== undefined ? city : customer.city,
        state: state !== undefined ? state : customer.state,
        postalCode: postalCode !== undefined ? postalCode : customer.postalCode,
        country: country !== undefined ? country : customer.country,
      },
    });

    return successResponse(res, 'Customer profile updated successfully', { customer: updated });
  } catch (err) {
    next(err);
  }
});

// Change Password for authenticated user
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;

router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', [], 400);
    }

    if (newPassword.length < 9 || !passwordRegex.test(newPassword)) {
      return errorResponse(
        res,
        'New password must be more than 8 characters and contain at least one uppercase letter, one lowercase letter, and one special character',
        [],
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return errorResponse(res, 'User not found', [], 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', [], 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return successResponse(res, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
});

// Get customer detail by ID
router.get('/:id', authenticateToken, enforceCustomerOwnership('id'), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        subscriptions: {
          include: {
            items: { include: { plan: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', [], 404);
    }

    // Calculate financial summary
    const totalInvoices = customer.invoices.length;
    const totalBilled = customer.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const totalPaid = customer.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalOutstanding = customer.invoices
      .filter((inv) => ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.balanceAmount || inv.totalAmount || 0), 0);

    return successResponse(res, 'Customer details retrieved', {
      customer: {
        ...customer,
        summary: {
          totalInvoices,
          totalBilled,
          totalPaid,
          totalOutstanding,
          activeSubscriptions: customer.subscriptions.filter((s) => s.status === 'ACTIVE').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
