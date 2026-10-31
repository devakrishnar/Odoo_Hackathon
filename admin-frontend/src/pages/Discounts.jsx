import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Percent,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE',
    value: '',
    maxDiscountAmount: '',
    usageLimit: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/discounts');
      const list = res?.data?.discounts || res?.discounts || [];
      setDiscounts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch discounts');
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || formData.value === '') {
      toast.error('Coupon code, name, and value are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        value: Number(formData.value),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      };

      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, payload);
        toast.success(`Discount ${formData.code} updated successfully!`);
      } else {
        await api.post('/discounts', payload);
        toast.success(`Discount ${formData.code} created!`);
      }

      setIsModalOpen(false);
      setEditingDiscount(null);
      fetchDiscounts();
    } catch (err) {
      toast.error(err?.message || 'Failed to save discount');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      await api.patch(`/discounts/${discount.id}/status`, { active: !discount.active });
      toast.success(`Coupon ${discount.code} ${!discount.active ? 'activated' : 'deactivated'}.`);
      fetchDiscounts();
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle discount');
    }
  };

  const filteredDiscounts = discounts.filter((d) => {
    const matchesSearch =
      !searchTerm.trim() ||
      d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const status = d.computedStatus || (d.active ? 'ACTIVE' : 'INACTIVE');
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discounts & Coupons</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Promotional Pricing
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage percentage vouchers, fixed rate discounts, usage quotas, and validity lifecycles.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchDiscounts}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingDiscount(null);
              setFormData({
                code: '',
                name: '',
                type: 'PERCENTAGE',
                value: '',
                maxDiscountAmount: '',
                usageLimit: '',
                validFrom: new Date().toISOString().split('T')[0],
                validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: '',
                active: true,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Discount</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code or discount campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="EXHAUSTED">Exhausted</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3" />
              <span>Loading discount records...</span>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <Tag className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Discounts Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm ? 'No discounts match the search.' : 'Create promotional discount codes above.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Coupon Code</th>
                  <th className="px-6 py-3.5">Campaign Name</th>
                  <th className="px-6 py-3.5">Deduction Value</th>
                  <th className="px-6 py-3.5">Redemptions</th>
                  <th className="px-6 py-3.5">Validity Period</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiscounts.map((d) => {
                  const status = d.computedStatus || (d.active ? 'ACTIVE' : 'INACTIVE');
                  const isPct = d.type === 'PERCENTAGE';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 text-xs">
                          {d.code}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">{d.name}</span>
                        <span className="text-[11px] text-slate-400 block max-w-xs truncate">
                          {d.description || 'General discount'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-900">
                        {isPct ? `${d.value}% OFF` : `$${Number(d.value).toFixed(2)} OFF`}
                        {d.maxDiscountAmount && (
                          <span className="text-[10px] text-slate-400 font-normal block">
                            Cap: ${Number(d.maxDiscountAmount).toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        <span className="font-semibold">{d.usedCount || 0}</span> /{' '}
                        <span>{d.usageLimit !== null ? d.usageLimit : '∞ unlimited'}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        <div>
                          <span>From: {new Date(d.validFrom).toLocaleDateString()}</span>
                          <span className="block text-slate-400">
                            To: {new Date(d.validTo).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'EXPIRED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : status === 'EXHAUSTED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingDiscount(d);
                            setFormData({
                              code: d.code,
                              name: d.name,
                              type: d.type,
                              value: d.value,
                              maxDiscountAmount: d.maxDiscountAmount || '',
                              usageLimit: d.usageLimit || '',
                              validFrom: new Date(d.validFrom).toISOString().split('T')[0],
                              validTo: new Date(d.validTo).toISOString().split('T')[0],
                              description: d.description || '',
                              active: d.active,
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(d)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                            d.active
                              ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {d.active ? 'Deactivate' : 'Activate'}
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

      {/* Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingDiscount ? 'Edit Promotional Coupon' : 'Create Promotional Coupon'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SPRING2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Spring Early Bird 20%"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Deduction Value ({formData.type === 'PERCENTAGE' ? '%' : '$'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder={formData.type === 'PERCENTAGE' ? '20' : '50.00'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Max Discount Amount ($ Cap)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional ceiling (e.g. 100)"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Usage Limit (Total count)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited if empty"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Valid From</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Valid To (Expiration)</label>
                  <input
                    type="date"
                    required
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Description & Campaign Terms</label>
                <textarea
                  rows={2}
                  placeholder="Terms of eligibility and quotation scope."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDiscount ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discounts;

