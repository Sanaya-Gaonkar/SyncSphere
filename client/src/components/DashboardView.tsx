import React from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileEdit,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Image,
  FileText,
  DollarSign,
  Tag,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import type { DashboardStats } from '../types';
import type { NavItem } from './Sidebar';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: NavItem) => void;
  onSyncPending: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onNavigate,
  onSyncPending,
  isSyncing,
  onRefresh,
}) => {
  if (loading && !stats) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading PIM metrics & catalog state...</p>
        </div>
      </div>
    );
  }

  const s = stats || {
    totalProducts: 0,
    syncedCount: 0,
    pendingCount: 0,
    conflictCount: 0,
    errorCount: 0,
    draftCount: 0,
    averageCompleteness: 0,
    completenessBreakdown: {
      missingImages: 0,
      missingDescriptions: 0,
      missingPrices: 0,
      missingCategories: 0,
    },
    categoryDistribution: [],
    recentJobs: [],
    recentAudit: [],
  };

  const syncRate = s.totalProducts > 0 ? Math.round((s.syncedCount / s.totalProducts) * 100) : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero Callout if conflicts exist */}
      {s.conflictCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 border border-rose-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                {s.conflictCount} WooCommerce Sync {s.conflictCount === 1 ? 'Conflict' : 'Conflicts'} Detected
              </h4>
              <p className="text-xs text-rose-700">
                Remote changes occurred on WooCommerce simultaneously. Resolve differences to restore automated 2-way sync.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('sync')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
          >
            Review Conflicts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Products */}
        <div
          onClick={() => onNavigate('catalog')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Catalog</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{s.totalProducts}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>All items in PIM</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* In Sync */}
        <div
          onClick={() => onNavigate('catalog')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Sync (Woo)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{s.syncedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {syncRate}% synced to store
          </div>
        </div>

        {/* Pending Sync */}
        <div
          onClick={() => onNavigate('catalog')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Sync</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{s.pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center justify-between">
            <span>{s.pendingCount > 0 ? 'Queued for export' : 'All up to date'}</span>
            {s.pendingCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSyncPending();
                }}
                disabled={isSyncing}
                className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {/* Conflicts */}
        <div
          onClick={() => onNavigate('sync')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-rose-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{s.conflictCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            {s.conflictCount > 0 ? 'Requires attention' : 'Zero conflicts'}
          </div>
        </div>

        {/* Errors */}
        <div
          onClick={() => onNavigate('sync')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-rose-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sync Errors</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{s.errorCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {s.errorCount > 0 ? 'Retry available' : 'Healthy API'}
          </div>
        </div>

        {/* Drafts */}
        <div
          onClick={() => onNavigate('catalog')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drafts</span>
            <FileEdit className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{s.draftCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unpublished items</div>
        </div>
      </div>

      {/* Middle Section: Completeness Scorecard & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Completeness Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" /> Catalog Completeness Scorecard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Algorithmic scoring checking product titles, descriptions, pricing, media, and taxonomies.
                </p>
              </div>
              <span className="text-2xl font-black text-purple-600">
                {s.averageCompleteness}%
              </span>
            </div>

            {/* Master Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-700 ease-out"
                style={{ width: `${s.averageCompleteness}%` }}
              />
            </div>

            {/* Missing Fields Breakdown Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                  <Image className="w-3.5 h-3.5 text-purple-500" /> Missing Images
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {s.completenessBreakdown.missingImages}
                </div>
                <div className="text-[10px] text-slate-400">Needs product gallery</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Descriptions
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {s.completenessBreakdown.missingDescriptions}
                </div>
                <div className="text-[10px] text-slate-400">Needs body copy</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Missing Prices
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {s.completenessBreakdown.missingPrices}
                </div>
                <div className="text-[10px] text-slate-400">Requires price &gt; 0</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                  <Tag className="w-3.5 h-3.5 text-amber-500" /> Categories
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {s.completenessBreakdown.missingCategories}
                </div>
                <div className="text-[10px] text-slate-400">Uncategorized items</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">High-scoring products improve conversion and SEO on WooCommerce.</span>
            <button
              onClick={() => onNavigate('catalog')}
              className="font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Filter Incomplete <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Category Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned taxonomy breakdown in PIM catalog.</p>
              </div>
              <button
                onClick={() => onNavigate('categories')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                Manage <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {s.categoryDistribution.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No categories assigned yet.</div>
              ) : (
                s.categoryDistribution.map(cat => {
                  const percent = s.totalProducts > 0 ? Math.round((cat.count / s.totalProducts) * 100) : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700">{cat.name}</span>
                        <span className="text-slate-500">
                          {cat.count} items ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Syncs directly to WooCommerce product categories.</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Sync Jobs & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Sync Jobs */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Synchronization Jobs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live execution telemetry with WooCommerce REST API.</p>
            </div>
            <button
              onClick={() => onNavigate('sync')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              All Jobs <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2 font-semibold">Job Type</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Affected</th>
                  <th className="pb-2 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s.recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No sync operations recorded yet.
                    </td>
                  </tr>
                ) : (
                  s.recentJobs.slice(0, 5).map(job => {
                    const statusStyles: Record<string, string> = {
                      SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
                      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                      RUNNING: 'bg-purple-50 text-purple-700 border-purple-200',
                      CONFLICT: 'bg-rose-50 text-rose-700 border-rose-200',
                    };

                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          {job.jobType}
                          {job.isSimulated && (
                            <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                              sandbox
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              statusStyles[job.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{job.affectedCount} items</td>
                        <td className="py-3 text-slate-400">
                          {new Date(job.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Trail Feed</h3>
                <p className="text-xs text-slate-500 mt-0.5">Immutable record of edits and operations.</p>
              </div>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                View Audit <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3.5">
              {s.recentAudit.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">No audit logs available.</div>
              ) : (
                s.recentAudit.slice(0, 4).map(log => (
                  <div key={log.id} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {log.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {log.action}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        by {log.userName} • {log.entityType}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">SOC2 / ISO 27001 compliant activity logging</span>
            <button onClick={onRefresh} className="text-purple-600 hover:text-purple-800 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
