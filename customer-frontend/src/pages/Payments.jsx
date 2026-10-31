import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  CreditCard,
  Receipt,
  Search,
  RefreshCw,
  PlusCircle,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Payments = () => {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [notes, setNotes] = useState('');

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices'),
      ]);
      if (payRes.data?.payments) setPayments(payRes.data.payments);
      if (invRes.data?.invoices) {
        setInvoices(invRes.data.invoices);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Unable to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  // If navigated from invoice "Pay" button
  useEffect(() => {
    if (location.state?.payInvoiceId && invoices.length > 0) {
      const target = invoices.find((i) => i.id === location.state.payInvoiceId);
      if (target && Number(target.balanceAmount) > 0) {
        setSelectedInvoiceId(target.id);
        setAmount(Number(target.balanceAmount).toFixed(2));
        setShowPayModal(true);
      }
    }
  }, [location.state, invoices]);

  const unpaidInvoices = invoices.filter(
    (inv) =>
      Number(inv.balanceAmount) > 0 &&
      inv.status !== 'PAID' &&
      inv.status !== 'VOID' &&
      inv.status !== 'CANCELLED'
  );

  const handleInvoiceSelect = (id) => {
    setSelectedInvoiceId(id);
    const inv = unpaidInvoices.find((i) => i.id === id);
    if (inv) {
      setAmount(Number(inv.balanceAmount).toFixed(2));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) {
      toast.error('Please select an invoice and enter amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments', {
        invoiceId: selectedInvoiceId,
        amount: parseFloat(amount),
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success('Payment recorded and reconciled against invoice successfully!');
        setShowPayModal(false);
        setSelectedInvoiceId('');
        setAmount('');
        setNotes('');
        fetchPaymentsData();
      } else {
        toast.error(res.message || 'Payment recording failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Server error occurred during payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const num = p.paymentNumber?.toLowerCase() || '';
    const invNum = p.invoice?.invoiceNumber?.toLowerCase() || '';
    const method = p.paymentMethod?.toLowerCase() || '';
    return num.includes(q) || invNum.includes(q) || method.includes(q);
  });

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOutstanding = unpaidInvoices.reduce(
    (sum, i) => sum + (Number(i.balanceAmount) || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Payment History & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track settled transactions, invoice receipts, and record payments for open balances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPaymentsData}
            className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowPayModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Make a Payment</span>
          </button>
        </div>
      </div>

      {/* Balance Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
            Total Settled Payments
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            ${totalPaid.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {payments.length} verified transaction(s)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
            Outstanding Unpaid Balance
          </span>
          <div
            className={`text-2xl font-extrabold mt-2 font-mono ${
              totalOutstanding > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            ${totalOutstanding.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {unpaidInvoices.length} pending invoice(s)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
            Settlement Policy
          </span>
          <div className="text-xs text-slate-300 mt-2 space-y-1">
            <p>✓ Instant invoice balance reconciliation</p>
            <p>✓ Multi-currency & bank transfer support</p>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by payment # or invoice #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
            Loading your payment history...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Payments Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't recorded any payments yet. When you pay an invoice, settlements will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Payment #</th>
                  <th className="px-6 py-3.5">Date Paid</th>
                  <th className="px-6 py-3.5">Related Invoice</th>
                  <th className="px-6 py-3.5">Payment Method</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Notes</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {p.paymentNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(p.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-indigo-400">
                      {p.invoice?.invoiceNumber || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase">
                        {p.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-emerald-400 text-sm">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Record Invoice Payment</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reconcile and settle outstanding balances on your customer account
                </p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">All Invoices are Paid!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You currently have no pending invoices with an outstanding balance.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                    Select Invoice to Pay *
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">-- Choose an outstanding invoice --</option>
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — Balance: ${Number(inv.balanceAmount).toFixed(2)} (Due: {new Date(inv.dueDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                      Payment Amount ($) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 font-mono font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CREDIT_CARD">Credit Card / Debit Card</option>
                      <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                      <option value="STRIPE">Stripe</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="MANUAL">Manual Settlement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                    Payment Note / Reference
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Bank wire reference #789012"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Payment Settlement Note:</span>
                  This records a payment against the selected invoice in PostgreSQL. Your invoice balance and status will update immediately.
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {submitting ? 'Recording Settlement...' : 'Record Payment Settlement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
