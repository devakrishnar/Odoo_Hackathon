import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Repeat,
  Receipt,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Package,
  Layers,
} from 'lucide-react';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [subRes, invRes, payRes, profRes] = await Promise.allSettled([
          api.get('/subscriptions'),
          api.get('/invoices'),
          api.get('/payments'),
          api.get('/customers/profile'),
        ]);

        if (subRes.status === 'fulfilled' && subRes.value?.data?.subscriptions) {
          setSubscriptions(subRes.value.data.subscriptions);
        }
        if (invRes.status === 'fulfilled' && invRes.value?.data?.invoices) {
          setInvoices(invRes.value.data.invoices);
        }
        if (payRes.status === 'fulfilled' && payRes.value?.data?.payments) {
          setPayments(payRes.value.data.payments);
        }
        if (profRes.status === 'fulfilled' && profRes.value?.data?.customer) {
          setCustomer(profRes.value.data.customer);
        }
      } catch (err) {
        console.error('Error loading customer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute metrics from actual data
  const activeSub = subscriptions.find(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIALING'
  ) || subscriptions[0];

  const outstandingBalance = invoices.reduce((sum, inv) => {
    if (inv.status === 'PAID' || inv.status === 'VOID' || inv.status === 'CANCELLED') return sum;
    return sum + (Number(inv.balanceAmount) || 0);
  }, 0);

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const overdueInvoices = invoices.filter((inv) => {
    if (inv.status === 'PAID' || inv.status === 'VOID' || inv.status === 'CANCELLED') return false;
    return new Date(inv.dueDate) < new Date();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back{customer?.name ? `, ${customer.name}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Overview of your active subscription licenses, next renewal date, and billing balances.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {outstandingBalance > 0 ? (
            <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/40 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <span>Balance Due: ${outstandingBalance.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="h-4 w-4" />
              <span>Account in Good Standing</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Plan Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current Plan</span>
            <Repeat className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 bg-slate-800 animate-pulse rounded w-2/3"></div>
            ) : (
              <span className="text-lg font-bold text-white block truncate">
                {activeSub?.items?.[0]?.plan?.name || (activeSub ? 'Subscription' : 'No Active Plan')}
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span>Status:</span>
              <span
                className={`font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                  activeSub?.status === 'ACTIVE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {activeSub?.status || 'None'}
              </span>
            </p>
          </div>
        </div>

        {/* Next Billing Date Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Next Billing Date</span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 bg-slate-800 animate-pulse rounded w-1/2"></div>
            ) : (
              <span className="text-lg font-bold text-white block">
                {activeSub?.currentPeriodEnd
                  ? new Date(activeSub.currentPeriodEnd).toLocaleDateString()
                  : 'N/A'}
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {activeSub?.autoRenew ? 'Auto-renewal is enabled' : 'Manual renewal required'}
            </p>
          </div>
        </div>

        {/* Outstanding Invoice Balance Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unpaid Balance</span>
            <Receipt className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 bg-slate-800 animate-pulse rounded w-1/2"></div>
            ) : (
              <span
                className={`text-2xl font-extrabold ${
                  outstandingBalance > 0 ? 'text-amber-400' : 'text-white'
                }`}
              >
                ${outstandingBalance.toFixed(2)}
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {overdueInvoices.length > 0 ? (
                <span className="text-rose-400 font-medium">
                  {overdueInvoices.length} overdue invoice(s)
                </span>
              ) : (
                'All dues current'
              )}
            </p>
          </div>
        </div>

        {/* Total Settled Payments Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Paid</span>
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 bg-slate-800 animate-pulse rounded w-1/2"></div>
            ) : (
              <span className="text-2xl font-extrabold text-emerald-400">
                ${totalPaid.toFixed(2)}
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Across {payments.length} settled transaction(s)
            </p>
          </div>
        </div>
      </div>

      {/* Main Focus: Active Subscription Details Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Package className="h-4 w-4 text-indigo-400" />
              <span>Subscription Overview</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current subscription plan parameters and billing lifecycle.
            </p>
          </div>

          <Link
            to="/plans"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <span>Browse Other Plans</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading subscription status...</div>
        ) : activeSub ? (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  {activeSub.items?.[0]?.plan?.product?.name || 'Software Subscription'} —{' '}
                  {activeSub.items?.[0]?.plan?.name || 'Standard License'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeSub.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Subscription Number:{' '}
                <strong className="text-slate-300 font-mono">{activeSub.subscriptionNumber}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Period:{' '}
                {new Date(activeSub.currentPeriodStart).toLocaleDateString()} to{' '}
                {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center space-x-4 self-start md:self-auto">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Amount</span>
                <span className="text-xl font-extrabold text-white">
                  ${Number(activeSub.totalAmount).toFixed(2)}
                </span>
              </div>
              <Link
                to="/subscriptions"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition border border-slate-700"
              >
                View Details
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80">
            <Layers className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No Active Subscription</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You do not currently have an active subscription package. Browse available plans to get started.
            </p>
            <Link
              to="/plans"
              className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            >
              <span>Explore Subscription Plans</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Two Column Section: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-amber-400" />
              <span>Recent Invoices</span>
            </h3>
            <Link to="/invoices" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              View All ({invoices.length})
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-slate-950 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              No billing invoices issued yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {invoices.slice(0, 3).map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <span className="text-xs font-semibold text-white font-mono block">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        ${Number(inv.totalAmount).toFixed(2)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          inv.status === 'PAID'
                            ? 'text-emerald-400'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Recent Payments</span>
            </h3>
            <Link to="/payments" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              View All ({payments.length})
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-slate-950 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.slice(0, 3).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <span className="text-xs font-semibold text-white font-mono block">
                      {pay.paymentNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(pay.paidAt).toLocaleDateString()} • {pay.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">
                      +${Number(pay.amount).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">{pay.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
