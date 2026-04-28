'use client';
import { useState, useEffect } from 'react';
import { Module, ModuleSuffix, ChecklistItem } from '@/types/architecture';
import { deriveLayerAndTrack, validateModuleName } from '@/lib/module-utils';
import { useArchitectureStore } from '@/store/architecture-store';
import { X, Plus, Check, ChevronDown } from 'lucide-react';
import ModuleChecklist from './ModuleChecklist';
import { getDefaultChecklist } from '@/lib/checklist-utils';

interface ModuleFormProps {
  module?: Module;
  onClose: () => void;
}

const namePlaceholder: Record<ModuleSuffix, string> = {
  CS: 'e.g. UserMgmt_CS',
  Web: 'e.g. Portal_Web',
  App: 'e.g. Mobile_App',
  UI: 'e.g. UserMgmt_UI',
  IS: 'e.g. Identity_IS',
  BL: 'e.g. Pricing_BL',
};

export default function ModuleForm({ module, onClose }: ModuleFormProps) {
  const { addModule, updateModule } = useArchitectureStore();
  const [name, setName] = useState(module?.name ?? '');
  const [suffix, setSuffix] = useState<ModuleSuffix>(module?.suffix ?? 'CS');
  const [description, setDescription] = useState(module?.description ?? '');
  const [notes, setNotes] = useState(module?.notes ?? '');
  const [entities, setEntities] = useState<string[]>(module?.ownedEntities ?? []);
  const [entityInput, setEntityInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(module?.checklistItems ?? []);
  const nameValidation = validateModuleName(name);
  const derivedInfo = deriveLayerAndTrack(suffix, name);
  const isSaveDisabled = !name || !nameValidation.valid;

  useEffect(() => {
    if (!module) {
      setChecklistItems(getDefaultChecklist(suffix));
    }
  }, [suffix, module]);

  const handleSubmit = () => {
    if (isSaveDisabled) return;
    const { layer, track } = deriveLayerAndTrack(suffix, name);
    const moduleData = { name, suffix, layer, track, description, ownedEntities: entities, dependsOn: module?.dependsOn ?? [], notes, position: module?.position ?? { x: 200, y: 200 }, checklistItems };
    if (module) {
      updateModule(module.id, moduleData);
    } else {
      addModule(moduleData);
    }
    onClose();
  };

  const addEntity = () => {
    if (entityInput.trim() && !entities.includes(entityInput.trim())) {
      setEntities([...entities, entityInput.trim()]);
      setEntityInput('');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-700 shadow-2xl z-[100] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg">{module ? 'Edit Module' : 'Add Module'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
      </div>

      {/* A) Required fields hint banner */}
      <div className="px-5 pt-3 pb-1">
        <p className="text-xs text-gray-500 bg-gray-800 rounded px-3 py-2 border border-gray-700">
          <span className="text-red-400">*</span> Required fields. Module Name must follow{' '}
          <code className="text-gray-300">PascalCase_Suffix</code> convention.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          {/* B) Red asterisk on required field */}
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Module Name <span className="text-red-400">*</span>
          </label>
          {/* C) Placeholder updates with selected suffix */}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={namePlaceholder[suffix]}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
          />
          {/* D) Three-state validation hint */}
          {!name ? (
            <p className="text-gray-500 text-xs mt-1">
              Format: <code className="text-gray-400">PascalCase_Suffix</code> — e.g.{' '}
              <code className="text-gray-400">UserMgmt_CS</code>,{' '}
              <code className="text-gray-400">Portal_Web</code>
            </p>
          ) : nameValidation.valid ? (
            <p className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
              <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-emerald-500/10 text-emerald-400">
                <Check size={9} strokeWidth={3} />
              </span>
              Valid module name
            </p>
          ) : (
            <p className="text-red-400 text-xs mt-1">✗ {nameValidation.error}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Module Type</label>
          <div className="relative">
            <select value={suffix} onChange={e => setSuffix(e.target.value as ModuleSuffix)} className="w-full appearance-none bg-gray-800 text-white pl-3 pr-9 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm">
              {(['Web', 'App', 'CS', 'UI', 'IS', 'BL'] as ModuleSuffix[]).map(s => (
                <option key={s} value={s}>_{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-xs text-gray-400 space-y-1">
          <div className="flex justify-between"><span>Layer:</span><span className="text-white font-medium">{derivedInfo.layer}</span></div>
          <div className="flex justify-between"><span>Track:</span><span className="text-white font-medium">{derivedInfo.track}</span></div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm resize-none" placeholder="What does this module do?" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Owned Entities</label>
          <div className="flex gap-2 mb-2">
            <input value={entityInput} onChange={e => setEntityInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEntity()} placeholder="EntityName" className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm" />
            <button onClick={addEntity} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"><Plus size={14} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entities.map(e => (
              <span key={e} className="flex items-center gap-1 bg-gray-700 text-white text-xs px-2 py-1 rounded">
                {e}
                <button onClick={() => setEntities(entities.filter(x => x !== e))} className="text-gray-400 hover:text-red-400"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm resize-none" placeholder="Architecture notes, pagination info, etc." />
        </div>
        <div className="border-t border-gray-700 pt-4">
          <ModuleChecklist items={checklistItems} onChange={setChecklistItems} />
        </div>
      </div>
      <div className="px-5 py-4 border-t border-gray-700 flex gap-3">
        <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm transition-colors">Cancel</button>
        {/* E) Tooltip explains why Save is disabled */}
        <button
          onClick={handleSubmit}
          disabled={isSaveDisabled}
          title={!name ? 'Enter a module name to continue' : !nameValidation.valid ? 'Fix the module name format first' : ''}
          className={`flex-1 bg-blue-600 text-white py-2 rounded text-sm transition-colors font-semibold ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}
        >
          {module ? 'Save Changes' : 'Add Module'}
        </button>
      </div>
    </div>
  );
}
