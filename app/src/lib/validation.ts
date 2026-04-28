import { Module, Dependency, ValidationViolation } from '@/types/architecture';
import { v4 as uuidv4 } from 'uuid';

const LAYER_ORDER: Record<string, number> = { 'end-user': 2, 'core': 1, 'foundation': 0 };

export function isDependencyAllowed(source: Module, target: Module): { allowed: boolean; reason?: string } {
  if (LAYER_ORDER[source.layer] < LAYER_ORDER[target.layer]) {
    return { allowed: false, reason: `Upward dependency: ${source.layer} → ${target.layer} violates canvas rules` };
  }
  if (source.layer === 'end-user' && target.layer === 'end-user') {
    return { allowed: false, reason: 'End-User to End-User horizontal dependency is forbidden' };
  }
  if (source.layer === 'core' && target.layer === 'core' && source.track === 'service' && target.track === 'service') {
    return { allowed: false, reason: 'Core CS to Core CS horizontal coupling is forbidden (use Foundation event pattern)' };
  }
  return { allowed: true };
}

export function runValidation(modules: Module[], dependencies: Dependency[]): ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  const moduleMap = new Map(modules.map(m => [m.id, m]));

  for (const dep of dependencies) {
    const source = moduleMap.get(dep.sourceId);
    const target = moduleMap.get(dep.targetId);
    if (!source || !target) continue;
    const result = isDependencyAllowed(source, target);
    if (!result.allowed) {
      violations.push({
        id: uuidv4(),
        severity: 'ERROR',
        dependencyId: dep.id,
        moduleId: dep.sourceId,
        rule: 'INVALID_DEPENDENCY',
        message: result.reason ?? 'Invalid dependency',
      });
    }
  }

  return violations;
}
