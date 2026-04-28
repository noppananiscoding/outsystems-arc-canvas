# AGENT.md — OutSystems Architecture Canvas Simulator

> **Project:** OutSystems Architecture Canvas Simulator  
> **Type:** Next.js Web Application  
> **Manager:** GitHub Copilot CLI (Project Manager Agent)  
> **Last Updated:** 2026-04-29

---

## Project Overview

A web application that simulates the **OutSystems Architecture Canvas** — an interactive design and validation tool for Solution Architects to design, visualize, and validate OutSystems module architecture **before** building in OutSystems.

No authentication required. Supports Import/Export of architecture files (JSON) for portability across machines.

---

## Architecture Reference

Source of truth: `OutSystems_Architecture_Canvas_Reference.md`

### Canvas Structure

The canvas is organized as a **3-layer × 2-track grid**:

| Layer | UI Modules Track | Services/Logic Track |
|-------|-----------------|---------------------|
| **End-User** | `_Web`, `_App` modules | _(none)_ |
| **Core** | `_UI` modules | `_CS` modules |
| **Foundation** | `StyleGuide_UI` | `_IS`, `_BL` modules |

### Module Types

| Suffix | Type | Layer |
|--------|------|-------|
| `_Web` | Reactive Web App | End-User |
| `_App` | Mobile App | End-User |
| `_CS` | Core Service (data + logic) | Core |
| `_UI` | Reusable UI Components | Core / Foundation |
| `_IS` | Integration / Foundation Service | Foundation |
| `_BL` | Business Logic Library (no DB) | Core / Foundation |

### Dependency Rules

**Allowed (✅):**
- End-User → Core Service
- End-User → Core UI
- End-User → Foundation
- Core Service → Foundation
- Core UI → Core Service
- Core UI → Foundation UI

**Forbidden (❌):**
- Foundation → Core *(upward)*
- Foundation → End-User *(upward)*
- Core → End-User *(upward)*
- Core CS A → Core CS B *(horizontal — coupling)*
- End-User A → End-User B *(horizontal — coupling)*

---

## Functional Requirements

### FR-01: Architecture Canvas View
- Interactive 3×2 grid canvas (layers × tracks)
- Modules rendered as cards within correct grid cells
- Layer and track labels clearly displayed
- Responsive layout

### FR-02: Module Management
- Add / Edit / Delete modules
- Fields: Name, Type, Layer (auto-derived), Track (auto-derived), Description, Owned Entities (list), Dependencies (list), Notes
- Naming convention validation on save (e.g., `UserMgmt_CS`, `Portal_Web`)
- Module cards display: name, type badge, dependency count, validation status

### FR-03: Dependency Visualization
- Directed arrows between module cards
- Add dependency by selecting source → target
- Delete dependency
- Color coding: green = valid, red = violation
- Dependency legend panel

### FR-04: Architecture Validation Engine
- Real-time rule validation on every change
- Validates: dependency direction, horizontal coupling, naming conventions
- Anti-pattern detection (8 patterns from reference)
- Validation report panel with severity (ERROR / WARN / INFO)
- Per-module validation score

### FR-05: Import / Export
- **Export:** Serialize full canvas state (modules, dependencies, positions, metadata) to `.json` file download
- **Import:** Load `.json` file, restore canvas state entirely
- File format versioned for forward compatibility

### FR-06: Module Inventory Checklist
- Per-module checklist (CS checklist / End-User checklist / Integration checklist)
- Track completion % per module
- Global checklist summary

### FR-07: Validation Report
- Sidebar/panel listing all violations
- Click violation → highlight offending module(s)
- Export validation report

---

## Technical Stack

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Canvas / Diagram | React Flow (`reactflow`) |
| State Management | Zustand |
| File I/O | Native browser File API |
| Icons | Lucide React |

---

## Agent Roster & Responsibilities

| Agent | Role | Status |
|-------|------|--------|
| **Project Manager** (Copilot CLI) | Requirements, delegation, coordination, QA gate | ✅ Active |
| **Next.js Developer** | Full implementation + iterative UX improvements | ✅ Complete |
| **QA Agent** | Validation, bug hunting, regression | ✅ Complete |

---

## Task Tracker

| ID | Task | Agent | Status |
|----|------|-------|--------|
| `req-analysis` | Requirements Analysis | PM | ✅ Done |
| `nextjs-scaffold` | Scaffold Next.js App | Next.js Dev | ✅ Done |
| `feature-canvas` | Architecture Canvas UI | Next.js Dev | ✅ Done |
| `feature-module-mgmt` | Module Management | Next.js Dev | ✅ Done |
| `feature-dependency` | Dependency Visualization & Validation | Next.js Dev | ✅ Done |
| `feature-validation` | Validation Engine | Next.js Dev | ✅ Done |
| `feature-import-export` | Import / Export | Next.js Dev | ✅ Done |
| `feature-checklist` | Module Inventory Checklist | Next.js Dev | ✅ Done |
| `qa-validation` | QA Validation (7 bugs found) | QA Agent | ✅ Done |
| `qa-fixes` | QA Issue Resolution (7 bugs fixed) | Next.js Dev | ✅ Done |
| `css-fix` | Tailwind v4 CSS syntax fix | PM | ✅ Done |
| `ux-required-fields` | Required fields clarity in Module Form | Next.js Dev | ✅ Done |
| `ux-keyboard-shortcuts` | Keyboard shortcuts (N/E/Del/Esc/Ctrl+S/Ctrl+Shift+V/?) | Next.js Dev | ✅ Done |
| `ux-sample-dropdown` | Sample architecture dropdown (Best Practices + Anti-Patterns) | Next.js Dev | ✅ Done |
| `ux-module-switch` | Edit panel switches module on canvas click | Next.js Dev | ✅ Done |
| `ux-delete-dependency` | Delete dependency via hover ✕ button + Del key | Next.js Dev | ✅ Done |

---

## File Structure (Target)

```
outsystems-arc-canvas/
├── AGENT.md                          ← This file
├── Claude.md                         ← AI assistant context
├── OutSystems_Architecture_Canvas_Reference.md
└── app/                              ← Next.js application
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx              ← Main canvas page
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── canvas/               ← Canvas grid & module cards
    │   │   ├── modules/              ← Module add/edit forms
    │   │   ├── validation/           ← Validation report panel
    │   │   ├── checklist/            ← Inventory checklist
    │   │   └── ui/                   ← shadcn/ui components
    │   ├── store/                    ← Zustand state stores
    │   ├── lib/
    │   │   ├── validation.ts         ← Dependency & naming rules
    │   │   ├── anti-patterns.ts      ← Anti-pattern detection
    │   │   └── import-export.ts      ← File I/O logic
    │   └── types/
    │       └── architecture.ts       ← TypeScript type definitions
```

---

## Quality Gates

### Before QA Handoff
- [ ] All 7 features implemented and functional
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Import/export roundtrip works correctly
- [ ] Dependency validation catches all 5 forbidden rule types

### QA Pass Criteria
- [ ] All functional requirements verified
- [ ] Anti-pattern detection fires correctly for all 8 patterns
- [ ] Canvas correctly rejects invalid naming conventions
- [ ] Import restores exact state
- [ ] No visual layout breaks at 1280px, 1440px, 1920px

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-28 | Project initialized, requirements analyzed, Next.js dev delegated | Project Manager |
| 2026-04-28 | Core app built: canvas, module mgmt, validation engine, import/export, checklist, 12 sample modules | Next.js Dev |
| 2026-04-28 | QA pass: 7 bugs found and fixed (arrowheads, checklist dedup, BYPASSING_CORE FP, dependsOn sync, validate toggle, import/export edge cases) | QA Agent + Next.js Dev |
| 2026-04-28 | Tailwind v4 CSS syntax fixed (`@import "tailwindcss"`) | PM |
| 2026-04-29 | UX Wave 1: Required fields clarity, 7 keyboard shortcuts, sample architecture dropdown | Next.js Dev |
| 2026-04-29 | UX Wave 2: Edit panel module switching fix (React key pattern), edge delete (hover ✕ + Del key + visual selection) | Next.js Dev |
