import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Only STAFF accounts are permitted
  if (user.role !== 'STAFF') {
    const handleAccessDenied = async () => {
      await logout();
      navigate('/login', { replace: true });
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-5">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Access Denied
          </h1>

          <p className="text-sm text-slate-500 mb-6">
            This portal is exclusively for Brightloop staff members.
            Your account does not have the required permissions.
          </p>

          <button
            onClick={handleAccessDenied}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition"
          >
            <LogOut size={17} />
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};