<<<<<<< Updated upstream
function App() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold">
        Staff Portal
      </h1>
      <p className="mt-2">
        Welcome to the Subscription Management System.
      </p>
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
import { StaffLayout } from './layouts/StaffLayout';
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

          {/* Protected Staff Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<StaffLayout />}>
              <Route path="/" element={<Dashboard />} />
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
                path="/quotations"
                element={
                  <ModulePage
                    title="Quotations"
                    endpoint="/quotations"
                    description="Create, edit, and send quotes to customers."
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
                    description="Manage subscriptions and track renewal periods."
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
                path="/invoices"
                element={
                  <ModulePage
                    title="Invoices"
                    endpoint="/invoices"
                    description="Issue and track customer invoices."
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
                    description="Record payments and verify transaction settlement."
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
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
>>>>>>> Stashed changes
