import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Tag,
  Layers,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'SaaS Platform',
    description: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Variant / Plan Modal
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);
  const [variantForm, setVariantForm] = useState({
    name: '',
    code: '',
    billingCycle: 'MONTHLY',
    price: '',
    trialDays: 14,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/products');
      const list = res?.data?.products || res?.products || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Product name and unique code are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success(`Product ${formData.name} updated successfully!`);
      } else {
        await api.post('/products', formData);
        toast.success(`Product ${formData.name} created successfully!`);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await api.patch(`/products/${product.id}/status`, { active: !product.active });
      toast.success(`Product ${product.name} ${!product.active ? 'activated' : 'deactivated'}.`);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle status');
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.name.trim() || !variantForm.code.trim() || !variantForm.price) {
      toast.error('Variant name, code, and price are required.');
      return;
    }

    try {
      await api.post('/plans', {
        ...variantForm,
        productId: targetProduct.id,
        price: Number(variantForm.price),
      });
      toast.success(`Variant plan ${variantForm.name} added to ${targetProduct.name}!`);
      setIsVariantModalOpen(false);
      setVariantForm({ name: '', code: '', billingCycle: 'MONTHLY', price: '', trialDays: 14 });
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to add variant plan');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Variants</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Catalog Management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure core SaaS applications, edition editions, recurring license tiers, and pricing adjustments.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', code: '', category: 'SaaS Platform', description: '', active: true });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Cards / Table */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3" />
              <span>Loading product catalog...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Products Available</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm ? 'No products match the filter criteria.' : 'Create your first product edition above.'}
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const plans = p.plans || [];
              const minPrice = plans.length > 0 ? Math.min(...plans.map((pl) => Number(pl.price))) : 0;
              const maxPrice = plans.length > 0 ? Math.max(...plans.map((pl) => Number(pl.price))) : 0;

              return (
                <div key={p.id} className="p-5 hover:bg-slate-50/60 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-base text-slate-900">{p.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                          {p.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            p.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {p.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {p.category && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {p.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
                        {p.description || 'No detailed product description provided.'}
                      </p>

                      {/* Variants & Pricing summary */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center space-x-1.5 text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-md">
                          <Layers className="h-3.5 w-3.5 text-blue-600" />
                          <span className="font-semibold">{plans.length}</span>
                          <span>Variants / Tiers</span>
                        </div>
                        {plans.length > 0 && (
                          <div className="flex items-center space-x-1.5 text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            <span>
                              Base Range: <strong>${minPrice.toFixed(2)}</strong> - <strong>${maxPrice.toFixed(2)}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          setTargetProduct(p);
                          setVariantForm({
                            name: '',
                            code: `${p.code}-V${plans.length + 1}`,
                            billingCycle: 'MONTHLY',
                            price: '',
                            trialDays: 14,
                          });
                          setIsVariantModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 flex items-center space-x-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Variant</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setFormData({
                            name: p.name,
                            code: p.code,
                            category: p.category || 'SaaS Platform',
                            description: p.description || '',
                            active: p.active,
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600"
                        title="Edit product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                          p.active
                            ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  {/* Plan / Variant Pills Sub-list */}
                  {plans.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">
                        Configured Plans / Variants:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {plans.map((pl) => (
                          <div
                            key={pl.id}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-800 block">{pl.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {pl.billingCycle} • {pl.trialDays}d trial
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-xs">
                              ${Number(pl.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brightloop Enterprise Suite"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Code / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="PROD-ENT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Category</label>
                  <input
                    type="text"
                    placeholder="SaaS Platform"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Description & Feature Notes</label>
                <textarea
                  rows={3}
                  placeholder="Core recurring product license terms, API limits, and features."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activeCheck" className="text-slate-700 font-medium">
                  Active in quotation & subscription catalogs
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
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Variant Tier</h2>
                <p className="text-xs text-slate-500">For product: {targetProduct?.name}</p>
              </div>
              <button onClick={() => setIsVariantModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddVariant} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Variant / Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Professional Edition"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Variant Code *</label>
                  <input
                    type="text"
                    required
                    value={variantForm.code}
                    onChange={(e) => setVariantForm({ ...variantForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Recurring Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="99.00"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Billing Cycle</label>
                  <select
                    value={variantForm.billingCycle}
                    onChange={(e) => setVariantForm({ ...variantForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Trial Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.trialDays}
                    onChange={(e) => setVariantForm({ ...variantForm, trialDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Variant Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

