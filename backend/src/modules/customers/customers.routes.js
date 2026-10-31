import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeRoles, enforceCustomerOwnership } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
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

// Update customer profile
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
