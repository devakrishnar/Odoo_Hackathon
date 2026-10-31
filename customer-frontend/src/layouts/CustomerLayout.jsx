import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Repeat,
  Receipt,
  CreditCard,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Subscriptions', path: '/subscriptions', icon: Repeat },
  { name: 'My Invoices', path: '/invoices', icon: Receipt },
  { name: 'Payment History', path: '/payments', icon: CreditCard },
  { name: 'My Profile', path: '/profile', icon: User },
  { name: 'Support', path: '/support', icon: HelpCircle },
];

export const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dark sleek Customer Portal Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              BL
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">Brightloop</span>
              <span className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                Customer Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-xs border border-indigo-500/30">
                {user?.firstName?.[0] || 'C'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Customer
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors border border-rose-900/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Customer Portal (Port 5175)</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-medium text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-800/50">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>Account Active</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
