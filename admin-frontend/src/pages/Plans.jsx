import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Edit2,
  AlertCircle,
  Sliders,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    code: '',
    description: '',
    billingCycle: 'MONTHLY',
    price: '',
    currency: 'USD',
    trialDays: 0,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, prodRes] = await Promise.all([
        api.get('/plans'),
        api.get('/products'),
      ]);
      setPlans(plansRes?.data?.plans || plansRes?.plans || []);
      setProducts(prodRes?.data?.products || prodRes?.products || []);
    } catch (err) {
      setError(err?.message || 'Failed to load plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.name.trim() || !formData.code.trim() || formData.price === '') {
      toast.error('Product, Plan name, unique code, and price are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        trialDays: Number(formData.trialDays || 0),
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        toast.success(`Plan ${formData.name} updated successfully!`);
      } else {
        await api.post('/plans', payload);
        toast.success(`Plan ${formData.name} created successfully!`);
      }

      setIsModalOpen(false);
      setEditingPlan(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      await api.patch(`/plans/${plan.id}/status`, { active: !plan.active });
      toast.success(`Plan ${plan.name} ${!plan.active ? 'activated' : 'deactivated'}.`);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle status');
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = cycleFilter === 'ALL' || p.billingCycle === cycleFilter;
    return matchesSearch && matchesCycle;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Pricing Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Define recurring pricing schedules, billing cycles, trial days, and subscription lifecycle rules.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingPlan(null);
              setFormData({
                productId: products[0]?.id || '',
                name: '',
                code: '',
                description: '',
                billingCycle: 'MONTHLY',
                price: '',
                currency: 'USD',
                trialDays: 14,
                active: true,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Plans Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plan name, SKU code, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">Billing Interval:</span>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Cycles</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="SEMI_ANNUAL">Semi-Annual</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
        </div>

        {/* Plan Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3" />
              <span>Loading pricing tiers...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <Layers className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Plans Configured</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm ? 'No plans match your search.' : 'Create your first pricing plan above.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Plan Name / Product</th>
                  <th className="px-6 py-3.5">Plan Code</th>
                  <th className="px-6 py-3.5">Billing Interval</th>
                  <th className="px-6 py-3.5">Recurring Price</th>
                  <th className="px-6 py-3.5">Trial Days</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((pl) => (
                  <tr key={pl.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-slate-900 block">{pl.name}</span>
                        <span className="text-xs text-blue-600 font-medium">
                          Product: {pl.product?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-700">
                      {pl.code}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="h-3 w-3 mr-1 text-slate-400" />
                        {pl.billingCycle}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      ${Number(pl.price).toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-400">{pl.currency || 'USD'}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {pl.trialDays > 0 ? `${pl.trialDays} Days Free` : 'No Trial'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          pl.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {pl.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingPlan(pl);
                          setFormData({
                            productId: pl.productId,
                            name: pl.name,
                            code: pl.code,
                            description: pl.description || '',
                            billingCycle: pl.billingCycle,
                            price: pl.price,
                            currency: pl.currency || 'USD',
                            trialDays: pl.trialDays,
                            active: pl.active,
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                        title="Edit plan"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(pl)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                          pl.active
                            ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {pl.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Parent Product *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select a Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Monthly"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Plan SKU / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="STD-M-2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Billing Interval</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="49.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Trial Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (immediate billing)"
                  value={formData.trialDays}
                  onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Plan Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Renewal terms, automated closure, or cancellation rules."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="planActive"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="planActive" className="text-slate-700 font-medium">
                  Active for new quotations and customer self-signup
                </label>
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
                  {submitting ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;

