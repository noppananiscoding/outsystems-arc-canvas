'use client';
import { ChecklistItem } from '@/types/architecture';

interface ModuleChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export default function ModuleChecklist({ items, onChange }: ModuleChecklistProps) {
  if (items.length === 0) return null;

  const toggle = (id: string) => {
    onChange(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const checked = items.filter(i => i.checked).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Module Checklist</h4>
        <span className="text-xs text-gray-400">{checked}/{items.length}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${(checked / items.length) * 100}%` }} />
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map(item => (
          <label key={item.id} className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggle(item.id)}
              className="mt-0.5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 flex-shrink-0"
            />
            <span className={`text-xs leading-relaxed ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
