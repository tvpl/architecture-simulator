"use client";
/**
 * FlowCanvas — main canvas component.
 * Layer-aware: renders infrastructure (L1) or solution design (L2) nodes/edges.
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

import { useFlowStore, type FlowNode, type FlowEdge, type AppFlowNode, selectInfraHostOptions } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { useLayerStore } from "@/stores/layer-store";
import { useSimulationStore } from "@/stores/simulation-store";
import type { AWSServiceType } from "@/domain/entities/node";
import type { AppComponentType } from "@/domain/entities/app-component";
import { ServiceNode } from "@/components/nodes/base/ServiceNode";
import { ContainerNode } from "@/components/nodes/base/ContainerNode";
import { NoteNode } from "@/components/nodes/base/NoteNode";
import { AppServiceNode } from "@/components/nodes/app/AppServiceNode";
import { HostGroupNode, type HostGroupNodeData } from "@/components/nodes/app/HostGroupNode";
import { ProtocolEdge } from "@/components/edges/ProtocolEdge";
import { NodeContextMenu, type ContextMenuState } from "./NodeContextMenu";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutoLayout } from "@/hooks/use-auto-layout";

// ── Static node/edge type registries (stable references) ─────────────────────

const nodeTypes = {
  "service-node": ServiceNode,
  "container-node": ContainerNode,
  "note-node": NoteNode,
  "app-service-node": AppServiceNode,
  "host-group-node": HostGroupNode,
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

  const isSolutionLayer = activeLayer === "solution-design";

  // ── Layer 1 state ──────────────────────────────────────────────────────────
  const infraNodes = useFlowStore((s) => s.nodes);
  const infraEdges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  // ── Layer 2 state ──────────────────────────────────────────────────────────
  const solutionNodes = useFlowStore((s) => s.solutionNodes);
  const solutionEdges = useFlowStore((s) => s.solutionEdges);
  const onSolutionNodesChange = useFlowStore((s) => s.onSolutionNodesChange);
  const onSolutionEdgesChange = useFlowStore((s) => s.onSolutionEdgesChange);
  const onSolutionConnect = useFlowStore((s) => s.onSolutionConnect);
  const addAppComponent = useFlowStore((s) => s.addAppComponent);
  const infraHosts = useFlowStore(selectInfraHostOptions);

  const { selectNode, selectEdge, clearSelection } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  // Choose which nodes/edges to render based on layer
  const activeNodes = isSolutionLayer ? solutionNodes : infraNodes;
  const activeEdges = isSolutionLayer ? solutionEdges : infraEdges;

  // ── Context menu ─────────────────────────────────────────────────────────

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode | AppFlowNode) => {
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
      const allNodes = [...useFlowStore.getState().nodes, ...useFlowStore.getState().solutionNodes];
      const node = allNodes.find((n) => n.id === nodeId);
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
      // Try L1 first, then L2
      const isL2 = useFlowStore.getState().solutionNodes.some((n) => n.id === renamingNodeId);
      if (isL2) {
        useFlowStore.getState().updateAppComponentData(renamingNodeId, { label: renameValue.trim() });
      } else {
        updateNodeData(renamingNodeId, { label: renameValue.trim() });
      }
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
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const bounds = wrapper.getBoundingClientRect();
      const position: XYPosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      // Layer 1: infrastructure service drop
      const infraType = event.dataTransfer.getData("application/architecture-service") as AWSServiceType;
      if (infraType) {
        addNode(infraType, position);
        return;
      }

      // Layer 2: app component drop
      const appType = event.dataTransfer.getData("application/app-component") as AppComponentType;
      if (appType) {
        // Auto-assign to first available host (user can change in properties)
        const defaultHost = infraHosts[0];
        if (!defaultHost) return; // No hosts available
        addAppComponent(appType, position, defaultHost.id);
        return;
      }
    },
    [addNode, addAppComponent, infraHosts]
  );

  // ── Element selection ────────────────────────────────────────────────────

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode | AppFlowNode) => {
      selectNode(node.id);
      openPropertiesPanel();
    },
    [selectNode, openPropertiesPanel]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: FlowNode | AppFlowNode) => {
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
      activeEdges.map((e) => ({
        ...e,
        animated:
          (activeLayer === "simulation" && simStatus === "complete") ||
          activeLayer === "solution-design",
      })),
    [activeEdges, activeLayer, simStatus]
  );

  // ── Host group nodes (visual containers for L2) ──────────────────────────

  const hostGroupNodes = useMemo(() => {
    if (!isSolutionLayer) return [];
    // Build a map of hostId → count of components
    const hostCounts = new Map<string, number>();
    for (const n of solutionNodes) {
      const hid = n.data.hostInfrastructureNodeId;
      if (hid) hostCounts.set(hid, (hostCounts.get(hid) ?? 0) + 1);
    }
    // Create a ghost group node for each host that has components
    return infraHosts
      .filter((h) => hostCounts.has(h.id))
      .map((host, idx) => {
        // Position groups in a grid layout
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        return {
          id: `host-group-${host.id}`,
          type: "host-group-node" as const,
          position: { x: col * 380, y: row * 320 },
          draggable: false,
          selectable: false,
          data: {
            hostId: host.id,
            hostLabel: host.data.label,
            hostType: host.data.type,
            childCount: hostCounts.get(host.id) ?? 0,
          } as HostGroupNodeData,
          style: { width: 340, height: 280 },
          zIndex: -1,
        };
      });
  }, [isSolutionLayer, solutionNodes, infraHosts]);

  // ── Node type mapping (route note type to note-node renderer) ─────────────

  const typedNodes = useMemo(
    () => {
      const mapped = (activeNodes as (FlowNode | AppFlowNode)[]).map((n) =>
        n.data.type === "note" ? { ...n, type: "note-node" } : n
      );
      // Prepend host groups so they render behind app nodes
      return [...hostGroupNodes, ...mapped] as FlowNode[];
    },
    [activeNodes, hostGroupNodes]
  );

  // ── MiniMap color ────────────────────────────────────────────────────────

  const nodeColor = useCallback((node: { data?: { type?: string } }) => {
    const colorMap: Record<string, string> = {
      // L1 infra colors
      lambda: "#f97316", ec2: "#d97706", ecs: "#0d9488", eks: "#2563eb",
      fargate: "#0891b2", alb: "#059669", nlb: "#16a34a",
      "api-gateway": "#db2777", cloudfront: "#4f46e5", sqs: "#f59e0b",
      sns: "#f43f5e", eventbridge: "#14b8a6", msk: "#ef4444", kinesis: "#3b82f6",
      s3: "#22c55e", rds: "#1d4ed8", dynamodb: "#4f46e5", elasticache: "#dc2626",
      vpc: "#7c3aed", subnet: "#8b5cf6", waf: "#ea580c", cloudwatch: "#22c55e",
      note: "#eab308",
      // L2 app component colors
      microservice: "#6366f1", worker: "#8b5cf6", consumer: "#f59e0b",
      producer: "#f97316", api: "#3b82f6", sidecar: "#14b8a6",
      "ingress-controller": "#059669", cronjob: "#a855f7", gateway: "#ec4899",
      "database-client": "#1d4ed8", "cache-client": "#dc2626", "batch-processor": "#0891b2",
    };
    return colorMap[node.data?.type ?? ""] ?? "#94a3b8";
  }, []);

  // Choose correct change/connect handlers based on layer
  // Cast needed because FlowNode and AppFlowNode have different data types,
  // but ReactFlow handlers are structurally compatible at runtime.
  const handleNodesChange = isSolutionLayer
    ? (onSolutionNodesChange as unknown as typeof onNodesChange)
    : onNodesChange;
  const handleEdgesChange = isSolutionLayer
    ? onSolutionEdgesChange
    : onEdgesChange;
  const handleConnect = isSolutionLayer
    ? onSolutionConnect
    : onConnect;

  // Empty state text
  const emptyMessages: Record<string, { title: string; sub: string }> = {
    architecture: { title: "Arraste componentes AWS para começar", sub: "Construa sua arquitetura" },
    "solution-design": { title: "Arraste componentes de solução para começar", sub: "Desenhe seus serviços e comunicações" },
  };
  const emptyMsg = emptyMessages[activeLayer];

  return (
    <div className="w-full h-full relative" ref={wrapperRef}>
      <ReactFlow<FlowNode, FlowEdge>
        nodes={typedNodes as FlowNode[]}
        edges={animatedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
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
        {activeNodes.length === 0 && emptyMsg && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3 opacity-50">
              <div className="text-4xl">{isSolutionLayer ? "🧩" : "☁️"}</div>
              <div className="text-sm font-medium text-muted-foreground">
                {emptyMsg.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {emptyMsg.sub}
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
        const allNodes = [...infraNodes, ...(solutionNodes as unknown as FlowNode[])];
        const n = allNodes.find((nd) => nd.id === renamingNodeId);
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
                placeholder="Nome do componente..."
              />
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
