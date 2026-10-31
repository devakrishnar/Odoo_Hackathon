import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Repeat,
  Receipt,
  AlertTriangle,
  Clock,
  ArrowRight,
  PlusCircle,
  PhoneCall,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CreditCard,
  FileText,
} from 'lucide-react';
import api from '../services/api';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeSubscriptions: 0,
    attentionSubscriptionsCount: 0,
    totalInvoices: 0,
    overdueInvoicesCount: 0,
    overdueInvoices: [],
    dueSoonInvoicesCount: 0,
    pendingQuotationsCount: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
    recentPayments: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard-metrics');
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Operations Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time subscription operations, invoice collection, and customer follow-ups.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/quotations?create=true')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue Invoices Alert */}
        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Overdue Invoices</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.overdueInvoicesCount}</span>
            <span className="text-xs font-medium text-red-600 flex items-center">Requires Follow-up</span>
          </div>
        </div>

        {/* Subscriptions Needing Attention */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Subscriptions Attention</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.attentionSubscriptionsCount}</span>
            <span className="text-xs font-medium text-amber-600">Expiring or Paused</span>
          </div>
        </div>

        {/* Invoices Due Soon */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Invoices Due (7 Days)</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.dueSoonInvoicesCount}</span>
            <span className="text-xs font-medium text-blue-600">Awaiting Settlement</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Subscriptions</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Repeat className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.activeSubscriptions}</span>
            <span className="text-xs font-medium text-emerald-600">Recurring active</span>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Revenue Operations</span>
          <h2 className="text-xl font-bold mt-1">Live Collection Overview</h2>
          <p className="text-xs text-slate-300 mt-0.5">Real-time monetary figures recorded in PostgreSQL.</p>
        </div>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="border-l border-slate-700/60 pl-5">
            <p className="text-xs text-slate-400">Total Collected</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              ${Number(metrics.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="border-l border-slate-700/60 pl-5">
            <p className="text-xs text-slate-400">Total Outstanding Balance</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-0.5">
              ${Number(metrics.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Operations Section: Overdue Attention & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Follow-up List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="font-bold text-slate-900 text-sm">Overdue Invoices Requiring Follow-up</h3>
              </div>
              <button
                onClick={() => navigate('/invoices?status=OVERDUE')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-0.5"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {metrics.overdueInvoices && metrics.overdueInvoices.length > 0 ? (
                metrics.overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{inv.customer?.name || 'Customer'}</p>
                      <p className="text-xs text-slate-500">
                        {inv.invoiceNumber} • Due {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">${Number(inv.balanceAmount).toFixed(2)}</p>
                      <button
                        onClick={() => navigate(`/customers/${inv.customerId}`)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 mt-0.5 justify-end"
                      >
                        <PhoneCall className="h-3 w-3 text-slate-400" />
                        <span>Follow up</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No overdue invoices found! All customer accounts are settled.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/invoices')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
            >
              Open Invoice Management
            </button>
          </div>
        </div>

        {/* Recent Payment Collections */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Payment Settlements</h3>
              </div>
              <button
                onClick={() => navigate('/payments')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-0.5"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {metrics.recentPayments && metrics.recentPayments.length > 0 ? (
                metrics.recentPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{pay.customer?.name || 'Customer'}</p>
                      <p className="text-xs text-slate-500">
                        {pay.paymentMethod} • {new Date(pay.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600">+${Number(pay.amount).toFixed(2)}</span>
                      <span className="block text-[11px] text-slate-400">Paid for {pay.invoice?.invoiceNumber}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No recorded payments yet. Use the Payments menu to record customer settlements.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/payments')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
            >
              Record New Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
