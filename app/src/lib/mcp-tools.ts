import { v4 as uuidv4 } from 'uuid';
import { Module, Dependency, ModuleSuffix, ValidationViolation } from '@/types/architecture';
import { deriveLayerAndTrack, validateModuleName } from '@/lib/module-utils';
import { isDependencyAllowed, runValidation } from '@/lib/validation';
import { detectAntiPatterns } from '@/lib/anti-patterns';
import { SessionState, getSession, putSession } from '@/lib/session-store';
import { getDefaultChecklist } from '@/lib/checklist-utils';

function saveState(sessionId: string, state: SessionState): void {
  putSession(sessionId, {
    ...state,
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: 'agent',
  });
}

function revalidate(modules: Module[], dependencies: Dependency[]): ValidationViolation[] {
  return [...runValidation(modules, dependencies), ...detectAntiPatterns(modules, dependencies)];
}

// ─── Tool: list_modules ─────────────────────────────────────────────────────

export function listModules(sessionId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };
  return {
    projectName: state.projectName,
    moduleCount: state.modules.length,
    modules: state.modules.map(m => ({
      id: m.id, name: m.name, suffix: m.suffix, layer: m.layer, track: m.track,
      description: m.description, ownedEntities: m.ownedEntities,
    })),
  };
}

// ─── Tool: get_architecture ──────────────────────────────────────────────────

export function getArchitecture(sessionId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };
  const violations = revalidate(state.modules, state.dependencies);
  return {
    projectName: state.projectName,
    modules: state.modules,
    dependencies: state.dependencies,
    violations,
    lastUpdatedAt: state.lastUpdatedAt,
    lastUpdatedBy: state.lastUpdatedBy,
  };
}

// ─── Tool: add_module ────────────────────────────────────────────────────────

export function addModule(
  sessionId: string,
  name: string,
  description: string,
  ownedEntities: string[],
  notes: string,
): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };

  const nameCheck = validateModuleName(name);
  if (!nameCheck.valid) return { error: nameCheck.error };

  if (state.modules.some(m => m.name === name)) {
    return { error: `Module "${name}" already exists` };
  }

  const suffix = name.split('_').pop() as ModuleSuffix;
  const { layer, track } = deriveLayerAndTrack(suffix, name);

  const newModule: Module = {
    id: uuidv4(), name, suffix, layer, track, description,
    ownedEntities, dependsOn: [], notes,
    position: { x: 100 + state.modules.length * 50, y: 100 },
    checklistItems: getDefaultChecklist(suffix),
  };

  state.modules = [...state.modules, newModule];
  saveState(sessionId, state);

  return { ok: true, module: { id: newModule.id, name, suffix, layer, track } };
}

// ─── Tool: update_module ─────────────────────────────────────────────────────

export function updateModule(
  sessionId: string,
  moduleId: string,
  updates: { description?: string; ownedEntities?: string[]; notes?: string },
): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };

  const idx = state.modules.findIndex(m => m.id === moduleId);
  if (idx === -1) return { error: `Module "${moduleId}" not found` };

  state.modules = state.modules.map((m, i) => i === idx ? { ...m, ...updates } : m);
  saveState(sessionId, state);

  return { ok: true, moduleId, updated: Object.keys(updates) };
}

// ─── Tool: delete_module ─────────────────────────────────────────────────────

export function deleteModule(sessionId: string, moduleId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };

  const mod = state.modules.find(m => m.id === moduleId);
  if (!mod) return { error: `Module "${moduleId}" not found` };

  state.modules = state.modules.filter(m => m.id !== moduleId);
  state.dependencies = state.dependencies.filter(d => d.sourceId !== moduleId && d.targetId !== moduleId);
  saveState(sessionId, state);

  return { ok: true, deleted: mod.name };
}

// ─── Tool: add_dependency ────────────────────────────────────────────────────

export function addDependency(
  sessionId: string,
  sourceName: string,
  targetName: string,
): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };

  const source = state.modules.find(m => m.name === sourceName);
  const target = state.modules.find(m => m.name === targetName);
  if (!source) return { error: `Source module "${sourceName}" not found` };
  if (!target) return { error: `Target module "${targetName}" not found` };

  const alreadyExists = state.dependencies.some(d => d.sourceId === source.id && d.targetId === target.id);
  if (alreadyExists) return { error: 'Dependency already exists' };

  const check = isDependencyAllowed(source, target);
  const newDep: Dependency = {
    id: uuidv4(), sourceId: source.id, targetId: target.id,
    isValid: check.allowed, violationReason: check.reason,
  };

  state.dependencies = [...state.dependencies, newDep];
  state.modules = state.modules.map(m =>
    m.id === source.id ? { ...m, dependsOn: [...m.dependsOn, target.id] } : m
  );
  saveState(sessionId, state);

  return {
    ok: true,
    dependencyId: newDep.id,
    isValid: check.allowed,
    ...(check.reason ? { warning: check.reason } : {}),
  };
}

// ─── Tool: delete_dependency ─────────────────────────────────────────────────

export function deleteDependency(sessionId: string, dependencyId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };

  const dep = state.dependencies.find(d => d.id === dependencyId);
  if (!dep) return { error: `Dependency "${dependencyId}" not found` };

  state.dependencies = state.dependencies.filter(d => d.id !== dependencyId);
  state.modules = state.modules.map(m =>
    m.id === dep.sourceId
      ? { ...m, dependsOn: m.dependsOn.filter(did => did !== dep.targetId) }
      : m
  );
  saveState(sessionId, state);

  return { ok: true, deleted: dependencyId };
}

// ─── Tool: validate_architecture ─────────────────────────────────────────────

export function validateArchitecture(sessionId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };

  const violations = revalidate(state.modules, state.dependencies);
  const errors = violations.filter(v => v.severity === 'ERROR');
  const warnings = violations.filter(v => v.severity === 'WARN');

  return {
    score: Math.max(0, 100 - errors.length * 15 - warnings.length * 5),
    totalViolations: violations.length,
    errors: errors.length,
    warnings: warnings.length,
    violations: violations.map(v => ({
      severity: v.severity, rule: v.rule, message: v.message,
    })),
  };
}

// ─── Tool: get_violations ────────────────────────────────────────────────────

export function getViolations(sessionId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };
  const violations = revalidate(state.modules, state.dependencies);
  return { violations };
}

// ─── Tool: set_project_name ──────────────────────────────────────────────────

export function setProjectName(sessionId: string, name: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };
  state.projectName = name;
  saveState(sessionId, state);
  return { ok: true, projectName: name };
}

// ─── Tool: clear_canvas ──────────────────────────────────────────────────────

export function clearCanvas(sessionId: string): object {
  const state = getSession(sessionId);
  if (!state) return { error: 'Session not found' };
  const count = state.modules.length;
  state.modules = [];
  state.dependencies = [];
  saveState(sessionId, state);
  return { ok: true, removedModules: count };
}

// ─── Resource: architecture://summary ───────────────────────────────────────

export function getArchitectureSummary(sessionId: string): string {
  const state = getSession(sessionId);
  if (!state) return 'Session not found';

  const violations = revalidate(state.modules, state.dependencies);
  const byLayer = { 'end-user': [] as string[], core: [] as string[], foundation: [] as string[] };
  for (const m of state.modules) byLayer[m.layer]?.push(m.name);

  const lines = [
    `# Architecture: ${state.projectName}`,
    `Last updated: ${state.lastUpdatedAt} (by ${state.lastUpdatedBy})`,
    '',
    `## Modules (${state.modules.length} total)`,
    `- End-User: ${byLayer['end-user'].join(', ') || '(none)'}`,
    `- Core: ${byLayer.core.join(', ') || '(none)'}`,
    `- Foundation: ${byLayer.foundation.join(', ') || '(none)'}`,
    '',
    `## Dependencies: ${state.dependencies.length}`,
    `## Violations: ${violations.length} (${violations.filter(v => v.severity === 'ERROR').length} errors, ${violations.filter(v => v.severity === 'WARN').length} warnings)`,
  ];

  if (violations.length > 0) {
    lines.push('', '## Issues');
    for (const v of violations) {
      lines.push(`- [${v.severity}] ${v.message}`);
    }
  }

  return lines.join('\n');
}
