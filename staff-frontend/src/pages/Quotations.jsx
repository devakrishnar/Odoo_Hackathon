import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Send,
  Trash2,
  X,
  Repeat,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Quotations = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Creator State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [validUntilDays, setValidUntilDays] = useState(14);
  const [discountCode, setDiscountCode] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { planId: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, description: '' },
  ]);

  // View Detail Modal
  const [previewQuote, setPreviewQuote] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [quotesRes, custRes, plansRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/customers'),
        api.get('/plans'),
      ]);
      setQuotations(quotesRes.data?.quotations || []);
      setCustomers(custRes.data?.customers || []);
      setPlans(plansRes.data?.plans || []);
    } catch (err) {
      console.warn('Error fetching data:', err);
      toast.error('Failed to load quotations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Check URL query parameters for auto-open create modal
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      const custId = searchParams.get('customerId');
      if (custId) setSelectedCustomer(custId);
    }
  }, [searchParams]);

  // Line item manipulation
  const handleAddItem = () => {
    setItems([
      ...items,
      { planId: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, description: '' },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // If plan changed, prefill unit price & description
    if (field === 'planId') {
      const selectedPlan = plans.find((p) => p.id === value);
      if (selectedPlan) {
        updated[index].unitPrice = Number(selectedPlan.price);
        updated[index].description = `${selectedPlan.product?.name || 'Software'} - ${selectedPlan.name}`;
      }
    }

    setItems(updated);
  };

  // Template Quick Apply
  const applyTemplate = (templateType) => {
    if (plans.length === 0) return;
    if (templateType === 'standard') {
      const plan = plans[0];
      setItems([
        {
          planId: plan.id,
          quantity: 1,
          unitPrice: Number(plan.price),
          taxPercent: 10,
          discountPercent: 0,
          description: `Standard Service - ${plan.name}`,
        },
      ]);
      setValidUntilDays(14);
      setNotes('Standard 14-day validity quotation with recurring monthly terms.');
      toast.success('Applied Standard Template');
    } else if (templateType === 'bundle') {
      const p1 = plans[0];
      const p2 = plans[1] || plans[0];
      setItems([
        {
          planId: p1.id,
          quantity: 1,
          unitPrice: Number(p1.price),
          taxPercent: 10,
          discountPercent: 5,
          description: `${p1.name} Primary License`,
        },
        {
          planId: p2.id,
          quantity: 2,
          unitPrice: Number(p2.price),
          taxPercent: 10,
          discountPercent: 10,
          description: `${p2.name} Add-on Seats`,
        },
      ]);
      setValidUntilDays(30);
      setNotes('Special bundle package with introductory seat discounts.');
      toast.success('Applied Enterprise Bundle Template');
    }
  };

  // Calculate live totals
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
  }, 0);

  const totalItemDiscounts = items.reduce((sum, item) => {
    const raw = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
    return sum + raw * ((Number(item.discountPercent) || 0) / 100);
  }, 0);

  const totalTax = items.reduce((sum, item) => {
    const raw = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
    const afterDisc = raw - raw * ((Number(item.discountPercent) || 0) / 100);
    return sum + afterDisc * ((Number(item.taxPercent) || 0) / 100);
  }, 0);

  const netTotal = Math.max(0, subtotal - totalItemDiscounts + totalTax);

  const handleCreateQuotation = async (initialStatus = 'DRAFT') => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    const invalidItem = items.find((i) => !i.planId);
    if (invalidItem) {
      toast.error('Please select a plan for each line item');
      return;
    }

    setCreating(true);
    try {
      const validUntil = new Date(Date.now() + validUntilDays * 24 * 60 * 60 * 1000);
      const payload = {
        customerId: selectedCustomer,
        status: initialStatus,
        validUntil,
        discountCode: discountCode.trim() || undefined,
        notes,
        items,
      };

      const res = await api.post('/quotations', payload);
      toast.success(`Quotation ${res.data?.quotation?.quotationNumber || ''} created successfully!`);
      setShowCreateModal(false);
      // Reset form
      setSelectedCustomer('');
      setItems([{ planId: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, description: '' }]);
      setNotes('');
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create quotation');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      await api.patch(`/quotations/${quoteId}/status`, { status: newStatus });
      toast.success(`Quotation marked as ${newStatus}`);
      fetchInitialData();
      if (previewQuote && previewQuote.id === quoteId) {
        setPreviewQuote((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Status update failed');
    }
  };

  const handleConvertToSubscription = async (quoteId) => {
    try {
      const res = await api.post(`/subscriptions/convert/${quoteId}`);
      toast.success(
        `Quotation converted into active subscription ${res.data?.subscription?.subscriptionNumber || ''}!`
      );
      fetchInitialData();
      if (previewQuote) setPreviewQuote(null);
      navigate('/subscriptions');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Conversion failed');
    }
  };

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations & Proposals</h1>
          <p className="text-sm text-slate-500">
            Create custom proposals using templates, configure discounts, and convert to active subscriptions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInitialData}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'REJECTED'].map((st) => (
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

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              Loading quotations...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No quotations found</h3>
              <p className="text-xs text-slate-400 mt-1">Get started by creating a quotation for a customer.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Valid Until</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{q.quotationNumber}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-800">{q.customer?.name}</div>
                      <div className="text-xs text-slate-400">{q.customer?.companyName || q.customer?.email}</div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">${Number(q.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          q.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.status === 'CONVERTED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : q.status === 'SENT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setPreviewQuote(q)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                      >
                        Preview
                      </button>

                      {q.status === 'DRAFT' && (
                        <button
                          onClick={() => handleUpdateStatus(q.id, 'SENT')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold transition"
                        >
                          Send
                        </button>
                      )}

                      {(q.status === 'DRAFT' || q.status === 'SENT') && (
                        <button
                          onClick={() => handleUpdateStatus(q.id, 'ACCEPTED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition"
                        >
                          Mark Accepted
                        </button>
                      )}

                      {q.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleConvertToSubscription(q.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-sm transition flex-inline items-center"
                        >
                          Convert to Sub
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Create New Quotation</h2>
                <p className="text-xs text-slate-400">Prepare offer with line items, taxes, and eligible discounts</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Quick Template Presets Bar */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-950">Fast Quotation Templates:</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => applyTemplate('standard')}
                    className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-medium transition shadow-xs"
                  >
                    Standard Single Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('bundle')}
                    className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-medium transition shadow-xs"
                  >
                    Enterprise Bundle
                  </button>
                </div>
              </div>

              {/* Customer & Expiry Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={validUntilDays}
                    onChange={(e) => setValidUntilDays(parseInt(e.target.value) || 14)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500">Plan</label>
                          <select
                            value={item.planId}
                            onChange={(e) => handleItemChange(index, 'planId', e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="">-- Select Plan --</option>
                            {plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} - ${Number(p.price).toFixed(2)} / {p.billingCycle}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500">Unit Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500">Tax (%)</label>
                          <input
                            type="number"
                            value={item.taxPercent}
                            onChange={(e) => handleItemChange(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500">Line Discount (%)</label>
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) =>
                              handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)
                            }
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Line Total:{' '}
                            $
                            {(
                              (Number(item.quantity) * Number(item.unitPrice) * (1 - (Number(item.discountPercent) || 0) / 100)) *
                              (1 + (Number(item.taxPercent) || 0) / 100)
                            ).toFixed(2)}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary Panel */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {totalItemDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discounts:</span>
                    <span>-${totalItemDiscounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax:</span>
                  <span>+${totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400 font-extrabold">${netTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment due upon acceptance. Subscription renews automatically."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => handleCreateQuotation('DRAFT')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
              >
                {creating ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => handleCreateQuotation('SENT')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                {creating ? 'Sending...' : 'Save & Send to Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW QUOTE MODAL */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewQuote.quotationNumber}</h3>
                <p className="text-xs text-slate-500">Customer: {previewQuote.customer?.name}</p>
              </div>
              <button onClick={() => setPreviewQuote(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-slate-900">{previewQuote.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="text-slate-800">{new Date(previewQuote.validUntil).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="text-slate-800">${Number(previewQuote.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-100">
                <span>Total Amount:</span>
                <span className="text-emerald-600">${Number(previewQuote.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              {previewQuote.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleConvertToSubscription(previewQuote.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Convert to Subscription
                </button>
              )}
              <button
                onClick={() => setPreviewQuote(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
