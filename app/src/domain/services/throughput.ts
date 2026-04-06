/**
 * Throughput calculation formulas per service type.
 * Returns max requests-per-second the service can handle.
 */
import type { ArchitectureNode } from "../entities/node";

export function calculateMaxThroughput(node: ArchitectureNode): number {
  switch (node.type) {
    case "lambda": {
      const cfg = node.config as import("../entities/node").LambdaConfig;
      const effectiveConcurrency =
        cfg.concurrency > 0 ? cfg.concurrency : 1000; // AWS burst limit
      const avgDurationSec = cfg.avgDurationMs / 1000;
      return Math.floor(effectiveConcurrency / avgDurationSec);
    }

    case "ec2": {
      const cfg = node.config as import("../entities/node").EC2Config;
      // Estimate: 500 RPS per vCPU, avg 2 vCPUs for t3.medium
      const vCPUs = estimateEC2vCPUs(cfg.instanceType);
      return cfg.count * vCPUs * 500;
    }

    case "ecs":
    case "fargate": {
      const cfg = node.config as import("../entities/node").ECSConfig;
      const vCPUs = cfg.cpu / 1024;
      return cfg.taskCount * vCPUs * 400;
    }

    case "eks": {
      const cfg = node.config as import("../entities/node").EKSConfig;
      const vCPUs = estimateEC2vCPUs(cfg.instanceType);
      return cfg.nodeCount * vCPUs * 350;
    }

    case "alb": {
      return 100_000; // ALB scales automatically
    }

    case "nlb": {
      return 1_000_000; // NLB handles millions of RPS
    }

    case "api-gateway": {
      const cfg = node.config as import("../entities/node").APIGatewayConfig;
      return cfg.throttleRPS;
    }

    case "sqs": {
      return 3000; // standard SQS: 3000 TPS in-flight
    }

    case "sns": {
      return 30_000; // SNS publish rate
    }

    case "eventbridge": {
      return 10_000; // default PutEvents limit
    }

    case "msk": {
      const cfg = node.config as import("../entities/node").MSKConfig;
      // ~10MB/s per partition, assume 1KB messages = 10K msg/s per partition
      return cfg.partitions * 10_000;
    }

    case "kinesis": {
      const cfg = node.config as import("../entities/node").KinesisConfig;
      return cfg.shardCount * 1000; // 1 MB/s or 1000 records/s per shard
    }

    case "dynamodb": {
      const cfg = node.config as import("../entities/node").DynamoDBConfig;
      if (cfg.capacityMode === "on-demand") return 40_000; // per table default
      return cfg.readCapacityUnits + cfg.writeCapacityUnits;
    }

    case "rds": {
      const cfg = node.config as import("../entities/node").RDSConfig;
      const base = estimateRDSConnections(cfg.instanceClass);
      return base * (cfg.readReplicas + 1);
    }

    case "elasticache": {
      const cfg = node.config as import("../entities/node").ElastiCacheConfig;
      return cfg.nodeCount * 100_000; // Redis: 100K ops/s per node
    }

    case "cloudfront": {
      return 250_000; // scales globally
    }

    case "step-functions": {
      const cfg = node.config as import("../entities/node").StepFunctionsConfig;
      return cfg.type === "express" ? 100_000 : 2000;
    }

    case "note":
      return 0;

    default:
      return 10_000;
  }
}

export function calculateUtilization(
  node: ArchitectureNode,
  actualRPS: number
): number {
  const maxRPS = calculateMaxThroughput(node);
  if (maxRPS === 0) return 0;
  return Math.min(100, (actualRPS / maxRPS) * 100);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function estimateEC2vCPUs(instanceType: string): number {
  if (instanceType.startsWith("t2.micro")) return 1;
  if (instanceType.startsWith("t2.small")) return 1;
  if (instanceType.startsWith("t2.medium")) return 2;
  if (instanceType.startsWith("t3.micro")) return 2;
  if (instanceType.startsWith("t3.small")) return 2;
  if (instanceType.startsWith("t3.medium")) return 2;
  if (instanceType.startsWith("t3.large")) return 2;
  if (instanceType.startsWith("t3.xlarge")) return 4;
  if (instanceType.startsWith("m5.large")) return 2;
  if (instanceType.startsWith("m5.xlarge")) return 4;
  if (instanceType.startsWith("m5.2xlarge")) return 8;
  if (instanceType.startsWith("c5.large")) return 2;
  if (instanceType.startsWith("c5.xlarge")) return 4;
  if (instanceType.startsWith("c5.2xlarge")) return 8;
  if (instanceType.startsWith("c5.4xlarge")) return 16;
  return 2; // default
}

function estimateRDSConnections(instanceClass: string): number {
  if (instanceClass.includes("micro")) return 50;
  if (instanceClass.includes("small")) return 150;
  if (instanceClass.includes("medium")) return 400;
  if (instanceClass.includes("large")) return 1000;
  if (instanceClass.includes("xlarge")) return 2000;
  return 400;
}
