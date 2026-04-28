import { LayerType, ModuleSuffix, TrackType } from '@/types/architecture';

export function deriveLayerAndTrack(suffix: ModuleSuffix, name?: string): { layer: LayerType; track: TrackType } {
  if (name === 'StyleGuide_UI') return { layer: 'foundation', track: 'ui' };
  switch (suffix) {
    case 'Web':
    case 'App':
      return { layer: 'end-user', track: 'ui' };
    case 'CS':
      return { layer: 'core', track: 'service' };
    case 'UI':
      return { layer: 'core', track: 'ui' };
    case 'IS':
    case 'BL':
      return { layer: 'foundation', track: 'service' };
  }
}

export function validateModuleName(name: string): { valid: boolean; error?: string } {
  const pattern = /^[A-Z][a-zA-Z0-9]*_(Web|App|CS|UI|IS|BL)$/;
  if (!pattern.test(name)) {
    return { valid: false, error: 'Name must follow pattern: {PascalCase}_{Suffix} (e.g. UserMgmt_CS, Portal_Web)' };
  }
  return { valid: true };
}

export function getSuffixColor(suffix: ModuleSuffix): string {
  const colors: Record<ModuleSuffix, string> = {
    Web: 'bg-blue-500',
    App: 'bg-cyan-500',
    CS: 'bg-purple-500',
    UI: 'bg-pink-500',
    IS: 'bg-green-500',
    BL: 'bg-yellow-500',
  };
  return colors[suffix];
}

export function getLayerColor(layer: LayerType): string {
  const colors: Record<LayerType, string> = {
    'end-user': '#3B82F6',
    'core': '#8B5CF6',
    'foundation': '#10B981',
  };
  return colors[layer];
}
