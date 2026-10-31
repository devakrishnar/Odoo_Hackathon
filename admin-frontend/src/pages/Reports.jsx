import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  DollarSign,
  Repeat,
  AlertTriangle,
  Clock,
  Download,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import api from '../services/api';

export const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/reports/summary', { params });
      setData(res?.data || null);
    } catch (err) {
      setError(err?.message || 'Failed to generate financial reports');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = data?.summary || {
    totalRevenue: 0,
    totalBilled: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    activeSubscriptionsCount: 0,
    totalSubscriptionsCount: 0,
    totalInvoicesCount: 0,
    totalPaymentsCount: 0,
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Reports & Audits</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Database
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated recurring revenue performance, invoice collections, outstanding accounts receivable, and subscription counts.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Range & Status Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600">End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Subscription Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIALING">Trialing</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {(startDate || endDate || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter('ALL');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Revenue Collected</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(summary.totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified customer payments received</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Billed</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(summary.totalBilled)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Gross sum across generated invoices</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Accounts receivable awaiting settlement</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Subscriptions</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Repeat className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary.activeSubscriptionsCount} / {summary.totalSubscriptionsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Overdue invoices: <strong className="text-rose-600">{summary.overdueCount}</strong>
          </p>
        </div>
      </div>

      {/* Subscriptions Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Audit Ledger: Subscriptions ({data?.subscriptions?.length || 0})</h2>
            <p className="text-xs text-slate-500">Filtered subscriptions retrieved from PostgreSQL</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Aggregating records...</div>
          ) : data?.subscriptions?.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No subscriptions match filters.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Subscription #</th>
                  <th className="px-5 py-3">Subscriber</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Recurring Total</th>
                  <th className="px-5 py-3">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-900">
                      {s.subscriptionNumber || s.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {s.customer?.name} ({s.customer?.email})
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">${Number(s.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

