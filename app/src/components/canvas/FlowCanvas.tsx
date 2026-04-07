"use client";
/**
 * FlowCanvas — main canvas component.
 * Connects @xyflow/react with Zustand stores and the registry-driven node/edge types.
 */
import React, { useCallback, useEffect, useRef, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type XYPosition,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlowStore, type FlowNode, type FlowEdge } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { useLayerStore } from "@/stores/layer-store";
import { useSimulationStore } from "@/stores/simulation-store";
import type { AWSServiceType } from "@/domain/entities/node";
import { ServiceNode } from "@/components/nodes/base/ServiceNode";
import { ContainerNode } from "@/components/nodes/base/ContainerNode";
import { NoteNode } from "@/components/nodes/base/NoteNode";
import { ProtocolEdge } from "@/components/edges/ProtocolEdge";
import { NodeContextMenu, type ContextMenuState } from "./NodeContextMenu";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutoLayout } from "@/hooks/use-auto-layout";

// ── Static node/edge type registries (stable references) ─────────────────────

const nodeTypes = {
  "service-node": ServiceNode,
  "container-node": ContainerNode,
  "note-node": NoteNode,
} as const;

const edgeTypes = {
  "protocol-edge": ProtocolEdge,
} as const;

// ── CanvasEffects — inner component inside ReactFlow context ──────────────────

function CanvasEffects({ onStartRename }: { onStartRename: (id: string) => void }) {
  const { fitView } = useReactFlow();
  const { applyLayout } = useAutoLayout();
  const autoLayoutPending = useUIStore((s) => s.autoLayoutPending);
  const autoLayoutDirection = useUIStore((s) => s.autoLayoutDirection);
  const clearAutoLayout = useUIStore((s) => s.clearAutoLayout);
  const presentationMode = useUIStore((s) => s.presentationMode);
  const prevPresentationMode = useRef(presentationMode);

  useKeyboardShortcuts({ onStartRename });

  useEffect(() => {
    if (autoLayoutPending) {
      applyLayout(autoLayoutDirection);
      clearAutoLayout();
    }
  }, [autoLayoutPending, autoLayoutDirection, applyLayout, clearAutoLayout]);

  useEffect(() => {
    if (presentationMode && !prevPresentationMode.current) {
      setTimeout(() => fitView({ duration: 400, padding: 0.15 }), 100);
    }
    prevPresentationMode.current = presentationMode;
  }, [presentationMode, fitView]);

  return null;
}

// ── Canvas ────────────────────────────────────────────────────────────────────

export function FlowCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const simStatus = useSimulationStore((s) => s.status);
  const snapToGrid = useUIStore((s) => s.snapToGrid);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
  } = useFlowStore();

  const { selectNode, selectEdge, clearSelection } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  // ── Context menu ─────────────────────────────────────────────────────────

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      selectNode(node.id);
      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    },
    [selectNode]
  );

  // ── Inline rename ─────────────────────────────────────────────────────────

  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = useCallback(
    (nodeId: string) => {
      const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setRenamingNodeId(nodeId);
      setRenameValue(node.data.label);
    },
    []
  );

  useEffect(() => {
    if (renamingNodeId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNodeId]);

  const commitRename = useCallback(() => {
    if (renamingNodeId && renameValue.trim()) {
      updateNodeData(renamingNodeId, { label: renameValue.trim() });
    }
    setRenamingNodeId(null);
  }, [renamingNodeId, renameValue, updateNodeData]);

  // ── Drag-and-drop from sidebar ───────────────────────────────────────────

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(
        "application/architecture-service"
      ) as AWSServiceType;
      if (!type) return;

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const bounds = wrapper.getBoundingClientRect();
      const position: XYPosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      addNode(type, position);
    },
    [addNode]
  );

  // ── Element selection ────────────────────────────────────────────────────

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      selectNode(node.id);
      openPropertiesPanel();
    },
    [selectNode, openPropertiesPanel]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      // Notes handle their own double-click inline editing
      if (node.data.type === "note") return;
      startRename(node.id);
    },
    [startRename]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: FlowEdge) => {
      selectEdge(edge.id);
      openPropertiesPanel();
    },
    [selectEdge, openPropertiesPanel]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
    setContextMenu(null);
    setRenamingNodeId(null);
  }, [clearSelection]);

  // ── Animated edges (layer-aware) ─────────────────────────────────────────

  const animatedEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        animated:
          (activeLayer === "simulation" && simStatus === "complete") ||
          activeLayer === "solution-design",
      })),
    [edges, activeLayer, simStatus]
  );

  // ── Node type mapping (route note type to note-node renderer) ─────────────

  const typedNodes = useMemo(
    () =>
      nodes.map((n) =>
        n.data.type === "note" ? { ...n, type: "note-node" } : n
      ),
    [nodes]
  );

  // ── MiniMap color ────────────────────────────────────────────────────────

  const nodeColor = useCallback((node: { data?: { type?: string } }) => {
    const colorMap: Record<string, string> = {
      lambda: "#f97316", ec2: "#d97706", ecs: "#0d9488", eks: "#2563eb",
      fargate: "#0891b2", alb: "#059669", nlb: "#16a34a",
      "api-gateway": "#db2777", cloudfront: "#4f46e5", sqs: "#f59e0b",
      sns: "#f43f5e", eventbridge: "#14b8a6", msk: "#ef4444", kinesis: "#3b82f6",
      s3: "#22c55e", rds: "#1d4ed8", dynamodb: "#4f46e5", elasticache: "#dc2626",
      vpc: "#7c3aed", subnet: "#8b5cf6", waf: "#ea580c", cloudwatch: "#22c55e",
      note: "#eab308",
    };
    return colorMap[node.data?.type ?? ""] ?? "#94a3b8";
  }, []);

  return (
    <div className="w-full h-full relative" ref={wrapperRef}>
      <ReactFlow<FlowNode, FlowEdge>
        nodes={typedNodes}
        edges={animatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={snapToGrid ? 16 : 20}
          size={1}
          className="bg-muted/20"
        />

        <Controls
          className="bg-background border border-border rounded-lg shadow-sm"
          showInteractive={false}
        />

        <MiniMap
          nodeColor={nodeColor as (n: unknown) => string}
          className="bg-background border border-border rounded-lg shadow-sm"
          zoomable
          pannable
        />

        <CanvasEffects onStartRename={startRename} />

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3 opacity-50">
              <div className="text-4xl">☁️</div>
              <div className="text-sm font-medium text-muted-foreground">
                Arraste componentes AWS para começar
              </div>
              <div className="text-xs text-muted-foreground">
                {activeLayer === "architecture" && "Construa sua arquitetura"}
                {activeLayer === "solution-design" && "Desenhe seus serviços e comunicações"}
                {activeLayer === "cost" && "Analise custos por componente"}
                {activeLayer === "simulation" && "Execute a simulação para ver métricas"}
              </div>
            </div>
          </div>
        )}
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <NodeContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onStartRename={startRename}
        />
      )}

      {/* Inline rename overlay */}
      {renamingNodeId && (() => {
        const n = nodes.find((nd) => nd.id === renamingNodeId);
        return n ? (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 100 }}
          >
            <div
              className="pointer-events-auto bg-background border-2 border-primary rounded-lg shadow-xl px-3 py-2 flex items-center gap-2"
              style={{
                position: "absolute",
                left: Math.max(8, n.position.x),
                top: Math.max(8, n.position.y - 50),
              }}
            >
              <input
                ref={renameInputRef}
                className="text-sm font-medium bg-transparent outline-none min-w-[140px] max-w-[240px] text-foreground"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingNodeId(null);
                }}
                placeholder="Nome do serviço..."
              />
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
