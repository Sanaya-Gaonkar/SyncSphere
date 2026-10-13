import React, { useState } from 'react';
import {
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { SyncJob, ConflictLog } from '../types';

interface SyncCenterViewProps {
  jobs: SyncJob[];
  conflicts: ConflictLog[];
  onPushBulkPending: () => Promise<void>;
  onPullWooCommerce: () => Promise<void>;
  onRetryJob: (jobId: string) => Promise<void>;
  onOpenConflictModal: (conflict: ConflictLog) => void;
  onRefresh: () => void;
  isSyncing?: boolean;
}

export const SyncCenterView: React.FC<SyncCenterViewProps> = ({
  jobs,
  conflicts,
  onPushBulkPending,
  onPullWooCommerce,
  onRetryJob,
  onOpenConflictModal,
  onRefresh,
  isSyncing = false,
}) => {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      await onRetryJob(id);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sync Pending Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Outbound Synchronization
              </div>
              <h4 className="text-base font-bold text-slate-900">Push to WooCommerce</h4>
              <p className="text-xs text-slate-500 mt-1">
                Transfers modified PIM products, pricing updates, and inventory to WooCommerce.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={onPushBulkPending}
            disabled={isSyncing}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Dispatching...' : 'Dispatch Outbound Push'}</span>
          </button>
        </div>

        {/* Pull from WooCommerce Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Inbound Ingestion
              </div>
              <h4 className="text-base font-bold text-slate-900">Pull from WooCommerce</h4>
              <p className="text-xs text-slate-500 mt-1">
                Downloads live store catalog, syncs missing variations, and reconciles stock levels.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={onPullWooCommerce}
            disabled={isSyncing}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pull & Ingest Catalog</span>
          </button>
        </div>

        {/* Conflict Resolution Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Integrity & Governance
              </div>
              <h4 className="text-base font-bold text-slate-900">Conflict Resolver</h4>
              <p className="text-xs text-slate-500 mt-1">
                {conflicts.length === 0
                  ? 'All local catalog attributes and remote WooCommerce data are fully harmonized.'
                  : `${conflicts.length} conflicting data divergences currently pending manual reconciliation.`}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${conflicts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {conflicts.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold">
            {conflicts.length > 0 ? (
              <span className="text-rose-600 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> {conflicts.length} open conflict issues
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Zero open conflicts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Open Conflicts Table if any */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50/40 rounded-2xl border border-rose-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Active Divergence Conflicts ({conflicts.length})
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Resolve differences to keep automated webhooks and bi-directional synchronizations running smoothly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conflicts.map(conf => (
              <div
                key={conf.id}
                className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {conf.productName || conf.productId}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    SKU: {conf.productSku || 'N/A'} • {conf.fieldDifferences?.length || 0} fields diverged
                  </div>
                </div>
                <button
                  onClick={() => onOpenConflictModal(conf)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  Resolve Diff
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Jobs Execution History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sync Execution Logs & Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical record of background sync payloads, API responses, and retry attempts.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-6 font-semibold w-8"></th>
                <th className="py-3 px-4 font-semibold">Job ID</th>
                <th className="py-3 px-4 font-semibold">Operation</th>
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Affected Items</th>
                <th className="py-3 px-4 font-semibold">Diagnostic Message</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No synchronization jobs recorded yet.
                  </td>
                </tr>
              ) : (
                jobs.map(job => {
                  const isExpanded = expandedJobId === job.id;
                  const isRetrying = retryingId === job.id;

                  const statusBadges: Record<string, string> = {
                    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    RUNNING: 'bg-purple-50 text-purple-700 border-purple-200',
                    CONFLICT: 'bg-rose-50 text-rose-700 border-rose-200',
                  };

                  return (
                    <React.Fragment key={job.id}>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-6">
                          <button
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {job.id.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {job.jobType}
                        </td>
                        <td className="py-3 px-4">
                          {job.isSimulated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Sparkles className="w-2.5 h-2.5" /> Sandbox
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Live Store
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              statusBadges[job.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {job.affectedCount} items
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={job.message || ''}>
                          {job.message || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(job.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-6 text-right">
                          {job.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(job.id)}
                              disabled={isRetrying}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition disabled:opacity-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON details row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-slate-50/80 px-10 py-3 border-y border-slate-100">
                            <div className="font-semibold text-slate-700 mb-1">Execution Payload Details:</div>
                            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                              {JSON.stringify(job.details || { message: job.message }, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
