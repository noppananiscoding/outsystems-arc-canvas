'use client';

import { useState } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { useArchitectureStore } from '@/store/architecture-store';
import AISettingsModal from './AISettingsModal';

export default function AIModeToggle() {
  const { aiMode, aiApiKey, setAiMode } = useArchitectureStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = () => {
    if (!aiMode) {
      aiApiKey.trim() ? setAiMode(true) : setShowSettings(true);
    } else {
      setAiMode(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleToggle}
          title={aiMode ? 'Disable AI Mode' : 'Enable AI Mode'}
          className="flex items-center gap-1.5 cursor-pointer select-none"
        >
          <Sparkles size={14} className={aiMode ? 'text-indigo-400' : 'text-gray-500'} />
          <span className={`text-xs font-medium ${aiMode ? 'text-indigo-300' : 'text-gray-500'}`}>AI</span>
          <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${aiMode ? 'bg-indigo-600' : 'bg-gray-600'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${aiMode ? 'translate-x-4' : 'translate-x-1'}`} />
          </div>
        </button>

        {aiMode && (
          <button
            onClick={() => setShowSettings(true)}
            title="AI Settings"
            className="text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-gray-700"
          >
            <Settings size={13} />
          </button>
        )}
      </div>

      <AISettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSaved={() => setShowSettings(false)}
      />
    </>
  );
}
