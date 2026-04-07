"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useFlowStore } from "@/stores/flow-store";
import type { FlowNode, FlowEdge, AppFlowNode } from "@/stores/flow-store";

// ── Snapshot type ─────────────────────────────────────────────────────────────

export interface Snapshot {
  /** uuid-style: Date.now().toString(36) + random hex */
  id: string;
  /** user-provided or auto "Versão HH:mm DD/MM" */
  name: string;
  projectName: string;
  timestamp: string; // ISO
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Layer 2 data (optional for backward compat with old snapshots) */
  solutionNodes?: AppFlowNode[];
  solutionEdges?: FlowEdge[];
}

const MAX_SNAPSHOTS = 20;

function generateSnapshotId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildAutoName(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  return `Versão ${hh}:${mm} ${dd}/${mo}`;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface HistoryStore {
  snapshots: Snapshot[];
  historyPanelOpen: boolean;
  saveSnapshot: (name?: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  toggleHistoryPanel: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      snapshots: [],
      historyPanelOpen: false,

      saveSnapshot: (name?: string) => {
        const flowState = useFlowStore.getState();
        const snapshot: Snapshot = {
          id: generateSnapshotId(),
          name: name?.trim() || buildAutoName(),
          projectName: flowState.projectName,
          timestamp: new Date().toISOString(),
          nodes: flowState.nodes,
          edges: flowState.edges,
          solutionNodes: flowState.solutionNodes,
          solutionEdges: flowState.solutionEdges,
        };

        set((state) => ({
          snapshots: [snapshot, ...state.snapshots].slice(0, MAX_SNAPSHOTS),
        }));
      },

      loadSnapshot: (id: string) => {
        const snap = get().snapshots.find((s) => s.id === id);
        if (!snap) return;

        // Use V3 import which handles both formats
        useFlowStore.getState().importProject({
          version: 3,
          name: snap.projectName,
          infrastructure: {
            nodes: snap.nodes,
            edges: snap.edges,
          },
          solutionDesign: {
            nodes: snap.solutionNodes ?? [],
            edges: snap.solutionEdges ?? [],
          },
          savedAt: snap.timestamp,
        });
      },

      deleteSnapshot: (id: string) => {
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== id),
        }));
      },

      toggleHistoryPanel: () => {
        set((state) => ({ historyPanelOpen: !state.historyPanelOpen }));
      },
    }),
    {
      name: "aws-arch-history",
      partialize: (state) => ({ snapshots: state.snapshots }),
    }
  )
);
