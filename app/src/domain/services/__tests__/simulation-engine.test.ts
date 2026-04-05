import { describe, it, expect } from "vitest";
import { runSimulation } from "@/domain/services/simulation-engine";
import type { ArchitectureNode } from "@/domain/entities/node";
import type { ConnectionEdge } from "@/domain/entities/edge";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeLambda(id: string, label = "Lambda"): ArchitectureNode {
  return {
    id,
    label,
    type: "lambda",
    category: "compute",
    latencyMs: 50,
    positionX: 0,
    positionY: 0,
    config: {
      memoryMB: 256,
      timeoutSec: 30,
      concurrency: 0,
      requestsPerMonth: 1_000_000,
      avgDurationMs: 100,
    },
  } as ArchitectureNode;
}

function makeRDS(id: string, label = "RDS"): ArchitectureNode {
  return {
    id,
    label,
    type: "rds",
    category: "storage",
    latencyMs: 5,
    positionX: 100,
    positionY: 0,
    config: {
      engine: "postgres",
      instanceClass: "db.t3.micro",
      multiAZ: false,
      storageGB: 20,
      readReplicas: 0,
    },
  } as ArchitectureNode;
}

function makeEdge(
  id: string,
  source: string,
  target: string
): ConnectionEdge {
  return {
    id,
    source,
    target,
    protocol: "https",
    latencyMs: 10,
    throughputRPS: 500,
    messageCount: 100,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("runSimulation", () => {
  it("returns empty result for empty diagram", () => {
    const result = runSimulation([], []);
    expect(result.pathAnalysis).toHaveLength(0);
    expect(result.bottlenecks).toHaveLength(0);
    expect(result.totalLatencyMs).toBe(0);
    expect(result.totalMonthlyCostUSD).toBeGreaterThanOrEqual(0);
  });

  it("handles single node with no connections", () => {
    const result = runSimulation([makeLambda("n1")], []);
    expect(result.resourceUtilization).toHaveLength(1);
    expect(result.resourceUtilization[0].nodeId).toBe("n1");
  });

  it("computes path latency for two connected nodes", () => {
    const lambda = makeLambda("n1", "API");
    const rds = makeRDS("n2", "DB");
    const edge = makeEdge("e1", "n1", "n2");

    const result = runSimulation([lambda, rds], [edge]);

    // Should find at least one path
    expect(result.pathAnalysis.length).toBeGreaterThan(0);
    // Path latency should be positive
    expect(result.totalLatencyMs).toBeGreaterThan(0);
  });

  it("includes all nodes in resource utilization", () => {
    const lambda = makeLambda("n1");
    const rds = makeRDS("n2");
    const edge = makeEdge("e1", "n1", "n2");

    const result = runSimulation([lambda, rds], [edge]);

    const nodeIds = result.resourceUtilization.map((r) => r.nodeId);
    expect(nodeIds).toContain("n1");
    expect(nodeIds).toContain("n2");
  });

  it("handles cycles gracefully without infinite loop", () => {
    const a = makeLambda("a", "Service A");
    const b = makeLambda("b", "Service B");
    const edgeAB = makeEdge("e1", "a", "b");
    const edgeBA = makeEdge("e2", "b", "a"); // cycle

    // Should not throw or hang
    expect(() => runSimulation([a, b], [edgeAB, edgeBA])).not.toThrow();
  });

  it("identifies the longest path as critical", () => {
    const entry = makeLambda("entry", "Entry");
    const slow = makeRDS("slow", "Slow DB");
    const edge = makeEdge("e1", "entry", "slow");

    const result = runSimulation([entry, slow], [edge]);

    if (result.pathAnalysis.length > 0) {
      const hasCritical = result.pathAnalysis.some((p) => p.isLongest);
      expect(hasCritical).toBe(true);
    }
  });

  it("returns non-negative monthly cost", () => {
    const lambda = makeLambda("n1");
    const result = runSimulation([lambda], []);
    expect(result.totalMonthlyCostUSD).toBeGreaterThanOrEqual(0);
  });
});
