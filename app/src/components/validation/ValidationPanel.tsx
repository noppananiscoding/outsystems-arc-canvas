'use client';
import { useArchitectureStore } from '@/store/architecture-store';
import { ValidationViolation } from '@/types/architecture';
import { X, AlertCircle, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

interface ValidationPanelProps {
  onClose: () => void;
  onHighlightModule: (id: string) => void;
}

function ViolationItem({ v, onHighlight }: { v: ValidationViolation; onHighlight: (id: string) => void }) {
  const colors = { ERROR: 'text-red-400 border-red-800 bg-red-950/30', WARN: 'text-amber-400 border-amber-800 bg-amber-950/30', INFO: 'text-blue-400 border-blue-800 bg-blue-950/30' };
  const icons = { ERROR: <AlertCircle size={14} />, WARN: <AlertTriangle size={14} />, INFO: <Info size={14} /> };
  const { modules } = useArchitectureStore();
  const module = v.moduleId ? modules.find(m => m.id === v.moduleId) : null;

  return (
    <div className={`border rounded p-2.5 space-y-1 cursor-pointer hover:opacity-80 ${colors[v.severity]}`} onClick={() => v.moduleId && onHighlight(v.moduleId)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        {icons[v.severity]}
        <span>{v.severity}</span>
        <span className="text-gray-500 font-normal">·</span>
        <span className="text-gray-400 font-normal">{v.rule}</span>
      </div>
      <p className="text-xs text-gray-300">{v.message}</p>
      {module && <p className="text-xs text-gray-500">Module: {module.name}</p>}
    </div>
  );
}

export default function ValidationPanel({ onClose, onHighlightModule }: ValidationPanelProps) {
  const { violations } = useArchitectureStore();
  const errors = violations.filter(v => v.severity === 'ERROR');
  const warns = violations.filter(v => v.severity === 'WARN');
  const infos = violations.filter(v => v.severity === 'INFO');

  const handleHighlight = (id: string) => onHighlightModule(id);

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">Validation Report</h3>
          <div className="flex gap-1">
            {errors.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{errors.length}</span>}
            {warns.length > 0 && <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{warns.length}</span>}
            {infos.length > 0 && <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{infos.length}</span>}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {violations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ShieldCheck size={48} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-emerald-400">Architecture is valid</p>
            <p className="text-xs text-gray-500 mt-1">No violations found</p>
          </div>
        )}
        {errors.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Errors ({errors.length})</h4>
            {errors.map(v => <ViolationItem key={v.id} v={v} onHighlight={handleHighlight} />)}
          </div>
        )}
        {warns.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Warnings ({warns.length})</h4>
            {warns.map(v => <ViolationItem key={v.id} v={v} onHighlight={handleHighlight} />)}
          </div>
        )}
        {infos.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Info ({infos.length})</h4>
            {infos.map(v => <ViolationItem key={v.id} v={v} onHighlight={handleHighlight} />)}
          </div>
        )}
      </div>
    </div>
  );
}
