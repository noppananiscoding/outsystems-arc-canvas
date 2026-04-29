'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Module, Dependency, ValidationViolation, ArchitectureFile, ModuleSuffix } from '@/types/architecture';
import { deriveLayerAndTrack } from '@/lib/module-utils';
import { isDependencyAllowed, runValidation } from '@/lib/validation';
import { detectAntiPatterns } from '@/lib/anti-patterns';
import { exportToJSON } from '@/lib/import-export';
import { getDefaultChecklist } from '@/lib/checklist-utils';

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

function buildSampleModules(): Module[] {
  const makeModule = (name: string, suffix: ModuleSuffix, x: number, y: number, description: string, ownedEntities: string[] = []): Module => {
    const { layer, track } = deriveLayerAndTrack(suffix, name);
    return {
      id: uuidv4(),
      name, suffix, layer, track, description, ownedEntities,
      dependsOn: [], notes: '', position: { x, y },
      checklistItems: getDefaultChecklist(suffix),
    };
  };

  return [
    makeModule('Portal_Web', 'Web', 100, 50, 'Customer-facing portal', []),
    makeModule('Admin_Web', 'Web', 400, 50, 'Admin management portal', []),
    makeModule('UserMgmt_CS', 'CS', 650, 300, 'User management core service', ['User', 'UserProfile', 'UserRole']),
    makeModule('Notifications_CS', 'CS', 950, 300, 'Notification core service', ['Notification', 'NotificationTemplate']),
    makeModule('ContentMgmt_CS', 'CS', 1250, 300, 'Content management core service', ['Content', 'ContentCategory', 'ContentTag']),
    makeModule('Analytics_CS', 'CS', 1550, 300, 'Analytics core service', ['AnalyticsEvent', 'Report']),
    makeModule('UserMgmt_UI', 'UI', 100, 300, 'User management UI components', []),
    makeModule('Notifications_UI', 'UI', 380, 300, 'Notification UI components', []),
    makeModule('Identity_IS', 'IS', 650, 580, 'Identity provider integration', []),
    makeModule('Integration_IS', 'IS', 950, 580, 'External integration connector', []),
    makeModule('SharedLib_IS', 'IS', 1250, 580, 'Shared libraries and utilities', []),
    makeModule('StyleGuide_UI', 'UI', 100, 580, 'Design system and style guide', []),
  ];
}

function buildSampleDependencies(modules: Module[]): Dependency[] {
  const byName = new Map(modules.map(m => [m.name, m]));
  const deps: Array<[string, string]> = [
    ['Portal_Web', 'UserMgmt_CS'],
    ['Portal_Web', 'Notifications_CS'],
    ['Portal_Web', 'ContentMgmt_CS'],
    ['Portal_Web', 'StyleGuide_UI'],
    ['Portal_Web', 'UserMgmt_UI'],
    ['Admin_Web', 'UserMgmt_CS'],
    ['Admin_Web', 'ContentMgmt_CS'],
    ['Admin_Web', 'Analytics_CS'],
    ['Admin_Web', 'StyleGuide_UI'],
    ['UserMgmt_CS', 'Identity_IS'],
    ['UserMgmt_CS', 'SharedLib_IS'],
    ['Notifications_CS', 'SharedLib_IS'],
    ['Notifications_CS', 'Integration_IS'],
    ['ContentMgmt_CS', 'UserMgmt_CS'],
    ['ContentMgmt_CS', 'SharedLib_IS'],
    ['Analytics_CS', 'SharedLib_IS'],
    ['UserMgmt_UI', 'UserMgmt_CS'],
    ['UserMgmt_UI', 'StyleGuide_UI'],
    ['Notifications_UI', 'Notifications_CS'],
    ['Notifications_UI', 'StyleGuide_UI'],
    ['Integration_IS', 'SharedLib_IS'],
  ];
  const result: Dependency[] = [];
  for (const [srcName, tgtName] of deps) {
    const source = byName.get(srcName);
    const target = byName.get(tgtName);
    if (!source || !target) continue;
    const check = isDependencyAllowed(source, target);
    result.push({ id: uuidv4(), sourceId: source.id, targetId: target.id, isValid: check.allowed, violationReason: check.reason });
  }
  return result;
}

interface ArchitectureStore {
  projectName: string;
  modules: Module[];
  dependencies: Dependency[];
  violations: ValidationViolation[];
  selectedModuleId: string | null;
  isInitialized: boolean;

  // AI Mode
  aiMode: boolean;
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;

  // MCP session
  mcpSessionId: string | null;
  mcpConnected: boolean;

  setProjectName: (name: string) => void;
  addModule: (module: Omit<Module, 'id'>) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  addDependency: (sourceId: string, targetId: string) => void;
  deleteDependency: (id: string) => void;
  validateAll: () => void;
  selectModule: (id: string | null) => void;
  importArchitecture: (file: ArchitectureFile) => void;
  exportArchitecture: () => ArchitectureFile;
  loadSampleData: () => void;

  // AI actions
  setAiMode: (enabled: boolean) => void;
  setAiConfig: (provider: AIProvider, apiKey: string, model: string) => void;
  clearAiConfig: () => void;

  // MCP actions
  startMcpSession: () => Promise<string>;
  stopMcpSession: () => void;
  pushSessionState: () => Promise<void>;
  pullSessionState: () => Promise<boolean>;
}

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
      projectName: 'My Architecture',
      modules: [],
      dependencies: [],
      violations: [],
      selectedModuleId: null,
      isInitialized: false,

      // AI defaults
      aiMode: false,
      aiProvider: 'gemini' as AIProvider,
      aiApiKey: (typeof window !== 'undefined' ? localStorage.getItem('ai_api_key') : null) ?? '',
      aiModel: 'gemini-2.5-flash',

      // MCP defaults
      mcpSessionId: null,
      mcpConnected: false,

      setProjectName: (name) => set({ projectName: name }),

      addModule: (moduleData) => {
        const newModule: Module = { ...moduleData, id: uuidv4() };
        set(state => ({ modules: [...state.modules, newModule] }));
        get().validateAll();
      },

      updateModule: (id, updates) => {
        set(state => ({
          modules: state.modules.map(m => m.id === id ? { ...m, ...updates } : m),
        }));
        get().validateAll();
      },

      deleteModule: (id) => {
        set(state => ({
          modules: state.modules.filter(m => m.id !== id),
          dependencies: state.dependencies.filter(d => d.sourceId !== id && d.targetId !== id),
          selectedModuleId: state.selectedModuleId === id ? null : state.selectedModuleId,
        }));
        get().validateAll();
      },

      addDependency: (sourceId, targetId) => {
        const { modules, dependencies } = get();
        const exists = dependencies.some(d => d.sourceId === sourceId && d.targetId === targetId);
        if (exists) return;
        const source = modules.find(m => m.id === sourceId);
        const target = modules.find(m => m.id === targetId);
        if (!source || !target) return;
        const result = isDependencyAllowed(source, target);
        const newDep: Dependency = { id: uuidv4(), sourceId, targetId, isValid: result.allowed, violationReason: result.reason };
        set(state => ({
          dependencies: [...state.dependencies, newDep],
          modules: state.modules.map(m =>
            m.id === sourceId
              ? { ...m, dependsOn: [...m.dependsOn, targetId] }
              : m
          ),
        }));
        get().validateAll();
      },

      deleteDependency: (id) => {
        const dep = get().dependencies.find(d => d.id === id);
        set(state => ({
          dependencies: state.dependencies.filter(d => d.id !== id),
          modules: dep
            ? state.modules.map(m =>
                m.id === dep.sourceId
                  ? { ...m, dependsOn: m.dependsOn.filter(did => did !== dep.targetId) }
                  : m
              )
            : state.modules,
        }));
        get().validateAll();
      },

      validateAll: () => {
        const { modules, dependencies } = get();
        const depViolations = runValidation(modules, dependencies);
        const antiPatternViolations = detectAntiPatterns(modules, dependencies);
        set({ violations: [...depViolations, ...antiPatternViolations] });
      },

      selectModule: (id) => set({ selectedModuleId: id }),

      importArchitecture: (file) => {
        set({
          projectName: file.projectName,
          modules: file.modules,
          dependencies: file.dependencies,
          selectedModuleId: null,
        });
        get().validateAll();
      },

      exportArchitecture: () => {
        const { projectName, modules, dependencies } = get();
        return JSON.parse(exportToJSON(projectName, modules, dependencies)) as ArchitectureFile;
      },

      loadSampleData: () => {
        const sampleModules = buildSampleModules();
        const sampleDeps = buildSampleDependencies(sampleModules);
        set({ modules: sampleModules, dependencies: sampleDeps, isInitialized: true });
        get().validateAll();
      },

      // AI actions
      setAiMode: (enabled) => set({ aiMode: enabled }),

      setAiConfig: (provider, apiKey, model) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai_api_key', apiKey);
        }
        set({ aiProvider: provider, aiModel: model, aiApiKey: apiKey, aiMode: true });
      },

      clearAiConfig: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ai_api_key');
        }
        set({ aiMode: false, aiProvider: 'gemini', aiModel: 'gemini-2.5-flash', aiApiKey: '' });
      },

      // MCP actions
      startMcpSession: async () => {
        const res = await fetch('/api/session/new');
        const { sessionId } = await res.json() as { sessionId: string };
        set({ mcpSessionId: sessionId, mcpConnected: true });
        // Push current state immediately
        const { projectName, modules, dependencies } = get();
        await fetch(`/api/session/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName, modules, dependencies, lastUpdatedAt: new Date().toISOString(), lastUpdatedBy: 'browser' }),
        });
        return sessionId;
      },

      stopMcpSession: () => {
        set({ mcpSessionId: null, mcpConnected: false });
      },

      pushSessionState: async () => {
        const { mcpSessionId, projectName, modules, dependencies } = get();
        if (!mcpSessionId) return;
        await fetch(`/api/session/${mcpSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName, modules, dependencies, lastUpdatedAt: new Date().toISOString(), lastUpdatedBy: 'browser' }),
        });
      },

      pullSessionState: async () => {
        const { mcpSessionId } = get();
        if (!mcpSessionId) return false;
        try {
          const res = await fetch(`/api/session/${mcpSessionId}`);
          if (!res.ok) return false;
          const remote = await res.json() as { projectName: string; modules: Module[]; dependencies: Dependency[]; lastUpdatedBy: string; lastUpdatedAt: string };
          if (remote.lastUpdatedBy !== 'agent') return false;
          // Apply remote changes and re-validate
          set({ projectName: remote.projectName, modules: remote.modules, dependencies: remote.dependencies });
          get().validateAll();
          // Mark as seen by pushing browser update
          await get().pushSessionState();
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'outsystems-architecture',
      partialize: (state) => ({
        projectName: state.projectName,
        modules: state.modules,
        dependencies: state.dependencies,
        violations: state.violations,
        selectedModuleId: state.selectedModuleId,
        isInitialized: state.isInitialized,
        aiMode: state.aiMode,
        aiProvider: state.aiProvider,
        aiModel: state.aiModel,
        // aiApiKey intentionally excluded — stored separately in localStorage
        // mcpSessionId / mcpConnected intentionally excluded — ephemeral per browser tab
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore apiKey from its own localStorage key
          if (typeof window !== 'undefined') {
            state.aiApiKey = localStorage.getItem('ai_api_key') ?? '';
          }
          if (!state.isInitialized && state.modules.length === 0) {
            state.loadSampleData();
          }
        }
      },
    }
  )
);
