import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { CustomerLayout } from './layouts/CustomerLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Support } from './pages/Support';
import { ModulePage } from './pages/ModulePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/subscriptions"
                element={
                  <ModulePage
                    title="My Subscriptions"
                    endpoint="/subscriptions"
                    description="View active license plans and renewals."
                    columns={[
                      { header: 'Subscription #', accessor: 'subscriptionNumber' },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Renewal Date', render: (r) => new Date(r.currentPeriodEnd).toLocaleDateString() },
                      { header: 'Amount', render: (r) => `$${r.totalAmount}` },
                    ]}
                  />
                }
              />
              <Route
                path="/invoices"
                element={
                  <ModulePage
                    title="My Invoices"
                    endpoint="/invoices"
                    description="View and download tax-compliant billing invoices."
                    columns={[
                      { header: 'Invoice #', accessor: 'invoiceNumber' },
                      { header: 'Date', render: (r) => new Date(r.issueDate).toLocaleDateString() },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Amount', render: (r) => `$${r.totalAmount}` },
                    ]}
                  />
                }
              />
              <Route
                path="/payments"
                element={
                  <ModulePage
                    title="Payment History"
                    endpoint="/payments"
                    description="Track previous receipts and settlements."
                    columns={[
                      { header: 'Payment #', accessor: 'paymentNumber' },
                      { header: 'Date', render: (r) => new Date(r.paidAt).toLocaleDateString() },
                      { header: 'Method', accessor: 'paymentMethod' },
                      { header: 'Status', accessor: 'status' },
                      { header: 'Amount', render: (r) => `$${r.amount}` },
                    ]}
                  />
                }
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
