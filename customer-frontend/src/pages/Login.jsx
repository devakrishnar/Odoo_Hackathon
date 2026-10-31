import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Receipt,
  Layers,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoFill = () => {
    setEmail('customer@acmecorp.com');
    setPassword('Customer@1234');
    setError('');
    setDemoActive(true);
    setTimeout(() => setDemoActive(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your company email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedEmail, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Authentication failed. Please verify your email and password.');
      }
    } catch (err) {
      setError(err.message || 'A network error occurred while connecting to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden">
      {/* Ambient background glow & radial mesh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Brand Presentation (visible on large screens) */}
          <div className="lg:col-span-6 hidden lg:flex flex-col justify-between space-y-8 pr-6">
            <div>
              {/* Brand Logo & Pill */}
              <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Brightloop Customer Portal</span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Transparent billing & subscription control.
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Review your active licenses, monitor real-time usage, approve customized quotations, 
                and download verified PDF tax invoices with zero friction.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="h-9 w-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Direct Plan & Quotation Requests</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Browse plans, select seats, and accept corporate quotes instantly.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="h-9 w-9 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Invoices & Instant Receipts</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Stream PDF invoices, track payment status, and manage outstanding balances.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="h-9 w-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Enterprise Token Isolation</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Strict role-based session isolation powered by Neon cloud PostgreSQL.</p>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center space-x-4 pt-2 border-t border-slate-800/80 text-xs text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>Live Neon Cloud DB</span>
              </span>
              <span>•</span>
              <span>256-Bit SSL Encryption</span>
              <span>•</span>
              <span>SOC2 Type II Ready</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative">
              
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Brightloop Software</span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Customer Sign In</h2>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Enter your corporate credentials to access your subscription portal
                </p>
              </div>

              {/* Quick Demo Fill Pill */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    demoActive
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-indigo-950/40 border-indigo-500/25 text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {demoActive ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                    <span>
                      {demoActive ? 'Demo credentials applied!' : 'One-Click Demo Customer Account'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Auto-Fill
                  </span>
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start space-x-2.5 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      placeholder="customer@acmecorp.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Port 5175</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating with Neon DB...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Customer Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration footer link */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Don't have a registered account?{' '}
                <Link
                  to="/register"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-400 transition"
                >
                  Register your company
                </Link>
              </div>
            </div>

            {/* Sub-footer reassurance */}
            <div className="text-center mt-5 text-[11px] text-slate-500 flex items-center justify-center space-x-2">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Protected by Brightloop Enterprise Identity Security</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
