import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Repeat,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  BarChart3,
  TrendingUp,
  RefreshCw,
  FileText,
  CreditCard,
  Shield,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import api from '../services/api';

const getFormattedDate = () => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return 'Subscription Overview';
  }
};

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('ALL'); // 'ALL' | 'PAYMENT' | 'INVOICE' | 'SUBSCRIPTION'

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/dashboard-metrics');
      if (res?.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      setError(err?.message || 'Failed to connect to backend reports service.');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val));
  };

  const kpiCards = [
    {
      title: 'Active Subscriptions',
      value: metrics?.activeSubscriptions != null ? metrics.activeSubscriptions : 0,
      icon: Repeat,
      description: 'Currently active customer subscriptions',
      color: 'blue',
    },
    {
      title: 'Revenue Received',
      value: formatCurrency(metrics?.revenueReceived ?? metrics?.totalRevenue),
      icon: DollarSign,
      description: 'Total completed subscription payments',
      color: 'emerald',
    },
    {
      title: 'Outstanding Balance',
      value: formatCurrency(metrics?.outstandingBalance),
      icon: Clock,
      description: 'Remaining unpaid invoice balances',
      color: 'amber',
    },
    {
      title: 'Overdue Invoices',
      value: metrics?.overdueInvoices != null ? metrics.overdueInvoices : 0,
      icon: AlertTriangle,
      description: 'Invoices past due date awaiting payment',
      color: 'rose',
    },
  ];

  const monthlyRev = metrics?.monthlyRevenue || [];
  const maxRevenue = Math.max(...monthlyRev.map((m) => m.revenue), 100);

  const statusCounts = metrics?.subscriptionStatusCounts || {
    ACTIVE: 0,
    TRIALING: 0,
    PAST_DUE: 0,
    PAUSED: 0,
    CANCELLED: 0,
  };
  const totalSubsCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const filteredActivities = (metrics?.recentActivities || []).filter((act) => {
    if (activityFilter === 'ALL') return true;
    return act.type === activityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{getFormattedDate()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Brightloop Admin Console
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Live PostgreSQL database synchronization for recurring revenues, active subscriptions, customer accounts, and real-time activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <Link
              to="/plans"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Manage Plans</span>
            </Link>
            <Link
              to="/customers"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Customers</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Backend Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* 4 Required KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;

          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-wide">
                  {kpi.title}
                </span>
                <div className="p-2 rounded-lg bg-slate-50 text-blue-600 border border-slate-100">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {loading ? <span className="text-slate-300 animate-pulse">...</span> : kpi.value}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 truncate mr-2">{kpi.description}</span>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Live DB
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Monthly Revenue & Subscription Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Monthly Revenue</h2>
              <p className="text-xs text-slate-500 mt-0.5">Subscription collections by billing month</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Payment Stream
            </span>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-100">
            {monthlyRev.map((m, i) => {
              const heightPercent = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${m.revenue.toFixed(0)}
                  </span>
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-md relative overflow-hidden flex items-end h-full">
                    <div
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                      className="w-full bg-blue-600 group-hover:bg-blue-700 transition-all rounded-t-md"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Status Breakdown</h2>
              <span className="text-xs text-slate-400 font-semibold">{totalSubsCount} Total</span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              {[
                { label: 'Active', count: statusCounts.ACTIVE, color: 'bg-emerald-500' },
                { label: 'Trialing', count: statusCounts.TRIALING, color: 'bg-blue-500' },
                { label: 'Past Due', count: statusCounts.PAST_DUE, color: 'bg-amber-500' },
                { label: 'Paused', count: statusCounts.PAUSED, color: 'bg-purple-500' },
                { label: 'Cancelled', count: statusCounts.CANCELLED, color: 'bg-rose-500' },
              ].map((s) => {
                const pct = totalSubsCount > 0 ? ((s.count / totalSubsCount) * 100).toFixed(0) : 0;
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
                      <span>{s.label}</span>
                      <span>
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={`h-full ${s.color} rounded-full`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Automated Lifecycle Sync</span>
            <span className="font-semibold text-emerald-600">Active</span>
          </div>
        </div>
      </div>

      {/* Enhanced Recent Activity / Audit Stream */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity Stream</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live transactional ledger from subscriptions, invoices, and verified collections (Newest first)
            </p>
          </div>

          {/* Activity Category Filter Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActivityFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${
                activityFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActivityFilter('PAYMENT')}
              className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                activityFilter === 'PAYMENT'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Payments</span>
            </button>
            <button
              onClick={() => setActivityFilter('INVOICE')}
              className={`px-2.5 py-1 rounded-md transition ${
                activityFilter === 'INVOICE'
                  ? 'bg-white text-purple-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActivityFilter('SUBSCRIPTION')}
              className={`px-2.5 py-1 rounded-md transition ${
                activityFilter === 'SUBSCRIPTION'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscriptions
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-600 mx-auto mb-2" />
            <span>Synchronizing audit events from database...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 px-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
            <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Events Found</h3>
            <p className="text-xs text-slate-400 mt-1">No activities match the selected filter category.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredActivities.map((act) => {
              const isPayment = act.type === 'PAYMENT';
              const isSub = act.type === 'SUBSCRIPTION';

              return (
                <div
                  key={act.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/75 px-3 rounded-xl transition"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isPayment
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : isSub
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-purple-50 text-purple-600 border-purple-200'
                      }`}
                    >
                      {isPayment ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : isSub ? (
                        <Repeat className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm tracking-tight">{act.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                            act.status === 'COMPLETED' || act.status === 'ACTIVE' || act.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : act.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {act.status}
                        </span>
                        {isPayment && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-800">
                            Cash Inflow
                          </span>
                        )}
                        {act.type === 'INVOICE' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100/70 text-purple-800">
                            Bill Billed
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-xs mt-0.5 block truncate">{act.description}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    {act.amount != null && (
                      <span
                        className={`font-mono font-extrabold text-sm block ${
                          isPayment ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isPayment ? `+$${Number(act.amount).toFixed(2)}` : `$${Number(act.amount).toFixed(2)}`}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {act.date ? new Date(act.date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
