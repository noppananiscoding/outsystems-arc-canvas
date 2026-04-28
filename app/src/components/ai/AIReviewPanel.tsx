'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X, Brain, RefreshCw, CheckCircle2, AlertTriangle, Layers, Lightbulb, Loader2,
} from 'lucide-react';
import { Module, ValidationViolation } from '@/types/architecture';
import { AIProvider } from '@/store/architecture-store';
import { ReviewReport } from '@/lib/ai-review-prompt';

interface AIReviewPanelProps {
  open: boolean;
  onClose: () => void;
  modules: Module[];
  violations: ValidationViolation[];
  projectName: string;
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 282.74

function scoreColor(score: number): string {
  if (score >= 90) return '#3B82F6'; // blue
  if (score >= 70) return '#10B981'; // emerald
  if (score >= 50) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [score]);

  const offset = animated
    ? CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none" stroke="#374151" strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
        />
        {/* Score number */}
        <text
          x="60" y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="22"
          fontWeight="bold"
          fill={color}
        >
          {score}
        </text>
      </svg>
      <p className="text-gray-400 text-xs font-medium tracking-wide uppercase">Architecture Health Score</p>
    </div>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[severity]} flex-shrink-0 mt-1`} />;
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export default function AIReviewPanel({
  open,
  onClose,
  modules,
  violations,
  projectName,
  provider,
  apiKey,
  model,
}: AIReviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReviewReport | null>(null);

  const runReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules, violations, projectName, provider, apiKey, model }),
      });

      const data = await res.json() as ReviewReport & { error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [modules, violations, projectName, provider, apiKey, model]);

  // Auto-trigger on open
  useEffect(() => {
    if (open) {
      runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const providerLabel =
    provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Anthropic';

  return (
    <div
      className="fixed top-[44px] right-0 h-[calc(100vh-44px)] w-[640px] bg-gray-900 border-l border-gray-700 flex flex-col z-50 shadow-2xl"
      style={{ maxWidth: '100vw' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700 bg-gray-900/95 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-indigo-400" />
          <span className="text-white font-semibold text-sm">AI Architecture Review</span>
          <span className="text-[10px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
            {provider}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runReview}
            disabled={loading}
            title="Re-run review"
            className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Re-run Review
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <Loader2 size={40} className="text-indigo-400 animate-spin" />
            <div className="text-center">
              <p className="text-white font-medium">{providerLabel} is analyzing your architecture…</p>
              <p className="text-gray-400 text-sm mt-1">This may take 10–20 seconds</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-6">
            <div className="bg-red-950/50 border border-red-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-300 font-medium text-sm">Review failed</p>
                  <p className="text-red-400/80 text-xs mt-1 break-words">{error}</p>
                </div>
              </div>
              <button
                onClick={runReview}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors cursor-pointer"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Report */}
        {!loading && report && (
          <div className="px-6 py-5 space-y-6">

            {/* Score */}
            <div className="flex flex-col items-center py-4">
              <ScoreRing score={report.score} />
            </div>

            {/* Summary */}
            {report.summary && (
              <p className="text-gray-400 text-sm italic text-center border-t border-gray-800 pt-5">
                &ldquo;{report.summary}&rdquo;
              </p>
            )}

            {/* Strengths */}
            {report.strengths?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{s}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Risks */}
            {report.risks?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-amber-400" />
                  <h3 className="text-white font-semibold text-sm">Risks</h3>
                </div>
                <ul className="space-y-2">
                  {report.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Module Recommendations */}
            {report.moduleRecommendations?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={15} className="text-indigo-400" />
                  <h3 className="text-white font-semibold text-sm">Module Recommendations</h3>
                </div>
                <div className="space-y-2.5">
                  {report.moduleRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/70 border border-gray-700/50 rounded-lg px-3.5 py-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <code className="text-xs bg-gray-700 text-indigo-300 px-2 py-0.5 rounded font-mono">
                          {rec.moduleName}
                        </code>
                        <SeverityDot severity={rec.severity} />
                        <span className="text-[11px] text-gray-500 capitalize">{rec.severity}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Overall Recommendations */}
            {report.overallRecommendations?.length > 0 && (
              <section className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={15} className="text-yellow-400" />
                  <h3 className="text-white font-semibold text-sm">Overall Recommendations</h3>
                </div>
                <ol className="space-y-2">
                  {report.overallRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-300 text-sm">{rec}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
