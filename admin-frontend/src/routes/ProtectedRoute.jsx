import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, token, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Verifying admin session...</p>
      </div>
    );
  }

  // Not logged in: Redirect to login and preserve destination
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check: Reject STAFF and CUSTOMER from admin portal
  if (user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Your account role is <span className="text-rose-400 font-semibold">{user.role}</span>. The Admin Console is restricted strictly to Brightloop Administrators.
          </p>
          <button
            onClick={logout}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out & Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
