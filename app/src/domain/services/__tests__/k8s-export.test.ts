import { describe, it, expect } from "vitest";
import { generateK8sManifests } from "@/domain/services/k8s-export";
import type { AppComponentNode } from "@/domain/entities/app-component";
import type { ArchitectureNode } from "@/domain/entities/node";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeInfraNode(id = "infra-1", type = "eks"): ArchitectureNode {
  return {
    id,
    label: "EKS Cluster",
    type,
    category: "compute",
    latencyMs: 5,
    positionX: 0,
    positionY: 0,
    config: {},
  } as unknown as ArchitectureNode;
}

function makeMicroservice(overrides: Partial<AppComponentNode> = {}): AppComponentNode {
  return {
    id: "app-ms-1",
    label: "My Service",
    type: "microservice",
    category: "application",
    hostInfrastructureNodeId: "infra-1",
    positionX: 0,
    positionY: 0,
    config: {
      replicas: 2,
      cpu: "500m",
      memory: "512Mi",
      port: 8080,
      image: "my-service:1.0",
      namespace: "production",
      healthCheckPath: "/health",
      readinessPath: "/ready",
      minReplicas: 2,
      maxReplicas: 5,
      targetCPUPercent: 70,
      targetMemoryPercent: 80,
      serviceType: "ClusterIP",
      restartPolicy: "Always",
      environmentVars: 0,
      volumeMounts: 0,
    },
    ...overrides,
  } as AppComponentNode;
}

// ── generateK8sManifests ──────────────────────────────────────────────────────

describe("generateK8sManifests", () => {
  it("returns empty comment for zero components", () => {
    const yaml = generateK8sManifests([], []);
    expect(yaml).toContain("Nenhum componente");
  });

  it("generates Deployment for microservice", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("kind: Deployment");
    expect(yaml).toContain("name: my-service");
  });

  it("generates Service for microservice", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("kind: Service");
  });

  it("generates HPA when autoscaling is configured (minReplicas < maxReplicas)", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("kind: HorizontalPodAutoscaler");
  });

  it("does NOT generate HPA when min === max replicas", () => {
    const node = makeMicroservice({
      config: {
        ...(makeMicroservice().config as object),
        minReplicas: 2,
        maxReplicas: 2,
      } as AppComponentNode["config"],
    });
    const yaml = generateK8sManifests([node], [makeInfraNode()]);
    expect(yaml).not.toContain("kind: HorizontalPodAutoscaler");
  });

  it("includes resource requests and limits in Deployment", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("requests:");
    expect(yaml).toContain("limits:");
    expect(yaml).toContain("cpu:");
    expect(yaml).toContain("memory:");
  });

  it("includes health probes when healthCheckPath is set", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("livenessProbe:");
    expect(yaml).toContain("readinessProbe:");
  });

  it("generates CronJob for cronjob type", () => {
    const cronNode: AppComponentNode = {
      id: "cron-1",
      label: "My CronJob",
      type: "cronjob",
      category: "scheduling",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        schedule: "0 2 * * *",
        command: "./run-job.sh",
        concurrencyPolicy: "Forbid",
        successfulJobsHistoryLimit: 3,
        failedJobsHistoryLimit: 1,
        memory: "256Mi",
        cpu: "250m",
        image: "cronjob:latest",
        namespace: "default",
        activeDeadlineSeconds: 300,
      },
    } as AppComponentNode;

    const yaml = generateK8sManifests([cronNode], [makeInfraNode()]);
    expect(yaml).toContain("kind: CronJob");
    expect(yaml).toContain("schedule:");
  });

  it("generates Ingress for ingress-controller type", () => {
    const ingressNode: AppComponentNode = {
      id: "ingress-1",
      label: "Main Ingress",
      type: "ingress-controller",
      category: "networking-app",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        type: "nginx",
        tls: false,
        hosts: ["app.example.com"],
        paths: ["/"],
        replicas: 2,
        memory: "256Mi",
        cpu: "250m",
      },
    } as AppComponentNode;

    const yaml = generateK8sManifests([ingressNode], [makeInfraNode()]);
    expect(yaml).toContain("kind: Ingress");
  });

  it("generates Job for batch-processor type", () => {
    const batchNode: AppComponentNode = {
      id: "batch-1",
      label: "Data Migrator",
      type: "batch-processor",
      category: "application",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        batchSize: 1000,
        parallelism: 4,
        memory: "1Gi",
        cpu: "1000m",
        image: "migrator:latest",
        namespace: "default",
        retryAttempts: 3,
        timeoutMs: 60000,
      },
    } as AppComponentNode;

    const yaml = generateK8sManifests([batchNode], [makeInfraNode()]);
    expect(yaml).toContain("kind: Job");
  });

  it("generates ConfigMap for database-client type", () => {
    const dbClientNode: AppComponentNode = {
      id: "db-client-1",
      label: "Postgres Client",
      type: "database-client",
      category: "data-access",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        connectionPoolSize: 10,
        timeoutMs: 5000,
        retryAttempts: 3,
        targetDatabase: "my-rds",
      },
    } as AppComponentNode;

    const yaml = generateK8sManifests([dbClientNode], [makeInfraNode()]);
    expect(yaml).toContain("kind: ConfigMap");
  });

  it("sanitizes labels with special characters", () => {
    const node = makeMicroservice({ id: "app-2", label: "My_Service__v2" });
    const yaml = generateK8sManifests([node], [makeInfraNode()]);
    // safeLabel: lowercase + special chars → dashes + collapse consecutive dashes
    // "My_Service__v2" → "my-service--v2" → "my-service-v2"
    expect(yaml).toContain("my-service-v2");
  });

  it("includes host comment referencing infra node label", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("EKS Cluster");
  });

  it("generates manifests for multiple components", () => {
    const nodes = [
      makeMicroservice({ id: "ms-1", label: "Auth Service" }),
      makeMicroservice({ id: "ms-2", label: "Payment Service" }),
    ];
    const yaml = generateK8sManifests(nodes, [makeInfraNode()]);
    expect(yaml).toContain("auth-service");
    expect(yaml).toContain("payment-service");
  });

  it("includes namespace from config", () => {
    const yaml = generateK8sManifests([makeMicroservice()], [makeInfraNode()]);
    expect(yaml).toContain("namespace: production");
  });

  it("generates Deployment for api type with Service", () => {
    const apiNode = makeMicroservice({ id: "api-1", label: "REST API", type: "api" });
    const yaml = generateK8sManifests([apiNode], [makeInfraNode()]);
    expect(yaml).toContain("kind: Deployment");
    expect(yaml).toContain("kind: Service");
  });

  it("generates Deployment for worker WITHOUT Service", () => {
    const workerNode: AppComponentNode = {
      id: "worker-1",
      label: "Background Worker",
      type: "worker",
      category: "application",
      hostInfrastructureNodeId: "infra-1",
      positionX: 0,
      positionY: 0,
      config: {
        replicas: 2,
        concurrency: 4,
        memory: "512Mi",
        cpu: "250m",
        image: "worker:latest",
        namespace: "default",
        restartPolicy: "Always",
        queueBinding: "events",
      },
    } as AppComponentNode;

    const yaml = generateK8sManifests([workerNode], [makeInfraNode()]);
    expect(yaml).toContain("kind: Deployment");
    // Workers don't expose a Service
    const serviceCount = (yaml.match(/kind: Service/g) ?? []).length;
    expect(serviceCount).toBe(0);
  });
});
