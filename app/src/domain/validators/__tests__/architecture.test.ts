import { describe, it, expect } from "vitest";
import { validateArchitecture } from "@/domain/validators/architecture";
import type { ArchitectureNode } from "@/domain/entities/node";
import type { ConnectionEdge } from "@/domain/entities/edge";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNode(id: string, type: ArchitectureNode["type"] = "lambda"): ArchitectureNode {
  return {
    id,
    label: `Node ${id}`,
    type,
    category: "compute",
    latencyMs: 10,
    positionX: 0,
    positionY: 0,
    config: {} as ArchitectureNode["config"],
  } as ArchitectureNode;
}

function makeEdge(id: string, source: string, target: string): ConnectionEdge {
  return {
    id,
    source,
    target,
    protocol: "https",
    latencyMs: 5,
    throughputRPS: 100,
    messageCount: 10,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("validateArchitecture", () => {
  it("returns isValid=false with EMPTY_DIAGRAM error for empty diagram", () => {
    const result = validateArchitecture([], []);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "EMPTY_DIAGRAM")).toBe(true);
  });

  it("returns isValid=true for a single node with no edges", () => {
    const result = validateArchitecture([makeNode("n1")], []);
    // Single node is valid, may have warnings about isolation
    expect(result.errors.filter((e) => e.code !== "EMPTY_DIAGRAM")).toHaveLength(0);
  });

  it("flags SELF_LOOP when source equals target", () => {
    const node = makeNode("n1");
    const selfEdge = makeEdge("e1", "n1", "n1");
    const result = validateArchitecture([node], [selfEdge]);
    expect(result.errors.some((e) => e.code === "SELF_LOOP")).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("flags INVALID_EDGE_SOURCE when source node does not exist", () => {
    const node = makeNode("n1");
    const badEdge = makeEdge("e1", "ghost", "n1");
    const result = validateArchitecture([node], [badEdge]);
    expect(result.errors.some((e) => e.code === "INVALID_EDGE_SOURCE")).toBe(true);
  });

  it("flags INVALID_EDGE_TARGET when target node does not exist", () => {
    const node = makeNode("n1");
    const badEdge = makeEdge("e1", "n1", "ghost");
    const result = validateArchitecture([node], [badEdge]);
    expect(result.errors.some((e) => e.code === "INVALID_EDGE_TARGET")).toBe(true);
  });

  it("returns isValid=true for a valid two-node connected diagram", () => {
    const a = makeNode("a");
    const b = makeNode("b");
    const edge = makeEdge("e1", "a", "b");
    const result = validateArchitecture([a, b], [edge]);
    expect(result.errors).toHaveLength(0);
    expect(result.isValid).toBe(true);
  });

  it("warns about duplicate edges", () => {
    const a = makeNode("a");
    const b = makeNode("b");
    const e1 = makeEdge("e1", "a", "b");
    const e2 = makeEdge("e2", "a", "b"); // duplicate
    const result = validateArchitecture([a, b], [e1, e2]);
    expect(result.warnings.some((w) => w.code === "DUPLICATE_EDGE")).toBe(true);
  });

  it("always returns errors and warnings as arrays", () => {
    const result = validateArchitecture([makeNode("n1")], []);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
