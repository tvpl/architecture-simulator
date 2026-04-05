"use client";
/**
 * FlowCanvas — main canvas component.
 * Connects @xyflow/react with Zustand stores and the registry-driven node/edge types.
 */
import React, { useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type XYPosition,
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
import { ProtocolEdge } from "@/components/edges/ProtocolEdge";

// ── Static node/edge type registries (stable references) ─────────────────────

const nodeTypes = {
  "service-node": ServiceNode,
  "container-node": ContainerNode,
} as const;

const edgeTypes = {
  "protocol-edge": ProtocolEdge,
} as const;

// ── Canvas ────────────────────────────────────────────────────────────────────

export function FlowCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const simStatus = useSimulationStore((s) => s.status);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useFlowStore();

  const { selectNode, selectEdge, clearSelection } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

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
    (_: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id);
      openPropertiesPanel();
    },
    [selectNode, openPropertiesPanel]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
      openPropertiesPanel();
    },
    [selectEdge, openPropertiesPanel]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // ── Animated edges (simulation layer) ───────────────────────────────────

  const animatedEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        animated:
          (activeLayer === "simulation" && simStatus === "complete") ||
          activeLayer === "services",
      })),
    [edges, activeLayer, simStatus]
  );

  // ── MiniMap color ────────────────────────────────────────────────────────

  const nodeColor = useCallback((node: { data?: { type?: string } }) => {
    const colorMap: Record<string, string> = {
      lambda: "#f97316",
      ec2: "#d97706",
      ecs: "#0d9488",
      eks: "#2563eb",
      fargate: "#0891b2",
      alb: "#059669",
      nlb: "#16a34a",
      "api-gateway": "#db2777",
      cloudfront: "#4f46e5",
      sqs: "#f59e0b",
      sns: "#f43f5e",
      eventbridge: "#14b8a6",
      msk: "#ef4444",
      kinesis: "#3b82f6",
      s3: "#22c55e",
      rds: "#1d4ed8",
      dynamodb: "#4f46e5",
      elasticache: "#dc2626",
      vpc: "#7c3aed",
      subnet: "#8b5cf6",
      waf: "#ea580c",
      cloudwatch: "#22c55e",
    };
    return colorMap[node.data?.type ?? ""] ?? "#94a3b8";
  }, []);

  return (
    <div className="w-full h-full" ref={wrapperRef}>
      <ReactFlow<FlowNode, FlowEdge>
        nodes={nodes}
        edges={animatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
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
                {activeLayer === "services" && "Visualize comunicação entre serviços"}
                {activeLayer === "cost" && "Analise custos por componente"}
                {activeLayer === "simulation" && "Execute a simulação para ver métricas"}
              </div>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
