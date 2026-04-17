/**
 * Availability calculation formulas per service type.
 * Returns percentage SLA (e.g. 99.99).
 */
import type { ArchitectureNode } from "../entities/node";

// AWS published SLAs
const BASE_AVAILABILITY: Record<string, number> = {
  lambda: 99.95,
  ec2: 99.99,
  ecs: 99.99,
  eks: 99.95,
  fargate: 99.99,
  alb: 99.99,
  nlb: 99.99,
  "api-gateway": 99.95,
  cloudfront: 99.99,
  route53: 100, // 100% uptime SLA
  sqs: 99.9,
  sns: 99.9,
  eventbridge: 99.99,
  msk: 99.9,
  kinesis: 99.9,
  s3: 99.99,
  rds: 99.95,
  dynamodb: 99.999,
  elasticache: 99.9,
  efs: 99.99,
  "secrets-manager": 99.99,
  cognito: 99.9,
  "step-functions": 99.9,
  cloudwatch: 99.9,
  waf: 99.99,
  iam: 99.99,
  vpc: 100,
  subnet: 100,
  "security-group": 100,
  ecr: 99.9,
  ses: 99.9,
  cloudtrail: 99.9,
  codepipeline: 99.9,
  xray: 99.9,
  redshift: 99.9,
  athena: 99.9,
  opensearch: 99.9,
  glue: 99.9,
  sagemaker: 99.9,
  bedrock: 99.9,
  "sfn-express": 99.9,
  "eventbridge-pipes": 99.9,
  note: 100,
  region: 100,
};

export function calculateAvailability(node: ArchitectureNode): number {
  const base = BASE_AVAILABILITY[node.type] ?? 99.9;

  switch (node.type) {
    case "rds": {
      const cfg = node.config as import("../entities/node").RDSConfig;
      // Multi-AZ improves from 99.95% to 99.99%
      if (cfg.multiAZ) return 99.99;
      return base;
    }

    case "elasticache": {
      const cfg = node.config as import("../entities/node").ElastiCacheConfig;
      // Replication = higher availability
      return cfg.replicationEnabled ? 99.99 : 99.9;
    }

    case "msk": {
      const cfg = node.config as import("../entities/node").MSKConfig;
      return cfg.replicationFactor >= 3 ? 99.99 : 99.9;
    }

    case "ec2": {
      const cfg = node.config as import("../entities/node").EC2Config;
      // Multiple instances across AZs
      if (cfg.count >= 3) return 99.99;
      if (cfg.count >= 2) return 99.95;
      return 99.5; // single instance has no SLA
    }

    case "ecs":
    case "fargate": {
      const cfg = node.config as import("../entities/node").ECSConfig;
      if (cfg.taskCount >= 2) return 99.99;
      return 99.9;
    }

    case "eks": {
      const cfg = node.config as import("../entities/node").EKSConfig;
      if (cfg.nodeCount >= 3) return 99.99;
      return 99.95;
    }

    case "lambda": {
      const cfg = node.config as import("../entities/node").LambdaConfig;
      // Provisioned concurrency improves cold start but not SLA
      void cfg;
      return base;
    }

    default:
      return base;
  }
}

/**
 * Calculate composite availability for a chain of services.
 * Availability degrades multiplicatively in series.
 */
export function calculatePathAvailability(
  availabilities: number[]
): number {
  if (availabilities.length === 0) return 100;
  return availabilities.reduce(
    (acc, avail) => (acc * avail) / 100,
    100
  );
}
