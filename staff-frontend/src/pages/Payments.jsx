import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  Plus,
  X,
  Receipt,
  CheckCircle,
  Calendar,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Record modal
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices'),
      ]);
      setPayments(payRes.data?.payments || []);
      setInvoices(invRes.data?.invoices || []);
    } catch (err) {
      console.warn('Failed to load payments data:', err);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvoiceSelect = (invId) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(String(Number(inv.balanceAmount || inv.totalAmount).toFixed(2)));
      setRef(`TXN-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) {
      toast.error('Please select an invoice and enter amount');
      return;
    }

    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      toast.error('Valid positive amount required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/payments', {
        invoiceId: selectedInvoiceId,
        amount: payNum,
        paymentMethod,
        transactionReference: ref,
        notes,
      });

      toast.success(`Payment of $${payNum.toFixed(2)} recorded successfully!`);
      setShowModal(false);
      setSelectedInvoiceId('');
      setAmount('');
      setRef('');
      setNotes('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const unpaidInvoices = invoices.filter(
    (inv) => Number(inv.balanceAmount) > 0 && inv.status !== 'CANCELLED'
  );

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.paymentNumber?.toLowerCase().includes(q) ||
      p.customer?.name?.toLowerCase().includes(q) ||
      p.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
      p.transactionReference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Collections</h1>
          <p className="text-sm text-slate-500">
            Record customer payments against invoices and verify payment transaction settlement.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment #, customer, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500">
          Showing <strong>{filteredPayments.length}</strong> recorded payments
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              Loading payment history...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No payment records found</h3>
              <p className="text-xs text-slate-400 mt-1">Record a payment to track collections against open invoices.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Payment #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Method & Reference</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Amount Paid</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-800">{p.customer?.name}</div>
                      <div className="text-xs text-slate-400">{p.customer?.companyName || p.customer?.email}</div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {p.invoice?.invoiceNumber || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <div className="font-semibold text-slate-800">{p.paymentMethod}</div>
                      <div className="text-slate-400 text-[11px]">{p.transactionReference || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-600">
                      +${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Record Customer Payment</h3>
                <p className="text-xs text-slate-400">Match payment against an outstanding invoice</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  required
                >
                  <option value="">-- Choose Outstanding Invoice --</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customer?.name} (Balance: ${Number(inv.balanceAmount).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash / Cheque</option>
                  <option value="STRIPE">Stripe / Online</option>
                  <option value="MANUAL">Manual Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g. WIRE-823912"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional settlement notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
