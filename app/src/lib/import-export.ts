import { ArchitectureFile, Module, Dependency } from '@/types/architecture';

export function exportToJSON(projectName: string, modules: Module[], dependencies: Dependency[]): string {
  const file: ArchitectureFile = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projectName,
    modules,
    dependencies,
  };
  return JSON.stringify(file, null, 2);
}

export function importFromJSON(raw: string): ArchitectureFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON file');
  }
  const file = parsed as Record<string, unknown>;
  if (!file.version || !file.modules || !file.dependencies || !file.projectName) {
    throw new Error('Invalid architecture file format: missing required fields');
  }
  return parsed as ArchitectureFile;
}
