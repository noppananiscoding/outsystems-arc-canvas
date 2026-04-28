'use client';
import { useRef, useState, useEffect } from 'react';
import { useArchitectureStore } from '@/store/architecture-store';
import { importFromJSON } from '@/lib/import-export';
import { BEST_PRACTICES_ARCHITECTURE, ANTI_PATTERN_SHOWCASE } from '@/lib/sample-architectures';
import { toast } from 'sonner';
import {
  Download, Upload, Plus, CheckSquare, BookOpen,
  ChevronDown, Keyboard, Layers, ShieldCheck, AlertCircle,
  Brain, Wand2, Sparkles,
} from 'lucide-react';
import AIModeToggle from '../ai/AIModeToggle';

interface CanvasToolbarProps {
  onAddModule: () => void;
  onToggleValidation: () => void;
  showValidation: boolean;
  onExport: () => void;
  onToggleShortcuts: () => void;
  onOpenGuidelines: () => void;
  onOpenAI: () => void;
  onOpenReview: () => void;
  onOpenGenerate: () => void;
}

export default function CanvasToolbar({
  onAddModule, onToggleValidation, showValidation,
  onExport, onToggleShortcuts, onOpenGuidelines,
  onOpenAI, onOpenReview, onOpenGenerate,
}: CanvasToolbarProps) {
  const { projectName, violations, setProjectName, importArchitecture, validateAll, aiMode } =
    useArchitectureStore();
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const samplesMenuRef  = useRef<HTMLDivElement>(null);
  const aiMenuRef       = useRef<HTMLDivElement>(null);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [showAIMenu,     setShowAIMenu]     = useState(false);

  const errorCount = violations.filter(v => v.severity === 'ERROR').length;
  const warnCount  = violations.filter(v => v.severity === 'WARN').length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (samplesMenuRef.current && !samplesMenuRef.current.contains(e.target as Node))
        setShowSampleMenu(false);
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node))
        setShowAIMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arch = importFromJSON(ev.target?.result as string);
        importArchitecture(arch);
        toast.success(`Imported "${arch.projectName}" with ${arch.modules.length} modules`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to import file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed top-0 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-700 z-50 flex-wrap">

      {/* Project name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Project:</span>
        <input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500 w-40 cursor-text"
        />
      </div>

      <div className="h-5 w-px bg-gray-700 flex-shrink-0" />

      {/* Add Module — primary CTA */}
      <button
        onClick={onAddModule}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer flex-shrink-0"
      >
        <Plus size={14} /> Add Module
      </button>

      {/* Export / Import — icon only to save space */}
      <button
        onClick={onExport}
        title="Export architecture (.json)"
        className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-1.5 rounded transition-colors cursor-pointer flex-shrink-0"
      >
        <Download size={15} />
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        title="Import architecture (.json)"
        className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-1.5 rounded transition-colors cursor-pointer flex-shrink-0"
      >
        <Upload size={15} />
      </button>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Samples dropdown */}
      <div className="relative flex-shrink-0" ref={samplesMenuRef}>
        <button
          onClick={() => setShowSampleMenu(v => !v)}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          <Layers size={14} /> Samples <ChevronDown size={12} />
        </button>
        {showSampleMenu && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Load Sample Architecture</p>
              <p className="text-xs text-amber-400 mt-0.5">⚠ Replaces the current canvas</p>
            </div>
            <button
              onClick={() => { importArchitecture(BEST_PRACTICES_ARCHITECTURE); validateAll(); setShowSampleMenu(false); toast.success('Loaded: Best Practices Reference Architecture'); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700/50 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">Best Practices Reference</span>
              </div>
              <p className="text-gray-400 text-xs ml-6">12 modules · Zero violations</p>
            </button>
            <button
              onClick={() => { importArchitecture(ANTI_PATTERN_SHOWCASE); validateAll(); setShowSampleMenu(false); toast.success('Loaded: Anti-Pattern Showcase'); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">Anti-Pattern Showcase</span>
              </div>
              <p className="text-gray-400 text-xs ml-6">22 modules · All 8 anti-patterns</p>
            </button>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-gray-700 flex-shrink-0" />

      {/* Validate */}
      <button
        onClick={() => { validateAll(); onToggleValidation(); }}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors cursor-pointer flex-shrink-0 ${
          showValidation ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'
        } text-white`}
      >
        <CheckSquare size={14} /> Validate
        {(errorCount > 0 || warnCount > 0) && (
          <span className="flex gap-1">
            {errorCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{errorCount}</span>}
            {warnCount  > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{warnCount}</span>}
          </span>
        )}
      </button>

      {/* Guidelines */}
      <button
        onClick={onOpenGuidelines}
        title="Architecture Guidelines (G)"
        className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer flex-shrink-0"
      >
        <BookOpen size={14} /> Guidelines
      </button>

      {/* Push everything after here to the right */}
      <div className="flex-1" />

      {/* Keyboard shortcuts */}
      <button
        onClick={onToggleShortcuts}
        title="Keyboard shortcuts (?)"
        className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm px-2 py-1.5 rounded transition-colors cursor-pointer flex-shrink-0"
      >
        <Keyboard size={14} />
        <span className="text-xs font-mono font-bold">?</span>
      </button>

      <div className="h-5 w-px bg-gray-700 flex-shrink-0" />

      {/* AI Tools dropdown — only visible in AI mode */}
      {aiMode && (
        <div className="relative flex-shrink-0" ref={aiMenuRef}>
          <button
            onClick={() => setShowAIMenu(v => !v)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            <Sparkles size={14} /> AI Tools <ChevronDown size={12} />
          </button>
          {showAIMenu && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => { onOpenAI(); setShowAIMenu(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer border-b border-gray-700/50"
              >
                <Sparkles size={14} className="text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Copilot Chat</p>
                  <p className="text-gray-400 text-xs">Ask about your architecture</p>
                </div>
              </button>
              <button
                onClick={() => { onOpenReview(); setShowAIMenu(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer border-b border-gray-700/50"
              >
                <Brain size={14} className="text-violet-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">AI Review</p>
                  <p className="text-gray-400 text-xs">Score &amp; detailed report</p>
                </div>
              </button>
              <button
                onClick={() => { onOpenGenerate(); setShowAIMenu(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Wand2 size={14} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Generate</p>
                  <p className="text-gray-400 text-xs">Describe → AI builds it</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Mode Toggle (toggle + gear, no Copilot button) */}
      <AIModeToggle />
    </div>
  );
}
