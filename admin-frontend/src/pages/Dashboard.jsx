
import React, { useEffect, useState } from 'react';
import {
  Users,
  Repeat,
  Receipt,
  DollarSign,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

import api from '../services/api';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeSubscriptions: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/reports/dashboard-metrics');

        setMetrics(prev => ({
          ...prev,
          ...res.data
        }));
      } catch (err) {
        setError('Dashboard data is currently unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      icon: Repeat,
    },
    {
      title: 'Customers',
      value: metrics.totalCustomers,
      icon: Users,
    },
    {
      title: 'Invoices Processed',
      value: metrics.totalInvoices,
      icon: Receipt,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Brightloop Subscription & Billing Management
          </p>
        </div>

        <span className="text-xs px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-200">
          Admin Dashboard
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.title}
                </span>

                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-2xl font-bold text-slate-900">
                  {loading ? '...' : stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* API Error / Loading */}
      {loading && (
        <p className="text-sm text-slate-500">
          Loading dashboard information...
        </p>
      )}

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Billing Lifecycle */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5">
            Subscription Billing Lifecycle
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              'Customer',
              'Quotation',
              'Subscription',
              'Invoice',
              'Payment'
            ].map((step, index) => (
              <div
                key={step}
                className="p-4 bg-slate-50 rounded-lg border border-slate-100"
              >
                <span className="text-xs font-semibold text-blue-600 block">
                  {index + 1}. {step}
                </span>

                <span className="text-[11px] text-slate-500 mt-2 block">
                  Billing process
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />

            <p className="text-xs text-blue-900 leading-relaxed">
              Manage products, subscriptions, recurring invoices and
              payments through one unified subscription management system.
            </p>
          </div>
        </div>

        {/* Environment Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Application Modules
          </h2>

          <div className="space-y-3 text-xs">
            {[
              'Admin Management',
              'Staff Operations',
              'Customer Portal',
              'Subscription Billing',
              'Payment Management'
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-slate-600">{item}</span>

                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
