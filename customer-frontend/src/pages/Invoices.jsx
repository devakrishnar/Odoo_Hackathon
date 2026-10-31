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
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/invoices/${invoice.id}/pdf`,
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
            My Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View tax-compliant billing invoices, outstanding balances, and download official PDF statements.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Controls: Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
            Loading your invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Invoices Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no invoice records matching the selected filter.
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
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Paid Amount</th>
                  <th className="px-6 py-3.5">Outstanding Balance</th>
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
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                            >
                              Pay
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-xs text-indigo-400 font-mono font-bold block">
                  {selectedInvoice.invoiceNumber}
                </span>
                <h3 className="text-xl font-bold text-white">Invoice Line Items & Breakdown</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Issue Date</span>
                  <span className="text-slate-300 font-medium">
                    {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Due Date</span>
                  <span className="text-slate-300 font-medium">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Currency</span>
                  <span className="text-white font-bold">{selectedInvoice.currency || 'USD'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                  {getStatusBadge(selectedInvoice.status, selectedInvoice.dueDate, selectedInvoice.balanceAmount)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">
                  Line Items
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Tax</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(selectedInvoice.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-medium text-white">{item.description}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            ${Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{Number(item.taxPercent || 0)}%</td>
                          <td className="px-4 py-3 text-right font-bold text-white font-mono">
                            ${Number(item.lineTotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
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
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Official PDF</span>
                </button>

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
    </div>
  );
};
