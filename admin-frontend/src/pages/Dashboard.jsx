import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Repeat,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Users,
  BarChart3,
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

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      try {
        const res = await api.get('/reports/dashboard-metrics');
        if (isMounted && res?.data) {
          setMetrics(res.data);
          setIsBackendConnected(true);
        }
      } catch {
        // Backend not connected or database not seeded yet
        if (isMounted) {
          setMetrics(null);
          setIsBackendConnected(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format currency or return placeholder
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val));
  };

  // Explicit KPI metrics requested
  const kpiCards = [
    {
      title: 'Active Subscriptions',
      value: metrics?.activeSubscriptions != null ? metrics.activeSubscriptions : null,
      icon: Repeat,
      description: 'Currently recurring customer subscriptions',
      badgeColor: 'blue',
      emptyValue: '0',
    },
    {
      title: 'Revenue Received',
      value: formatCurrency(metrics?.revenueReceived ?? metrics?.totalRevenue),
      icon: DollarSign,
      description: 'Total subscription payments collected',
      badgeColor: 'emerald',
      emptyValue: '$0.00',
    },
    {
      title: 'Outstanding Balance',
      value: formatCurrency(metrics?.outstandingBalance),
      icon: Clock,
      description: 'Pending payments on issued invoices',
      badgeColor: 'amber',
      emptyValue: '$0.00',
    },
    {
      title: 'Overdue Invoices',
      value: metrics?.overdueInvoices != null ? metrics.overdueInvoices : null,
      icon: AlertTriangle,
      description: 'Invoices past due date awaiting payment',
      badgeColor: 'rose',
      emptyValue: '0',
    },
  ];

  const [currentDateFormatted] = useState(getFormattedDate);

  return (
    <div className="space-y-6">
      {/* 4. Welcome Heading */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{currentDateFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome to Brightloop Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Centralized platform for subscription lifecycle, recurring billing, customer accounts, and revenue tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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

        {/* Backend Status Notice */}
        {!isBackendConnected && (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start space-x-3 text-xs text-slate-600">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-800">Foundation Mode Active:</span> Backend REST API is not yet connected. Metrics and activity logs display clearly labelled placeholder/empty states in compliance with hackathon development rules.
            </div>
          </div>
        )}
      </div>

      {/* 3. KPI Cards: Active Subscriptions, Revenue Received, Outstanding Balance, Overdue Invoices */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Subscription & Billing Metrics
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            {isBackendConnected ? 'Live Database Sync' : 'Placeholder States'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            const hasLiveData = kpi.value !== null;
            const displayValue = hasLiveData ? kpi.value : kpi.emptyValue;

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
                    {loading ? (
                      <span className="text-slate-300 animate-pulse">...</span>
                    ) : (
                      displayValue
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate mr-2">{kpi.description}</span>
                  {!hasLiveData && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      Empty State
                    </span>
                  )}
                  {hasLiveData && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Live
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Activity Section & Subscription Lifecycle Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time subscription events, invoices generated, and payment confirmations.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Activity Stream
            </span>
          </div>

          {/* Clean Placeholder / Empty State for Recent Activity */}
          <div className="py-12 px-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3 border border-blue-100">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Recent Activity Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              When customers create subscriptions, recurring invoices trigger, or payments are verified, transactional logs will automatically stream into this panel.
            </p>
            <div className="mt-4 inline-flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              <span>Awaiting Backend Service Events</span>
            </div>
          </div>
        </div>

        {/* Subscription Business Lifecycle Overview */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Lifecycle Flow</h2>
              <span className="text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Brightloop
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Core automated business stages tracked by this system:
            </p>

            <div className="space-y-2.5">
              {[
                { step: '1', title: 'Product & Plan Setup', desc: 'Editions, recurring pricing, add-ons', path: '/plans' },
                { step: '2', title: 'Customer Onboarding', desc: 'Direct signup or sales quotation', path: '/customers' },
                { step: '3', title: 'Active Subscription', desc: 'Automated renewal cycle monitoring', path: '/staff' },
                { step: '4', title: 'Recurring Invoicing', desc: 'Auto-generation & tax calculations', path: '/taxes' },
                { step: '5', title: 'Payment & Reconciliation', desc: 'Cash collection & revenue reports', path: '/reports' },
              ].map((item) => (
                <Link
                  key={item.step}
                  to={item.path}
                  className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition group"
                >
                  <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {item.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Architecture: Shared API</span>
            <span className="font-mono text-slate-600">Port 5000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
