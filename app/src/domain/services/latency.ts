/**
 * Latency calculation formulas for each AWS service type.
 * All values in milliseconds. Pure functions — no side effects.
 */
import type { ArchitectureNode, AWSServiceType } from "../entities/node";

export interface LatencyContext {
  incomingRPS: number;
  region: string;
}

// Base latency values per service (p50 under normal load, ms)
const BASE_LATENCY_MS: Record<AWSServiceType, number> = {
  ec2: 5,
  ecs: 8,
  eks: 10,
  lambda: 50,
  fargate: 8,
  vpc: 0,
  subnet: 0,
  alb: 5,
  nlb: 2,
  "api-gateway": 20,
  cloudfront: 15,
  route53: 1,
  "security-group": 0,
  sqs: 20,
  sns: 10,
  eventbridge: 25,
  msk: 15,
  kinesis: 20,
  s3: 30,
  rds: 5,
  dynamodb: 3,
  elasticache: 1,
  efs: 10,
  iam: 0,
  waf: 1,
  "secrets-manager": 10,
  cognito: 50,
  "step-functions": 100,
  cloudwatch: 0,
  codepipeline: 0,
  xray: 0,
  ecr: 50,
  ses: 100,
  cloudtrail: 0,
  redshift: 500,
  athena: 2000,
  opensearch: 20,
  glue: 0,
  sagemaker: 200,
  note: 0,
};

export function getBaseLatency(type: AWSServiceType): number {
  return BASE_LATENCY_MS[type] ?? 10;
}

/**
 * Calculate effective latency for a node given incoming load.
 * Applies load-based degradation for stateful/compute services.
 */
export function calculateNodeLatency(
  node: ArchitectureNode,
  context: LatencyContext
): number {
  const base = node.latencyMs ?? getBaseLatency(node.type);
  const { incomingRPS } = context;

  switch (node.type) {
    case "lambda": {
      const cfg = node.config as import("../entities/node").LambdaConfig;
      // Cold start penalty when no provisioned concurrency
      const coldStartMs = cfg.concurrency === 0 ? 150 : 0;
      // Throttle degradation above concurrency limit
      const throttleMs =
        cfg.concurrency > 0 && incomingRPS > cfg.concurrency * 10
          ? 200
          : 0;
      return base + coldStartMs + throttleMs;
    }

    case "rds": {
      const cfg = node.config as import("../entities/node").RDSConfig;
      // Connection pool saturation at high RPS
      const maxConnections = cfg.multiAZ ? 400 : 200;
      if (incomingRPS > maxConnections * 0.8) {
        return base * 3; // connection pool exhaustion
      }
      return base;
    }

    case "dynamodb": {
      const cfg = node.config as import("../entities/node").DynamoDBConfig;
      if (cfg.capacityMode === "provisioned") {
        const maxRPS = cfg.readCapacityUnits + cfg.writeCapacityUnits;
        if (incomingRPS > maxRPS * 0.9) {
          return base + 50; // throttling
        }
      }
      return base;
    }

    case "elasticache": {
      const cfg = node.config as import("../entities/node").ElastiCacheConfig;
      const nodeCount = cfg.nodeCount;
      // Redis cluster distributes load
      if (incomingRPS > nodeCount * 100_000) {
        return base * 2;
      }
      return base;
    }

    case "sqs": {
      // SQS is async — latency represents polling delay
      return base;
    }

    case "alb": {
      const cfg = node.config as import("../entities/node").ALBConfig;
      void cfg;
      return base + (incomingRPS > 50_000 ? 5 : 0);
    }

    case "api-gateway": {
      const cfg = node.config as import("../entities/node").APIGatewayConfig;
      if (incomingRPS > cfg.throttleRPS * 0.9) {
        return base + 100; // throttling added latency
      }
      return base;
    }

    case "msk": {
      const cfg = node.config as import("../entities/node").MSKConfig;
      // Higher partitions = lower latency under load
      const partitionFactor = Math.max(1, cfg.partitions / 10);
      return base / Math.sqrt(partitionFactor);
    }

    default:
      return base;
  }
}

/**
 * Calculate cumulative latency for a path (array of nodes + edges).
 */
export function calculatePathLatency(
  nodeTimes: number[],
  edgeTimes: number[]
): number {
  const nodeSum = nodeTimes.reduce((a, b) => a + b, 0);
  const edgeSum = edgeTimes.reduce((a, b) => a + b, 0);
  return nodeSum + edgeSum;
}
