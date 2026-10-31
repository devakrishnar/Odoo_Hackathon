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
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard-metrics');
      if (res?.data) {
        setMetrics(res.data);
        setIsBackendConnected(true);
      }
    } catch {
      setMetrics(null);
      setIsBackendConnected(false);
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
      description: 'Pending collections on issued invoices',
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
              Real-time subscription billing lifecycle, live database revenues, customer directory, and invoicing analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
              title="Refresh dashboard"
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

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity Stream</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live transactional events from subscriptions and recurring invoices
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Audit Log
          </span>
        </div>

        {metrics?.recentActivities?.length === 0 ? (
          <div className="py-12 px-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
            <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Recent Events</h3>
            <p className="text-xs text-slate-400 mt-1">Events will populate as customers transact.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {metrics?.recentActivities?.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    {act.type === 'SUBSCRIPTION' ? <Repeat className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{act.title}</span>
                    <span className="text-slate-500">{act.description}</span>
                  </div>
                </div>

                <div className="text-right">
                  {act.amount != null && (
                    <span className="font-bold text-slate-900 block">${Number(act.amount).toFixed(2)}</span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {new Date(act.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
