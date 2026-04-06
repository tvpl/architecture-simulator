"use client";
/**
 * Validation Store — reactively runs validateArchitecture whenever nodes/edges change.
 * ServiceNode reads from this store to display inline error/warning badges.
 */
import { create } from "zustand";
import { useFlowStore } from "./flow-store";
import { validateArchitecture } from "@/domain/validators/architecture";
import type { ValidationResult } from "@/domain/entities/simulation";

interface ValidationStore {
  result: ValidationResult | null;
  /** Node IDs that have at least one validation error */
  errorNodeIds: string[];
  /** Node IDs that have at least one validation warning */
  warningNodeIds: string[];
}

export const useValidationStore = create<ValidationStore>()(() => ({
  result: null,
  errorNodeIds: [],
  warningNodeIds: [],
}));

// Reactively re-validate whenever nodes or edges change
useFlowStore.subscribe(
  (state) => ({ nodes: state.nodes, edges: state.edges }),
  ({ nodes, edges }) => {
    const domainNodes = nodes.map((n) => n.data);
    const domainEdges = edges.map((e) => e.data!).filter(Boolean);
    const result = validateArchitecture(domainNodes, domainEdges);

    const errorNodeIds: string[] = [];
    const warningNodeIds: string[] = [];

    for (const error of result.errors) {
      if (error.nodeId) errorNodeIds.push(error.nodeId);
    }
    for (const warning of result.warnings) {
      if (warning.nodeId) warningNodeIds.push(warning.nodeId);
    }

    useValidationStore.setState({ result, errorNodeIds, warningNodeIds });
  },
  { equalityFn: (a, b) => a.nodes === b.nodes && a.edges === b.edges }
);
