// ─── Simulation Input ────────────────────────────────────────────────────────

import type { ArchitectureNode } from "./node";
import type { ConnectionEdge } from "./edge";

export interface SimulationInput {
  nodes: ArchitectureNode[];
  edges: ConnectionEdge[];
}

// ─── Simulation Results ──────────────────────────────────────────────────────

export interface Bottleneck {
  nodeId: string;
  nodeName: string;
  latencyMs: number;
  type: string;
  reason: string;
}

export interface PathAnalysis {
  path: string[];
  pathNames: string[];
  totalLatencyMs: number;
  totalMessages: number;
  isLongest: boolean;
}

export interface ResourceUtilization {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  utilization: number;
  throughput: string;
  availability: string;
}

export interface SimulationResult {
  totalLatencyMs: number;
  totalMessages: number;
  totalProcessingTimeMs: number;
  bottlenecks: Bottleneck[];
  pathAnalysis: PathAnalysis[];
  resourceUtilization: ResourceUtilization[];
  totalMonthlyCostUSD: number;
  costBreakdown: CostBreakdownItem[];
  recommendations: Recommendation[];
  timestamp: string;
}

// ─── Cost Types ──────────────────────────────────────────────────────────────

export interface CostBreakdownItem {
  nodeId: string;
  component: string;
  serviceType: string;
  monthlyCostUSD: number;
  details: string;
  percentage: number;
}

export interface CostEstimate {
  totalMonthlyCostUSD: number;
  breakdown: CostBreakdownItem[];
  currency: "USD";
  region: string;
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export type RecommendationSeverity = "info" | "warning" | "critical";
export type RecommendationCategory =
  | "performance"
  | "cost"
  | "reliability"
  | "security";

export interface Recommendation {
  severity: RecommendationSeverity;
  category: RecommendationCategory;
  title: string;
  description: string;
  affectedNodeIds: string[];
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  nodeId?: string;
  edgeId?: string;
  message: string;
  code: string;
}
