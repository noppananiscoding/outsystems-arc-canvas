# OutSystems Architecture Canvas Simulator

An interactive web application that simulates the **OutSystems Architecture Canvas** — a visual design and validation tool for Solution Architects to design, validate, and document OutSystems module architectures **before** building in OutSystems.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![React Flow](https://img.shields.io/badge/React%20Flow-v11-ff0072)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Interactive Canvas** | Drag-and-drop modules onto a 3-layer × 2-track OutSystems grid |
| **Module Management** | Add, edit, delete modules with naming convention validation |
| **Dependency Visualization** | Directed arrows color-coded green (valid) / red (violation) |
| **Real-time Validation** | Instantly detects 5 forbidden dependency rules + 8 anti-patterns |
| **Sample Architectures** | Load Best Practices reference or Anti-Pattern showcase |
| **Import / Export** | Save/restore architecture as `.json` — open on any machine |
| **Module Checklist** | Per-module inventory checklist (entities, services, screens) |
| **Architecture Guidelines** | In-app reference panel: naming, rules, anti-patterns, best practices |
| **Keyboard Shortcuts** | `N` new, `E` edit, `Del` delete, `Ctrl+S` export, `?` help, `G` guidelines |

---

## 🏗 OutSystems Architecture Canvas

The canvas follows the official **OutSystems Architecture Canvas** methodology:

```
┌─────────────────────────────────────────────────────┐
│                    END-USER LAYER                   │
│  ┌─────────────────┐  ┌────────────────────────┐   │
│  │  _Web / _App    │  │       (none)            │   │
│  └─────────────────┘  └────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                     CORE LAYER                      │
│  ┌─────────────────┐  ┌────────────────────────┐   │
│  │      _UI        │  │          _CS            │   │
│  └─────────────────┘  └────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                  FOUNDATION LAYER                   │
│  ┌─────────────────┐  ┌────────────────────────┐   │
│  │  StyleGuide_UI  │  │      _IS  /  _BL        │   │
│  └─────────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         UI Track              Services Track
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
cd app
npm install
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build for production

```bash
cd app
npm run build
npm start
```

---

## 🎹 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Add new module |
| `E` | Edit selected module |
| `Del` / `Backspace` | Delete selected module or edge |
| `Esc` | Close panel / dismiss dialog |
| `Ctrl/Cmd + S` | Export architecture |
| `Ctrl/Cmd + Shift + V` | Run validation |
| `G` | Open Architecture Guidelines |
| `?` | Show keyboard shortcuts |

---

## 📁 Project Structure

```
outsystems-arc-canvas/
├── AGENT.md                          ← Project management & task tracker
├── Claude.md                         ← AI assistant context & domain model
├── OutSystems_Architecture_Canvas_Reference.md ← Source reference
└── app/                              ← Next.js application
    └── src/
        ├── app/                      ← Next.js App Router
        ├── components/
        │   ├── canvas/               ← React Flow canvas & nodes
        │   ├── modules/              ← Module add/edit form
        │   ├── validation/           ← Validation report panel
        │   ├── guidelines/           ← Architecture guidelines panel
        │   └── ui/                   ← shadcn/ui primitives
        ├── store/                    ← Zustand state management
        ├── lib/                      ← Validation engine, anti-patterns, utils
        └── types/                    ← TypeScript interfaces
```

---

## 📄 License

MIT — free to use, modify, and distribute.
