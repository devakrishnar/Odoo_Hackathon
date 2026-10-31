import React, { useState, useEffect, useCallback } from 'react';
import {
  Percent,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Globe,
  FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Taxes = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    country: 'Global / Standard',
    type: 'PERCENTAGE',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/taxes');
      setTaxes(res?.data?.taxes || res?.taxes || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch tax rates');
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleSaveTax = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.rate === '') {
      toast.error('Tax name and rate are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        rate: Number(formData.rate),
      };

      if (editingTax) {
        await api.put(`/taxes/${editingTax.id}`, payload);
        toast.success(`Tax rule ${formData.name} updated successfully!`);
      } else {
        await api.post('/taxes', payload);
        toast.success(`Tax rule ${formData.name} added!`);
      }

      setIsModalOpen(false);
      setEditingTax(null);
      fetchTaxes();
    } catch (err) {
      toast.error(err?.message || 'Failed to save tax rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTax = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tax rule "${name}"?`)) return;
    try {
      await api.delete(`/taxes/${id}`);
      toast.success('Tax rule deleted.');
      fetchTaxes();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete tax rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Configuration</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Invoicing & Billing
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Regional VAT, GST percentage schedules, and enterprise reverse-charge applicability rules.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchTaxes}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingTax(null);
              setFormData({
                name: '',
                rate: '',
                country: 'Global / Standard',
                type: 'PERCENTAGE',
                description: '',
              });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Tax Rule</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Taxes Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3" />
              <span>Loading tax rules...</span>
            </div>
          ) : taxes.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <Percent className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Tax Rules Configured</h3>
              <p className="text-xs text-slate-500 mt-1">Create your first tax rate rule above.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Tax Name / Specification</th>
                  <th className="px-6 py-3.5">Applicable Rate (%)</th>
                  <th className="px-6 py-3.5">Jurisdiction / Scope</th>
                  <th className="px-6 py-3.5">Calculation Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-slate-900 block">{t.name}</span>
                        <span className="text-[11px] text-slate-400 max-w-sm truncate block">
                          {t.description || 'Standard recurring tax rule'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-base text-slate-900">{t.rate}%</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                      <span className="inline-flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-md">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span>{t.country}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-600">
                      {t.type}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingTax(t);
                          setFormData({
                            name: t.name,
                            rate: t.rate,
                            country: t.country,
                            type: t.type,
                            description: t.description || '',
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                        title="Edit tax rule"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTax(t.id, t.name)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-rose-50 text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Tax Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingTax ? 'Edit Tax Rule' : 'Add Tax Rule'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTax} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Tax Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard GST / VAT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Percentage Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="18.00"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Jurisdiction / Country</label>
                  <input
                    type="text"
                    placeholder="Global / Standard"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Applicability Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="PERCENTAGE">Standard Percentage</option>
                  <option value="ZERO_RATED">Zero Rated / Export</option>
                  <option value="EXEMPT">Exempt</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes for invoice generator and tax reporting compliance."
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
                  {submitting ? 'Saving...' : editingTax ? 'Save Changes' : 'Create Tax Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Taxes;

