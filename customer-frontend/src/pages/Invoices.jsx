import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Receipt,
  Download,
  Search,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  Building2,
  HelpCircle,
  Copy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      if (res.data?.invoices) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error('Unable to fetch your invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      const token = localStorage.getItem('brightloop_customer_token');
      const response = await fetch(
        `http://localhost:5000/api/invoices/${invoice.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download invoice PDF');
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
      toast.success(`Downloaded Invoice ${invoice.invoiceNumber}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error(err.message || 'Could not download invoice PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status, dueDate, balance) => {
    const isOverdue = status !== 'PAID' && new Date(dueDate) < new Date() && Number(balance) > 0;
    if (isOverdue) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-950/60 text-rose-400 border border-rose-800/40">
          OVERDUE
        </span>
      );
    }

    const map = {
      PAID: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
      PARTIALLY_PAID: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
      ISSUED: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/40',
      DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
    };

    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
          map[status] || 'bg-slate-800 text-slate-400 border-slate-700'
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
            My Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access tax-compliant billing statements, line-item breakdowns, and download official PDF receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInstructionsModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/40 text-indigo-300 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <HelpCircle className="h-4 w-4 text-indigo-400" />
            <span>Payment Instructions</span>
          </button>

          <button
            onClick={fetchInvoices}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition shadow-sm"
            title="Refresh Invoices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-3" />
            <p className="text-xs">Loading invoice records...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Invoices Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are no billing records matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Paid</th>
                  <th className="px-6 py-3.5">Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => {
                  const hasBalance = Number(inv.balanceAmount) > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        ${Number(inv.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                        ${Number(inv.paidAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">
                        <span className={hasBalance ? 'text-amber-400' : 'text-slate-400'}>
                          ${Number(inv.balanceAmount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(inv.status, inv.dueDate, inv.balanceAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title="View Breakdown"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingId === inv.id}
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition border border-indigo-500/30"
                            title="Download PDF"
                          >
                            <Download className={`h-3.5 w-3.5 ${downloadingId === inv.id ? 'animate-bounce' : ''}`} />
                          </button>
                          {hasBalance && (
                            <button
                              onClick={() => navigate('/payments', { state: { payInvoiceId: inv.id } })}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center space-x-1"
                              title="Submit offline bank transfer details"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Submit Payment</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase font-semibold">
                  Invoice Breakdown
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Issue Date</span>
                  <span className="text-slate-200 font-medium">
                    {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Due Date</span>
                  <span className="text-slate-200 font-medium">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Status</span>
                  <div>{getStatusBadge(selectedInvoice.status, selectedInvoice.dueDate, selectedInvoice.balanceAmount)}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Remaining Balance</span>
                  <span className="text-rose-400 font-mono font-bold">
                    ${Number(selectedInvoice.balanceAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider mb-2">
                  Line Items & License Entitlements
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Item Description</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                      {(selectedInvoice.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-white font-medium">
                            {item.description || 'Subscription Line'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-slate-400">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                            ${Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-white font-semibold">
                            ${Number(item.lineTotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-white font-mono">${Number(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(selectedInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount:</span>
                    <span className="text-emerald-400 font-mono">
                      -${Number(selectedInvoice.discountAmount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Tax Amount:</span>
                  <span className="text-white font-mono">${Number(selectedInvoice.taxAmount).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Total Invoice Amount:</span>
                  <span className="font-mono text-indigo-400">
                    ${Number(selectedInvoice.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Amount Paid:</span>
                  <span className="font-mono">${Number(selectedInvoice.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-400 font-bold text-sm">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono">${Number(selectedInvoice.balanceAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedInvoice)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Official PDF</span>
                  </button>

                  {Number(selectedInvoice.balanceAmount) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = selectedInvoice.id;
                        setSelectedInvoice(null);
                        navigate('/payments', { state: { payInvoiceId: id } });
                      }}
                      className="px-3 py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 rounded-lg text-xs font-semibold transition"
                    >
                      Submit Payment Details
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Instructions Modal */}
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
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-start space-x-2.5 text-indigo-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                <p className="leading-relaxed">
                  Brightloop Software operates on verified corporate wire transfers. Please transfer the outstanding balance using the account details below, including your <strong>Invoice Number</strong> as the reference.
                </p>
              </div>

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

              <div className="space-y-1.5 text-slate-400">
                <p className="font-semibold text-white text-[11px]">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Initiate the transfer from your banking portal or counter.</li>
                  <li>Go to the Payments tab and click <strong>"Submit Payment Details"</strong>.</li>
                  <li>Enter your bank reference/UTR number and amount transferred.</li>
                  <li>Our finance team will verify the bank statement and confirm your payment.</li>
                </ol>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
