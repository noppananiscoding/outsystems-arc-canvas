export type LayerType = 'end-user' | 'core' | 'foundation';
export type TrackType = 'ui' | 'service';
export type ModuleSuffix = 'Web' | 'App' | 'CS' | 'UI' | 'IS' | 'BL';
export type ViolationSeverity = 'ERROR' | 'WARN' | 'INFO';

export interface Module {
  id: string;
  name: string;
  suffix: ModuleSuffix;
  layer: LayerType;
  track: TrackType;
  description: string;
  ownedEntities: string[];
  dependsOn: string[];
  notes: string;
  position: { x: number; y: number };
  checklistItems: ChecklistItem[];
}

export interface Dependency {
  id: string;
  sourceId: string;
  targetId: string;
  isValid: boolean;
  violationReason?: string;
}

export interface ValidationViolation {
  id: string;
  severity: ViolationSeverity;
  moduleId?: string;
  dependencyId?: string;
  rule: string;
  message: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'cs' | 'end-user' | 'integration';
}

export interface ArchitectureFile {
  version: string;
  exportedAt: string;
  projectName: string;
  modules: Module[];
  dependencies: Dependency[];
}
