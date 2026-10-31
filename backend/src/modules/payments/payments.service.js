import prisma from '../../config/db.js';
import { generatePaymentNumber } from '../../utils/invoiceNumber.js';

export const paymentsService = {
  /**
   * List payments with role-based filtering
   */
  async listPayments(user, query = {}) {
    const where = {};
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: user.id } });
      where.customerId = customer ? customer.id : 'none';
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.invoiceId) {
      where.invoiceId = query.invoiceId;
    }

    return prisma.payment.findMany({
      where,
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Record a payment against an invoice
   */
  async recordPayment(data, user) {
    const {
      invoiceId,
      amount,
      paymentMethod = 'MANUAL',
      paymentDate = new Date(),
      transactionReference,
      notes,
    } = data;

    if (!invoiceId) throw new Error('Invoice ID is required');
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Valid positive payment amount is required');
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === 'PAID') {
      throw new Error('Invoice is already fully paid');
    }

    const currentPaid = Number(invoice.paidAmount);
    const totalAmount = Number(invoice.totalAmount);
    const newPaidAmount = Number((currentPaid + paymentAmount).toFixed(2));
    const newBalance = Math.max(0, Number((totalAmount - newPaidAmount).toFixed(2)));

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const paymentNumber = generatePaymentNumber();

    return prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          amount: paymentAmount,
          currency: invoice.currency || 'USD',
          paymentMethod: paymentMethod.toUpperCase(),
          status: 'COMPLETED',
          transactionReference: transactionReference || paymentNumber,
          paidAt: new Date(paymentDate),
          notes,
        },
        include: {
          customer: true,
          invoice: true,
        },
      });

      // Update invoice paid & balance amounts and status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          status: newStatus,
        },
      });

      return { payment, invoice: updatedInvoice };
    });
  },
};
