import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

// GET /api/reports/dashboard-metrics - Real KPI & Revenue Metrics from actual DB
router.get('/dashboard-metrics', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const now = new Date();

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
    ] = await Promise.all([
      // 1. Active Subscriptions
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      // 2. Active Customers
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      // 3. Invoices count
      prisma.invoice.count(),
      // 4. Overdue invoices (must strictly be OVERDUE status)
      prisma.invoice.count({
        where: {
          status: 'OVERDUE',
        },
      }),
      // 5. Total Revenue collected - ONLY from COMPLETED payments
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      // 6. Outstanding balance: ONLY remaining unpaid invoice amounts, accounting for partial payments
      // Statuses eligible: ISSUED, OVERDUE, PARTIALLY_PAID (exclude PAID, CANCELLED, VOID, DRAFT)
      prisma.invoice.findMany({
        where: {
          status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] },
        },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
        },
      }),
      // 7. Recent Subscriptions (for Activity feed)
      prisma.subscription.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      // 8. Recent Invoices (for Activity feed)
      prisma.invoice.findMany({
        take: 8,
        orderBy: { issueDate: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
      // 9. Recent Payments (for Activity feed)
      prisma.payment.findMany({
        take: 8,
        where: { status: 'COMPLETED' },
        orderBy: { paidAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),
    ]);

    // Financial calculation 1: Revenue Received = strictly completed payments
    const revenueReceived = Number(paymentsCompleted._sum.amount || 0);

    // Financial calculation 2: Outstanding Balance = remaining unpaid invoice amounts accounting for partial payments
    const outstandingBalance = invoicesAll.reduce((sum, inv) => {
      // If balanceAmount is explicitly tracked in DB, use it; otherwise totalAmount - paidAmount
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
        title: `Payment Received`,
        reference: p.paymentNumber || p.id.slice(0, 8),
        customerName: p.customer?.name || 'Customer',
        description: `Verified collection of $${Number(p.amount).toFixed(2)} from ${p.customer?.name || 'Subscriber'}`,
        status: p.status,
        amount: Number(p.amount),
        date: p.paidAt,
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
        date: s.createdAt,
      })),
      ...recentInvoices.map((inv) => ({
        id: `inv-${inv.id}`,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber}`,
        reference: inv.invoiceNumber,
        customerName: inv.customer?.name || 'Customer',
        description: `Billing invoice issued to ${inv.customer?.name || 'Customer'} (${inv.status})`,
        status: inv.status,
        amount: inv.totalAmount != null ? Number(inv.totalAmount) : null,
        date: inv.issueDate || inv.createdAt,
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
