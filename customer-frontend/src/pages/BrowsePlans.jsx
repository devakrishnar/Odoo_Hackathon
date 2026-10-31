import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Package,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BrowsePlans = () => {
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('ALL'); // ALL, MONTHLY, ANNUAL
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const [prodRes, planRes] = await Promise.all([
          api.get('/products'),
          api.get('/plans'),
        ]);
        if (prodRes.data?.products) setProducts(prodRes.data.products);
        if (planRes.data?.plans) setPlans(planRes.data.plans);
      } catch (err) {
        console.error('Failed to load plans catalog:', err);
        toast.error('Unable to load subscription plans catalog.');
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const filteredPlans = plans.filter((plan) => {
    if (billingCycle === 'ALL') return true;
    return plan.billingCycle === billingCycle;
  });

  const handleOpenRequest = (plan) => {
    setSelectedPlan(plan);
    setQuantity(1);
    setNotes('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      const res = await api.post('/quotations/request', {
        planId: selectedPlan.id,
        quantity: parseInt(quantity, 10) || 1,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Quotation request for ${selectedPlan.name} submitted successfully!`);
        setSelectedPlan(null);
        navigate('/subscriptions');
      } else {
        toast.error(res.message || 'Failed to submit quotation request.');
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred while requesting plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Product Catalog & Subscription Tiers</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Browse Products & Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Choose the ideal license tier for your organization. Submit quotation requests directly from your customer portal.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center space-x-1 self-start md:self-auto">
          {['ALL', 'MONTHLY', 'ANNUAL'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === cycle
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cycle === 'ALL' ? 'All Cycles' : cycle === 'MONTHLY' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-6 bg-slate-800 rounded w-2/3"></div>
                <div className="h-4 bg-slate-800 rounded w-full"></div>
              </div>
              <div className="h-10 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Layers className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Subscription Plans Available</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no active plans listed under the selected billing cycle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const product = plan.product || {};
            const isMonthly = plan.billingCycle === 'MONTHLY';

            return (
              <div
                key={plan.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                      {product.name || 'Software Product'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{plan.billingCycle}</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 min-h-[36px] line-clamp-2">
                    {plan.description || product.description || 'Full-featured enterprise subscription plan.'}
                  </p>

                  <div className="mt-5 pb-5 border-b border-slate-800">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl font-extrabold text-white">
                        ${Number(plan.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        / {isMonthly ? 'month' : 'year'}
                      </span>
                    </div>
                    {plan.trialDays > 0 && (
                      <span className="inline-block mt-1 text-[11px] text-emerald-400 font-medium">
                        ✓ Includes {plan.trialDays}-day free trial
                      </span>
                    )}
                  </div>

                  <div className="py-4 space-y-2.5">
                    <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                      Plan Features & Terms:
                    </span>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Code: <strong className="text-slate-300 font-mono">{plan.code}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Billing frequency: <strong>{plan.billingCycle}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Currency: <strong>{plan.currency || 'USD'}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Self-service invoice & payment management</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenRequest(plan)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
                  >
                    <span>Request Quotation / Plan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Request Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-white tracking-tight mb-1">
              Request Quotation for {selectedPlan.name}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Specify quantity and optional instructions. Your quotation will be generated and available under your account.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Unit Price</span>
                  <span className="text-base font-bold text-white">
                    ${Number(selectedPlan.price).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Billing Cycle</span>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800/40">
                    {selectedPlan.billingCycle}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Quantity / Seats *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Calculated Estimated Total
                </label>
                <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-lg font-bold text-emerald-400">
                  ${(Number(selectedPlan.price) * (parseInt(quantity, 10) || 1)).toFixed(2)} {selectedPlan.currency || 'USD'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Notes / Specific Requirements
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Need deployment for EU subsidiary, custom onboarding"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Quotation Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
