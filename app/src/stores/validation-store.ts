"use client";
/**
 * Validation Store — reactively runs validation whenever nodes/edges change.
 * Validates both infrastructure (L1) and solution design (L2) layers,
 * including cross-layer relationships.
 */
import { create } from "zustand";
import { useFlowStore } from "./flow-store";
import { validateArchitecture } from "@/domain/validators/architecture";
import { validateSolutionDesign, validateCrossLayer } from "@/domain/validators/solution-design";
import type { ValidationResult, ValidationError, ValidationWarning } from "@/domain/entities/simulation";

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

/** Merge multiple ValidationResults into one */
function mergeResults(...results: ValidationResult[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  for (const r of results) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  return { isValid: errors.length === 0, errors, warnings };
}

// Reactively re-validate whenever nodes or edges change (any layer)
useFlowStore.subscribe(
  (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    solutionNodes: state.solutionNodes,
    solutionEdges: state.solutionEdges,
  }),
  ({ nodes, edges, solutionNodes, solutionEdges }) => {
    const domainNodes = nodes.map((n) => n.data);
    const domainEdges = edges.map((e) => e.data!).filter(Boolean);
    const appNodes = solutionNodes.map((n) => n.data);
    const appEdges = solutionEdges.map((e) => e.data!).filter(Boolean);

    const infraResult = validateArchitecture(domainNodes, domainEdges);
    const solutionResult = validateSolutionDesign(appNodes, appEdges);
    const crossResult = validateCrossLayer(domainNodes, appNodes);

    const result = mergeResults(infraResult, solutionResult, crossResult);

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
  {
    equalityFn: (a, b) =>
      a.nodes === b.nodes &&
      a.edges === b.edges &&
      a.solutionNodes === b.solutionNodes &&
      a.solutionEdges === b.solutionEdges,
  }
);
