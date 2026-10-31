import React from 'react';
import { HelpCircle, Mail, MessageSquare, ExternalLink } from 'lucide-react';

export const Support = () => {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Customer Support</h1>
        <p className="text-sm text-slate-400">Need help with your subscription or invoices? Our team is available 24/7.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <Mail className="h-6 w-6 text-indigo-400 mb-3" />
          <h3 className="text-sm font-bold text-white">Email Billing Support</h3>
          <p className="text-xs text-slate-400 mt-1">Direct inquiries to billing@brightloop.io with 2-hour response SLA.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <MessageSquare className="h-6 w-6 text-emerald-400 mb-3" />
          <h3 className="text-sm font-bold text-white">Live Assistance</h3>
          <p className="text-xs text-slate-400 mt-1">Connect with dedicated account managers during standard business hours.</p>
        </div>
      </div>
    </div>
  );
};
