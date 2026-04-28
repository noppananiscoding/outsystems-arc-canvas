# Claude.md — AI Assistant Context

> This file provides context for AI assistants (GitHub Copilot, Claude, etc.) working on this project.

---

## What This Project Is

An **interactive OutSystems Architecture Canvas Simulator** built with Next.js.  
It allows Solution Architects to **visually design, validate, and export** OutSystems module architectures before implementing in OutSystems O11.

---

## Key Domain Concepts

### The Canvas

A **3-layer × 2-track grid**:

```
┌──────────────┬──────────────────────┬──────────────────────┐
│    LAYER     │   UI Modules Track   │ Services/Logic Track │
├──────────────┼──────────────────────┼──────────────────────┤
│  END-USER    │  _Web, _App          │  (none allowed)      │
├──────────────┼──────────────────────┼──────────────────────┤
│  CORE        │  _UI                 │  _CS                 │
├──────────────┼──────────────────────┼──────────────────────┤
│  FOUNDATION  │  StyleGuide_UI       │  _IS, _BL            │
└──────────────┴──────────────────────┴──────────────────────┘
```

### Module Types

- `_Web` — End-User Reactive Web App
- `_App` — End-User Mobile App  
- `_CS` — Core Service (owns entities + business logic)
- `_UI` — Reusable UI Component Library
- `_IS` — Integration/Foundation Service
- `_BL` — Business Logic Library (no DB, no UI)

### Dependency Rules

**ALLOWED:**
- End-User → Core Service ✅
- End-User → Core UI ✅
- End-User → Foundation ✅
- Core Service → Foundation ✅
- Core UI → Core Service ✅
- Core UI → Foundation UI ✅

**FORBIDDEN (violations):**
- Foundation → Core ❌ (upward)
- Foundation → End-User ❌ (upward)
- Core → End-User ❌ (upward)
- Core CS A → Core CS B ❌ (horizontal coupling)
- End-User A → End-User B ❌ (horizontal coupling)

### Naming Conventions

| Suffix | Correct Example |
|--------|----------------|
| `_Web` | `Portal_Web`, `Admin_Web` |
| `_App` | `Mobile_App`, `Field_App` |
| `_CS` | `UserMgmt_CS`, `Orders_CS` |
| `_UI` | `UserMgmt_UI`, `StyleGuide_UI` |
| `_IS` | `Identity_IS`, `Integration_IS` |
| `_BL` | `Pricing_BL`, `TaxCalc_BL` |

Pattern: `{PascalCaseDomain}_{Suffix}` — must match regex `/^[A-Z][a-zA-Z0-9]*_(Web|App|CS|UI|IS|BL)$/`

### Anti-Patterns (detect and warn)

1. **God Module** — One CS owns too many entities (>8 entity types)
2. **Bypassing Core Services** — End-User module directly aggregates Core entities
3. **Upward Dependencies** — Foundation/Core referencing higher layers
4. **Unbounded Queries** — List actions without pagination
5. **Hardcoded Configuration** — Config values not in SystemConfig/FeatureFlag
6. **Synchronous Notifications** — Blocking notification send in main flow
7. **Logic in Screen Preparation** — Business logic inside Preparation actions
8. **Direct Inter-CS Entity Sharing** — CS module references another CS's entities

---

## TypeScript Types (Reference)

```typescript
type LayerType = 'end-user' | 'core' | 'foundation';
type TrackType = 'ui' | 'service';
type ModuleSuffix = 'Web' | 'App' | 'CS' | 'UI' | 'IS' | 'BL';

interface Module {
  id: string;
  name: string;           // e.g. "UserMgmt_CS"
  suffix: ModuleSuffix;
  layer: LayerType;       // derived from suffix
  track: TrackType;       // derived from suffix
  description: string;
  ownedEntities: string[];
  dependsOn: string[];    // array of module IDs
  notes: string;
  position?: { x: number; y: number };
  checklistItems?: ChecklistItem[];
}

interface Dependency {
  id: string;
  sourceId: string;  // module ID
  targetId: string;  // module ID
  isValid: boolean;
  violationReason?: string;
}

interface ValidationViolation {
  id: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  moduleId?: string;
  dependencyId?: string;
  rule: string;
  message: string;
}

interface ArchitectureFile {
  version: string;          // "1.0"
  exportedAt: string;       // ISO datetime
  projectName: string;
  modules: Module[];
  dependencies: Dependency[];
  metadata?: Record<string, unknown>;
}
```

---

## State Management (Zustand)

```typescript
// Main architecture store
interface ArchitectureStore {
  projectName: string;
  modules: Module[];
  dependencies: Dependency[];
  violations: ValidationViolation[];
  
  // Actions
  addModule: (module: Omit<Module, 'id'>) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  addDependency: (sourceId: string, targetId: string) => void;
  deleteDependency: (id: string) => void;
  validateAll: () => void;
  importFromFile: (file: ArchitectureFile) => void;
  exportToFile: () => ArchitectureFile;
}
```

---

## Layer/Track Derivation Logic

```typescript
function deriveLayerAndTrack(suffix: ModuleSuffix): { layer: LayerType; track: TrackType } {
  switch (suffix) {
    case 'Web': case 'App': return { layer: 'end-user', track: 'ui' };
    case 'CS':              return { layer: 'core',     track: 'service' };
    case 'UI':              return { layer: 'core',     track: 'ui' };   // (Foundation UI is special case)
    case 'IS': case 'BL':  return { layer: 'foundation', track: 'service' };
  }
}
// Note: StyleGuide_UI is Foundation layer, UI track — handle as special case or allow manual override
```

---

## Validation Rules Engine

```typescript
// Dependency validity check
function isDependencyAllowed(source: Module, target: Module): { allowed: boolean; reason?: string } {
  const layerOrder = { 'end-user': 2, 'core': 1, 'foundation': 0 };
  
  // Upward dependency check
  if (layerOrder[source.layer] < layerOrder[target.layer]) {
    return { allowed: false, reason: 'Upward dependency violates canvas rules' };
  }
  
  // Horizontal same-layer service coupling
  if (source.layer === target.layer && source.track === 'service' && target.track === 'service') {
    return { allowed: false, reason: 'Horizontal CS-to-CS coupling forbidden' };
  }
  
  // End-User to End-User
  if (source.layer === 'end-user' && target.layer === 'end-user') {
    return { allowed: false, reason: 'End-User to End-User dependency forbidden' };
  }
  
  return { allowed: true };
}
```

---

## Import/Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2026-04-28T15:00:00Z",
  "projectName": "My Enterprise Architecture",
  "modules": [
    {
      "id": "uuid-here",
      "name": "UserMgmt_CS",
      "suffix": "CS",
      "layer": "core",
      "track": "service",
      "description": "User Management Core Service",
      "ownedEntities": ["User", "UserProfile", "UserRole"],
      "dependsOn": ["foundation-identity-is-id"],
      "notes": ""
    }
  ],
  "dependencies": [
    {
      "id": "dep-uuid",
      "sourceId": "module-id-1",
      "targetId": "module-id-2",
      "isValid": true
    }
  ]
}
```

---

## Development Guidelines

- **App directory:** All Next.js code lives in `app/` subfolder within this project root
- **No auth required** — app is fully public, stateless on server
- **All state is client-side** — no backend API, no database
- **shadcn/ui** for all UI components — do not build custom primitives
- **React Flow** for canvas diagram rendering
- **Zustand** for state (persist to localStorage for session continuity)
- **TypeScript strict mode** — no `any` types

---

## Reference Files

| File | Purpose |
|------|---------|
| `OutSystems_Architecture_Canvas_Reference.md` | Full technical reference (source of truth) |
| `AGENT.md` | Project management, task tracking, agent roster |
| `Claude.md` | This file — AI assistant context |
