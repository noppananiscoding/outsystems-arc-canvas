'use client';

import { useState, useCallback } from 'react';
import { Wand2, X, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { useArchitectureStore, AIProvider } from '@/store/architecture-store';
import { ParsedArchitecture } from '@/lib/ai-output-parser';
import { LayerType } from '@/types/architecture';

interface AIGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  provider: AIProvider;
  apiKey: string;
  model: string;
}

type Step = 'describe' | 'generating' | 'preview';

const EXAMPLE_PROMPTS = [
  'E-Commerce Platform',
  'HR Management System',
  'Healthcare Patient Portal',
  'Banking Core System',
];

// Layer color classes for preview badges
const LAYER_BADGE: Record<LayerType, string> = {
  'end-user': 'bg-purple-900/60 border-purple-700/50 text-purple-300',
  'core':     'bg-blue-900/60 border-blue-700/50 text-blue-300',
  'foundation': 'bg-emerald-900/60 border-emerald-700/50 text-emerald-300',
};

export default function AIGenerateDialog({
  open,
  onClose,
  provider,
  apiKey,
  model,
}: AIGenerateDialogProps) {
  const { importArchitecture } = useArchitectureStore();

  const [step, setStep] = useState<Step>('describe');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<ParsedArchitecture | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    setStep('generating');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), provider, apiKey, model }),
      });

      const data = await res.json() as ParsedArchitecture & { error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
        setStep('describe');
        return;
      }

      setResult(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('describe');
    }
  }, [description, provider, apiKey, model]);

  const handleLoad = useCallback(() => {
    if (!result) return;
    importArchitecture({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projectName: description.trim() || 'AI Generated Architecture',
      modules: result.modules,
      dependencies: result.dependencies,
    });
    onClose();
    // Reset for next use
    setStep('describe');
    setDescription('');
    setResult(null);
  }, [result, description, importArchitecture, onClose]);

  const handleClose = () => {
    onClose();
    // Small delay before reset so the closing animation isn't jarring
    setTimeout(() => {
      setStep('describe');
      setError(null);
      setResult(null);
    }, 300);
  };

  if (!open) return null;

  const providerLabel =
    provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Anthropic';

  return (
    /* Backdrop */
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
      {/* Dialog */}
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ maxWidth: '600px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-indigo-400" />
            <span className="text-white font-semibold">Generate Architecture with AI</span>
            <span className="text-[10px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
              {provider}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step 1: Describe ────────────────────────────────────────────── */}
        {(step === 'describe') && (
          <div className="px-5 py-5 space-y-4">
            {/* Error banner */}
            {error && (
              <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe your system
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="E.g. 'E-commerce platform with product catalog, orders, payments, and a customer portal'"
                className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2.5 rounded-lg resize-none focus:outline-none focus:border-indigo-500 placeholder-gray-500 transition-colors"
              />
            </div>

            {/* Example chips */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setDescription(ex)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-white px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider info */}
            <p className="text-xs text-gray-500">
              Using <span className="text-indigo-400 font-medium">{providerLabel}</span> · {model}
            </p>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!description.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
            >
              <Wand2 size={15} />
              Generate Architecture
            </button>
          </div>
        )}

        {/* ── Step 2: Generating ──────────────────────────────────────────── */}
        {step === 'generating' && (
          <div className="px-5 py-12 flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-indigo-400 animate-spin" />
            <div className="text-center">
              <p className="text-white font-medium">AI is designing your architecture…</p>
              <p className="text-gray-400 text-sm mt-1">Generating modules and dependencies</p>
            </div>
            <button
              onClick={() => setStep('describe')}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer mt-2"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Step 3: Preview ─────────────────────────────────────────────── */}
        {step === 'preview' && result && (
          <div className="px-5 py-5 space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-emerald-400 font-semibold">✓</span>
              Generated{' '}
              <span className="text-white font-semibold">{result.modules.length} modules</span>
              {' '}and{' '}
              <span className="text-white font-semibold">{result.dependencies.length} dependencies</span>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle size={12} /> Automatic adjustments made:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.warnings.map((w, i) => (
                    <span
                      key={i}
                      className="text-xs bg-amber-950/60 border border-amber-700/40 text-amber-300 px-2 py-0.5 rounded"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertTriangle size={12} /> Issues:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.errors.map((e, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-950/60 border border-red-700/40 text-red-300 px-2 py-0.5 rounded"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Module preview grid */}
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Generated Modules</p>
              <div className="flex flex-wrap gap-2">
                {result.modules.map(m => (
                  <span
                    key={m.id}
                    className={`text-xs border px-2 py-0.5 rounded font-mono font-medium ${LAYER_BADGE[m.layer]}`}
                    title={m.description}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Layer legend */}
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                End-User
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Core
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Foundation
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setStep('describe'); setResult(null); }}
                className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors cursor-pointer font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleLoad}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Load onto Canvas
                <ChevronRight size={14} />
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center">
              ⚠ Loading will replace the current canvas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
