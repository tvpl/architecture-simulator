import { describe, it, expect } from "vitest";
import { validateSolutionDesign, validateCrossLayer } from "../solution-design";
import type { AppComponentNode } from "../../entities/app-component";
import type { ArchitectureNode } from "../../entities/node";
import type { ConnectionEdge } from "../../entities/edge";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAppNode(
  overrides: Partial<AppComponentNode> = {}
): AppComponentNode {
  return {
    id: "app-1",
    label: "My Service",
    type: "microservice",
    category: "application",
    hostInfrastructureNodeId: "infra-1",
    positionX: 0,
    positionY: 0,
    config: { replicas: 1, cpu: "250m", memory: "256Mi", port: 8080 },
    ...overrides,
  } as AppComponentNode;
}

function makeInfraNode(
  overrides: Partial<ArchitectureNode> & { type?: string; category?: string } = {}
): ArchitectureNode {
  return {
    id: "infra-1",
    label: "EKS Cluster",
    type: "eks",
    category: "compute",
    latencyMs: 5,
    positionX: 0,
    positionY: 0,
    config: {},
    ...overrides,
  } as unknown as ArchitectureNode;
}

function makeEdge(
  overrides: Partial<ConnectionEdge> = {}
): ConnectionEdge {
  return {
    id: "e-1",
    source: "app-1",
    target: "app-2",
    protocol: "http",
    ...overrides,
  } as ConnectionEdge;
}

// ─── validateSolutionDesign ─────────────────────────────────────────────────

describe("validateSolutionDesign", () => {
  it("returns valid for empty input", () => {
    const result = validateSolutionDesign([], []);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns valid for well-formed single node", () => {
    const result = validateSolutionDesign([makeAppNode()], []);
    expect(result.isValid).toBe(true);
  });

  it("detects missing label", () => {
    const node = makeAppNode({ label: "" });
    const result = validateSolutionDesign([node], []);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "L2_MISSING_LABEL")).toBe(true);
  });

  it("detects missing host", () => {
    const node = makeAppNode({ hostInfrastructureNodeId: "" });
    const result = validateSolutionDesign([node], []);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "L2_NO_HOST")).toBe(true);
  });

  it("detects invalid edge source", () => {
    const node = makeAppNode({ id: "app-1" });
    const edge = makeEdge({ source: "nonexistent", target: "app-1" });
    const result = validateSolutionDesign([node], [edge]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "L2_INVALID_EDGE_SOURCE")).toBe(true);
  });

  it("detects invalid edge target", () => {
    const node = makeAppNode({ id: "app-1" });
    const edge = makeEdge({ source: "app-1", target: "nonexistent" });
    const result = validateSolutionDesign([node], [edge]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "L2_INVALID_EDGE_TARGET")).toBe(true);
  });

  it("warns about isolated components", () => {
    const nodes = [
      makeAppNode({ id: "app-1" }),
      makeAppNode({ id: "app-2", label: "Isolated" }),
    ];
    const edges = [makeEdge({ source: "app-1", target: "app-1" })]; // self-loop, app-2 isolated
    const result = validateSolutionDesign(nodes, edges);
    expect(result.warnings.some((w) => w.code === "L2_ISOLATED")).toBe(true);
  });

  it("does not warn about isolation for single node", () => {
    const result = validateSolutionDesign([makeAppNode()], []);
    expect(result.warnings).toHaveLength(0);
  });
});

// ─── validateCrossLayer ─────────────────────────────────────────────────────

describe("validateCrossLayer", () => {
  it("returns valid for empty app nodes", () => {
    const result = validateCrossLayer([makeInfraNode()], []);
    expect(result.isValid).toBe(true);
  });

  it("returns valid for proper host assignment", () => {
    const infra = makeInfraNode({ id: "infra-1", type: "eks" });
    const app = makeAppNode({ hostInfrastructureNodeId: "infra-1" });
    const result = validateCrossLayer([infra], [app]);
    expect(result.isValid).toBe(true);
  });

  it("detects missing host infrastructure", () => {
    const app = makeAppNode({ hostInfrastructureNodeId: "deleted-host" });
    const result = validateCrossLayer([], [app]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "CROSS_HOST_MISSING")).toBe(true);
  });

  it("detects invalid host type (s3 cannot host apps)", () => {
    const infra = makeInfraNode({ id: "infra-1", type: "s3", category: "storage" });
    const app = makeAppNode({ hostInfrastructureNodeId: "infra-1" });
    const result = validateCrossLayer([infra], [app]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "CROSS_INVALID_HOST_TYPE")).toBe(true);
  });

  it("allows valid hostable types (ec2, ecs, eks, lambda, fargate)", () => {
    const hostTypes = ["ec2", "ecs", "eks", "lambda", "fargate"] as const;
    for (const type of hostTypes) {
      const infra = makeInfraNode({ id: "infra-1", type });
      const app = makeAppNode({ hostInfrastructureNodeId: "infra-1" });
      const result = validateCrossLayer([infra], [app]);
      expect(result.isValid).toBe(true);
    }
  });

  it("warns about consumer without messaging infra", () => {
    const infra = makeInfraNode({ id: "infra-1", type: "eks" });
    const app = makeAppNode({
      type: "consumer",
      category: "messaging-app",
      hostInfrastructureNodeId: "infra-1",
    });
    const result = validateCrossLayer([infra], [app]);
    expect(result.warnings.some((w) => w.code === "CROSS_NO_MESSAGING_INFRA")).toBe(true);
  });

  it("no messaging warning when SQS is present", () => {
    const infra = [
      makeInfraNode({ id: "infra-1", type: "eks" }),
      makeInfraNode({ id: "infra-2", type: "sqs", category: "messaging" }),
    ];
    const app = makeAppNode({
      type: "consumer",
      category: "messaging-app",
      hostInfrastructureNodeId: "infra-1",
    });
    const result = validateCrossLayer(infra, [app]);
    expect(result.warnings.some((w) => w.code === "CROSS_NO_MESSAGING_INFRA")).toBe(false);
  });

  it("warns about database client without database infra", () => {
    const infra = makeInfraNode({ id: "infra-1", type: "eks" });
    const app = makeAppNode({
      type: "database-client",
      category: "data-access",
      hostInfrastructureNodeId: "infra-1",
    });
    const result = validateCrossLayer([infra], [app]);
    expect(result.warnings.some((w) => w.code === "CROSS_NO_DB_INFRA")).toBe(true);
  });

  it("warns about cache client without ElastiCache", () => {
    const infra = makeInfraNode({ id: "infra-1", type: "eks" });
    const app = makeAppNode({
      type: "cache-client",
      category: "data-access",
      hostInfrastructureNodeId: "infra-1",
    });
    const result = validateCrossLayer([infra], [app]);
    expect(result.warnings.some((w) => w.code === "CROSS_NO_CACHE_INFRA")).toBe(true);
  });

  it("warns about overloaded host (>10 components)", () => {
    const infra = makeInfraNode({ id: "infra-1", type: "eks" });
    const apps = Array.from({ length: 11 }, (_, i) =>
      makeAppNode({
        id: `app-${i}`,
        label: `Service ${i}`,
        hostInfrastructureNodeId: "infra-1",
      })
    );
    const result = validateCrossLayer([infra], apps);
    expect(result.warnings.some((w) => w.code === "CROSS_HOST_OVERLOADED")).toBe(true);
  });
});
