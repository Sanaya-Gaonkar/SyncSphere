import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  RefreshCw,
  FileSpreadsheet,
  Webhook,
  History,
  Settings,
  Shield,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavItem =
  | 'dashboard'
  | 'catalog'
  | 'categories'
  | 'sync'
  | 'csv'
  | 'webhooks'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  setCurrentTab: (tab: NavItem) => void;
  openConflictCount?: number;
  isDemoMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openConflictCount = 0,
  isDemoMode = true,
}) => {
  const { user, role, switchRole } = useAuth();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Product Catalog', icon: Package },
    { id: 'categories', label: 'Categories & Specs', icon: Layers },
    {
      id: 'sync',
      label: 'Sync Center',
      icon: RefreshCw,
      badge: openConflictCount > 0 ? `${openConflictCount} Conflict` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'csv', label: 'CSV Import / Export', icon: FileSpreadsheet },
    { id: 'webhooks', label: 'Webhooks & Events', icon: Webhook },
    { id: 'audit', label: 'Audit Trail', icon: History, adminOnly: true },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-700 via-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
          <RefreshCw className="w-5 h-5 animate-pulse-subtle" />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
            SyncSphere
            <span className="text-[10px] font-semibold bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded tracking-wide uppercase">
              PIM
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-tight">WooCommerce Integration</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Catalog Management
        </div>

        {navLinks.map(link => {
          if (link.adminOnly && role !== 'ADMIN') return null;
          const Icon = link.icon;
          const isActive = currentTab === link.id;

          return (
            <button
              key={link.id}
              onClick={() => setCurrentTab(link.id as NavItem)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/25 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${link.badgeColor}`}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Store Connection Indicator Card */}
      <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-b from-slate-50 to-cyan-50/60 border border-cyan-100/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {isDemoMode ? 'Simulated Sandbox' : 'Live Store Connected'}
            </span>
          </div>
          <button
            onClick={() => setCurrentTab('settings')}
            className="text-[11px] text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-0.5"
            title="Configure connection settings"
          >
            Config <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="text-[11px] text-slate-500 line-clamp-1 font-mono">
          {isDemoMode ? 'WooCommerce v8.6 (Demo)' : 'WooCommerce REST API v3'}
        </div>
      </div>

      {/* User Role Card & Quick-Switch */}
      <div className="p-3.5 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${role === 'ADMIN' ? 'bg-cyan-100 text-cyan-800' : 'bg-sky-100 text-sky-800'}`}>
              {role === 'ADMIN' ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || (role === 'ADMIN' ? 'Sanaya Gaonkar' : 'Catalog Editor')}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Role:</span>
                <span className={`font-semibold ${role === 'ADMIN' ? 'text-cyan-600' : 'text-sky-600'}`}>
                  {role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => switchRole(role === 'ADMIN' ? 'EDITOR' : 'ADMIN')}
            className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 transition font-medium shrink-0"
            title={`Switch to ${role === 'ADMIN' ? 'Editor' : 'Admin'} mode`}
          >
            Switch to {role === 'ADMIN' ? 'Editor' : 'Admin'}
          </button>
        </div>
      </div>
    </aside>
  );
};
