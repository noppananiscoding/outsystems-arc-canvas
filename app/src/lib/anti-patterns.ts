import { Module, Dependency, ValidationViolation } from '@/types/architecture';
import { v4 as uuidv4 } from 'uuid';

export function detectAntiPatterns(modules: Module[], dependencies: Dependency[]): ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  const moduleMap = new Map(modules.map(m => [m.id, m]));

  // 1. God Module
  for (const m of modules) {
    if (m.suffix === 'CS' && m.ownedEntities.length > 8) {
      violations.push({ id: uuidv4(), severity: 'WARN', moduleId: m.id, rule: 'GOD_MODULE', message: `${m.name} owns ${m.ownedEntities.length} entities (>8). Consider splitting.` });
    }
  }

  // 2. Bypassing Core Services
  for (const dep of dependencies) {
    const source = moduleMap.get(dep.sourceId);
    const target = moduleMap.get(dep.targetId);
    if (source?.layer === 'end-user' && target?.layer === 'foundation' && target?.track === 'service') {
      violations.push({ id: uuidv4(), severity: 'INFO', moduleId: dep.sourceId, dependencyId: dep.id, rule: 'BYPASSING_CORE', message: `${source.name} directly depends on Foundation module ${target?.name}. Verify no business logic is bypassed.` });
    }
  }

  // 3. Missing Foundation dependency for CS modules
  for (const m of modules) {
    if (m.suffix === 'CS') {
      const hasFdnDep = dependencies.some(d => {
        if (d.sourceId !== m.id) return false;
        const target = moduleMap.get(d.targetId);
        return target?.layer === 'foundation';
      });
      if (!hasFdnDep) {
        violations.push({ id: uuidv4(), severity: 'WARN', moduleId: m.id, rule: 'MISSING_FOUNDATION_DEP', message: `${m.name} has no Foundation dependency. Every CS module should reference at least one Foundation module.` });
      }
    }
  }

  // 4. God Canvas
  if (modules.length > 20) {
    violations.push({ id: uuidv4(), severity: 'WARN', rule: 'GOD_CANVAS', message: `Canvas has ${modules.length} modules (>20). Consider splitting into sub-architectures.` });
  }

  // 5. Empty Module
  for (const m of modules) {
    if (!m.description && m.ownedEntities.length === 0 && m.dependsOn.length === 0) {
      violations.push({ id: uuidv4(), severity: 'INFO', moduleId: m.id, rule: 'EMPTY_MODULE', message: `${m.name} has no description, entities, or dependencies.` });
    }
  }

  // 6. Unbounded Queries warning for CS modules
  for (const m of modules) {
    if (m.suffix === 'CS' && m.ownedEntities.length > 0 && !m.notes.toLowerCase().includes('pagination') && !m.description.toLowerCase().includes('pagination')) {
      violations.push({ id: uuidv4(), severity: 'INFO', moduleId: m.id, rule: 'UNBOUNDED_QUERIES', message: `${m.name} owns entities but no pagination mention found in description/notes.` });
    }
  }

  return violations;
}
