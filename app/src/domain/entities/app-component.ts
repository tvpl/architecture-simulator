// ─── Application Component Types (Layer 2: Solution Design) ─────────────────
// These represent what runs INSIDE infrastructure components from Layer 1.

import type { AWSServiceType } from "./node";

export const APP_COMPONENT_TYPES = [
  "microservice",
  "worker",
  "consumer",
  "producer",
  "api",
  "sidecar",
  "ingress-controller",
  "cronjob",
  "gateway",
  "database-client",
  "cache-client",
  "batch-processor",
] as const;

export type AppComponentType = (typeof APP_COMPONENT_TYPES)[number];

export const APP_COMPONENT_CATEGORIES = [
  "application",
  "messaging-app",
  "networking-app",
  "scheduling",
  "data-access",
] as const;

export type AppComponentCategory = (typeof APP_COMPONENT_CATEGORIES)[number];

// ─── Per-Component Configuration Types ──────────────────────────────────────

export interface MicroserviceConfig {
  replicas: number;
  cpu: string;
  memory: string;
  port: number;
  image: string;
  namespace: string;
  healthCheckPath: string;
  readinessPath: string;
  minReplicas: number;
  maxReplicas: number;
  targetCPUPercent: number;
  targetMemoryPercent: number;
  serviceType: "ClusterIP" | "NodePort" | "LoadBalancer";
  restartPolicy: "Always" | "OnFailure" | "Never";
  environmentVars: number;
  volumeMounts: number;
}

export interface WorkerConfig {
  replicas: number;
  concurrency: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
  restartPolicy: "Always" | "OnFailure" | "Never";
  queueBinding: string;
}

export interface ConsumerConfig {
  groupId: string;
  topics: string[];
  batchSize: number;
  autoCommit: boolean;
  replicas: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
  offsetReset: "earliest" | "latest";
  maxPollRecords: number;
}

export interface ProducerConfig {
  topics: string[];
  serializationFormat: "json" | "avro" | "protobuf";
  batchSize: number;
  lingerMs: number;
  acks: "0" | "1" | "all";
  replicas: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
}

export interface APIConfig {
  type: "rest" | "grpc" | "graphql";
  port: number;
  rateLimit: number;
  replicas: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
  healthCheckPath: string;
  corsEnabled: boolean;
  authType: "none" | "jwt" | "oauth2" | "api-key";
  serviceType: "ClusterIP" | "NodePort" | "LoadBalancer";
}

export interface SidecarConfig {
  type: "envoy" | "istio" | "fluentd" | "datadog" | "custom";
  port: number;
  protocol: "http" | "grpc" | "tcp";
  memory: string;
  cpu: string;
  image: string;
}

export interface IngressControllerConfig {
  type: "nginx" | "traefik" | "istio" | "aws-alb";
  tls: boolean;
  hosts: string[];
  paths: string[];
  replicas: number;
  memory: string;
  cpu: string;
}

export interface CronJobConfig {
  schedule: string;
  command: string;
  concurrencyPolicy: "Allow" | "Forbid" | "Replace";
  successfulJobsHistoryLimit: number;
  failedJobsHistoryLimit: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
  activeDeadlineSeconds: number;
}

export interface GatewayConfig {
  type: "api-gateway" | "mesh-gateway" | "ingress-gateway";
  port: number;
  replicas: number;
  rateLimit: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
  corsEnabled: boolean;
  circuitBreakerEnabled: boolean;
  retryPolicy: boolean;
  timeoutMs: number;
}

export interface DatabaseClientConfig {
  connectionPoolSize: number;
  timeoutMs: number;
  retryAttempts: number;
  targetDatabase: string;
}

export interface CacheClientConfig {
  connectionPoolSize: number;
  timeoutMs: number;
  ttlSeconds: number;
  targetCache: string;
}

export interface BatchProcessorConfig {
  batchSize: number;
  parallelism: number;
  memory: string;
  cpu: string;
  image: string;
  namespace: string;
  retryAttempts: number;
  timeoutMs: number;
}

// ─── Config Map ─────────────────────────────────────────────────────────────

export interface AppComponentConfigMap {
  microservice: MicroserviceConfig;
  worker: WorkerConfig;
  consumer: ConsumerConfig;
  producer: ProducerConfig;
  api: APIConfig;
  sidecar: SidecarConfig;
  "ingress-controller": IngressControllerConfig;
  cronjob: CronJobConfig;
  gateway: GatewayConfig;
  "database-client": DatabaseClientConfig;
  "cache-client": CacheClientConfig;
  "batch-processor": BatchProcessorConfig;
}

// ─── Application Component Node ─────────────────────────────────────────────

export interface AppComponentNodeBase {
  id: string;
  label: string;
  category: AppComponentCategory;
  hostInfrastructureNodeId: string;
  positionX: number;
  positionY: number;
  [key: string]: unknown; // Required for React Flow Node<T> compatibility
}

export type AppComponentNode<T extends AppComponentType = AppComponentType> =
  AppComponentNodeBase & {
    type: T;
    config: AppComponentConfigMap[T];
  };

// ─── Category mapping ───────────────────────────────────────────────────────

export const APP_COMPONENT_CATEGORY_MAP: Record<AppComponentType, AppComponentCategory> = {
  microservice: "application",
  worker: "application",
  api: "application",
  "batch-processor": "application",
  consumer: "messaging-app",
  producer: "messaging-app",
  sidecar: "networking-app",
  "ingress-controller": "networking-app",
  gateway: "networking-app",
  cronjob: "scheduling",
  "database-client": "data-access",
  "cache-client": "data-access",
};

// ─── Hostable infrastructure types ──────────────────────────────────────────
// Which Layer 1 infrastructure nodes can host Layer 2 components

export const HOSTABLE_INFRA_TYPES: AWSServiceType[] = [
  "ec2",
  "ecs",
  "eks",
  "lambda",
  "fargate",
];

export function canHostAppComponent(infraType: AWSServiceType): boolean {
  return HOSTABLE_INFRA_TYPES.includes(infraType);
}
