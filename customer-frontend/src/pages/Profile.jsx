import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-400">Manage your contact information and preferences.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
          <div className="h-16 w-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
            {user?.firstName?.[0] || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Verified Customer
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Company / Organization</span>
            <span className="font-semibold text-white">Acme Global Corporation</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Role / Access</span>
            <span className="font-semibold text-white">Billing Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
};
