import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('customer@acmecorp.com');
  const [password, setPassword] = useState('customer123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Server error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/20">
            <User className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your subscriptions, licenses, and invoices</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="customer@acmecorp.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Frontend Port: <span className="font-mono text-slate-400">5175</span> | Backend Port: <span className="font-mono text-slate-400">5000</span>
          </p>
        </div>
      </div>
    </div>
  );
};
