import { v4 as uuidv4 } from 'uuid';
import { Module, Dependency, ModuleSuffix, LayerType } from '@/types/architecture';
import { validateModuleName, deriveLayerAndTrack } from '@/lib/module-utils';
import { isDependencyAllowed } from '@/lib/validation';
import { getDefaultChecklist } from '@/lib/checklist-utils';

const VALID_SUFFIXES = new Set<string>(['Web', 'App', 'CS', 'UI', 'IS', 'BL']);

const MAX_MODULES = 25;

interface GeneratedModule {
  name: string;
  suffix: string;
  description: string;
  ownedEntities: string[];
  notes: string;
}

interface GeneratedDep {
  from: string;
  to: string;
}

interface RawArchitecture {
  modules: GeneratedModule[];
  dependencies: GeneratedDep[];
}

export interface ParsedArchitecture {
  modules: Module[];
  dependencies: Dependency[];
  warnings: string[];
  errors: string[];
}

// ─── Runtime type guards ──────────────────────────────────────────────────────

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isGeneratedModule(val: unknown): val is GeneratedModule {
  if (!isRecord(val)) return false;
  return (
    typeof val.name === 'string' &&
    typeof val.suffix === 'string' &&
    typeof val.description === 'string' &&
    Array.isArray(val.ownedEntities) &&
    typeof val.notes === 'string'
  );
}

function isGeneratedDep(val: unknown): val is GeneratedDep {
  if (!isRecord(val)) return false;
  return typeof val.from === 'string' && typeof val.to === 'string';
}

function isRawArchitecture(val: unknown): val is RawArchitecture {
  if (!isRecord(val)) return false;
  if (!Array.isArray(val.modules) || !Array.isArray(val.dependencies)) return false;
  return true;
}

// ─── Auto-layout ─────────────────────────────────────────────────────────────

const LAYER_Y: Record<LayerType, number> = {
  'end-user': 80,
  'core': 300,
  'foundation': 520,
};

function autoPosition(
  modules: Module[]
): void {
  const counters: Record<LayerType, number> = { 'end-user': 0, 'core': 0, 'foundation': 0 };
  for (const m of modules) {
    m.position = {
      x: 100 + counters[m.layer] * 240,
      y: LAYER_Y[m.layer],
    };
    counters[m.layer]++;
  }
}

// ─── Attempt to fix a bad module name by appending the correct suffix ────────

function attemptNameFix(name: string, suffix: string): string | null {
  // If name already has a known suffix pattern but wrong capitalisation, try fixing
  const base = name.replace(/_(Web|App|CS|UI|IS|BL)$/i, '').trim();
  if (!base) return null;

  // Ensure PascalCase base
  const fixedBase = base.charAt(0).toUpperCase() + base.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  if (!fixedBase) return null;

  const fixedSuffix = VALID_SUFFIXES.has(suffix) ? suffix : null;
  if (!fixedSuffix) return null;

  const candidate = `${fixedBase}_${fixedSuffix}`;
  return validateModuleName(candidate).valid ? candidate : null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseAndValidateAIOutput(raw: unknown): ParsedArchitecture {
  const warnings: string[] = [];
  const errors: string[] = [];
  const modules: Module[] = [];
  const seenNames = new Set<string>();

  if (!isRawArchitecture(raw)) {
    errors.push('AI response is not a valid architecture object with modules and dependencies arrays.');
    return { modules: [], dependencies: [], warnings, errors };
  }

  // ─ Process modules ──────────────────────────────────────────────────────────
  const rawModules = raw.modules.slice(0, MAX_MODULES + 5); // allow slight over for truncation msg
  if (raw.modules.length > MAX_MODULES) {
    warnings.push(`Architecture truncated to ${MAX_MODULES} modules (AI generated ${raw.modules.length}).`);
  }

  for (const rawMod of rawModules) {
    if (modules.length >= MAX_MODULES) break;

    if (!isGeneratedModule(rawMod)) {
      warnings.push(`Skipped a malformed module entry (missing required fields).`);
      continue;
    }

    let finalName = rawMod.name.trim();

    // Validate naming convention
    if (!validateModuleName(finalName).valid) {
      // Attempt auto-fix
      const fixed = attemptNameFix(finalName, rawMod.suffix);
      if (fixed) {
        warnings.push(`Module name "${finalName}" was auto-corrected to "${fixed}".`);
        finalName = fixed;
      } else {
        errors.push(`Module "${rawMod.name}" has an invalid name and could not be auto-fixed — skipped.`);
        continue;
      }
    }

    // Duplicate check
    if (seenNames.has(finalName)) {
      warnings.push(`Duplicate module name "${finalName}" was removed.`);
      continue;
    }
    seenNames.add(finalName);

    const suffix = finalName.split('_').pop() as ModuleSuffix;
    const { layer, track } = deriveLayerAndTrack(suffix, finalName);

    const ownedEntities = Array.isArray(rawMod.ownedEntities)
      ? rawMod.ownedEntities
          .filter((e): e is string => typeof e === 'string')
          .map(e => e.trim())
          .filter(Boolean)
      : [];

    modules.push({
      id: uuidv4(),
      name: finalName,
      suffix,
      layer,
      track,
      description: typeof rawMod.description === 'string' ? rawMod.description.trim() : '',
      ownedEntities,
      dependsOn: [],
      notes: typeof rawMod.notes === 'string' ? rawMod.notes.trim() : '',
      position: { x: 0, y: 0 }, // will be set by autoPosition
      checklistItems: getDefaultChecklist(suffix),
    });
  }

  // Auto-layout positions
  autoPosition(modules);

  // Build name → id map for dependency resolution
  const nameToId = new Map<string, string>(modules.map(m => [m.name, m.id]));

  // ─ Process dependencies ─────────────────────────────────────────────────────
  const dependencies: Dependency[] = [];
  const seenDepPairs = new Set<string>();

  for (const rawDep of raw.dependencies) {
    if (!isGeneratedDep(rawDep)) {
      warnings.push(`Skipped a malformed dependency entry.`);
      continue;
    }

    const fromName = rawDep.from.trim();
    const toName = rawDep.to.trim();
    const fromId = nameToId.get(fromName);
    const toId = nameToId.get(toName);

    if (!fromId) {
      warnings.push(`Dependency skipped: source module "${fromName}" not found.`);
      continue;
    }
    if (!toId) {
      warnings.push(`Dependency skipped: target module "${toName}" not found.`);
      continue;
    }

    // Deduplicate
    const pairKey = `${fromId}→${toId}`;
    if (seenDepPairs.has(pairKey)) {
      warnings.push(`Duplicate dependency "${fromName}" → "${toName}" removed.`);
      continue;
    }
    seenDepPairs.add(pairKey);

    const sourceModule = modules.find(m => m.id === fromId)!;
    const targetModule = modules.find(m => m.id === toId)!;

    const { allowed, reason } = isDependencyAllowed(sourceModule, targetModule);
    if (!allowed) {
      warnings.push(`Forbidden dependency "${fromName}" → "${toName}" removed: ${reason ?? 'rule violation'}.`);
      continue;
    }

    // Update the module's dependsOn array
    sourceModule.dependsOn.push(toId);

    dependencies.push({
      id: uuidv4(),
      sourceId: fromId,
      targetId: toId,
      isValid: true,
    });
  }

  return { modules, dependencies, warnings, errors };
}
