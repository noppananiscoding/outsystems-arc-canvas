'use client';

import { useState } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { useArchitectureStore } from '@/store/architecture-store';
import AISettingsModal from './AISettingsModal';

interface AIModeToggleProps {
  onOpenCopilot: () => void;
}

export default function AIModeToggle({ onOpenCopilot }: AIModeToggleProps) {
  const { aiMode, aiApiKey, setAiMode } = useArchitectureStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = () => {
    if (!aiMode) {
      // Turning ON
      if (aiApiKey.trim()) {
        // Key already configured — enable directly
        setAiMode(true);
      } else {
        // No key yet — open settings modal
        setShowSettings(true);
      }
    } else {
      // Turning OFF
      setAiMode(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Toggle button */}
        <button
          onClick={handleToggle}
          title={aiMode ? 'Disable AI Mode' : 'Enable AI Mode'}
          className="flex items-center gap-1.5 cursor-pointer select-none"
        >
          <Sparkles
            size={14}
            className={aiMode ? 'text-indigo-400' : 'text-gray-500'}
          />
          <span className={`text-xs font-medium ${aiMode ? 'text-indigo-300' : 'text-gray-500'}`}>
            AI
          </span>
          {/* Custom toggle switch */}
          <div
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              aiMode ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                aiMode ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </div>
        </button>

        {/* Gear icon — opens settings (always shown when AI mode is on) */}
        {aiMode && (
          <>
            <button
              onClick={() => setShowSettings(true)}
              title="AI Settings"
              className="text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Settings size={13} />
            </button>

            {/* AI Copilot open button */}
            <button
              onClick={onOpenCopilot}
              title="Open AI Copilot (A)"
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium"
            >
              <Sparkles size={11} />
              Copilot
            </button>
          </>
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
