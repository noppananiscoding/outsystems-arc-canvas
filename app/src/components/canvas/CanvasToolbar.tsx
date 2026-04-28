'use client';
import { useRef, useState, useEffect } from 'react';
import { useArchitectureStore } from '@/store/architecture-store';
import { importFromJSON } from '@/lib/import-export';
import { BEST_PRACTICES_ARCHITECTURE, ANTI_PATTERN_SHOWCASE } from '@/lib/sample-architectures';
import { toast } from 'sonner';
import { Download, Upload, Plus, CheckSquare, BookOpen, ChevronDown, Keyboard, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface CanvasToolbarProps {
  onAddModule: () => void;
  onToggleValidation: () => void;
  showValidation: boolean;
  onExport: () => void;
  onToggleShortcuts: () => void;
  onOpenGuidelines: () => void;
}

export default function CanvasToolbar({
  onAddModule,
  onToggleValidation,
  showValidation,
  onExport,
  onToggleShortcuts,
  onOpenGuidelines,
}: CanvasToolbarProps) {
  const { projectName, violations, setProjectName, importArchitecture, validateAll } = useArchitectureStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const samplesMenuRef = useRef<HTMLDivElement>(null);
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const errorCount = violations.filter(v => v.severity === 'ERROR').length;
  const warnCount = violations.filter(v => v.severity === 'WARN').length;

  // Close sample menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (samplesMenuRef.current && !samplesMenuRef.current.contains(e.target as Node)) {
        setShowSampleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700 z-50 relative">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Project:</span>
        <input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500 w-48"
        />
      </div>
      <div className="h-5 w-px bg-gray-700" />
      <button onClick={onAddModule} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer">
        <Plus size={14} /> Add Module
      </button>
      <button onClick={onExport} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer">
        <Download size={14} /> Export
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer">
        <Upload size={14} /> Import
      </button>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Sample architectures dropdown */}
      <div className="relative" ref={samplesMenuRef}>
        <button
          onClick={() => setShowSampleMenu(v => !v)}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          <Layers size={14} /> Samples <ChevronDown size={12} className="ml-1" />
        </button>
        {showSampleMenu && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Load Sample Architecture</p>
              <p className="text-xs text-red-400 mt-0.5">⚠ This will replace the current canvas</p>
            </div>
            <button
              onClick={() => {
                importArchitecture(BEST_PRACTICES_ARCHITECTURE);
                validateAll();
                setShowSampleMenu(false);
                toast.success('Loaded: Best Practices Reference Architecture');
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700/50 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">Best Practices Reference</span>
              </div>
              <p className="text-gray-400 text-xs ml-6">12 modules · All valid · Zero violations · Full reference architecture</p>
            </button>
            <button
              onClick={() => {
                importArchitecture(ANTI_PATTERN_SHOWCASE);
                validateAll();
                setShowSampleMenu(false);
                toast.success('Loaded: Anti-Pattern Showcase — check the Validation panel!');
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">Anti-Pattern Showcase</span>
              </div>
              <p className="text-gray-400 text-xs ml-6">22 modules · Intentional violations · All 8 anti-patterns visible</p>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => { validateAll(); onToggleValidation(); }}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors cursor-pointer ${showValidation ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
      >
        <CheckSquare size={14} /> Validate
        {(errorCount > 0 || warnCount > 0) && (
          <span className="flex gap-1 ml-1">
            {errorCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{errorCount}</span>}
            {warnCount > 0 && <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{warnCount}</span>}
          </span>
        )}
      </button>

      <button
        onClick={onOpenGuidelines}
        title="Architecture Guidelines (G)"
        className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors cursor-pointer"
      >
        <BookOpen size={14} /> Guidelines
      </button>

      {/* Spacer pushes ? button to far right */}
      <div className="flex-1" />

      {/* Keyboard shortcuts help toggle */}
      <button
        onClick={onToggleShortcuts}
        title="Keyboard shortcuts (?)"
        className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm px-2.5 py-1.5 rounded transition-colors cursor-pointer"
      >
        <Keyboard size={14} />
        <span className="text-xs font-mono font-bold">?</span>
      </button>
    </div>
  );
}
