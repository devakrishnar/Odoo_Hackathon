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
  Clock,
  Building2,
  HelpCircle,
  Copy,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Payments = () => {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Payment notification form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionReference, setTransactionReference] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
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

  // If navigated from invoice "Submit Payment" button
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

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName}`);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) {
      toast.error('Please select an invoice and enter amount.');
      return;
    }

    if (!transactionReference.trim()) {
      toast.error('Please enter the transaction reference / bank wire reference.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments', {
        invoiceId: selectedInvoiceId,
        amount: parseFloat(amount),
        paymentMethod,
        transactionReference: transactionReference.trim(),
        notes: notes.trim() ? `${notes.trim()} (Transfer Date: ${transferDate})` : `Transfer Date: ${transferDate}`,
      });

      if (res.success) {
        toast.success(
          'Your payment details have been submitted. The payment will be reflected in your invoice after verification by the finance team.',
          { duration: 6000 }
        );
        setShowPayModal(false);
        setSelectedInvoiceId('');
        setAmount('');
        setTransactionReference('');
        setNotes('');
        fetchPaymentsData();
      } else {
        toast.error(res.message || 'Payment submission failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Server error occurred during payment submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const num = p.paymentNumber?.toLowerCase() || '';
    const invNum = p.invoice?.invoiceNumber?.toLowerCase() || '';
    const method = p.paymentMethod?.toLowerCase() || '';
    const ref = p.transactionReference?.toLowerCase() || '';
    return num.includes(q) || invNum.includes(q) || method.includes(q) || ref.includes(q);
  });

  const totalVerifiedPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPendingVerification = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalOutstanding = unpaidInvoices.reduce(
    (sum, i) => sum + (Number(i.balanceAmount) || 0),
    0
  );

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <CheckCircle2 className="h-3 w-3" />
            <span>Verified</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <Clock className="h-3 w-3" />
            <span>Pending Verification</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-950/60 text-rose-400 border border-rose-800/40">
            <AlertCircle className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Payment History & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track bank transfer submissions, finance verification statuses, and view verified payment receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInstructionsModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/40 text-indigo-300 rounded-xl text-xs font-semibold transition"
          >
            <HelpCircle className="h-4 w-4 text-indigo-400" />
            <span>Bank Instructions</span>
          </button>

          <button
            onClick={() => setShowPayModal(true)}
            disabled={unpaidInvoices.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Payment Notification</span>
          </button>

          <button
            onClick={fetchPaymentsData}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Total Verified Paid
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono mt-2">
            ${totalVerifiedPaid.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Reconciled into invoice balances</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-amber-400 tracking-wider">
              Pending Verification
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono mt-2">
            ${totalPendingVerification.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting finance team review</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Outstanding Invoices
            </span>
            <Receipt className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-400 font-mono mt-2">
            ${totalOutstanding.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{unpaidInvoices.length} unpaid invoice(s)</span>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by payment #, invoice #, reference..."
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
              You haven't submitted any payment notifications yet. When you transfer funds for an invoice, submit your details to track verification.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Payment #</th>
                  <th className="px-6 py-3.5">Submission Date</th>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Transaction Ref</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Verification Status</th>
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
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {p.transactionReference || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-white text-sm">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {getVerificationBadge(p.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Payment Notification Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                  Manual Payment Verification
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  Submit Payment Notification
                </h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              {/* Notification Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-start space-x-2.5 text-indigo-300 text-xs leading-relaxed">
                <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                <span>
                  Your payment details will be submitted for manual verification. The payment will be reflected in your invoice after confirmation by the finance team.
                </span>
              </div>

              {/* Invoice Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Outstanding Invoice *
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose an invoice --</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — Balance: ${Number(inv.balanceAmount).toFixed(2)} (Due: {new Date(inv.dueDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Transferred */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Amount Transferred ($ USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="BANK_TRANSFER">Bank Wire / Wire Transfer</option>
                  <option value="CREDIT_CARD">Corporate Credit Card (Offline)</option>
                  <option value="MANUAL">Direct Deposit / Cheque</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </div>

              {/* Transaction Reference / Bank UTR */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Transaction / UTR / Reference ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-91823910, WIRE-88129, or Cheque #1029"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Provided on your bank transfer receipt or transaction confirmation.
                </span>
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Transfer Date *
                </label>
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Remittance Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any additional bank or settlement notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Company Payment Instructions
                  </h3>
                  <p className="text-xs text-slate-400">Manual wire and bank transfer details</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-300">
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Beneficiary Name</span>
                  <span className="font-semibold text-white">Brightloop Software Inc.</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Bank Name</span>
                  <span className="font-semibold text-white">Silicon Valley SaaS Commercial Bank</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Account Number</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-indigo-300">8820 9104 5512</span>
                    <button
                      onClick={() => handleCopy('882091045512', 'Account Number')}
                      className="p-1 hover:text-white text-slate-400"
                    >
                      {copiedField === 'Account Number' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">SWIFT / Routing Code</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-slate-200">SVSB0001882</span>
                    <button
                      onClick={() => handleCopy('SVSB0001882', 'SWIFT Code')}
                      className="p-1 hover:text-white text-slate-400"
                    >
                      {copiedField === 'SWIFT Code' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Payment Reference</span>
                  <span className="font-mono font-bold text-amber-400">Your Invoice Number (e.g. INV-XXXX)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
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
