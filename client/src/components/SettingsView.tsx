import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Globe,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { settingsApi } from '../api';
import type { StoreSettings } from '../types';
import { useToast } from '../context/ToastContext';

interface SettingsViewProps {
  onSettingsSaved?: (newSettings: StoreSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsSaved }) => {
  const { success, error, warning } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [autoSyncOnSave, setAutoSyncOnSave] = useState(false);
  const [verifySsl, setVerifySsl] = useState(true);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    pingMs?: number;
    isSimulated?: boolean;
  } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const s: StoreSettings = await settingsApi.get();
        if (s) {
          setStoreUrl(s.storeUrl || '');
          setConsumerKey(s.consumerKey || '');
          setWebhookSecret(s.webhookSecret || '');
          setIsDemoMode(s.isDemoMode ?? true);
          setAutoSyncOnSave(s.autoSyncOnSave ?? false);
          setVerifySsl(s.verifySsl ?? true);
        }
      } catch (err: any) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await settingsApi.test({
        storeUrl,
        consumerKey,
        consumerSecret,
        isDemoMode,
        verifySsl,
      });
      setTestResult(res);
      if (res.success) {
        success('WooCommerce connection verified!', `Latency: ${res.pingMs}ms`);
      } else {
        warning('Connection verification failed', res.message);
      }
    } catch (err: any) {
      error('Test connection error', err.message);
      setTestResult({
        success: false,
        message: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = {
        storeUrl,
        consumerKey,
        webhookSecret,
        isDemoMode,
        autoSyncOnSave,
        verifySsl,
      };
      if (consumerSecret.trim()) {
        payload.consumerSecret = consumerSecret.trim();
      }

      const res = await settingsApi.update(payload);
      success('Settings updated successfully');
      if (onSettingsSaved) onSettingsSaved(res);
    } catch (err: any) {
      error('Failed to save settings', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Sandbox Toggle Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Simulated Sandbox Sandbox Mode</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulates live WooCommerce REST API responses with latency and bidirectional sync without needing a real server.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isDemoMode}
            onChange={e => setIsDemoMode(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* Connection Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">WooCommerce REST API v3 Credentials</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keys generated from WooCommerce &gt; Settings &gt; Advanced &gt; REST API.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-600" /> WooCommerce Store URL
            </label>
            <input
              type="url"
              value={storeUrl}
              onChange={e => setStoreUrl(e.target.value)}
              placeholder="https://your-store.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" /> Consumer Key
              </label>
              <input
                type="text"
                value={consumerKey}
                onChange={e => setConsumerKey(e.target.value)}
                placeholder="ck_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Consumer Secret
              </label>
              <input
                type="password"
                value={consumerSecret}
                onChange={e => setConsumerSecret(e.target.value)}
                placeholder="cs_... (Leave blank to keep existing)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" /> Webhook HMAC Secret
            </label>
            <input
              type="text"
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono text-xs"
            />
          </div>

          {/* Additional switches */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncOnSave}
                onChange={e => setAutoSyncOnSave(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span className="font-medium text-slate-700">
                Auto-sync on product update (Instantly pushes changes to WooCommerce upon saving)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifySsl}
                onChange={e => setVerifySsl(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span className="font-medium text-slate-700">
                Verify SSL Certificates for HTTPS endpoints
              </span>
            </label>
          </div>
        </div>

        {/* Live Test Connection Card */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.pingMs && (
              <span className="font-mono font-semibold">{testResult.pingMs}ms latency</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 text-purple-600 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Pinging WooCommerce...' : 'Test Connection & Ping'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
