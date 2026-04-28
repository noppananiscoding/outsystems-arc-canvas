'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Module } from '@/types/architecture';
import { getSuffixColor, getLayerColor } from '@/lib/module-utils';
import { useArchitectureStore } from '@/store/architecture-store';
import { Trash2, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

type ModuleNodeData = Module & { highlighted?: boolean; onDelete?: (id: string) => void };

function ModuleNode({ data, selected }: NodeProps<ModuleNodeData>) {
  const { violations, selectModule, deleteModule } = useArchitectureStore();
  const moduleViolations = violations.filter(v => v.moduleId === data.id);
  const hasError = moduleViolations.some(v => v.severity === 'ERROR');
  const hasWarn = moduleViolations.some(v => v.severity === 'WARN');
  const layerColor = getLayerColor(data.layer);

  const ValidationIcon = hasError
    ? <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
    : hasWarn
    ? <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
    : <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />;
  const borderColor = hasError ? '#EF4444' : hasWarn ? '#F59E0B' : selected ? layerColor : '#374151';
  // W3: highlighted ring shown when clicked from ValidationPanel (without opening the form)
  const highlightRing = data.highlighted ? '0 0 0 3px #FBBF24, 0 0 12px 4px #FBBF2466' : undefined;

  return (
    <div
      className="relative bg-gray-800 rounded-lg shadow-lg cursor-pointer min-w-[180px] max-w-[220px]"
      style={{ border: `2px solid ${borderColor}`, boxShadow: highlightRing }}
      onClick={() => selectModule(data.id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-2">
          <span className="text-white text-sm font-semibold leading-tight break-all">{data.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); deleteModule(data.id); }}
            className="text-gray-500 hover:text-red-400 flex-shrink-0 mt-0.5"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <span className={`text-white text-xs px-1.5 py-0.5 rounded ${getSuffixColor(data.suffix)}`}>_{data.suffix}</span>
          <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: layerColor }}>{data.layer}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {data.ownedEntities.length > 0 && (
            <span className="bg-gray-700 px-1.5 py-0.5 rounded">{data.ownedEntities.length} entities</span>
          )}
          {data.dependsOn.length > 0 && (
            <span className="bg-gray-700 px-1.5 py-0.5 rounded">{data.dependsOn.length} deps</span>
          )}
          <span>{validationIcon}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
    </div>
  );
}

export default memo(ModuleNode);
