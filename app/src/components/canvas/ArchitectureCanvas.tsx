'use client';
import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node, Edge, Connection,
  Background, Controls, MiniMap,
  NodeTypes, EdgeTypes, useNodesState, useEdgesState, BackgroundVariant,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useArchitectureStore } from '@/store/architecture-store';
import { Module } from '@/types/architecture';
import { exportToJSON } from '@/lib/import-export';
import { toast } from 'sonner';
import ModuleNode from './ModuleNode';
import DependencyEdge from './DependencyEdge';
import CanvasGrid from './CanvasGrid';
import CanvasToolbar from './CanvasToolbar';
import ModuleForm from '../modules/ModuleForm';
import ValidationPanel from '../validation/ValidationPanel';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import GuidelinesPanel from '../guidelines/GuidelinesPanel';
import AICopilotPanel from '../ai/AICopilotPanel';
import AIReviewPanel from '../ai/AIReviewPanel';
import AIGenerateDialog from '../ai/AIGenerateDialog';

const nodeTypes: NodeTypes = { moduleNode: ModuleNode };
const edgeTypes: EdgeTypes = { dependencyEdge: DependencyEdge };

export default function ArchitectureCanvas() {
  const {
    modules, dependencies, selectedModuleId,
    addDependency, deleteDependency, loadSampleData, isInitialized,
    validateAll, updateModule, selectModule, deleteModule,
    projectName, violations, aiMode, aiProvider, aiApiKey, aiModel,
  } = useArchitectureStore();

  const [showForm, setShowForm] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Tracks the currently-selected edge ID so Del/Backspace can delete it
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // Separate highlight state — used by ValidationPanel to highlight without opening the form
  const [highlightModuleId, setHighlightModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      loadSampleData();
    } else {
      validateAll();
    }
  }, [isInitialized, loadSampleData, validateAll]);

  // Shared export function used by toolbar and keyboard shortcut
  const handleExport = useCallback(() => {
    const json = exportToJSON(projectName, modules, dependencies);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = projectName
      .replace(/[/\\:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase() || 'architecture';
    a.download = `${safeName}-architecture.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Architecture exported!');
  }, [projectName, modules, dependencies]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Escape — close panels (always active)
      if (e.key === 'Escape') {
        setShowForm(false);
        setShowValidation(false);
        setShowShortcuts(false);
        setShowGuidelines(false);
        setDeleteConfirmId(null);
        return;
      }

      // ? — toggle shortcuts help (guard against typing)
      if (e.key === '?' && !isTyping) {
        setShowShortcuts(v => !v);
        return;
      }

      if (isTyping) return; // block all other shortcuts when typing

      // G — toggle guidelines
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowGuidelines(v => !v);
        return;
      }

      // A — toggle AI copilot (only if AI mode is on)
      if (e.key === 'a' || e.key === 'A') {
        if (aiMode) {
          e.preventDefault();
          setShowAIPanel(v => !v);
        }
        return;
      }

      // N — new module
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingModule(undefined);
        setShowForm(true);
        return;
      }

      // E — edit selected module
      if ((e.key === 'e' || e.key === 'E') && selectedModuleId) {
        e.preventDefault();
        const mod = modules.find(m => m.id === selectedModuleId);
        if (mod) { setEditingModule(mod); setShowForm(true); }
        return;
      }

      // Del / Backspace — delete selected module; if no module selected, delete selected edge
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedModuleId) {
          e.preventDefault();
          setDeleteConfirmId(selectedModuleId);
          return;
        }
        if (selectedEdgeId) {
          e.preventDefault();
          deleteDependency(selectedEdgeId);
          setSelectedEdgeId(null);
          return;
        }
        return;
      }

      // Ctrl+S / Cmd+S — export
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExport();
        return;
      }

      // Ctrl+Shift+V / Cmd+Shift+V — validate
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        validateAll();
        setShowValidation(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModuleId, selectedEdgeId, modules, showForm, handleExport, validateAll, deleteDependency, aiMode]);

  const nodes: Node[] = useMemo(() => modules.map(m => ({
    id: m.id,
    type: 'moduleNode',
    position: m.position,
    data: { ...m, highlighted: m.id === highlightModuleId },
    selected: m.id === selectedModuleId,
  })), [modules, selectedModuleId, highlightModuleId]);

  const edges: Edge[] = useMemo(() => dependencies.map(d => ({
    id: d.id,
    source: d.sourceId,
    target: d.targetId,
    type: 'dependencyEdge',
    data: { isValid: d.isValid, violationReason: d.violationReason },
  })), [dependencies]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [, , onEdgesChange] = useEdgesState(edges);

  useEffect(() => { setRfNodes(nodes); }, [nodes, setRfNodes]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    updateModule(node.id, { position: node.position });
  }, [updateModule]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      addDependency(connection.source, connection.target);
    }
  }, [addDependency]);

  // Track edge selection so Del/Backspace can delete the selected edge
  const onSelectionChange = useCallback(({ edges: selEdges }: OnSelectionChangeParams) => {
    setSelectedEdgeId(selEdges.length > 0 ? selEdges[0].id : null);
  }, []);

  // Clicking the blank canvas deselects everything
  const onPaneClick = useCallback(() => {
    selectModule(null);
    setSelectedEdgeId(null);
  }, [selectModule]);

  const handleAddModule = () => {
    setEditingModule(undefined);
    setShowForm(true);
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  // Only open the form when selectedModuleId is set via a node click
  useEffect(() => {
    if (selectedModuleId && selectedModule) {
      setEditingModule(selectedModule);
      setShowForm(true);
    }
  }, [selectedModuleId, selectedModule]);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingModule(undefined);
    selectModule(null);
  };

  // Highlight a module from ValidationPanel without opening the edit form
  const handleHighlightModule = (id: string) => {
    setHighlightModuleId(id);
    // Clear the highlight after 2 seconds
    setTimeout(() => setHighlightModuleId(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 pt-[44px]">
      {/* Hidden SVG defs for edge arrowhead markers — P1 fix */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <marker id="arrow-valid" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
          </marker>
          <marker id="arrow-invalid" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
          </marker>
        </defs>
      </svg>

      <CanvasToolbar
        onAddModule={handleAddModule}
        onToggleValidation={() => setShowValidation(true)}
        showValidation={showValidation}
        onExport={handleExport}
        onToggleShortcuts={() => setShowShortcuts(v => !v)}
        onOpenGuidelines={() => setShowGuidelines(true)}
        onOpenAI={() => setShowAIPanel(true)}
        onOpenReview={() => setShowReviewPanel(true)}
        onOpenGenerate={() => setShowGenerateDialog(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative">
          <CanvasGrid />
          <ReactFlow
            nodes={rfNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onSelectionChange={onSelectionChange}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-gray-950"
            style={{ zIndex: 1, position: 'relative' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#374151" />
            <Controls />
            <MiniMap nodeColor="#374151" maskColor="rgba(99,102,241,0.12)" />
          </ReactFlow>
        </div>
        {showValidation && (
          <ValidationPanel
            onClose={() => setShowValidation(false)}
            onHighlightModule={handleHighlightModule}
          />
        )}
      </div>

      {showForm && (
        <ModuleForm
          key={editingModule?.id ?? 'new'}
          module={editingModule}
          onClose={handleCloseForm}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-80 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Delete Module?</h3>
            <p className="text-gray-400 text-sm mb-4">
              &ldquo;{modules.find(m => m.id === deleteConfirmId)?.name}&rdquo; and all its dependencies will be removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteModule(deleteConfirmId);
                  setDeleteConfirmId(null);
                  selectModule(null);
                  setShowForm(false);
                  setEditingModule(undefined);
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help overlay */}
      {showShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}

      {/* Architecture Guidelines slide-over */}
      <GuidelinesPanel open={showGuidelines} onClose={() => setShowGuidelines(false)} />

      {/* AI Copilot Panel */}
      <AICopilotPanel
        open={showAIPanel && aiMode}
        onClose={() => setShowAIPanel(false)}
        modules={modules}
        violations={violations}
        projectName={projectName}
      />

      {/* AI Review Panel */}
      <AIReviewPanel
        open={showReviewPanel && aiMode}
        onClose={() => setShowReviewPanel(false)}
        modules={modules}
        violations={violations}
        projectName={projectName}
        provider={aiProvider}
        apiKey={aiApiKey}
        model={aiModel}
      />

      {/* AI Generate Dialog */}
      <AIGenerateDialog
        open={showGenerateDialog && aiMode}
        onClose={() => setShowGenerateDialog(false)}
        provider={aiProvider}
        apiKey={aiApiKey}
        model={aiModel}
      />
    </div>
  );
}
