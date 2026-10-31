
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const res = await login(trimmedEmail, password);

      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -top-40 -left-40" />
      <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-40 -right-40" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500 text-white mb-5 shadow-xl shadow-emerald-500/20">
            <Briefcase className="h-8 w-8" />
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">
            Brightloop
          </h1>

          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.2em] mt-2">
            Staff Operations Portal
          </p>
        </div>

        {/* Login card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-7 sm:p-9 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">
              Welcome back
            </h2>

            <p className="text-sm text-slate-400 mt-2">
              Sign in to manage your subscription operations.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider"
              >
                Staff Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brightloop.io"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition"
                >
                  {showPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>

          {/* Security information */}
          <div className="mt-7 pt-5 border-t border-slate-800 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />

            <span className="text-xs text-slate-400">
              Secure staff-only access
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Brightloop Software © 2026
        </p>

      </div>
    </div>
  );
};
