'use client';
import { useState } from 'react';
import { BookOpen, X, Check, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';

interface GuidelinesPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'canvas' | 'naming' | 'dependencies' | 'anti-patterns' | 'best-practices';

const TABS: { id: Tab; label: string }[] = [
  { id: 'canvas', label: 'Canvas Structure' },
  { id: 'naming', label: 'Module Naming' },
  { id: 'dependencies', label: 'Dependency Rules' },
  { id: 'anti-patterns', label: 'Anti-Patterns' },
  { id: 'best-practices', label: 'Best Practices' },
];

// ─── Canvas Structure Tab ────────────────────────────────────────────────────

function CanvasStructureTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold mb-3">3-Layer × 2-Track Grid</h3>
        {/* Visual grid */}
        <div className="grid grid-cols-3 border border-white/10 rounded-lg overflow-hidden text-xs">
          {/* Header row */}
          <div className="bg-gray-700/50 px-3 py-2 font-semibold text-gray-300 border-b border-white/10" />
          <div className="bg-gray-700/50 px-3 py-2 font-semibold text-gray-300 border-b border-white/10 border-l border-white/10 text-center">UI Modules Track</div>
          <div className="bg-gray-700/50 px-3 py-2 font-semibold text-gray-300 border-b border-white/10 border-l border-white/10 text-center">Services/Logic Track</div>
          {/* End-User row */}
          <div className="bg-amber-900/30 px-3 py-4 font-semibold text-amber-300 border-b border-white/10">End-User</div>
          <div className="bg-amber-900/20 px-3 py-4 text-amber-200 border-b border-white/10 border-l border-white/10">
            <code className="text-amber-300">_Web</code>, <code className="text-amber-300">_App</code>
          </div>
          <div className="bg-amber-900/10 px-3 py-4 text-gray-500 border-b border-white/10 border-l border-white/10 italic">
            (none allowed)
          </div>
          {/* Core row */}
          <div className="bg-indigo-900/30 px-3 py-4 font-semibold text-indigo-300 border-b border-white/10">Core</div>
          <div className="bg-indigo-900/20 px-3 py-4 text-indigo-200 border-b border-white/10 border-l border-white/10">
            <code className="text-indigo-300">_UI</code>
          </div>
          <div className="bg-indigo-900/20 px-3 py-4 text-indigo-200 border-b border-white/10 border-l border-white/10">
            <code className="text-indigo-300">_CS</code>
          </div>
          {/* Foundation row */}
          <div className="bg-emerald-900/30 px-3 py-4 font-semibold text-emerald-300">Foundation</div>
          <div className="bg-emerald-900/20 px-3 py-4 text-emerald-200 border-l border-white/10">
            <code className="text-emerald-300">StyleGuide_UI</code>
          </div>
          <div className="bg-emerald-900/20 px-3 py-4 text-emerald-200 border-l border-white/10">
            <code className="text-emerald-300">_IS</code>, <code className="text-emerald-300">_BL</code>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Layer Reference</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left pb-2 pr-4">Layer</th>
              <th className="text-left pb-2 pr-4">Track</th>
              <th className="text-left pb-2 pr-4">Module Types</th>
              <th className="text-left pb-2">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="text-gray-300">
              <td className="py-2 pr-4 font-medium text-amber-300">End-User</td>
              <td className="py-2 pr-4">UI</td>
              <td className="py-2 pr-4"><code>_Web, _App</code></td>
              <td className="py-2">User-facing applications consuming CS data</td>
            </tr>
            <tr className="text-gray-300">
              <td className="py-2 pr-4 font-medium text-indigo-300">Core</td>
              <td className="py-2 pr-4">UI</td>
              <td className="py-2 pr-4"><code>_UI</code></td>
              <td className="py-2">Reusable UI blocks shared across apps</td>
            </tr>
            <tr className="text-gray-300">
              <td className="py-2 pr-4 font-medium text-indigo-300">Core</td>
              <td className="py-2 pr-4">Service</td>
              <td className="py-2 pr-4"><code>_CS</code></td>
              <td className="py-2">Owns entities + business logic per domain</td>
            </tr>
            <tr className="text-gray-300">
              <td className="py-2 pr-4 font-medium text-emerald-300">Foundation</td>
              <td className="py-2 pr-4">UI</td>
              <td className="py-2 pr-4"><code>StyleGuide_UI</code></td>
              <td className="py-2">Design system, tokens, global styles</td>
            </tr>
            <tr className="text-gray-300">
              <td className="py-2 pr-4 font-medium text-emerald-300">Foundation</td>
              <td className="py-2 pr-4">Service</td>
              <td className="py-2 pr-4"><code>_IS, _BL</code></td>
              <td className="py-2">Integrations and shared business logic libs</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Module Naming Tab ───────────────────────────────────────────────────────

function ModuleNamingTab() {
  const suffixes = [
    { suffix: '_Web', full: 'Reactive Web App', layer: 'End-User', track: 'UI', purpose: 'Customer/admin web application', example: 'Portal_Web, Admin_Web', color: 'text-amber-300' },
    { suffix: '_App', full: 'Mobile App', layer: 'End-User', track: 'UI', purpose: 'Native/hybrid mobile application', example: 'Mobile_App, Field_App', color: 'text-amber-300' },
    { suffix: '_CS', full: 'Core Service', layer: 'Core', track: 'Service', purpose: 'Owns entities + business logic per domain', example: 'UserMgmt_CS, Orders_CS', color: 'text-indigo-300' },
    { suffix: '_UI', full: 'UI Component Library', layer: 'Core', track: 'UI', purpose: 'Reusable UI blocks (special case: StyleGuide_UI → Foundation)', example: 'UserMgmt_UI, StyleGuide_UI', color: 'text-indigo-300' },
    { suffix: '_IS', full: 'Integration Service', layer: 'Foundation', track: 'Service', purpose: 'External system integration connector', example: 'Identity_IS, EmailSvc_IS', color: 'text-emerald-300' },
    { suffix: '_BL', full: 'Business Logic Library', layer: 'Foundation', track: 'Service', purpose: 'Shared logic library — no DB, no UI', example: 'Pricing_BL, TaxCalc_BL', color: 'text-emerald-300' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-white font-semibold mb-1">Naming Pattern</h3>
        <p className="text-gray-400 text-xs mb-3">
          All module names must match:{' '}
          <code className="bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded">/^[A-Z][a-zA-Z0-9]*_(Web|App|CS|UI|IS|BL)$/</code>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left pb-2 pr-3">Suffix</th>
              <th className="text-left pb-2 pr-3">Full Name</th>
              <th className="text-left pb-2 pr-3">Layer</th>
              <th className="text-left pb-2 pr-3">Track</th>
              <th className="text-left pb-2 pr-3">Purpose</th>
              <th className="text-left pb-2">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {suffixes.map(s => (
              <tr key={s.suffix} className="text-gray-300 align-top">
                <td className="py-2 pr-3"><code className={`font-mono font-semibold ${s.color}`}>{s.suffix}</code></td>
                <td className="py-2 pr-3 whitespace-nowrap">{s.full}</td>
                <td className={`py-2 pr-3 whitespace-nowrap ${s.color}`}>{s.layer}</td>
                <td className="py-2 pr-3">{s.track}</td>
                <td className="py-2 pr-3 text-gray-400">{s.purpose}</td>
                <td className="py-2"><code className="text-gray-300">{s.example}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2 text-xs text-amber-200">
              <span className="flex items-center gap-1 font-semibold"><AlertTriangle size={12} className="text-amber-400" /> Special Case:</span>{' '}
        <code>StyleGuide_UI</code> is technically a <code>_UI</code> suffix but lives in the{' '}
        <strong>Foundation</strong> layer. The system auto-detects this by module name.
      </div>
    </div>
  );
}

// ─── Dependency Rules Tab ────────────────────────────────────────────────────

function DependencyRulesTab() {
  const allowed = [
    { from: 'End-User (_Web, _App)', to: 'Core Service (_CS)', note: 'Consume business logic' },
    { from: 'End-User (_Web, _App)', to: 'Core UI (_UI)', note: 'Use reusable UI components' },
    { from: 'End-User (_Web, _App)', to: 'Foundation (_IS, _BL)', note: 'Use shared libraries' },
    { from: 'Core Service (_CS)', to: 'Foundation (_IS, _BL)', note: 'Use integrations and utilities' },
    { from: 'Core UI (_UI)', to: 'Core Service (_CS)', note: 'Bind UI blocks to service data' },
    { from: 'Core UI (_UI)', to: 'Foundation UI (StyleGuide_UI)', note: 'Inherit design system tokens' },
  ];

  const forbidden = [
    { from: 'Foundation', to: 'Core', reason: 'Upward dependency — lower layers cannot reference higher' },
    { from: 'Foundation', to: 'End-User', reason: 'Upward dependency — lower layers cannot reference higher' },
    { from: 'Core', to: 'End-User', reason: 'Upward dependency — core must not reference end-user apps' },
    { from: 'Core CS A', to: 'Core CS B', reason: 'Horizontal CS coupling — each CS must be independent' },
    { from: 'End-User A', to: 'End-User B', reason: 'Horizontal end-user coupling — apps must not depend on each other' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3"><ShieldCheck size={14} /> Allowed Dependencies</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left pb-2 pr-4">From</th>
              <th className="text-left pb-2 pr-4 text-gray-500">→</th>
              <th className="text-left pb-2 pr-4">To</th>
              <th className="text-left pb-2">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {allowed.map((r, i) => (
              <tr key={i} className="text-gray-300 align-top">
                <td className="py-2 pr-4 whitespace-nowrap font-medium">{r.from}</td>
                <td className="py-2 pr-4 text-emerald-400">→</td>
                <td className="py-2 pr-4 whitespace-nowrap font-medium">{r.to}</td>
                <td className="py-2 text-gray-400">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-red-400 uppercase tracking-wider mb-3"><ShieldX size={14} /> Forbidden Dependencies</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left pb-2 pr-4">From</th>
              <th className="text-left pb-2 pr-4 text-gray-500">→</th>
              <th className="text-left pb-2 pr-4">To</th>
              <th className="text-left pb-2">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {forbidden.map((r, i) => (
              <tr key={i} className="text-gray-300 align-top">
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-red-300">{r.from}</td>
                <td className="py-2 pr-4 text-red-400">→</td>
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-red-300">{r.to}</td>
                <td className="py-2 text-gray-400">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Anti-Patterns Tab ───────────────────────────────────────────────────────

type Severity = 'ERROR' | 'WARN' | 'INFO';

const severityBadge: Record<Severity, string> = {
  ERROR: 'bg-red-500/20 text-red-400 border border-red-500/30',
  WARN: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  INFO: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

function AntiPatternsTab() {
  const patterns: { id: string; severity: Severity; description: string; fix: string }[] = [
    {
      id: 'UPWARD_DEPENDENCY',
      severity: 'ERROR',
      description: 'A Foundation or Core module depends on a higher-layer module (End-User or Core).',
      fix: 'Reverse the dependency direction or extract shared logic into a Foundation module.',
    },
    {
      id: 'HORIZONTAL_COUPLING_CS',
      severity: 'ERROR',
      description: 'A Core Service (_CS) depends on another Core Service. CS modules must be independently deployable.',
      fix: 'Extract shared logic into a Foundation _BL module. Use events or APIs for inter-CS communication.',
    },
    {
      id: 'HORIZONTAL_COUPLING_EU',
      severity: 'ERROR',
      description: 'An End-User module depends on another End-User module, creating tight coupling between apps.',
      fix: 'Move shared UI into a Core _UI module. Move shared logic into a Core _CS module.',
    },
    {
      id: 'BYPASSING_CORE',
      severity: 'INFO',
      description: 'An End-User module directly depends on a Foundation service (_IS/_BL), bypassing Core Services.',
      fix: 'Route End-User access through an appropriate Core Service that wraps the Foundation dependency.',
    },
    {
      id: 'GOD_MODULE',
      severity: 'WARN',
      description: 'A Core Service owns more than 8 entity types, indicating it handles too many responsibilities.',
      fix: 'Split into multiple focused _CS modules, each owning 1–7 entities in a single domain.',
    },
    {
      id: 'GOD_CANVAS',
      severity: 'WARN',
      description: 'The canvas has more than 20 modules total, suggesting the architecture may be over-complex.',
      fix: 'Consider grouping modules into separate canvases by bounded context or domain.',
    },
    {
      id: 'MISSING_FOUNDATION_DEP',
      severity: 'WARN',
      description: 'A Core Service has no dependency on any Foundation module.',
      fix: 'Add a dependency on a Foundation _IS or _BL module for shared utilities or integrations.',
    },
    {
      id: 'EMPTY_MODULE',
      severity: 'INFO',
      description: 'A module has no description, no owned entities, and no dependencies — likely a placeholder.',
      fix: 'Add a description, owned entities, or dependencies; or remove the placeholder module.',
    },
  ];

  return (
    <div className="space-y-3">
      {patterns.map(p => (
        <div key={p.id} className="border border-white/10 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityBadge[p.severity]}`}>
              {p.severity}
            </span>
            <code className="text-white text-xs font-mono font-semibold">{p.id}</code>
          </div>
          <p className="text-gray-300 text-xs">{p.description}</p>
          <p className="text-gray-500 text-xs">
            <span className="text-gray-400 font-medium">Fix: </span>
            {p.fix}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Best Practices Tab ──────────────────────────────────────────────────────

function BestPracticesTab() {
  const checks = [
    { category: 'Core Services', items: [
      'Each _CS module owns 1–7 entities in a single focused domain.',
      'CS modules only depend on Foundation (_IS, _BL) — never on other CS modules.',
      'All list actions in _CS include pagination parameters (MaxRecords / StartIndex).',
      'Business logic is in Server Actions inside _CS, not in Screen Preparation.',
    ]},
    { category: 'End-User Modules', items: [
      'End-User modules depend on _CS and _UI modules, not directly on Foundation.',
      'No direct entity aggregation from Foundation in End-User modules.',
      'End-User modules never depend on each other (no horizontal coupling).',
    ]},
    { category: 'Foundation Modules', items: [
      'Use _IS for all external system integrations (REST, SOAP, SFTP, etc.).',
      'Use _BL for complex business logic libraries with no database or UI.',
      'Foundation modules never depend on Core or End-User modules.',
      'Keep Foundation modules stable — frequent changes indicate misplaced logic.',
    ]},
    { category: 'General Architecture', items: [
      'Each module has a clear single responsibility aligned to a business domain.',
      'Avoid hardcoded configuration values — use SystemConfig or FeatureFlag patterns.',
      'Notifications should be asynchronous (timer/event), never blocking the main flow.',
      'Keep total modules under 20 per canvas; split large systems into bounded contexts.',
    ]},
  ];

  return (
    <div className="space-y-5">
      {checks.map(section => (
        <div key={section.category}>
          <h3 className="text-white text-sm font-semibold mb-2">{section.category}</h3>
          <ul className="space-y-1.5">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GuidelinesPanel({ open, onClose }: GuidelinesPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('canvas');

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[110]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed top-[44px] bottom-0 right-0 w-[640px] bg-gray-900 border-l border-gray-700 shadow-2xl z-[120] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-indigo-400" />
            <h2 className="text-white font-semibold text-lg">OutSystems Architecture Guidelines</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700 cursor-pointer"
            aria-label="Close guidelines"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === 'canvas' && <CanvasStructureTab />}
          {activeTab === 'naming' && <ModuleNamingTab />}
          {activeTab === 'dependencies' && <DependencyRulesTab />}
          {activeTab === 'anti-patterns' && <AntiPatternsTab />}
          {activeTab === 'best-practices' && <BestPracticesTab />}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-700 px-5 py-3">
          <p className="text-xs text-gray-500 text-center">
            Based on OutSystems Architecture Canvas v3 · Press{' '}
            <kbd className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded font-mono">G</kbd>{' '}
            to toggle or{' '}
            <kbd className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded font-mono">Esc</kbd>{' '}
            to close
          </p>
        </div>
      </div>
    </>
  );
}
