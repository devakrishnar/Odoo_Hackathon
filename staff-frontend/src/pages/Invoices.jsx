import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Download,
  CreditCard,
  Eye,
  AlertTriangle,
  CheckCircle,
  X,
  PhoneCall,
  Mail,
  DollarSign,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Invoices = () => {
  const [searchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Drawer state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Payment Recording Modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data?.invoices || []);
    } catch (err) {
      console.warn('Failed to load invoices:', err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Sync initial query params e.g. /invoices?status=OVERDUE
  useEffect(() => {
    const st = searchParams.get('status');
    if (st) setStatusFilter(st.toUpperCase());
  }, [searchParams]);

  // Download PDF invoice
  const handleDownloadPDF = async (invoice) => {
    try {
      toast.loading('Generating invoice PDF...', { id: 'pdf-toast' });
      const token = localStorage.getItem('brightloop_staff_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/invoices/${invoice.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice PDF downloaded!', { id: 'pdf-toast' });
    } catch (err) {
      toast.error('Failed to download PDF invoice', { id: 'pdf-toast' });
    }
  };

  // Open Payment modal
  const openPaymentModal = (inv) => {
    setPaymentModalInvoice(inv);
    setPayAmount(String(Number(inv.balanceAmount || inv.totalAmount).toFixed(2)));
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayNote('');
  };

  // Submit recorded payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice || !payAmount) return;

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return;
    }

    setRecordingPayment(true);
    try {
      const payload = {
        invoiceId: paymentModalInvoice.id,
        amount: amountNum,
        paymentMethod: payMethod,
        transactionReference: payRef,
        notes: payNote,
      };

      await api.post('/payments', payload);
      toast.success(`Payment of $${amountNum.toFixed(2)} recorded successfully!`);
      setPaymentModalInvoice(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment recording failed');
    } finally {
      setRecordingPayment(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.companyName?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') return inv.displayStatus === 'OVERDUE' || inv.isOverdue;
    return inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Management & Follow-up</h1>
          <p className="text-sm text-slate-500">
            Track customer billing, download PDF invoices, record payments, and follow up overdue balances.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInvoices}
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
            placeholder="Search invoice #, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          {['ALL', 'ISSUED', 'OVERDUE', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === st
                  ? st === 'OVERDUE'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'OVERDUE' ? '⚠️ Overdue Follow-up' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No invoices found</h3>
              <p className="text-xs text-slate-400 mt-1">Invoices generated from subscriptions will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Dates (Issue / Due)</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Balance Due</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isOverdue = inv.displayStatus === 'OVERDUE' || inv.isOverdue;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/75 transition ${isOverdue ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800">{inv.customer?.name}</div>
                        <div className="text-xs text-slate-400">{inv.customer?.companyName || inv.customer?.email}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        <div>Issued: {new Date(inv.issueDate).toLocaleDateString()}</div>
                        <div className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-400'}>
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">${Number(inv.totalAmount).toFixed(2)}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`font-bold ${
                            Number(inv.balanceAmount) > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          ${Number(inv.balanceAmount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            isOverdue
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isOverdue ? 'OVERDUE' : inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1.5">
                        {/* Download PDF button */}
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5 inline mr-1" />
                          <span>PDF</span>
                        </button>

                        {/* Record Payment button */}
                        {Number(inv.balanceAmount) > 0 && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-sm transition"
                            title="Record Payment"
                          >
                            <CreditCard className="h-3.5 w-3.5 inline mr-1" />
                            <span>Pay</span>
                          </button>
                        )}

                        {/* View detail button */}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Record Payment</h3>
                <p className="text-xs text-slate-400">Invoice: {paymentModalInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{paymentModalInvoice.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="text-slate-800">${Number(paymentModalInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Current Outstanding:</span>
                  <span>${Number(paymentModalInvoice.balanceAmount).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Record ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={Number(paymentModalInvoice.balanceAmount)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
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
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Optional notes or settlement confirmation number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {recordingPayment ? 'Recording...' : 'Confirm & Settle Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE DETAIL DRAWER */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h2 className="text-lg font-bold">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Billed to: {selectedInvoice.customer?.name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Customer Follow-Up Contact Card */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
                    <PhoneCall className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                    Customer Contact & Follow-Up
                  </span>
                  {selectedInvoice.isOverdue && (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                      Follow-up Needed
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Name</span>
                    <span className="font-semibold">{selectedInvoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company</span>
                    <span className="font-semibold">{selectedInvoice.customer?.companyName || 'Individual'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email</span>
                    <a
                      href={`mailto:${selectedInvoice.customer?.email}`}
                      className="font-semibold text-emerald-600 hover:underline flex items-center mt-0.5"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {selectedInvoice.customer?.email || 'N/A'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone</span>
                    <a
                      href={`tel:${selectedInvoice.customer?.phone}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600 flex items-center mt-0.5"
                    >
                      <PhoneCall className="h-3 w-3 mr-1 text-slate-400" />
                      {selectedInvoice.customer?.phone || 'No phone recorded'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 inline-block">
                    {selectedInvoice.displayStatus || selectedInvoice.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Balance Due</span>
                  <span className="font-bold text-red-600 text-sm mt-0.5 inline-block">
                    ${Number(selectedInvoice.balanceAmount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Invoiced</span>
                  <span className="font-medium text-slate-800">
                    ${Number(selectedInvoice.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Paid So Far</span>
                  <span className="font-medium text-emerald-600">
                    ${Number(selectedInvoice.paidAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Itemized Charges</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedInvoice.items &&
                    selectedInvoice.items.map((it) => (
                      <div key={it.id} className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-900">{it.description}</p>
                          <p className="text-slate-400 text-[11px]">
                            Qty: {it.quantity} × ${Number(it.unitPrice).toFixed(2)} (Tax: {Number(it.taxPercent)}%)
                          </p>
                        </div>
                        <span className="font-bold text-slate-800">${Number(it.lineTotal).toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* PDF & Payment Actions */}
              <div className="pt-4 border-t border-slate-200 flex space-x-2">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Official PDF</span>
                </button>
                {Number(selectedInvoice.balanceAmount) > 0 && (
                  <button
                    onClick={() => {
                      const inv = selectedInvoice;
                      setSelectedInvoice(null);
                      openPaymentModal(inv);
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Record Payment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
