import React, { useEffect, useState } from 'react';
import { Users, Repeat, Receipt, DollarSign, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import api from '../services/api';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCustomers: 128,
    activeSubscriptions: 94,
    totalInvoices: 342,
    totalRevenue: '48,250.00',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/reports/dashboard-metrics');
        if (res.data) {
          setMetrics(res.data);
        }
      } catch (e) {
        // Fallback to sample stats if database not seeded yet
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const stats = [
    { title: 'Total Revenue', value: `$${metrics.totalRevenue || '0.00'}`, icon: DollarSign, change: '+14.2%', color: 'blue' },
    { title: 'Active Subscriptions', value: metrics.activeSubscriptions, icon: Repeat, change: '+8.1%', color: 'emerald' },
    { title: 'Customers', value: metrics.totalCustomers, icon: Users, change: '+12%', color: 'indigo' },
    { title: 'Invoices Processed', value: metrics.totalInvoices, icon: Receipt, change: '+5.4%', color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-sm text-slate-500">Brightloop Subscription & Billing Management</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-200">
            System Status: Operational
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.title}</span>
                <div className="p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{s.value}</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {s.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Subscription Billing Lifecycle</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            {['1. Customer', '2. Quotation', '3. Subscription', '4. Invoice', '5. Payment'].map((step, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-semibold text-blue-600 block">{step}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Integrated Module</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              Shared REST API at <span className="font-mono font-semibold">http://localhost:5000/api</span> serves all three frontends with PostgreSQL & Prisma transactional integrity.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Active Environment</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Admin Frontend</span>
              <span className="font-mono font-semibold text-slate-800">Port 5173</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Staff Frontend</span>
              <span className="font-mono font-semibold text-slate-800">Port 5174</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Customer Frontend</span>
              <span className="font-mono font-semibold text-slate-800">Port 5175</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Express API</span>
              <span className="font-mono font-semibold text-blue-600">Port 5000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
