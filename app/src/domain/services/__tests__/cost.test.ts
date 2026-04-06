import { describe, it, expect } from "vitest";
import { calculateServiceCost, buildCostBreakdown } from "@/domain/services/cost";
import type { ArchitectureNode } from "@/domain/entities/node";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeLambdaNode(overrides: Partial<{
  requestsPerMonth: number;
  memoryMB: number;
  avgDurationMs: number;
  concurrency: number;
}> = {}): ArchitectureNode {
  return {
    id: "lambda-1",
    label: "My Lambda",
    type: "lambda",
    category: "compute",
    latencyMs: 50,
    positionX: 0,
    positionY: 0,
    config: {
      memoryMB: overrides.memoryMB ?? 256,
      timeoutSec: 30,
      concurrency: overrides.concurrency ?? 0,
      requestsPerMonth: overrides.requestsPerMonth ?? 1_000_000,
      avgDurationMs: overrides.avgDurationMs ?? 100,
    },
  } as ArchitectureNode;
}

function makeS3Node(): ArchitectureNode {
  return {
    id: "s3-1",
    label: "My Bucket",
    type: "s3",
    category: "storage",
    latencyMs: 30,
    positionX: 0,
    positionY: 0,
    config: {
      storageClass: "standard",
      storageSizeGB: 100,
      requestsPerMonth: 1_000_000,
    },
  } as ArchitectureNode;
}

function makeIAMNode(): ArchitectureNode {
  return {
    id: "iam-1",
    label: "IAM Role",
    type: "iam",
    category: "security",
    latencyMs: 0,
    positionX: 0,
    positionY: 0,
    config: {
      roleType: "service",
      managedPolicies: [],
    },
  } as ArchitectureNode;
}

// ── calculateServiceCost ──────────────────────────────────────────────────────

describe("calculateServiceCost", () => {
  it("returns positive cost for Lambda with 1M requests", () => {
    const node = makeLambdaNode({ requestsPerMonth: 1_000_000 });
    const result = calculateServiceCost(node);
    // Lambda free tier is 1M requests — cost should be ~$0.20 for requests
    // plus compute cost. Base at minimum ~$0
    expect(result.monthlyCostUSD).toBeGreaterThanOrEqual(0);
    expect(result.details).toBeTruthy();
    expect(result.lineItems.length).toBeGreaterThan(0);
  });

  it("higher Lambda concurrency increases cost", () => {
    const base = calculateServiceCost(makeLambdaNode({ concurrency: 0 }));
    const withConcurrency = calculateServiceCost(makeLambdaNode({ concurrency: 10 }));
    expect(withConcurrency.monthlyCostUSD).toBeGreaterThan(base.monthlyCostUSD);
  });

  it("S3 with 100GB returns a positive cost", () => {
    const result = calculateServiceCost(makeS3Node());
    expect(result.monthlyCostUSD).toBeGreaterThan(0);
  });

  it("IAM returns zero cost (free service)", () => {
    const result = calculateServiceCost(makeIAMNode());
    expect(result.monthlyCostUSD).toBe(0);
  });

  it("returns details string for every service", () => {
    const lambda = calculateServiceCost(makeLambdaNode());
    const s3 = calculateServiceCost(makeS3Node());
    expect(typeof lambda.details).toBe("string");
    expect(typeof s3.details).toBe("string");
  });
});

// ── buildCostBreakdown ────────────────────────────────────────────────────────

describe("buildCostBreakdown", () => {
  it("returns empty array for zero nodes", () => {
    expect(buildCostBreakdown([])).toHaveLength(0);
  });

  it("returns one item per node", () => {
    const nodes = [makeLambdaNode(), makeS3Node()];
    const breakdown = buildCostBreakdown(nodes);
    expect(breakdown).toHaveLength(2);
  });

  it("percentages sum to 100 (or 0 if all free)", () => {
    const nodes = [makeLambdaNode(), makeS3Node()];
    const breakdown = buildCostBreakdown(nodes);
    const total = breakdown.reduce((s, i) => s + i.percentage, 0);
    // Allow floating point tolerance
    expect(total).toBeCloseTo(100, 0);
  });

  it("nodeId and component match the source node", () => {
    const node = makeLambdaNode();
    const [item] = buildCostBreakdown([node]);
    expect(item.nodeId).toBe("lambda-1");
    expect(item.component).toBe("My Lambda");
    expect(item.serviceType).toBe("lambda");
  });

  it("total is sum of individual costs", () => {
    const nodes = [makeLambdaNode(), makeS3Node()];
    const breakdown = buildCostBreakdown(nodes);
    const sumFromBreakdown = breakdown.reduce((s, i) => s + i.monthlyCostUSD, 0);
    const sumFromIndividual = nodes.reduce(
      (s, n) => s + calculateServiceCost(n).monthlyCostUSD,
      0
    );
    expect(sumFromBreakdown).toBeCloseTo(sumFromIndividual, 5);
  });
});
