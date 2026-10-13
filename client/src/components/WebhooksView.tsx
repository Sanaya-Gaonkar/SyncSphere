import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Play,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { webhooksApi } from '../api';
import type { WebhookEvent, Product } from '../types';
import { useToast } from '../context/ToastContext';

interface WebhooksViewProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ products, onRefreshProducts }) => {
  const { success, error } = useToast();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Simulation form
  const [simEvent, setSimEvent] = useState<'product.updated' | 'product.created' | 'product.deleted'>('product.updated');
  const [simProductId, setSimProductId] = useState<string>(products[0]?.id || '');
  const [simStockChange, setSimStockChange] = useState<number>(5);
  const [simPriceChange, setSimPriceChange] = useState<number>(59.99);
  const [corruptSignature, setCorruptSignature] = useState(false);

  const webhookEndpoint = `${window.location.origin.replace(':5173', ':4000')}/api/webhooks/woocommerce`;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await webhooksApi.listEvents();
      setEvents(res || []);
    } catch (err: any) {
      console.error('Failed to load webhook events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedUrl(true);
    success('Webhook endpoint copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const targetProd = products.find(p => p.id === simProductId) || products[0];

      const payload = {
        eventName: simEvent,
        productId: targetProd?.id,
        remoteWooId: targetProd?.remoteWooId || 9999,
        sku: targetProd?.sku || 'DEMO-SKU',
        name: targetProd?.name || 'Simulated Product',
        regularPrice: simPriceChange,
        stockQuantity: simStockChange,
        corruptSignature,
      };

      const res = await webhooksApi.simulate(payload);
      success('Webhook dispatched & processed!', `Status: ${res.status || 'OK'}`);
      await fetchEvents();
      onRefreshProducts();
    } catch (err: any) {
      error('Simulation failed', err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Endpoint configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">WooCommerce Webhook Ingestion URL</h3>
              <p className="text-xs text-slate-500">
                Configure this webhook in WooCommerce WP-Admin &gt; Settings &gt; Advanced &gt; Webhooks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <code className="text-xs font-mono text-purple-700 px-2">{webhookEndpoint}</code>
          <button
            onClick={handleCopyUrl}
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
            title="Copy URL"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Webhook Simulator Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-600" /> Live Webhook Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Simulate real-time WooCommerce push events to test HMAC security and auto-sync triggers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Webhook Topic / Event</label>
            <select
              value={simEvent}
              onChange={e => setSimEvent(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none"
            >
              <option value="product.updated">action: product.updated</option>
              <option value="product.created">action: product.created</option>
              <option value="product.deleted">action: product.deleted</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Target Product</label>
            <select
              value={simProductId}
              onChange={e => setSimProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Simulated Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={simPriceChange}
              onChange={e => setSimPriceChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Simulated Stock Qty</label>
            <input
              type="number"
              value={simStockChange}
              onChange={e => setSimStockChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="corruptSig"
              checked={corruptSignature}
              onChange={e => setCorruptSignature(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <label htmlFor="corruptSig" className="text-xs text-slate-600 cursor-pointer">
              Corrupt HMAC-SHA256 signature (Test security rejection)
            </label>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Dispatching...' : 'Dispatch Simulated Webhook'}</span>
          </button>
        </div>
      </div>

      {/* Webhook Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Received Webhook History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit of all incoming HTTP webhook deliveries and HMAC verification results.
            </p>
          </div>
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-6 w-8"></th>
                <th className="py-3 px-4 font-semibold">Event Topic</th>
                <th className="py-3 px-4 font-semibold">HMAC Signature</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Received At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading webhook events...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No webhook events received yet. Try dispatching a simulated event above!
                  </td>
                </tr>
              ) : (
                events.map(ev => {
                  const isExpanded = expandedEventId === ev.id;

                  return (
                    <React.Fragment key={ev.id}>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-6">
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {ev.eventName}
                        </td>
                        <td className="py-3 px-4">
                          {ev.signatureVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Valid HMAC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" /> Invalid Signature
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              ev.status === 'PROCESSED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ev.status === 'DUPLICATE'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(ev.processedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/80 px-10 py-3 border-y border-slate-100">
                            <div className="font-semibold text-slate-700 mb-1">Raw Ingested Webhook Payload:</div>
                            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                              {JSON.stringify(ev.payload, null, 2)}
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
