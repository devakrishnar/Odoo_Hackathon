import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Layers,
  Percent,
  Tag,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  Shield,
  Layers as LogoIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Explicit sidebar navigation items required for Brightloop Admin
const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Staff Management', path: '/staff', icon: Users },
  { name: 'Customers', path: '/customers', icon: UserCheck },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Plans', path: '/plans', icon: Layers },
  { name: 'Taxes', path: '/taxes', icon: Percent },
  { name: 'Discounts', path: '/discounts', icon: Tag },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentNav = navItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/30">
              <LogoIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">Brightloop</span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                Admin Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Profile Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-semibold text-xs border border-blue-500/30 shrink-0">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'admin@brightloop.io'}
                </p>
              </div>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-950/30 transition-colors border border-slate-800 hover:border-rose-900/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Brightloop SaaS</span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <span className="font-semibold text-slate-900">
                {currentNav?.name || 'Admin Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Port 5173</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span>Admin Environment</span>
            </div>
            <button
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 relative transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600"></span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
