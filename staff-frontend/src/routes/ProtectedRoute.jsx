import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-4">This portal is restricted to Brightloop Staff Members.</p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return <Outlet />;
};
