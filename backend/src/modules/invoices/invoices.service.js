import prisma from '../../config/db.js';
import { generateInvoiceNumber } from '../../utils/invoiceNumber.js';
import { addDays } from 'date-fns';

export const invoicesService = {
  /**
   * List invoices with role filters and search
   */
  async listInvoices(user, query = {}) {
    const where = {};
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: user.id } });
      where.customerId = customer ? customer.id : 'none';
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        subscription: true,
        items: {
          include: { plan: { include: { product: true } } },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Check for derived overdue status
    const now = new Date();
    return invoices.map((inv) => {
      const isPastDue = new Date(inv.dueDate) < now && Number(inv.balanceAmount) > 0 && inv.status !== 'PAID';
      return {
        ...inv,
        isOverdue: isPastDue,
        displayStatus: isPastDue && inv.status !== 'CANCELLED' ? 'OVERDUE' : inv.status,
      };
    });
  },

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id, user) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: true,
        items: {
          include: { plan: { include: { product: true } } },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: user.id } });
      if (!customer || invoice.customerId !== customer.id) {
        throw new Error('Unauthorized to view this invoice');
      }
    }

    const isPastDue = new Date(invoice.dueDate) < new Date() && Number(invoice.balanceAmount) > 0 && invoice.status !== 'PAID';

    return {
      ...invoice,
      isOverdue: isPastDue,
      displayStatus: isPastDue && invoice.status !== 'CANCELLED' ? 'OVERDUE' : invoice.status,
    };
  },

  /**
   * Generate invoice from due subscription with idempotency check
   */
  async generateFromSubscription(subscriptionId, user) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        items: { include: { plan: true } },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new Error(`Cannot bill subscription with status: ${subscription.status}`);
    }

    const billingPeriodStart = subscription.currentPeriodStart;
    const billingPeriodEnd = subscription.currentPeriodEnd;

    // Check idempotency: unique constraint check for (subscriptionId, billingPeriodStart, billingPeriodEnd)
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        subscriptionId: subscription.id,
        billingPeriodStart,
        billingPeriodEnd,
      },
    });

    if (existingInvoice) {
      return {
        invoice: existingInvoice,
        alreadyGenerated: true,
        message: 'Invoice already exists for this subscription billing period (idempotent)',
      };
    }

    const issueDate = new Date();
    const dueDate = addDays(issueDate, 14); // 14 days net
    const invoiceNumber = generateInvoiceNumber();

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const invoiceItemsData = subscription.items.map((item) => {
      const unitPrice = Number(item.unitPrice);
      const qty = item.quantity;
      const rawTotal = unitPrice * qty;
      const disc = Number(item.discountAmount || 0);
      const taxRate = Number(item.taxPercent || 0);
      const tax = (rawTotal - disc) * (taxRate / 100);
      const lineTotal = rawTotal - disc + tax;

      subtotal += rawTotal;
      discountAmount += disc;
      taxAmount += tax;

      return {
        planId: item.planId,
        description: item.plan?.name ? `${item.plan.name} (Recurring)` : 'Subscription Service',
        quantity: qty,
        unitPrice,
        taxPercent: taxRate,
        discountAmount: disc,
        lineTotal: Number(lineTotal.toFixed(2)),
      };
    });

    const totalAmount = Number((subtotal - discountAmount + taxAmount).toFixed(2));
    const balanceAmount = totalAmount;

    const newInvoice = await prisma.$transaction(async (tx) => {
      return tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: subscription.customerId,
          subscriptionId: subscription.id,
          status: 'ISSUED', // Ready for customer
          issueDate,
          dueDate,
          billingPeriodStart,
          billingPeriodEnd,
          subtotal: Number(subtotal.toFixed(2)),
          discountAmount: Number(discountAmount.toFixed(2)),
          taxAmount: Number(taxAmount.toFixed(2)),
          totalAmount,
          paidAmount: 0,
          balanceAmount,
          currency: subscription.currency || 'USD',
          items: {
            create: invoiceItemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    return {
      invoice: newInvoice,
      alreadyGenerated: false,
      message: 'Invoice generated successfully',
    };
  },

  /**
   * Update invoice status (e.g. DRAFT -> ISSUED / CANCELLED)
   */
  async updateStatus(id, status, user) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');

    return prisma.invoice.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });
  },
};
