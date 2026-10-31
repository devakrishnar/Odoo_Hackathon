import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';
import { addDays } from 'date-fns';

const router = Router();

// GET /api/reports/dashboard-metrics - Comprehensive Real DB Metrics for Admin & Staff
router.get('/dashboard-metrics', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const [
      activeSubscriptionsCount,
      totalCustomersCount,
      totalInvoicesCount,
      overdueInvoicesCount,
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
      // 4. Overdue invoices (either status OVERDUE or dueDate < now with balance > 0)
      prisma.invoice.count({
        where: {
          OR: [
            { status: 'OVERDUE' },
            {
              dueDate: { lt: now },
              balanceAmount: { gt: 0 },
              status: { notIn: ['PAID', 'CANCELLED'] },
            },
          ],
        },
      }),
      // 5. Total Revenue collected - ONLY from COMPLETED payments
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      // 6. Invoices for outstanding balance - ONLY remaining unpaid invoice amounts accounting for partial payments
      prisma.invoice.findMany({
        where: {
          balanceAmount: { gt: 0 },
          status: { notIn: ['PAID', 'CANCELLED', 'VOID', 'DRAFT'] },
        },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
        },
      }),
      // 7. Recent Subscriptions
      prisma.subscription.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      // 8. Recent Invoices
      prisma.invoice.findMany({
        take: 8,
        orderBy: { issueDate: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      // 9. Recent Payments
      prisma.payment.findMany({
        take: 8,
        where: { status: 'COMPLETED' },
        orderBy: { paidAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          invoice: { select: { invoiceNumber: true } },
        },
      }),
      // 10. Subscriptions needing attention (e.g. expiring within 7 days or paused)
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
      // 11. Invoices due in next 7 days
      prisma.invoice.count({
        where: {
          dueDate: { gte: now, lte: sevenDaysFromNow },
          balanceAmount: { gt: 0 },
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
      }),
      // 12. Overdue invoices list
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
      // 13. Pending quotations
      prisma.quotation.count({
        where: { status: { in: ['DRAFT', 'SENT'] } },
      }),
    ]);

    // Financial calculation 1: Revenue Received = strictly completed payments
    const revenueReceived = Number(paymentsCompleted._sum.amount || 0);

    // Financial calculation 2: Outstanding Balance = remaining unpaid invoice amounts accounting for partial payments
    const outstandingBalance = invoicesAll.reduce((sum, inv) => {
      const total = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const remaining = inv.balanceAmount != null ? Number(inv.balanceAmount) : Math.max(0, total - paid);
      return sum + Math.max(0, remaining);
    }, 0);

    // Build unified Recent Activity / Audit Stream:
    // Sorted newest first with unique deduplicated keys and real recorded database actions
    const rawActivities = [
      ...recentPayments.map((p) => ({
        id: `pay-${p.id}`,
        type: 'PAYMENT',
        title: `Payment Received (${p.paymentNumber || 'Direct'})`,
        reference: p.paymentNumber || p.id.slice(0, 8),
        customerName: p.customer?.name || 'Customer',
        description: `Collected for invoice ${p.invoice?.invoiceNumber || 'Billing'} from ${p.customer?.name || 'Customer'}`,
        status: p.status,
        amount: Number(p.amount),
        amountPrefix: '+',
        date: p.paidAt,
      })),
      ...recentInvoices.map((inv) => ({
        id: `inv-${inv.id}`,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber}`,
        reference: inv.invoiceNumber,
        customerName: inv.customer?.name || 'Customer',
        description: inv.status === 'PARTIALLY_PAID'
          ? `Billed $${Number(inv.totalAmount).toFixed(2)} to ${inv.customer?.name} (Unpaid balance: $${Number(inv.balanceAmount || 0).toFixed(2)})`
          : `Billing invoice issued to ${inv.customer?.name || 'Customer'} (${inv.status})`,
        status: inv.status,
        amount: Number(inv.totalAmount || 0),
        balanceAmount: inv.balanceAmount != null ? Number(inv.balanceAmount) : 0,
        amountPrefix: '',
        date: inv.issueDate || inv.createdAt,
      })),
      ...recentSubscriptions.map((s) => ({
        id: `sub-${s.id}`,
        type: 'SUBSCRIPTION',
        title: `Subscription ${s.subscriptionNumber || s.id.slice(0, 8)}`,
        reference: s.subscriptionNumber || s.id.slice(0, 8),
        customerName: s.customer?.name || 'Subscriber',
        description: `Active recurring plan for ${s.customer?.name || 'Customer'} (${s.status})`,
        status: s.status,
        amount: s.totalAmount != null ? Number(s.totalAmount) : null,
        amountPrefix: '',
        date: s.createdAt,
      })),
    ];

    // Deduplicate and sort newest first
    const seenIds = new Set();
    const activities = rawActivities
      .filter((item) => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Monthly revenue simulation/grouping
    const paymentsLast6Months = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        },
      },
      select: { amount: true, paidAt: true },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthlyMap[key] = 0;
    }

    paymentsLast6Months.forEach((p) => {
      const d = new Date(p.paidAt);
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
      overdueInvoices: overdueInvoicesCount,
      totalCustomers: totalCustomersCount,
      totalInvoices: totalInvoicesCount,
      monthlyRevenue,
      subscriptionStatusCounts,
      recentActivities: activities,
      // Operational metrics for Staff dashboard compatibility
      attentionSubscriptionsCount,
      dueSoonInvoices,
      overdueInvoicesList,
      pendingQuotations,
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
          ...(startDate || endDate ? { paidAt: dateFilter } : {}),
        },
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { paidAt: 'desc' },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalOutstanding = invoices
      .filter((inv) => ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'].includes(inv.status))
      .reduce((sum, inv) => {
        const bal = inv.balanceAmount != null ? Number(inv.balanceAmount) : (Number(inv.totalAmount) - Number(inv.paidAmount || 0));
        return sum + Math.max(0, bal);
      }, 0);
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
