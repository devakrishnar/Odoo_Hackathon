import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 text-center">
        <div className="max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20 text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-6">
            You are signed in as a <span className="text-indigo-400 font-semibold">{user.role}</span>. The Customer Portal is reserved exclusively for customer accounts.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('brightloop_customer_token');
              localStorage.removeItem('brightloop_customer_user');
              window.location.href = '/login';
            }}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition"
          >
            Sign Out & Log In as Customer
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

