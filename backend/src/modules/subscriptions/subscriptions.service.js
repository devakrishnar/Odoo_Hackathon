import prisma from '../../config/db.js';
import { generateSubscriptionNumber } from '../../utils/invoiceNumber.js';
import { addDays, addMonths, addYears } from 'date-fns';

export const subscriptionsService = {
  /**
   * List subscriptions with role checks and filters
   */
  async listSubscriptions(user, query = {}) {
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

    return prisma.subscription.findMany({
      where,
      include: {
        customer: true,
        quotation: true,
        items: {
          include: { plan: { include: { product: true } } },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get single subscription
   */
  async getSubscriptionById(id, user) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: { plan: { include: { product: true } } },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: user.id } });
      if (!customer || subscription.customerId !== customer.id) {
        throw new Error('Unauthorized to view this subscription');
      }
    }

    return subscription;
  },

  /**
   * Convert an accepted quotation to an active subscription
   */
  async convertFromQuotation(quotationId, user) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: { include: { plan: true } }, customer: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status === 'CONVERTED') {
      throw new Error('This quotation has already been converted into a subscription');
    }

    const startDate = new Date();
    // Default 1 month period
    const currentPeriodStart = startDate;
    const currentPeriodEnd = addMonths(startDate, 1);

    const subscriptionNumber = generateSubscriptionNumber();

    // Perform database transaction: Create subscription and mark quote as CONVERTED
    return prisma.$transaction(async (tx) => {
      const subItems = quotation.items.map((qi) => ({
        planId: qi.planId,
        quantity: qi.quantity,
        unitPrice: qi.unitPrice,
        taxPercent: qi.taxPercent,
        discountAmount: qi.discountPercent > 0 ? (Number(qi.unitPrice) * qi.quantity * Number(qi.discountPercent)) / 100 : 0,
        lineTotal: qi.lineTotal,
      }));

      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          status: 'ACTIVE',
          startDate,
          currentPeriodStart,
          currentPeriodEnd,
          autoRenew: true,
          currency: quotation.currency || 'USD',
          totalAmount: quotation.totalAmount,
          items: {
            create: subItems,
          },
        },
        include: {
          customer: true,
          items: { include: { plan: true } },
        },
      });

      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'CONVERTED' },
      });

      return subscription;
    });
  },

  /**
   * Create direct subscription (Staff / Admin)
   */
  async createSubscription(data) {
    const { customerId, planId, quantity = 1, interval = 'MONTHLY' } = data;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Selected plan not found');

    const startDate = new Date();
    let currentPeriodEnd;
    if (interval === 'ANNUAL' || interval === 'YEARLY') {
      currentPeriodEnd = addYears(startDate, 1);
    } else {
      currentPeriodEnd = addMonths(startDate, 1);
    }

    const unitPrice = Number(plan.price);
    const lineTotal = unitPrice * quantity;
    const subscriptionNumber = generateSubscriptionNumber();

    return prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId,
        status: 'ACTIVE',
        startDate,
        currentPeriodStart: startDate,
        currentPeriodEnd,
        autoRenew: true,
        currency: plan.currency || 'USD',
        totalAmount: lineTotal,
        items: {
          create: [
            {
              planId: plan.id,
              quantity,
              unitPrice,
              taxPercent: 0,
              discountAmount: 0,
              lineTotal,
            },
          ],
        },
      },
      include: {
        customer: true,
        items: { include: { plan: true } },
      },
    });
  },

  /**
   * Lifecycle actions: PAUSE, ACTIVATE, RENEW, CANCEL
   */
  async updateStatus(id, action, user, reason) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new Error('Subscription not found');

    let updateData = {};
    const now = new Date();

    switch (action.toUpperCase()) {
      case 'PAUSE':
        updateData = { status: 'PAUSED' };
        break;
      case 'ACTIVATE':
      case 'RESUME':
        updateData = { status: 'ACTIVE' };
        break;
      case 'CANCEL':
      case 'CLOSE':
        updateData = {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: reason || 'Cancelled by staff',
          autoRenew: false,
        };
        break;
      case 'RENEW':
        // Extend period by another cycle
        const newStart = sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
        const newEnd = addMonths(newStart, 1);
        updateData = {
          status: 'ACTIVE',
          currentPeriodStart: newStart,
          currentPeriodEnd: newEnd,
        };
        break;
      default:
        throw new Error(`Unsupported lifecycle action: ${action}`);
    }

    return prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { customer: true, items: { include: { plan: true } } },
    });
  },
};
