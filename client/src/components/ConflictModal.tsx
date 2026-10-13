import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Database,
  Cloud,
} from 'lucide-react';
import type { ConflictLog, ConflictResolution } from '../types';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ConflictLog | null;
  onResolve: (conflictId: string, resolution: ConflictResolution, mergedData?: any) => Promise<void>;
  isResolving?: boolean;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
  isResolving = false,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution>('KEEP_LOCAL');

  if (!isOpen || !conflict) return null;

  const differences = conflict.fieldDifferences || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Divergence Detected (Sync Conflict)
              </h3>
              <p className="text-xs text-rose-800">
                Product: <span className="font-semibold">{conflict.productName || conflict.productId}</span> ({conflict.productSku || 'SKU'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isResolving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational description */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 space-y-1">
            <div className="font-semibold">Why did this conflict occur?</div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              This item was modified in SyncSphere PIM while simultaneous updates were registered on WooCommerce (or vice versa).
              Choose which source of truth should take precedence, or perform a merged reconciliation.
            </p>
          </div>

          {/* Diff Grid Header */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center justify-between">
              <span>Field Differences Comparison</span>
              <span>{differences.length} differing attributes</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-bold text-slate-600 text-[11px]">
                <div className="col-span-4">Attribute Field</div>
                <div className="col-span-4 flex items-center gap-1 text-purple-700">
                  <Database className="w-3.5 h-3.5" /> Local PIM System
                </div>
                <div className="col-span-4 flex items-center gap-1 text-indigo-700">
                  <Cloud className="w-3.5 h-3.5" /> Remote WooCommerce
                </div>
              </div>

              {differences.map((diff, idx) => (
                <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-slate-50/50">
                  <div className="col-span-4 font-semibold text-slate-800 capitalize">
                    {diff.field}
                  </div>
                  <div className="col-span-4 font-mono text-cyan-700 bg-cyan-50/60 p-1.5 rounded-lg mr-2 border border-cyan-100">
                    {typeof diff.local === 'object' ? JSON.stringify(diff.local) : String(diff.local ?? '—')}
                  </div>
                  <div className="col-span-4 font-mono text-indigo-700 bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100">
                    {typeof diff.remote === 'object' ? JSON.stringify(diff.remote) : String(diff.remote ?? '—')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Options Choice */}
          <div className="space-y-3 pt-3">
            <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
              Resolution Strategy
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedResolution('KEEP_LOCAL')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedResolution === 'KEEP_LOCAL'
                    ? 'border-cyan-600 bg-cyan-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    selectedResolution === 'KEEP_LOCAL'
                      ? 'border-cyan-600 bg-cyan-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {selectedResolution === 'KEEP_LOCAL' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900">Local PIM Wins</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Overwrite WooCommerce with current PIM values. Dispatches an immediate update push to WooCommerce.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedResolution('KEEP_REMOTE')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedResolution === 'KEEP_REMOTE'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    selectedResolution === 'KEEP_REMOTE'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {selectedResolution === 'KEEP_REMOTE' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900">WooCommerce Wins</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Update local PIM record with the remote WooCommerce values and mark as synchronized.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isResolving}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onResolve(conflict.id, selectedResolution)}
            disabled={isResolving}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isResolving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Confirm Resolution ({selectedResolution === 'KEEP_LOCAL' ? 'PIM Wins' : 'Woo Wins'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
