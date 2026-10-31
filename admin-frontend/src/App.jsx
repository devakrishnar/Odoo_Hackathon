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

          {/* Protected Admin Routes within AdminLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              {/* 1. Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* 2. Staff Management */}
              <Route
                path="/staff"
                element={
                  <ModulePage
                    title="Staff Management"
                    endpoint="/users"
                    description="Manage platform administrative and support staff accounts, credentials, and roles."
                    actionLabel="Add Staff Member"
                    columns={[
                      {
                        header: 'Staff Name',
                        render: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.name || '—',
                      },
                      { header: 'Email', accessor: 'email' },
                      { header: 'Role', accessor: 'role' },
                      { header: 'Status', accessor: 'status' },
                    ]}
                  />
                }
              />
              {/* Backward compatibility alias */}
              <Route path="/users" element={<Navigate to="/staff" replace />} />

              {/* 3. Customers */}
              <Route
                path="/customers"
                element={
                  <ModulePage
                    title="Customers"
                    endpoint="/customers"
                    description="Manage enterprise, business, and individual subscriber profiles and billing contacts."
                    actionLabel="Onboard Customer"
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

              {/* 4. Products */}
              <Route
                path="/products"
                element={
                  <ModulePage
                    title="Products"
                    endpoint="/products"
                    description="Configure software applications, catalog editions, and recurring add-on modules."
                    actionLabel="Create Product"
                    columns={[
                      { header: 'Product Name', accessor: 'name' },
                      { header: 'Product Code', accessor: 'code' },
                      { header: 'Category', accessor: 'category' },
                      { header: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
                    ]}
                  />
                }
              />

              {/* 5. Plans */}
              <Route
                path="/plans"
                element={
                  <ModulePage
                    title="Plans"
                    endpoint="/plans"
                    description="Define recurring subscription tiers, billing cycles (monthly, yearly), and pricing rules."
                    actionLabel="Create Plan"
                    columns={[
                      { header: 'Plan Name', accessor: 'name' },
                      { header: 'Plan Code', accessor: 'code' },
                      { header: 'Billing Cycle', accessor: 'billingCycle' },
                      {
                        header: 'Price',
                        render: (r) => (r.price != null ? `$${r.price} ${r.currency || 'USD'}` : '—'),
                      },
                      { header: 'Trial Days', accessor: 'trialDays' },
                    ]}
                  />
                }
              />

              {/* 6. Taxes */}
              <Route
                path="/taxes"
                element={
                  <ModulePage
                    title="Taxes"
                    endpoint="/taxes"
                    description="Manage regional tax rates, GST/VAT percentage schedules, and invoicing compliance rules."
                    actionLabel="New Tax Rule"
                    columns={[
                      { header: 'Tax Name', accessor: 'name' },
                      { header: 'Rate (%)', render: (r) => (r.rate != null ? `${r.rate}%` : '—') },
                      { header: 'Jurisdiction / Country', accessor: 'country' },
                      { header: 'Type', accessor: 'type' },
                      { header: 'Status', accessor: 'status' },
                    ]}
                  />
                }
              />

              {/* 7. Discounts */}
              <Route
                path="/discounts"
                element={
                  <ModulePage
                    title="Discounts"
                    endpoint="/discounts"
                    description="Manage promotional coupons, partner discount codes, and rate deduction policies."
                    actionLabel="Create Discount"
                    columns={[
                      { header: 'Coupon Code', accessor: 'code' },
                      { header: 'Discount Name', accessor: 'name' },
                      { header: 'Type', accessor: 'type' },
                      { header: 'Value', accessor: 'value' },
                      { header: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
                    ]}
                  />
                }
              />

              {/* 8. Reports */}
              <Route
                path="/reports"
                element={
                  <ModulePage
                    title="Reports"
                    endpoint="/reports/dashboard-metrics"
                    description="View recurring revenue summaries, churn rates, invoice collections, and executive metrics."
                    actionLabel="Generate Report"
                    columns={[
                      { header: 'Report Name', accessor: 'name' },
                      { header: 'Metric Category', accessor: 'category' },
                      { header: 'Billing Period', accessor: 'period' },
                      { header: 'Status', accessor: 'status' },
                    ]}
                  />
                }
              />
            </Route>
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
