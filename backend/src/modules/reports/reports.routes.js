import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';
import { addDays } from 'date-fns';

const router = Router();

// GET /api/reports/dashboard-metrics - Comprehensive Operational & Executive KPIs
router.get('/dashboard-metrics', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const [
      activeSubscriptionsCount,
      totalCustomersCount,
      totalInvoicesCount,
      paymentsCompleted,
      invoicesAll,
      recentSubscriptions,
      recentInvoices,
      recentPayments,
      attentionSubscriptionsCount,
      dueSoonInvoices,
      overdueInvoicesList,
      pendingQuotations,
    ] = await Promise.all([
      // 1. Active Subscriptions
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      // 2. Active Customers
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      // 3. Invoices count
      prisma.invoice.count(),
      // 4. Total Revenue collected
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      // 5. Invoices for outstanding balance
      prisma.invoice.findMany({
        where: {
          balanceAmount: { gt: 0 },
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        select: {
          balanceAmount: true,
          totalAmount: true,
          paidAmount: true,
        },
      }),
      // 6. Recent Subscriptions (for Activity feed)
      prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      // 7. Recent Invoices
      prisma.invoice.findMany({
        take: 5,
        orderBy: { issueDate: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      // 8. Recent 5 payments
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          invoice: { select: { invoiceNumber: true } },
        },
      }),
      // 9. Subscriptions needing attention (e.g. expiring within 7 days or paused)
      prisma.subscription.count({
        where: {
          OR: [
            { status: 'PAUSED' },
            {
              status: 'ACTIVE',
              currentPeriodEnd: { lte: sevenDaysFromNow },
            },
          ],
        },
      }),
      // 10. Invoices due in the next 7 days
      prisma.invoice.count({
        where: {
          dueDate: { gte: now, lte: sevenDaysFromNow },
          balanceAmount: { gt: 0 },
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
      }),
      // 11. Overdue invoices list
      prisma.invoice.findMany({
        where: {
          dueDate: { lt: now },
          balanceAmount: { gt: 0 },
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        include: { customer: true },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
      // 12. Pending quotations
      prisma.quotation.count({
        where: { status: { in: ['DRAFT', 'SENT'] } },
      }),
    ]);

    // Financial calculations
    const revenueReceived = Number(paymentsCompleted._sum.amount || 0);
    const outstandingBalance = invoicesAll.reduce((sum, inv) => {
      const bal = inv.balanceAmount != null ? Number(inv.balanceAmount) : (Number(inv.totalAmount) - Number(inv.paidAmount || 0));
      return sum + Math.max(0, bal);
    }, 0);

    // Build recent activities feed
    const activities = [
      ...recentSubscriptions.map((s) => ({
        id: `sub-${s.id}`,
        type: 'SUBSCRIPTION',
        title: `Subscription ${s.subscriptionNumber || s.id.slice(0, 8)}`,
        description: `Customer ${s.customer?.name || 'Subscriber'} (${s.status})`,
        amount: s.totalAmount != null ? Number(s.totalAmount) : null,
        date: s.createdAt,
      })),
      ...recentInvoices.map((inv) => ({
        id: `inv-${inv.id}`,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber}`,
        description: `Issued to ${inv.customer?.name || 'Customer'} (${inv.status})`,
        amount: inv.totalAmount != null ? Number(inv.totalAmount) : null,
        date: inv.issueDate || inv.createdAt,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // Monthly revenue simulation/grouping
    const paymentsLast6Months = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        },
      },
      select: { amount: true, createdAt: true },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthlyMap[key] = 0;
    }

    paymentsLast6Months.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += Number(p.amount);
      }
    });

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue.toFixed(2)),
    }));

    // Subscription status breakdown
    const [activeSubs, trialingSubs, pastDueSubs, pausedSubs, cancelledSubs] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIALING' } }),
      prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      prisma.subscription.count({ where: { status: 'PAUSED' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
    ]);

    const subscriptionStatusCounts = {
      ACTIVE: activeSubs,
      TRIALING: trialingSubs,
      PAST_DUE: pastDueSubs,
      PAUSED: pausedSubs,
      CANCELLED: cancelledSubs,
    };

    return successResponse(res, 'Dashboard metrics retrieved', {
      activeSubscriptions: activeSubscriptionsCount,
      revenueReceived,
      totalRevenue: revenueReceived,
      outstandingBalance,
      overdueInvoices: overdueInvoicesList.length,
      overdueInvoicesCount: overdueInvoicesList.length,
      overdueInvoicesList,
      dueSoonInvoicesCount: dueSoonInvoices,
      attentionSubscriptionsCount,
      pendingQuotationsCount: pendingQuotations,
      totalCustomers: totalCustomersCount,
      totalInvoices: totalInvoicesCount,
      monthlyRevenue,
      subscriptionStatusCounts,
      recentActivities: activities,
      recentPayments,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/summary - Detailed financial & subscription report
router.get('/summary', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const subWhere = {};
    if (status && status !== 'ALL') subWhere.status = status;
    if (startDate || endDate) subWhere.createdAt = dateFilter;

    const invWhere = {};
    if (startDate || endDate) invWhere.issueDate = dateFilter;

    const [subscriptions, invoices, payments] = await Promise.all([
      prisma.subscription.findMany({
        where: subWhere,
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: invWhere,
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { issueDate: 'desc' },
      }),
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalOutstanding = invoices
      .filter((inv) => ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.balanceAmount || inv.totalAmount), 0);
    const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

    return successResponse(res, 'Report summary retrieved successfully', {
      summary: {
        totalRevenue,
        totalBilled,
        totalOutstanding,
        overdueCount,
        activeSubscriptionsCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
        totalSubscriptionsCount: subscriptions.length,
        totalInvoicesCount: invoices.length,
        totalPaymentsCount: payments.length,
      },
      subscriptions,
      invoices,
      payments,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
