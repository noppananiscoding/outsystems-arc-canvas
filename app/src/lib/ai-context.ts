import { Module, ValidationViolation } from '@/types/architecture';

const MAX_MODULES = 30;
const MAX_VIOLATIONS = 15;

/**
 * Serializes the current canvas state into a compact plain-text format
 * optimised for LLM context windows.
 */
export function serializeCanvasContext(
  modules: Module[],
  violations: ValidationViolation[],
  projectName: string
): string {
  const lines: string[] = [];

  lines.push(`PROJECT: ${projectName}`);

  // --- Modules ---
  const moduleList = modules.slice(0, MAX_MODULES);
  lines.push(`MODULES (${modules.length}):`);

  for (const m of moduleList) {
    const deps = m.dependsOn
      .map(id => modules.find(x => x.id === id)?.name ?? id)
      .filter(Boolean);

    const depsStr = deps.length > 0 ? `Deps: ${deps.join(', ')}` : 'Deps: none';
    const entitiesStr = `Entities: ${m.ownedEntities.length}`;

    lines.push(
      `  - ${m.name} [_${m.suffix}] | Layer: ${m.layer} | Track: ${m.track} | ${entitiesStr} | ${depsStr}`
    );
  }

  if (modules.length > MAX_MODULES) {
    lines.push(`  ... and ${modules.length - MAX_MODULES} more modules (truncated)`);
  }

  // --- Violations ---
  const violationList = violations.slice(0, MAX_VIOLATIONS);
  lines.push(`\nCURRENT VIOLATIONS (${violations.length}):`);

  if (violationList.length === 0) {
    lines.push('  None — architecture is valid!');
  } else {
    for (const v of violationList) {
      const mod = v.moduleId ? modules.find(m => m.id === v.moduleId)?.name : undefined;
      const modStr = mod ? ` on ${mod}` : '';
      lines.push(`  - ${v.severity}: ${v.rule}${modStr}: ${v.message}`);
    }

    if (violations.length > MAX_VIOLATIONS) {
      lines.push(`  ... and ${violations.length - MAX_VIOLATIONS} more violations (truncated)`);
    }
  }

  return lines.join('\n');
}
