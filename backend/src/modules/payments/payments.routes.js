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

// Record a payment against an invoice with ownership validation
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

    // If role is CUSTOMER, ensure customer owns this invoice
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
          transactionReference: transactionReference || `TXN-${Date.now()}`,
          notes: notes || `Payment recorded for Invoice ${invoice.invoiceNumber}`,
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

    return successResponse(res, 'Payment recorded successfully', result, 201);
  } catch (err) {
    next(err);
  }
});


export default router;
