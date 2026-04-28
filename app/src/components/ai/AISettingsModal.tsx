'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ChevronDown, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useArchitectureStore, AIProvider } from '@/store/architecture-store';

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const PROVIDERS: { value: AIProvider; label: string; keyPage: string }[] = [
  { value: 'gemini', label: 'Google Gemini', keyPage: 'https://aistudio.google.com/app/apikey' },
  { value: 'openai', label: 'OpenAI', keyPage: 'https://platform.openai.com/api-keys' },
  { value: 'anthropic', label: 'Anthropic (Claude)', keyPage: 'https://console.anthropic.com/settings/api-keys' },
];

const MODELS: Record<AIProvider, { value: string; label: string; tier?: string }[]> = {
  gemini: [
    { value: 'gemini-2.0-flash',              label: 'Gemini 2.0 Flash',             tier: 'Free' },
    { value: 'gemini-2.0-flash-lite',          label: 'Gemini 2.0 Flash Lite',        tier: 'Free' },
    { value: 'gemini-1.5-flash',               label: 'Gemini 1.5 Flash',             tier: 'Free' },
    { value: 'gemini-1.5-flash-8b',            label: 'Gemini 1.5 Flash 8B',          tier: 'Free' },
    { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview',     tier: 'Free' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
  ],
  anthropic: [
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Recommended)' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  ],
};

export default function AISettingsModal({ open, onClose, onSaved }: AISettingsModalProps) {
  const { aiProvider, aiModel, aiApiKey, setAiConfig } = useArchitectureStore();

  const [provider, setProvider] = useState<AIProvider>(aiProvider);
  const [model, setModel] = useState(aiModel);
  const [apiKey, setApiKey] = useState(aiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync with store when modal opens
  useEffect(() => {
    if (open) {
      setProvider(aiProvider);
      setModel(aiModel);
      setApiKey(aiApiKey);
      setTestResult(null);
    }
  }, [open, aiProvider, aiModel, aiApiKey]);

  // When provider changes, reset model to first available
  useEffect(() => {
    setModel(MODELS[provider][0].value);
    setTestResult(null);
  }, [provider]);

  const currentProvider = PROVIDERS.find(p => p.value === provider)!;

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello',
          history: [],
          canvasContext: 'PROJECT: Test',
          provider,
          apiKey: apiKey.trim(),
          model,
        }),
      });

      if (res.ok) {
        // Read a bit of the stream to confirm it works
        const reader = res.body?.getReader();
        if (reader) {
          const { done, value } = await reader.read();
          reader.cancel();
          const hasContent = !done && value && value.length > 0;
          setTestResult({ ok: !!hasContent, error: hasContent ? undefined : 'No response received' });
        } else {
          setTestResult({ ok: false, error: 'Could not read response' });
        }
      } else {
        const data = await res.json() as { error?: string };
        setTestResult({ ok: false, error: data.error ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setAiConfig(provider, apiKey.trim(), model);
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300]" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            <h2 className="text-white font-semibold text-base">Configure AI Provider</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Provider
            </label>
            <div className="relative">
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as AIProvider)}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Model
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                {MODELS[provider].map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}{m.tier ? ` · ${m.tier}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                API Key
              </label>
              <a
                href={currentProvider.keyPage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Get your free API key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setTestResult(null); }}
                placeholder={`Paste your ${currentProvider.label} API key`}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 pr-10 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${testResult.ok ? 'bg-emerald-900/40 border border-emerald-700 text-emerald-300' : 'bg-red-900/40 border border-red-700 text-red-300'}`}>
              <span>{testResult.ok ? '✓ Connection successful!' : `✗ ${testResult.error}`}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={handleTest}
            disabled={!apiKey.trim() || testing}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {testing ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Testing…
              </span>
            ) : 'Test Connection'}
          </button>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            <Sparkles size={13} />
            Save &amp; Enable AI
          </button>
        </div>
      </div>
    </div>
  );
}
