/**
 * flow-store.test.ts
 * Tests for the V2→V3 migration helper and store mutations.
 * Uses vi.hoisted to provide a localStorage mock before module evaluation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mock localStorage BEFORE any module is loaded ────────────────────────────
// vi.hoisted() runs before imports are evaluated by the module system.
const { mockStorage } = vi.hoisted(() => {
  let _store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => _store[key] ?? null,
    setItem: (key: string, value: string) => { _store[key] = value; },
    removeItem: (key: string) => { delete _store[key]; },
    clear: () => { _store = {}; },
    length: 0,
  };
  return { mockStorage };
});

vi.stubGlobal("localStorage", mockStorage);

// Import AFTER stubbing global
import { useFlowStore } from "@/stores/flow-store";
import type { ProjectData } from "@/stores/flow-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function freshStore() {
  useFlowStore.getState().clearCanvas();
  mockStorage.clear();
}

// ── V2 → V3 migration ─────────────────────────────────────────────────────────

describe("importProject — V2→V3 migration", () => {
  beforeEach(freshStore);

  it("imports V3 project data correctly", () => {
    const v3: ProjectData = {
      version: 3,
      name: "My Project",
      infrastructure: { nodes: [], edges: [] },
      solutionDesign: { nodes: [], edges: [] },
      savedAt: new Date().toISOString(),
    };

    useFlowStore.getState().importProject(v3);
    const state = useFlowStore.getState();
    expect(state.projectName).toBe("My Project");
    expect(state.nodes).toHaveLength(0);
    expect(state.solutionNodes).toHaveLength(0);
  });

  it("migrates V2 data: puts nodes in infrastructure, initializes empty solutionNodes", () => {
    // Construct a minimal V2 payload — cast to 'unknown as ProjectData' to bypass
    // private type (ProjectDataV2) while still exercising the migration branch.
    const v2 = {
      version: 2,
      name: "Legacy Project",
      nodes: [
        {
          id: "ec2-1",
          type: "service-node",
          position: { x: 0, y: 0 },
          data: {
            id: "ec2-1",
            label: "EC2 Instance",
            type: "ec2",
            category: "compute",
            latencyMs: 10,
            positionX: 0,
            positionY: 0,
            config: { instanceType: "t3.micro", instanceCount: 1, storageGB: 20, os: "linux" },
          },
        },
      ],
      edges: [],
      savedAt: new Date().toISOString(),
    };

    useFlowStore.getState().importProject(v2 as unknown as ProjectData);
    const state = useFlowStore.getState();
    expect(state.projectName).toBe("Legacy Project");
    expect(state.nodes).toHaveLength(1);
    expect(state.solutionNodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
  });
});

// ── addAppComponent ───────────────────────────────────────────────────────────

describe("addAppComponent", () => {
  beforeEach(freshStore);

  it("adds a solution node with correct type and host", () => {
    const id = useFlowStore.getState().addAppComponent(
      "microservice",
      { x: 100, y: 100 },
      "infra-host-1",
      "Auth Service"
    );

    const { solutionNodes } = useFlowStore.getState();
    expect(solutionNodes).toHaveLength(1);

    const node = solutionNodes[0];
    expect(node.id).toBe(id);
    expect(node.data.type).toBe("microservice");
    expect(node.data.hostInfrastructureNodeId).toBe("infra-host-1");
    expect(node.data.label).toBe("Auth Service");
  });

  it("assigns default label when none provided", () => {
    useFlowStore.getState().addAppComponent("worker", { x: 0, y: 0 }, "host-1");
    const { solutionNodes } = useFlowStore.getState();
    expect(solutionNodes[0].data.label).toBeTruthy();
  });

  it("increments solution nodes on each add", () => {
    const store = useFlowStore.getState();
    store.addAppComponent("microservice", { x: 0, y: 0 }, "host-1");
    store.addAppComponent("worker", { x: 10, y: 10 }, "host-1");
    store.addAppComponent("api", { x: 20, y: 20 }, "host-2");

    expect(useFlowStore.getState().solutionNodes).toHaveLength(3);
  });
});

// ── removeAppComponent ────────────────────────────────────────────────────────

describe("removeAppComponent", () => {
  beforeEach(freshStore);

  it("removes the correct solution node", () => {
    const store = useFlowStore.getState();
    const id1 = store.addAppComponent("microservice", { x: 0, y: 0 }, "host-1", "Svc A");
    store.addAppComponent("worker", { x: 10, y: 10 }, "host-1", "Worker B");

    store.removeAppComponent(id1);

    const { solutionNodes } = useFlowStore.getState();
    expect(solutionNodes).toHaveLength(1);
    expect(solutionNodes[0].data.label).toBe("Worker B");
  });
});

// ── updateAppComponentConfig ──────────────────────────────────────────────────

describe("updateAppComponentConfig", () => {
  beforeEach(freshStore);

  it("merges config patch without losing other fields", () => {
    const id = useFlowStore.getState().addAppComponent(
      "microservice",
      { x: 0, y: 0 },
      "host-1",
      "My Service"
    );

    useFlowStore.getState().updateAppComponentConfig(id, { replicas: 5 });

    const node = useFlowStore.getState().solutionNodes.find((n) => n.id === id);
    expect(node).toBeTruthy();
    const cfg = node!.data.config as unknown as Record<string, unknown>;
    expect(cfg.replicas).toBe(5);
    // Other fields should still exist
    expect(cfg.cpu).toBeTruthy();
  });
});

// ── removeNode cascade ────────────────────────────────────────────────────────

describe("removeNode cascade", () => {
  beforeEach(freshStore);

  it("removing infra node also removes its hosted app components", () => {
    const store = useFlowStore.getState();

    // Add infra node
    const infraId = store.addNode("eks", { x: 0, y: 0 }, "EKS Cluster");

    // Add app component hosted on infra
    store.addAppComponent("microservice", { x: 10, y: 10 }, infraId, "My Service");
    expect(useFlowStore.getState().solutionNodes).toHaveLength(1);

    // Remove infra node — should cascade to app components
    store.removeNode(infraId);

    expect(useFlowStore.getState().nodes).toHaveLength(0);
    expect(useFlowStore.getState().solutionNodes).toHaveLength(0);
  });
});

// ── exportProject / importProject round-trip ──────────────────────────────────

describe("exportProject / importProject round-trip", () => {
  beforeEach(freshStore);

  it("exported V3 data can be re-imported with the same structure", () => {
    const store = useFlowStore.getState();
    const infraId = store.addNode("lambda", { x: 50, y: 50 }, "My Lambda");
    store.addAppComponent("microservice", { x: 100, y: 100 }, infraId, "My Service");

    const exported = store.exportProject();

    // Clear and re-import
    store.clearCanvas();
    expect(useFlowStore.getState().nodes).toHaveLength(0);

    store.importProject(exported);

    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.solutionNodes).toHaveLength(1);
    expect(state.nodes[0].data.label).toBe("My Lambda");
    expect(state.solutionNodes[0].data.label).toBe("My Service");
  });

  it("exported data has version 3", () => {
    const exported = useFlowStore.getState().exportProject();
    expect(exported.version).toBe(3);
  });

  it("exported data has infrastructure and solutionDesign sections", () => {
    const exported = useFlowStore.getState().exportProject();
    expect(exported.infrastructure).toBeDefined();
    expect(exported.solutionDesign).toBeDefined();
    expect(Array.isArray(exported.infrastructure.nodes)).toBe(true);
    expect(Array.isArray(exported.solutionDesign.nodes)).toBe(true);
  });

  it("projectName is preserved across export/import", () => {
    useFlowStore.getState().setProjectName("Minha Arquitetura EKS");
    const exported = useFlowStore.getState().exportProject();
    useFlowStore.getState().clearCanvas();
    useFlowStore.getState().importProject(exported);
    expect(useFlowStore.getState().projectName).toBe("Minha Arquitetura EKS");
  });
});
