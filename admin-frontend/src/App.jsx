<<<<<<< Updated upstream

import { Dashboard } from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Dashboard />
    </div>
  );
}

export default App;
=======
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ModulePage } from './pages/ModulePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/users"
                element={
                  <ModulePage
                    title="Users Management"
                    endpoint="/users"
                    description="Manage platform administrative and staff users."
                    columns={[
                      { header: 'Email', accessor: 'email' },
                      { header: 'First Name', accessor: 'firstName' },
                      { header: 'Last Name', accessor: 'lastName' },
                      { header: 'Role', accessor: 'role' },
                      { header: 'Status', accessor: 'status' },
                    ]}
                  />
                }
              />
              <Route
                path="/customers"
                element={
                  <ModulePage
                    title="Customers"
                    endpoint="/customers"
                    description="View and manage corporate and individual customer accounts."
                    columns={[
                      { header: 'Name', accessor: 'name' },
                      { header: 'Company', accessor: 'companyName' },
                      { header: 'Email', accessor: 'email' },
                      { header: 'Phone', accessor: 'phone' },
                      { header: 'Status', accessor: 'status' },
                    ]}
                  />
                }
              />
              <Route
                path="/products"
                element={
                  <ModulePage
                    title="Products"
                    endpoint="/products"
                    description="Manage software catalog products and subscriptions."
                    columns={[
                      { header: 'Name', accessor: 'name' },
                      { header: 'Code', accessor: 'code' },
                      { header: 'Category', accessor: 'category' },
                      { header: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
                    ]}
                  />
                }
              />
              <Route
                path="/plans"
                element={
                  <ModulePage
                    title="Subscription Plans"
                    endpoint="/plans"
                    description="Configure pricing tiers, billing cycles, and trial periods."
                    columns={[
                      { header: 'Plan Name', accessor: 'name' },
                      { header: 'Code', accessor: 'code' },
                      { header: 'Cycle', accessor: 'billingCycle' },
                      { header: 'Price', render: (r) => `$${r.price} ${r.currency || 'USD'}` },
                      { header: 'Trial Days', accessor: 'trialDays' },
                    ]}
                  />
                }
              />
              <Route
                path="/quotations"
                element={
                  <ModulePage
                    title="Quotations"
                    endpoint="/quotations"
                    description="Review, send, and convert quotations to active subscriptions."
                    columns={[
                      { header: 'Quote #', accessor: 'quotationNumber' },
                      { header: 'Customer', render: (r) => r.customer?.name || '—' },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Total', render: (r) => `$${r.totalAmount}` },
                      { header: 'Valid Until', render: (r) => new Date(r.validUntil).toLocaleDateString() },
                    ]}
                  />
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ModulePage
                    title="Subscriptions"
                    endpoint="/subscriptions"
                    description="Track active recurring subscriptions and renewals."
                    columns={[
                      { header: 'Sub #', accessor: 'subscriptionNumber' },
                      { header: 'Customer', render: (r) => r.customer?.name || '—' },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Period End', render: (r) => new Date(r.currentPeriodEnd).toLocaleDateString() },
                      { header: 'Amount', render: (r) => `$${r.totalAmount}` },
                    ]}
                  />
                }
              />
              <Route
                path="/discounts"
                element={
                  <ModulePage
                    title="Discounts & Coupons"
                    endpoint="/discounts"
                    description="Manage promotional codes, rate deductions, and limits."
                    columns={[
                      { header: 'Code', accessor: 'code' },
                      { header: 'Name', accessor: 'name' },
                      { header: 'Type', accessor: 'type' },
                      { header: 'Value', accessor: 'value' },
                      { header: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
                    ]}
                  />
                }
              />
              <Route
                path="/invoices"
                element={
                  <ModulePage
                    title="Invoices"
                    endpoint="/invoices"
                    description="Automated billing records and recurring invoices."
                    columns={[
                      { header: 'Invoice #', accessor: 'invoiceNumber' },
                      { header: 'Customer', render: (r) => r.customer?.name || '—' },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Total', render: (r) => `$${r.totalAmount}` },
                      { header: 'Due Date', render: (r) => new Date(r.dueDate).toLocaleDateString() },
                    ]}
                  />
                }
              />
              <Route
                path="/payments"
                element={
                  <ModulePage
                    title="Payments"
                    endpoint="/payments"
                    description="Customer payment transactions and allocations."
                    columns={[
                      { header: 'Payment #', accessor: 'paymentNumber' },
                      { header: 'Customer', render: (r) => r.customer?.name || '—' },
                      { header: 'Method', accessor: 'paymentMethod' },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Amount', render: (r) => `$${r.amount}` },
                    ]}
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <ModulePage
                    title="Reports & Analytics"
                    endpoint="/reports/dashboard-metrics"
                    description="Comprehensive financial reporting and system metrics."
                    columns={[
                      { header: 'Metric', accessor: 'key' },
                      { header: 'Value', accessor: 'value' },
                    ]}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">System Settings</h2>
                    <p className="text-sm text-slate-500 mb-6">Configure platform parameters and email notifications.</p>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-slate-600 font-medium">Automatic Invoicing Cron</span>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded">Active (Daily at midnight)</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-slate-600 font-medium">Email Dispatcher</span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">Nodemailer Ready</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600 font-medium">PDF Invoice Engine</span>
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">PDFKit Enabled</span>
                      </div>
                    </div>
                  </div>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
>>>>>>> Stashed changes
