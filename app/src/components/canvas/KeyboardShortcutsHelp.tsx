'use client';

interface Props {
  onClose: () => void;
}

const shortcuts = [
  { keys: ['N'], description: 'New module' },
  { keys: ['E'], description: 'Edit selected module' },
  { keys: ['Del'], description: 'Delete selected module' },
  { keys: ['G'], description: 'Open Architecture Guidelines' },
  { keys: ['Esc'], description: 'Close panel' },
  { keys: ['Ctrl', 'S'], description: 'Export architecture' },
  { keys: ['Ctrl', '⇧', 'V'], description: 'Validate architecture' },
  { keys: ['?'], description: 'Toggle this help' },
];

export default function KeyboardShortcutsHelp({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-96 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{description}</span>
              <div className="flex gap-1">
                {keys.map(k => (
                  <kbd
                    key={k}
                    className="bg-gray-800 border border-gray-600 text-gray-200 text-xs px-2 py-0.5 rounded font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-4 text-center">
          Shortcuts are disabled while typing in a field
        </p>
      </div>
    </div>
  );
}
