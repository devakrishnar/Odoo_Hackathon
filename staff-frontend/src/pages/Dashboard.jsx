import React, { useEffect, useState } from 'react';
import { Users, Repeat, Receipt, DollarSign, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCustomers: 85,
    activeSubscriptions: 62,
    totalInvoices: 210,
    totalRevenue: '32,100.00',
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/reports/dashboard-metrics');
        if (res.data) setMetrics(res.data);
      } catch (e) {
        // Sample data default
      }
    };
    fetchMetrics();
  }, []);

  const stats = [
    { title: 'Managed Customers', value: metrics.totalCustomers, icon: Users, color: 'emerald' },
    { title: 'Active Subscriptions', value: metrics.activeSubscriptions, icon: Repeat, color: 'teal' },
    { title: 'Pending Quotations', value: '14', icon: CheckCircle2, color: 'amber' },
    { title: 'Invoices Issued', value: metrics.totalInvoices, icon: Receipt, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Operations Dashboard</h1>
          <p className="text-sm text-slate-500">Manage assigned customer quotations, subscriptions, and invoicing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.title}</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{s.value}</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-3">Staff Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Customer Onboarding</h3>
            <p className="text-xs text-slate-500 mt-1">Register new client and configure billing address.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Create Quotation</h3>
            <p className="text-xs text-slate-500 mt-1">Select software plans and apply discounts.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Convert to Subscription</h3>
            <p className="text-xs text-slate-500 mt-1">Activate accepted quotes with automatic period billing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
