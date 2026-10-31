import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Repeat,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  RefreshCw,
  ExternalLink,
  X,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions'); // subscriptions | quotations
  const [selectedSub, setSelectedSub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, quoteRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/quotations'),
      ]);
      if (subRes.data?.subscriptions) setSubscriptions(subRes.data.subscriptions);
      if (quoteRes.data?.quotations) setQuotations(quoteRes.data.quotations);
    } catch (err) {
      console.error('Failed to load subscriptions/quotations:', err);
      toast.error('Unable to fetch subscription records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptQuotation = async (quotationId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/quotations/${quotationId}/accept`);
      if (res.success) {
        toast.success('Quotation accepted! Operations staff will confirm your subscription shortly.');
        fetchData();
      } else {
        toast.error(res.message || 'Unable to accept quotation.');
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred while accepting quotation.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((s) => {
    const q = searchTerm.toLowerCase();
    const num = s.subscriptionNumber?.toLowerCase() || '';
    const planName = s.items?.[0]?.plan?.name?.toLowerCase() || '';
    const status = s.status?.toLowerCase() || '';
    return num.includes(q) || planName.includes(q) || status.includes(q);
  });

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
      TRIALING: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/40',
      PAUSED: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
      PAST_DUE: 'bg-rose-950/60 text-rose-400 border-rose-800/40',
      CANCELLED: 'bg-slate-800 text-slate-400 border-slate-700',
      EXPIRED: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${
          map[status] || 'bg-slate-800 text-slate-300 border-slate-700'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Subscriptions & Quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your active recurring licenses, terms, and quotation requests.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/plans"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20"
          >
            Explore More Plans
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'subscriptions'
              ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'quotations'
              ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Quotations & Offers ({quotations.length})
        </button>
      </div>

      {activeTab === 'subscriptions' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by subscription # or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
              Loading your subscription details...
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
              <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Subscriptions Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                You do not have any active subscriptions matching your search.
              </p>
              <Link
                to="/plans"
                className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Browse Available Plans
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubscriptions.map((sub) => {
                const plan = sub.items?.[0]?.plan || {};
                const product = plan.product || {};

                return (
                  <div
                    key={sub.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-white">
                          {sub.subscriptionNumber}
                        </span>
                        {getStatusBadge(sub.status)}
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {product.name || 'Brightloop Product'} — {plan.name || 'Standard License'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {plan.description || 'Full recurring access license.'}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Start Date</span>
                          <span className="text-slate-300 font-medium">
                            {new Date(sub.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Next Renewal</span>
                          <span className="text-slate-300 font-medium">
                            {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Auto-Renew</span>
                          <span className="text-emerald-400 font-medium">
                            {sub.autoRenew ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Total Billing</span>
                          <span className="text-white font-bold font-mono">
                            ${Number(sub.totalAmount).toFixed(2)} {sub.currency || 'USD'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {sub.items?.length || 1} license line item(s)
                      </span>
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                      >
                        <span>View Full Breakdown</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Quotations Tab */
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
              <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Quotation Requests</h3>
              <p className="text-xs text-slate-400 mt-1">
                You haven't requested any custom plan quotations yet.
              </p>
              <Link
                to="/plans"
                className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Request a Plan
              </Link>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Quotation #</th>
                    <th className="px-6 py-3.5">Plan Requested</th>
                    <th className="px-6 py-3.5">Validity</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {quotations.map((quote) => {
                    const plan = quote.items?.[0]?.plan || {};
                    const isDraft = quote.status === 'DRAFT' || quote.status === 'SENT';

                    return (
                      <tr key={quote.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-mono font-semibold text-white">
                          {quote.quotationNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">{plan.name || 'Custom Plan'}</span>
                          <span className="text-[11px] text-slate-500">
                            Qty: {quote.items?.[0]?.quantity || 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          Until {new Date(quote.validUntil).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-white font-mono">
                          ${Number(quote.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              quote.status === 'ACCEPTED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                : quote.status === 'CONVERTED'
                                ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/40'
                                : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isDraft ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleAcceptQuotation(quote.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow disabled:opacity-50"
                            >
                              Accept Quotation
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs italic">
                              {quote.status === 'ACCEPTED' ? 'Pending Staff Activation' : 'Converted to Subscription'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subscription Breakdown Drawer/Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-xs text-indigo-400 font-mono font-bold block">
                  {selectedSub.subscriptionNumber}
                </span>
                <h3 className="text-xl font-bold text-white">Subscription Details</h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                  {getStatusBadge(selectedSub.status)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Currency</span>
                  <span className="text-xs font-bold text-white">{selectedSub.currency || 'USD'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Renewal</span>
                  <span className="text-xs font-medium text-slate-300">
                    {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Auto-Renew</span>
                  <span className="text-xs font-medium text-emerald-400">
                    {selectedSub.autoRenew ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">
                  Configured Item Lines
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(selectedSub.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-white block">
                              {item.plan?.name || 'Plan Item'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.plan?.billingCycle} frequency
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            ${Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white font-mono">
                            ${Number(item.lineTotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to="/invoices"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View Invoices for this Subscription →
                </Link>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
