import { describe, it, expect } from "vitest";
import { estimateAppComponentCost } from "@/domain/services/cost";
import type { AppComponentNode } from "@/domain/entities/app-component";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNode(
  overrides: Partial<{
    type: AppComponentNode["type"];
    replicas: number;
    cpu: string;
    memory: string;
  }> = {}
): AppComponentNode {
  return {
    id: "app-1",
    label: "Test Component",
    type: overrides.type ?? "microservice",
    category: "application",
    hostInfrastructureNodeId: "infra-1",
    positionX: 0,
    positionY: 0,
    config: {
      replicas: overrides.replicas ?? 1,
      cpu: overrides.cpu ?? "250m",
      memory: overrides.memory ?? "256Mi",
      port: 8080,
      image: "test:latest",
      namespace: "default",
      healthCheckPath: "/health",
      readinessPath: "/ready",
      minReplicas: 1,
      maxReplicas: 3,
      targetCPUPercent: 70,
      targetMemoryPercent: 80,
      serviceType: "ClusterIP",
      restartPolicy: "Always",
      environmentVars: 2,
      volumeMounts: 0,
    },
  } as AppComponentNode;
}

// ── estimateAppComponentCost ──────────────────────────────────────────────────

describe("estimateAppComponentCost", () => {
  it("returns positive cost for default microservice (1 replica, 250m CPU, 256Mi)", () => {
    const node = makeNode();
    const result = estimateAppComponentCost(node);
    expect(result.monthlyCostUSD).toBeGreaterThan(0);
    expect(result.details).toBeTruthy();
    expect(result.lineItems.length).toBeGreaterThan(0);
  });

  it("cost scales linearly with replica count", () => {
    const cost1 = estimateAppComponentCost(makeNode({ replicas: 1 }));
    const cost2 = estimateAppComponentCost(makeNode({ replicas: 2 }));
    const cost4 = estimateAppComponentCost(makeNode({ replicas: 4 }));

    // Cost should roughly double with each doubling of replicas
    expect(cost2.monthlyCostUSD).toBeCloseTo(cost1.monthlyCostUSD * 2, 0);
    expect(cost4.monthlyCostUSD).toBeCloseTo(cost1.monthlyCostUSD * 4, 0);
  });

  it("larger CPU allocation increases cost", () => {
    const low = estimateAppComponentCost(makeNode({ cpu: "250m" }));
    const high = estimateAppComponentCost(makeNode({ cpu: "1000m" }));
    expect(high.monthlyCostUSD).toBeGreaterThan(low.monthlyCostUSD);
  });

  it("larger memory allocation increases cost", () => {
    const low = estimateAppComponentCost(makeNode({ memory: "256Mi" }));
    const high = estimateAppComponentCost(makeNode({ memory: "2048Mi" }));
    expect(high.monthlyCostUSD).toBeGreaterThan(low.monthlyCostUSD);
  });

  it("Gi memory notation is parsed correctly (costs more than Mi equivalent)", () => {
    const miCost = estimateAppComponentCost(makeNode({ memory: "512Mi" }));
    const giCost = estimateAppComponentCost(makeNode({ memory: "1Gi" }));
    // 1Gi = 1024Mi — should be more expensive, but total won't be 2x because CPU cost is shared
    expect(giCost.monthlyCostUSD).toBeGreaterThan(miCost.monthlyCostUSD);
    // The extra memory (512Mi extra) should cost at least $1/month
    expect(giCost.monthlyCostUSD - miCost.monthlyCostUSD).toBeGreaterThan(1);
  });

  it("whole-number CPU string (e.g. '1') is parsed correctly", () => {
    const milliCore = estimateAppComponentCost(makeNode({ cpu: "1000m" }));
    const wholeCore = estimateAppComponentCost(makeNode({ cpu: "1" }));
    // "1" = 1000m — same cost
    expect(wholeCore.monthlyCostUSD).toBeCloseTo(milliCore.monthlyCostUSD, 2);
  });

  it("returns cost for worker component type", () => {
    const workerNode: AppComponentNode = {
      id: "w-1",
      label: "My Worker",
      type: "worker",
      category: "application",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        replicas: 2,
        concurrency: 4,
        memory: "512Mi",
        cpu: "500m",
        image: "worker:latest",
        namespace: "default",
        restartPolicy: "Always",
        queueBinding: "my-queue",
      },
    } as AppComponentNode;
    const result = estimateAppComponentCost(workerNode);
    expect(result.monthlyCostUSD).toBeGreaterThan(0);
  });

  it("returns cost for consumer component type", () => {
    const consumerNode: AppComponentNode = {
      id: "c-1",
      label: "Kafka Consumer",
      type: "consumer",
      category: "messaging-app",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        groupId: "my-group",
        topics: ["events"],
        batchSize: 100,
        autoCommit: true,
        replicas: 3,
        memory: "512Mi",
        cpu: "250m",
        image: "consumer:latest",
        namespace: "default",
        offsetReset: "latest",
        maxPollRecords: 500,
      },
    } as AppComponentNode;
    const result = estimateAppComponentCost(consumerNode);
    expect(result.monthlyCostUSD).toBeGreaterThan(0);
    // 3 replicas should cost ~3x single replica at same CPU/mem
    const singleReplica = estimateAppComponentCost({
      ...consumerNode,
      config: { ...consumerNode.config, replicas: 1 },
    } as AppComponentNode);
    expect(result.monthlyCostUSD).toBeCloseTo(singleReplica.monthlyCostUSD * 3, 0);
  });

  it("line items are non-negative", () => {
    const result = estimateAppComponentCost(makeNode({ replicas: 2, cpu: "500m", memory: "1Gi" }));
    for (const item of result.lineItems) {
      expect(item.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it("monthly cost equals sum of all line items", () => {
    const result = estimateAppComponentCost(makeNode({ replicas: 2, cpu: "500m", memory: "512Mi" }));
    const sumItems = result.lineItems.reduce((acc, i) => acc + i.amount, 0);
    expect(result.monthlyCostUSD).toBeCloseTo(sumItems, 5);
  });
});
