import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StaffManagement } from './pages/StaffManagement';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Taxes } from './pages/Taxes';
import { Discounts } from './pages/Discounts';
import { Reports } from './pages/Reports';

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
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/users" element={<Navigate to="/staff" replace />} />

              {/* 3. Customers */}
              <Route path="/customers" element={<Customers />} />

              {/* 4. Products & Variants */}
              <Route path="/products" element={<Products />} />

              {/* 5. Plans */}
              <Route path="/plans" element={<Plans />} />

              {/* 6. Taxes */}
              <Route path="/taxes" element={<Taxes />} />

              {/* 7. Discounts */}
              <Route path="/discounts" element={<Discounts />} />

              {/* 8. Reports */}
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
