import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  Search,
  Filter,
  RefreshCw,
  Pause,
  Play,
  RotateCw,
  XCircle,
  Receipt,
  Eye,
  X,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Subscriptions = () => {
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected subscription for detail drawer
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancellation modal state
  const [cancelModalSubId, setCancelModalSubId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data?.subscriptions || []);
    } catch (err) {
      console.warn('Failed to load subscriptions:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleLifecycleAction = async (subId, action, reason = '') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/subscriptions/${subId}/${action}`, { reason });
      toast.success(`Subscription successfully ${action}d!`);
      fetchSubscriptions();
      if (selectedSub && selectedSub.id === subId) {
        setSelectedSub(res.data?.subscription || null);
      }
      setCancelModalSubId(null);
      setCancelReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || `Failed to ${action} subscription`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async (subId) => {
    try {
      const res = await api.post('/invoices/generate', { subscriptionId: subId });
      if (res.data?.alreadyGenerated) {
        toast('Invoice already exists for this billing period', { icon: 'ℹ️' });
      } else {
        toast.success(`Invoice ${res.data?.invoice?.invoiceNumber || ''} generated!`);
      }
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invoice generation failed');
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      s.subscriptionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Management</h1>
          <p className="text-sm text-slate-500">
            Control customer subscription lifecycles: activate, pause, renew, or close subscriptions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchSubscriptions}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by sub # or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          {['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              Loading subscriptions...
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="p-12 text-center">
              <Repeat className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No subscriptions found</h3>
              <p className="text-xs text-slate-400 mt-1">Convert an accepted quotation to activate a subscription.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Subscription #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Billing Period</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubs.map((sub) => {
                  const isExpiringSoon =
                    sub.status === 'ACTIVE' &&
                    new Date(sub.currentPeriodEnd) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900">{sub.subscriptionNumber}</span>
                        {sub.quotation && (
                          <div className="text-[11px] text-slate-400">From {sub.quotation.quotationNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800">{sub.customer?.name}</div>
                        <div className="text-xs text-slate-400">{sub.customer?.email}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        <div>
                          {new Date(sub.currentPeriodStart).toLocaleDateString()} -{' '}
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </div>
                        {isExpiringSoon && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Renews / Ends Soon
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">${Number(sub.totalAmount).toFixed(2)}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'PAUSED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Fast Generate Due Invoice */}
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleGenerateInvoice(sub.id)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold border border-blue-200 transition"
                            title="Generate Billing Invoice"
                          >
                            <Receipt className="h-3.5 w-3.5 inline mr-1" />
                            <span>Bill Now</span>
                          </button>
                        )}

                        {/* Pause / Resume */}
                        {sub.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleLifecycleAction(sub.id, 'pause')}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-semibold transition"
                            title="Pause Subscription"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </button>
                        ) : sub.status === 'PAUSED' ? (
                          <button
                            onClick={() => handleLifecycleAction(sub.id, 'activate')}
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-xs font-semibold transition"
                            title="Resume Subscription"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        ) : null}

                        {/* Renew */}
                        {sub.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleLifecycleAction(sub.id, 'renew')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition"
                            title="Extend / Renew 1 Cycle"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Cancel / Close */}
                        {sub.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setCancelModalSubId(sub.id)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-semibold transition"
                            title="Close / Cancel Early"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h2 className="text-lg font-bold">{selectedSub.subscriptionNumber}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Customer: {selectedSub.customer?.name}</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status and Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 inline-block">{selectedSub.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Recurring Total</span>
                  <span className="font-bold text-emerald-600 text-sm mt-0.5 inline-block">
                    ${Number(selectedSub.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Period Start</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedSub.currentPeriodStart).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Period End / Renewal</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Subscribed Items</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {selectedSub.items &&
                    selectedSub.items.map((item) => (
                      <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-900">{item.plan?.name || 'Software License'}</p>
                          <p className="text-slate-400 text-[11px]">
                            Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-800">${Number(item.lineTotal).toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Fast Action Buttons in Drawer */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Lifecycle Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSub.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleGenerateInvoice(selectedSub.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Trigger Due Invoice</span>
                    </button>
                  )}

                  {selectedSub.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleLifecycleAction(selectedSub.id, 'pause')}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause Subscription</span>
                    </button>
                  ) : selectedSub.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleLifecycleAction(selectedSub.id, 'activate')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume Subscription</span>
                    </button>
                  ) : null}

                  {selectedSub.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleLifecycleAction(selectedSub.id, 'renew')}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                    >
                      <RotateCw className="h-4 w-4" />
                      <span>Renew for Next Period</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalSubId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-base text-slate-900">Close / Cancel Subscription</h3>
            </div>
            <p className="text-xs text-slate-500">
              This will stop automatic recurring billing. Please provide a reason for cancellation:
            </p>
            <textarea
              rows="3"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Customer requested downgrade, project completed, etc."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCancelModalSubId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Keep Active
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleLifecycleAction(cancelModalSubId, 'cancel', cancelReason)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
