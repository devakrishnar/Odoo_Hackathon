import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setSuccessData(res.data);
        toast.success('Password reset instructions generated!');
      } else {
        setError(res.message || 'Unable to process reset request.');
      }
    } catch (err) {
      setError(err.message || 'Server error occurred during password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-4 border border-indigo-500/30">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Forgot Password</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter your registered email to receive password reset instructions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Reset Token Generated</span>
              </div>
              <p>
                Password reset instructions have been generated for <strong>{email}</strong>.
              </p>
              {successData.resetToken && (
                <div className="mt-2 pt-2 border-t border-emerald-800/50">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Development Demo Token (simulated email delivery):
                  </span>
                  <div className="bg-slate-950 p-2 rounded text-[10px] font-mono break-all text-slate-300 border border-slate-800">
                    {successData.resetToken}
                  </div>
                </div>
              )}
            </div>

            {successData.resetToken && (
              <button
                type="button"
                onClick={() => navigate(`/reset-password?token=${encodeURIComponent(successData.resetToken)}`)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <span>Continue to Set New Password</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center space-x-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : 'Send Password Reset Link'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-3 border-t border-slate-800">
              <Link
                to="/login"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center space-x-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
