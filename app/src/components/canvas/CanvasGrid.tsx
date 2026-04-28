'use client';

const LAYERS = [
  { name: 'END-USER', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.05)' },
  { name: 'CORE', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.05)' },
  { name: 'FOUNDATION', color: '#10B981', bgColor: 'rgba(16,185,129,0.05)' },
];

const TRACKS = ['UI Modules Track', 'Services / Logic Track'];

export default function CanvasGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Track headers */}
      <div className="absolute top-0 left-0 right-0 flex" style={{ height: 30, marginLeft: 120 }}>
        {TRACKS.map((track, i) => (
          <div key={i} className="flex-1 flex items-center justify-center text-xs font-semibold text-gray-400 border-b border-gray-700" style={{ borderLeft: i === 0 ? 'none' : '1px solid #374151' }}>
            {track}
          </div>
        ))}
      </div>
      {/* Layer rows */}
      <div className="absolute left-0 right-0" style={{ top: 30, bottom: 0, display: 'flex', flexDirection: 'column' }}>
        {LAYERS.map((layer, i) => (
          <div key={i} className="flex flex-1 relative" style={{ borderBottom: i < LAYERS.length - 1 ? '1px solid #374151' : 'none' }}>
            {/* Layer label */}
            <div className="w-[120px] flex items-center justify-center flex-shrink-0 border-r border-gray-700">
              <span className="text-xs font-bold tracking-wider" style={{ color: layer.color, writingMode: 'vertical-lr' as const, transform: 'rotate(180deg)' }}>
                {layer.name}
              </span>
            </div>
            {/* UI track */}
            <div className="flex-1" style={{ backgroundColor: layer.bgColor, borderRight: '1px solid #374151' }} />
            {/* Service track */}
            <div className="flex-1" style={{ backgroundColor: layer.bgColor }} />
          </div>
        ))}
      </div>
    </div>
  );
}
