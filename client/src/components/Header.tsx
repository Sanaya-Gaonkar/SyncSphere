import React from 'react';
import {
  RefreshCw,
  Plus,
  ArrowDownToLine,
  Sparkles,
  Search,
} from 'lucide-react';
import type { NavItem } from './Sidebar';

interface HeaderProps {
  currentTab: NavItem;
  onOpenProductModal: () => void;
  onSyncAllPending: () => void;
  onImportWoo: () => void;
  isSyncing?: boolean;
  pendingCount?: number;
  isDemoMode?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenProductModal,
  onSyncAllPending,
  onImportWoo,
  isSyncing = false,
  pendingCount = 0,
  isDemoMode = true,
  searchQuery = '',
  setSearchQuery,
}) => {
  const titles: Record<NavItem, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'PIM Overview',
      subtitle: 'Real-time catalog completeness, synchronization metrics, and store operations.',
    },
    catalog: {
      title: 'Product Catalog',
      subtitle: 'Manage all omnichannel products, variations, attributes, and stock status.',
    },
    categories: {
      title: 'Taxonomies & Attributes',
      subtitle: 'Organize category trees and standardized attribute dictionaries for WooCommerce.',
    },
    sync: {
      title: 'Synchronization Center',
      subtitle: 'Automated 2-way sync jobs, error recovery, conflict resolution, and execution history.',
    },
    csv: {
      title: 'CSV Bulk Operations',
      subtitle: 'Import new catalogs with row-level validation previews or export filtered CSV datasets.',
    },
    webhooks: {
      title: 'WooCommerce Webhooks',
      subtitle: 'Real-time event receiver with HMAC-SHA256 signature verification & event simulator.',
    },
    audit: {
      title: 'Audit Trail & Compliance',
      subtitle: 'Track all changes to catalog data, user modifications, and synchronization dispatches.',
    },
    settings: {
      title: 'Store Settings & Credentials',
      subtitle: 'Manage WooCommerce REST API v3 keys, webhook secrets, and simulated sandbox toggles.',
    },
  };

  const { title, subtitle } = titles[currentTab] || { title: 'SyncSphere', subtitle: '' };

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-4 shrink-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title area */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                <Sparkles className="w-3 h-3" /> Demo Sandbox Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Global Quick Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {setSearchQuery && currentTab === 'catalog' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search SKU, name, tags..."
                className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 w-56 transition"
              />
            </div>
          )}

          {/* Import from WooCommerce button */}
          <button
            onClick={onImportWoo}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
            title="Pull and update existing products from WooCommerce store"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-600" />
            <span>Import Store</span>
          </button>

          {/* Sync All Pending button */}
          <button
            onClick={onSyncAllPending}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-50 ${
              pendingCount > 0
                ? 'border-cyan-600 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Sync all modified products to WooCommerce"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Pending {pendingCount > 0 && `(${pendingCount})`}</span>
          </button>

          {/* Add Product Modal Button */}
          <button
            onClick={onOpenProductModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm shadow-cyan-600/30 transition transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>
    </header>
  );
};
