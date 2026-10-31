import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';
import { paymentsService } from './payments.service.js';

const router = Router();

// GET all payments (role-aware: customers see their own, staff/admin see all)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      where.customerId = customer ? customer.id : 'none';
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Payments retrieved successfully', { payments });
  } catch (err) {
    next(err);
  }
});

// POST / — Record a payment against an invoice (all authenticated roles; customers validated for ownership)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod = 'CREDIT_CARD', notes, transactionReference } = req.body;

    if (!invoiceId || !amount) {
      return errorResponse(res, 'Invoice ID and payment amount are required', [], 400);
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return errorResponse(res, 'Amount must be a positive number', [], 400);
    }

    // Retrieve invoice and verify ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404);
    }

    // Customers can only pay their own invoices
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      if (!customer || invoice.customerId !== customer.id) {
        return errorResponse(res, 'Forbidden: You can only make payments on your own invoices.', [], 403);
      }
    }

    if (invoice.status === 'PAID') {
      return errorResponse(res, 'Invoice has already been paid in full', [], 400);
    }

    const currentBalance = Number(invoice.balanceAmount);
    if (payAmount > currentBalance) {
      return errorResponse(
        res,
        `Payment amount ($${payAmount.toFixed(2)}) cannot exceed current outstanding balance ($${currentBalance.toFixed(2)})`,
        [],
        400
      );
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isCustomer = req.user.role === 'CUSTOMER';

    // If submitted by CUSTOMER: Record as PENDING verification without modifying invoice balance
    if (isCustomer) {
      const payment = await prisma.payment.create({
        data: {
          paymentNumber,
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          amount: payAmount,
          currency: invoice.currency || 'USD',
          paymentMethod,
          status: 'PENDING',
          transactionReference: transactionReference || `TXN-REF-${Date.now()}`,
          notes: notes || `Customer manual payment submission for Invoice ${invoice.invoiceNumber}`,
          paidAt: new Date(),
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
              dueDate: true,
            },
          },
        },
      });

      return successResponse(
        res,
        'Your payment details have been submitted. The payment will be reflected in your invoice after verification by the finance team.',
        { payment, status: 'PENDING' },
        201
      );
    }

    // If recorded by STAFF/ADMIN: Reconcile immediately as COMPLETED
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          amount: payAmount,
          currency: invoice.currency || 'USD',
          paymentMethod,
          status: 'COMPLETED',
          transactionReference: transactionReference || `TXN-STAFF-${Date.now()}`,
          notes: notes || `Direct manual payment recorded by staff for Invoice ${invoice.invoiceNumber}`,
          paidAt: new Date(),
        },
      });

      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: payAmount,
        },
      });

      const updatedPaid = Number(invoice.paidAmount) + payAmount;
      const updatedBalance = currentBalance - payAmount;
      const updatedStatus = updatedBalance <= 0.001 ? 'PAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: updatedPaid,
          balanceAmount: Math.max(0, updatedBalance),
          status: updatedStatus,
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return successResponse(res, 'Payment recorded and verified successfully', result, 201);
  } catch (err) {
    next(err);
  }
});

// Staff verifies and confirms a pending payment notification
router.post('/:id/verify', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      return errorResponse(res, 'Forbidden: Only finance staff or admin can verify payments.', [], 403);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true },
    });

    if (!payment) {
      return errorResponse(res, 'Payment record not found', [], 404);
    }

    if (payment.status !== 'PENDING') {
      return errorResponse(res, `Payment is already ${payment.status.toLowerCase()} and cannot be verified again.`, [], 400);
    }

    if (!payment.invoiceId || !payment.invoice) {
      return errorResponse(res, 'No associated invoice found for this payment', [], 400);
    }

    const invoice = payment.invoice;
    const payAmount = Number(payment.amount);
    const currentBalance = Number(invoice.balanceAmount);

    if (payAmount > currentBalance + 0.001) {
      return errorResponse(
        res,
        `Cannot verify payment: Payment amount ($${payAmount.toFixed(2)}) exceeds current outstanding balance ($${currentBalance.toFixed(2)})`,
        [],
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const verifiedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          notes: (payment.notes ? `${payment.notes} | ` : '') + `Verified by ${req.user.email} on ${new Date().toISOString()}`,
        },
      });

      await tx.paymentAllocation.create({
        data: {
          paymentId: verifiedPayment.id,
          invoiceId: invoice.id,
          amount: payAmount,
        },
      });

      const updatedPaid = Number(invoice.paidAmount) + payAmount;
      const updatedBalance = Math.max(0, currentBalance - payAmount);
      const updatedStatus = updatedBalance <= 0.001 ? 'PAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: updatedPaid,
          balanceAmount: updatedBalance,
          status: updatedStatus,
        },
      });

      return { payment: verifiedPayment, invoice: updatedInvoice };
    });

    return successResponse(res, 'Payment verified and confirmed successfully. Invoice balance updated.', result);
  } catch (err) {
    next(err);
  }
});

// Staff rejects an invalid payment notification
router.post('/:id/reject', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      return errorResponse(res, 'Forbidden: Only finance staff or admin can reject payments.', [], 403);
    }

    const { reason } = req.body;
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
    });

    if (!payment) {
      return errorResponse(res, 'Payment record not found', [], 404);
    }

    if (payment.status !== 'PENDING') {
      return errorResponse(res, `Payment is already ${payment.status.toLowerCase()} and cannot be rejected.`, [], 400);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        notes: (payment.notes ? `${payment.notes} | ` : '') + `Rejected: ${reason || 'Invalid transaction or funds not received'}`,
      },
    });

    return successResponse(res, 'Payment notification marked as rejected. Invoice balance remains unchanged.', { payment: updatedPayment });
  } catch (err) {
    next(err);
  }
});

export default router;
