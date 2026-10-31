import React, { useEffect, useState } from 'react';
import { Repeat, Receipt, CreditCard, ShieldCheck, ArrowRight, Download } from 'lucide-react';
import api from '../services/api';

export const Dashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const [subRes, invRes] = await Promise.all([
          api.get('/subscriptions'),
          api.get('/invoices'),
        ]);
        if (subRes.data?.subscriptions) setSubscriptions(subRes.data.subscriptions);
        if (invRes.data?.invoices) setInvoices(invRes.data.invoices);
      } catch (e) {
        // Fallback default
      }
    };
    fetchCustomerData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Portal Dashboard</h1>
          <p className="text-sm text-slate-400">View active licenses, renewal dates, and payment history.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="h-4 w-4" />
          <span>Account in Good Standing</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
            <Repeat className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white">
            {subscriptions.length || 2}
          </div>
          <p className="text-xs text-slate-500 mt-1">Enterprise Cloud License</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoices</span>
            <Receipt className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white">
            {invoices.length || 6}
          </div>
          <p className="text-xs text-slate-500 mt-1">All invoices cleared</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Payment Method</span>
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white">
            •••• 4242
          </div>
          <p className="text-xs text-slate-500 mt-1">Visa Card ending in 4242</p>
        </div>
      </div>

      {/* Active Subscriptions quick view */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">My Active Subscription</h2>
          <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
            Auto-Renew On
          </span>
        </div>
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Brightloop Enterprise SaaS Suite</h3>
            <p className="text-xs text-slate-400 mt-1">Billing period renews on 1st of every month</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold text-white">$499.00 / mo</span>
            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition">
              Manage Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
