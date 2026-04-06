"use client";
/**
 * useAutoLayout — Dagre-based automatic graph layout for the canvas.
 * Must be called inside ReactFlow context (provides fitView).
 */
import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import Dagre from "@dagrejs/dagre";
import { useFlowStore } from "@/stores/flow-store";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const CONTAINER_WIDTH = 260;
const CONTAINER_HEIGHT = 200;

export function useAutoLayout() {
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(
    (direction: "TB" | "LR" = "TB") => {
      const { nodes, edges } = useFlowStore.getState();

      if (nodes.length === 0) return;

      const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
      g.setGraph({
        rankdir: direction,
        ranksep: 80,
        nodesep: 60,
        marginx: 30,
        marginy: 30,
      });

      const containerTypes = new Set(["vpc", "subnet", "security-group"]);

      nodes.forEach((node) => {
        const isContainer = containerTypes.has(node.data.type);
        g.setNode(node.id, {
          width: isContainer ? CONTAINER_WIDTH : NODE_WIDTH,
          height: isContainer ? CONTAINER_HEIGHT : NODE_HEIGHT,
        });
      });

      edges.forEach((edge) => {
        // Dagre requires both endpoints to be registered as nodes
        if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
          g.setEdge(edge.source, edge.target);
        }
      });

      Dagre.layout(g);

      const layoutedNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        if (!pos) return node;
        const isContainer = containerTypes.has(node.data.type);
        const w = isContainer ? CONTAINER_WIDTH : NODE_WIDTH;
        const h = isContainer ? CONTAINER_HEIGHT : NODE_HEIGHT;
        return {
          ...node,
          position: {
            x: pos.x - w / 2,
            y: pos.y - h / 2,
          },
        };
      });

      useFlowStore.setState({ nodes: layoutedNodes });

      // Fit view after the DOM has updated
      setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
    },
    [fitView]
  );

  return { applyLayout };
}
