/**
 * AWS cost calculation formulas per service type.
 * Prices based on us-east-1 on-demand rates (approximate).
 * All values in USD/month.
 */
import type { ArchitectureNode } from "../entities/node";
import type { CostBreakdownItem } from "../entities/simulation";

export interface ServiceCostResult {
  monthlyCostUSD: number;
  details: string;
  lineItems: { label: string; amount: number }[];
}

export function calculateServiceCost(
  node: ArchitectureNode
): ServiceCostResult {
  switch (node.type) {
    case "lambda":
      return calculateLambdaCost(
        node.config as import("../entities/node").LambdaConfig
      );
    case "ec2":
      return calculateEC2Cost(
        node.config as import("../entities/node").EC2Config
      );
    case "ecs":
    case "fargate":
      return calculateECSCost(
        node.config as import("../entities/node").ECSConfig
      );
    case "eks":
      return calculateEKSCost(
        node.config as import("../entities/node").EKSConfig
      );
    case "alb":
      return calculateALBCost(
        node.config as import("../entities/node").ALBConfig
      );
    case "nlb":
      return calculateNLBCost(
        node.config as import("../entities/node").NLBConfig
      );
    case "api-gateway":
      return calculateAPIGatewayCost(
        node.config as import("../entities/node").APIGatewayConfig
      );
    case "cloudfront":
      return calculateCloudFrontCost(
        node.config as import("../entities/node").CloudFrontConfig
      );
    case "route53":
      return calculateRoute53Cost(
        node.config as import("../entities/node").Route53Config
      );
    case "sqs":
      return calculateSQSCost(
        node.config as import("../entities/node").SQSConfig
      );
    case "sns":
      return calculateSNSCost(
        node.config as import("../entities/node").SNSConfig
      );
    case "eventbridge":
      return calculateEventBridgeCost(
        node.config as import("../entities/node").EventBridgeConfig
      );
    case "msk":
      return calculateMSKCost(
        node.config as import("../entities/node").MSKConfig
      );
    case "kinesis":
      return calculateKinesisCost(
        node.config as import("../entities/node").KinesisConfig
      );
    case "s3":
      return calculateS3Cost(
        node.config as import("../entities/node").S3Config
      );
    case "rds":
      return calculateRDSCost(
        node.config as import("../entities/node").RDSConfig
      );
    case "dynamodb":
      return calculateDynamoDBCost(
        node.config as import("../entities/node").DynamoDBConfig
      );
    case "elasticache":
      return calculateElastiCacheCost(
        node.config as import("../entities/node").ElastiCacheConfig
      );
    case "waf":
      return calculateWAFCost(
        node.config as import("../entities/node").WAFConfig
      );
    case "secrets-manager":
      return calculateSecretsManagerCost(
        node.config as import("../entities/node").SecretsManagerConfig
      );
    case "step-functions":
      return calculateStepFunctionsCost(
        node.config as import("../entities/node").StepFunctionsConfig
      );
    case "cloudwatch":
      return calculateCloudWatchCost(
        node.config as import("../entities/node").CloudWatchConfig
      );
    case "cognito":
      return calculateCognitoCost(
        node.config as import("../entities/node").CognitoConfig
      );
    case "note":
      return { monthlyCostUSD: 0, details: "Anotação (sem custo)", lineItems: [] };
    default:
      return { monthlyCostUSD: 0, details: "Free or not priced", lineItems: [] };
  }
}

export function buildCostBreakdown(
  nodes: ArchitectureNode[]
): CostBreakdownItem[] {
  const results = nodes.map((node) => ({
    node,
    cost: calculateServiceCost(node),
  }));
  const total = results.reduce((s, r) => s + r.cost.monthlyCostUSD, 0);

  return results.map(({ node, cost }) => ({
    nodeId: node.id,
    component: node.label,
    serviceType: node.type,
    monthlyCostUSD: cost.monthlyCostUSD,
    details: cost.details,
    percentage: total > 0 ? (cost.monthlyCostUSD / total) * 100 : 0,
  }));
}

// ── Per-Service Calculators ────────────────────────────────────────────────

function calculateLambdaCost(
  cfg: import("../entities/node").LambdaConfig
): ServiceCostResult {
  const HOURS_PER_MONTH = 730;
  const requestPrice = 0.2; // per 1M requests
  const computePrice = 0.0000166667; // per GB-second

  const requestCost = (cfg.requestsPerMonth / 1_000_000) * requestPrice;
  const gbSeconds =
    (cfg.requestsPerMonth * (cfg.avgDurationMs / 1000) * cfg.memoryMB) / 1024;
  const computeCost = gbSeconds * computePrice;

  // Provisioned concurrency: $0.0000041667 per GB-second
  const provisionedCost =
    cfg.concurrency > 0
      ? cfg.concurrency *
        (cfg.memoryMB / 1024) *
        HOURS_PER_MONTH *
        3600 *
        0.0000041667
      : 0;

  const total = requestCost + computeCost + provisionedCost;

  return {
    monthlyCostUSD: total,
    details: `${(cfg.requestsPerMonth / 1_000_000).toFixed(1)}M req/mo, ${cfg.memoryMB}MB, ${cfg.avgDurationMs}ms avg`,
    lineItems: [
      { label: "Requests", amount: requestCost },
      { label: "Compute (GB-s)", amount: computeCost },
      { label: "Provisioned concurrency", amount: provisionedCost },
    ],
  };
}

function calculateEC2Cost(
  cfg: import("../entities/node").EC2Config
): ServiceCostResult {
  const hourlyPrices: Record<string, number> = {
    "t3.micro": 0.0104,
    "t3.small": 0.0208,
    "t3.medium": 0.0416,
    "t3.large": 0.0832,
    "t3.xlarge": 0.1664,
    "t3.2xlarge": 0.3328,
    "m5.large": 0.096,
    "m5.xlarge": 0.192,
    "m5.2xlarge": 0.384,
    "m5.4xlarge": 0.768,
    "c5.large": 0.085,
    "c5.xlarge": 0.17,
    "c5.2xlarge": 0.34,
    "c5.4xlarge": 0.68,
    "r5.large": 0.126,
    "r5.xlarge": 0.252,
  };
  const hourly = hourlyPrices[cfg.instanceType] ?? 0.05;
  const spotDiscount = cfg.spotEnabled ? 0.3 : 1; // ~70% discount
  const instanceCost = cfg.count * hourly * 730 * spotDiscount;
  const ebsCost = cfg.count * cfg.ebsVolumeGB * 0.1; // $0.10/GB-month gp3

  return {
    monthlyCostUSD: instanceCost + ebsCost,
    details: `${cfg.count}x ${cfg.instanceType}${cfg.spotEnabled ? " (Spot)" : ""}, ${cfg.ebsVolumeGB}GB EBS`,
    lineItems: [
      { label: `${cfg.count}x ${cfg.instanceType}`, amount: instanceCost },
      { label: "EBS Storage", amount: ebsCost },
    ],
  };
}

function calculateECSCost(
  cfg: import("../entities/node").ECSConfig
): ServiceCostResult {
  if (cfg.launchType === "ec2") {
    return { monthlyCostUSD: 0, details: "EC2 launch type (billed at EC2)", lineItems: [] };
  }
  // Fargate pricing: $0.04048/vCPU-hour, $0.004445/GB-hour
  const vCPUs = cfg.cpu / 1024;
  const memGB = cfg.memoryMB / 1024;
  const cpuCost = cfg.taskCount * vCPUs * 0.04048 * 730;
  const memCost = cfg.taskCount * memGB * 0.004445 * 730;
  return {
    monthlyCostUSD: cpuCost + memCost,
    details: `${cfg.taskCount} tasks, ${cfg.cpu} vCPU, ${cfg.memoryMB}MB`,
    lineItems: [
      { label: "vCPU", amount: cpuCost },
      { label: "Memory", amount: memCost },
    ],
  };
}

function calculateEKSCost(
  cfg: import("../entities/node").EKSConfig
): ServiceCostResult {
  const clusterCost = 0.1 * 730; // $0.10/hour for cluster
  const nodeCost = calculateEC2Cost({
    instanceType: cfg.instanceType,
    count: cfg.nodeCount,
    spotEnabled: false,
    ebsVolumeGB: 50,
  });
  return {
    monthlyCostUSD: clusterCost + nodeCost.monthlyCostUSD,
    details: `${cfg.nodeCount}x ${cfg.instanceType} nodes`,
    lineItems: [
      { label: "EKS Cluster", amount: clusterCost },
      { label: "Worker Nodes", amount: nodeCost.monthlyCostUSD },
    ],
  };
}

function calculateALBCost(
  _cfg: import("../entities/node").ALBConfig
): ServiceCostResult {
  // $0.008/hour + $0.008/LCU
  const fixedCost = 0.008 * 730;
  const lcuCost = 10 * 0.008; // estimated 10 LCUs
  return {
    monthlyCostUSD: fixedCost + lcuCost,
    details: "Application Load Balancer",
    lineItems: [
      { label: "ALB hours", amount: fixedCost },
      { label: "LCU charges", amount: lcuCost },
    ],
  };
}

function calculateNLBCost(
  _cfg: import("../entities/node").NLBConfig
): ServiceCostResult {
  const fixedCost = 0.008 * 730;
  const lcuCost = 10 * 0.006;
  return {
    monthlyCostUSD: fixedCost + lcuCost,
    details: "Network Load Balancer",
    lineItems: [
      { label: "NLB hours", amount: fixedCost },
      { label: "NLCU charges", amount: lcuCost },
    ],
  };
}

function calculateAPIGatewayCost(
  cfg: import("../entities/node").APIGatewayConfig
): ServiceCostResult {
  const pricePerM = cfg.type === "rest" ? 3.5 : 1.0;
  const requestCost = (cfg.requestsPerMonth / 1_000_000) * pricePerM;
  const cacheCost = cfg.cacheSizeGB > 0 ? cfg.cacheSizeGB * 0.02 * 730 : 0;
  return {
    monthlyCostUSD: requestCost + cacheCost,
    details: `${cfg.type.toUpperCase()} Gateway, ${(cfg.requestsPerMonth / 1_000_000).toFixed(1)}M req/mo`,
    lineItems: [
      { label: "Requests", amount: requestCost },
      { label: "Cache", amount: cacheCost },
    ],
  };
}

function calculateCloudFrontCost(
  cfg: import("../entities/node").CloudFrontConfig
): ServiceCostResult {
  const dataTransferCost = cfg.dataTransferGB * 0.0085; // $0.0085/GB (US)
  const requestCost = (cfg.requestsPerMonth / 10_000) * 0.01;
  return {
    monthlyCostUSD: dataTransferCost + requestCost,
    details: `${cfg.dataTransferGB}GB transfer, ${(cfg.requestsPerMonth / 1_000_000).toFixed(1)}M req/mo`,
    lineItems: [
      { label: "Data Transfer", amount: dataTransferCost },
      { label: "HTTP Requests", amount: requestCost },
    ],
  };
}

function calculateRoute53Cost(
  cfg: import("../entities/node").Route53Config
): ServiceCostResult {
  const hostedZoneCost = cfg.hostedZones * 0.5;
  const queryCost = (cfg.queriesPerMonth / 1_000_000) * 0.4;
  return {
    monthlyCostUSD: hostedZoneCost + queryCost,
    details: `${cfg.hostedZones} hosted zones`,
    lineItems: [
      { label: "Hosted Zones", amount: hostedZoneCost },
      { label: "Queries", amount: queryCost },
    ],
  };
}

function calculateSQSCost(
  cfg: import("../entities/node").SQSConfig
): ServiceCostResult {
  const pricePerM = cfg.type === "fifo" ? 0.5 : 0.4;
  // First 1M free
  const billableM = Math.max(0, cfg.messagesPerMonth / 1_000_000 - 1);
  const cost = billableM * pricePerM;
  return {
    monthlyCostUSD: cost,
    details: `${cfg.type.toUpperCase()}, ${(cfg.messagesPerMonth / 1_000_000).toFixed(1)}M msg/mo`,
    lineItems: [{ label: "Messages", amount: cost }],
  };
}

function calculateSNSCost(
  cfg: import("../entities/node").SNSConfig
): ServiceCostResult {
  // First 1M free for publish
  const billableM = Math.max(0, cfg.messagesPerMonth / 1_000_000 - 1);
  const publishCost = billableM * 0.5;
  const deliveryCost = cfg.subscriptions * 0.006 * (cfg.messagesPerMonth / 1_000_000);
  return {
    monthlyCostUSD: publishCost + deliveryCost,
    details: `${cfg.subscriptions} subscriptions, ${(cfg.messagesPerMonth / 1_000_000).toFixed(1)}M msg/mo`,
    lineItems: [
      { label: "Publish", amount: publishCost },
      { label: "Delivery", amount: deliveryCost },
    ],
  };
}

function calculateEventBridgeCost(
  cfg: import("../entities/node").EventBridgeConfig
): ServiceCostResult {
  const cost = (cfg.eventsPerMonth / 1_000_000) * 1.0; // $1/M events
  return {
    monthlyCostUSD: cost,
    details: `${cfg.rulesCount} rules, ${(cfg.eventsPerMonth / 1_000_000).toFixed(1)}M events/mo`,
    lineItems: [{ label: "Events", amount: cost }],
  };
}

function calculateMSKCost(
  cfg: import("../entities/node").MSKConfig
): ServiceCostResult {
  const brokerPrices: Record<string, number> = {
    "kafka.t3.small": 0.0456,
    "kafka.m5.large": 0.216,
    "kafka.m5.xlarge": 0.432,
    "kafka.m5.2xlarge": 0.864,
  };
  const hourly = brokerPrices[cfg.instanceType] ?? 0.216;
  const brokerCost = cfg.brokerCount * hourly * 730;
  const storageCost = cfg.brokerCount * cfg.storagePerBrokerGB * 0.1;
  return {
    monthlyCostUSD: brokerCost + storageCost,
    details: `${cfg.brokerCount}x ${cfg.instanceType}, ${cfg.partitions} partitions`,
    lineItems: [
      { label: "Brokers", amount: brokerCost },
      { label: "Storage", amount: storageCost },
    ],
  };
}

function calculateKinesisCost(
  cfg: import("../entities/node").KinesisConfig
): ServiceCostResult {
  const shardCost = cfg.shardCount * 0.015 * 730; // $0.015/shard-hour
  const putCost = (cfg.dataInGB * 1024) * 0.014; // $0.014/1M PUT payload units
  return {
    monthlyCostUSD: shardCost + putCost,
    details: `${cfg.shardCount} shards, ${cfg.retentionHours}h retention`,
    lineItems: [
      { label: "Shards", amount: shardCost },
      { label: "PUT records", amount: putCost },
    ],
  };
}

function calculateS3Cost(
  cfg: import("../entities/node").S3Config
): ServiceCostResult {
  const storagePrices: Record<string, number> = {
    STANDARD: 0.023,
    IA: 0.0125,
    GLACIER: 0.004,
    DEEP_ARCHIVE: 0.00099,
  };
  const pricePerGB = storagePrices[cfg.storageClass] ?? 0.023;
  const storageCost = cfg.storageSizeGB * pricePerGB;
  const requestCost = (cfg.requestsPerMonth / 1000) * 0.0004; // $0.0004/1K GET
  return {
    monthlyCostUSD: storageCost + requestCost,
    details: `${cfg.storageSizeGB}GB ${cfg.storageClass}`,
    lineItems: [
      { label: "Storage", amount: storageCost },
      { label: "Requests", amount: requestCost },
    ],
  };
}

function calculateRDSCost(
  cfg: import("../entities/node").RDSConfig
): ServiceCostResult {
  const instancePrices: Record<string, number> = {
    "db.t3.micro": 0.017,
    "db.t3.small": 0.034,
    "db.t3.medium": 0.068,
    "db.t3.large": 0.136,
    "db.m5.large": 0.171,
    "db.m5.xlarge": 0.342,
    "db.m5.2xlarge": 0.684,
    "db.r5.large": 0.24,
    "db.r5.xlarge": 0.48,
  };
  const hourly = instancePrices[cfg.instanceClass] ?? 0.068;
  const multiAZMultiplier = cfg.multiAZ ? 2 : 1;
  const instanceCost = hourly * 730 * multiAZMultiplier;
  const storageCost = cfg.storageGB * 0.115; // gp2
  const replicaCost = cfg.readReplicas * hourly * 730;
  return {
    monthlyCostUSD: instanceCost + storageCost + replicaCost,
    details: `${cfg.instanceClass} ${cfg.engine}${cfg.multiAZ ? " Multi-AZ" : ""}${cfg.readReplicas > 0 ? ` +${cfg.readReplicas} replicas` : ""}`,
    lineItems: [
      { label: "Instance", amount: instanceCost },
      { label: "Storage", amount: storageCost },
      { label: "Read Replicas", amount: replicaCost },
    ],
  };
}

function calculateDynamoDBCost(
  cfg: import("../entities/node").DynamoDBConfig
): ServiceCostResult {
  if (cfg.capacityMode === "on-demand") {
    // $1.25/M write, $0.25/M read (estimated)
    const writeCost = 1.25;
    const readCost = 0.25;
    const storageCost = cfg.storageGB * 0.25;
    return {
      monthlyCostUSD: writeCost + readCost + storageCost,
      details: `On-demand, ${cfg.storageGB}GB storage`,
      lineItems: [
        { label: "Write requests", amount: writeCost },
        { label: "Read requests", amount: readCost },
        { label: "Storage", amount: storageCost },
      ],
    };
  }
  const writeCost = cfg.writeCapacityUnits * 0.00065 * 730;
  const readCost = cfg.readCapacityUnits * 0.00013 * 730;
  const storageCost = cfg.storageGB * 0.25;
  return {
    monthlyCostUSD: writeCost + readCost + storageCost,
    details: `Provisioned ${cfg.readCapacityUnits}RCU/${cfg.writeCapacityUnits}WCU, ${cfg.storageGB}GB`,
    lineItems: [
      { label: "Write Capacity", amount: writeCost },
      { label: "Read Capacity", amount: readCost },
      { label: "Storage", amount: storageCost },
    ],
  };
}

function calculateElastiCacheCost(
  cfg: import("../entities/node").ElastiCacheConfig
): ServiceCostResult {
  const nodePrices: Record<string, number> = {
    "cache.t3.micro": 0.017,
    "cache.t3.small": 0.034,
    "cache.t3.medium": 0.068,
    "cache.m5.large": 0.166,
    "cache.m5.xlarge": 0.332,
    "cache.r6g.large": 0.168,
  };
  const hourly = nodePrices[cfg.nodeType] ?? 0.068;
  const cost = cfg.nodeCount * hourly * 730;
  return {
    monthlyCostUSD: cost,
    details: `${cfg.nodeCount}x ${cfg.nodeType} ${cfg.engine}${cfg.replicationEnabled ? " with replication" : ""}`,
    lineItems: [{ label: "Nodes", amount: cost }],
  };
}

function calculateWAFCost(
  cfg: import("../entities/node").WAFConfig
): ServiceCostResult {
  const webACLCost = 5.0; // $5/month per Web ACL
  const ruleCost = cfg.rulesCount * 1.0; // $1/rule/month
  const requestCost = (cfg.requestsPerMonth / 1_000_000) * 0.6;
  return {
    monthlyCostUSD: webACLCost + ruleCost + requestCost,
    details: `${cfg.rulesCount} rules`,
    lineItems: [
      { label: "Web ACL", amount: webACLCost },
      { label: "Rules", amount: ruleCost },
      { label: "Requests", amount: requestCost },
    ],
  };
}

function calculateSecretsManagerCost(
  cfg: import("../entities/node").SecretsManagerConfig
): ServiceCostResult {
  const secretCost = cfg.secretsCount * 0.4; // $0.40/secret/month
  const apiCost = cfg.secretsCount * 1000 * 0.00005; // estimated API calls
  return {
    monthlyCostUSD: secretCost + apiCost,
    details: `${cfg.secretsCount} secrets${cfg.rotationEnabled ? " with rotation" : ""}`,
    lineItems: [
      { label: "Secrets", amount: secretCost },
      { label: "API Calls", amount: apiCost },
    ],
  };
}

function calculateStepFunctionsCost(
  cfg: import("../entities/node").StepFunctionsConfig
): ServiceCostResult {
  const pricePerM = cfg.type === "express" ? 1.0 : 25.0;
  const cost = (cfg.transitionsPerMonth / 1_000_000) * pricePerM;
  return {
    monthlyCostUSD: cost,
    details: `${cfg.type} workflow, ${(cfg.transitionsPerMonth / 1_000_000).toFixed(1)}M transitions/mo`,
    lineItems: [{ label: "State transitions", amount: cost }],
  };
}

function calculateCloudWatchCost(
  cfg: import("../entities/node").CloudWatchConfig
): ServiceCostResult {
  const metricsCost = Math.max(0, cfg.metricsCount - 10) * 0.3; // first 10 free
  const logsCost = cfg.logsIngestGB * 0.5;
  const alarmsCost = Math.max(0, cfg.alarmsCount - 10) * 0.1;
  return {
    monthlyCostUSD: metricsCost + logsCost + alarmsCost,
    details: `${cfg.metricsCount} metrics, ${cfg.logsIngestGB}GB logs, ${cfg.alarmsCount} alarms`,
    lineItems: [
      { label: "Metrics", amount: metricsCost },
      { label: "Logs Ingestion", amount: logsCost },
      { label: "Alarms", amount: alarmsCost },
    ],
  };
}

function calculateCognitoCost(
  cfg: import("../entities/node").CognitoConfig
): ServiceCostResult {
  // First 50K MAUs free
  const billableUsers = Math.max(0, cfg.userPoolSize - 50_000);
  const cost =
    billableUsers <= 0
      ? 0
      : billableUsers <= 50_000
      ? billableUsers * 0.0055
      : 50_000 * 0.0055 + (billableUsers - 50_000) * 0.0046;
  return {
    monthlyCostUSD: cost,
    details: `${cfg.userPoolSize.toLocaleString()} MAUs${cfg.mfaEnabled ? " + MFA" : ""}`,
    lineItems: [{ label: "MAUs", amount: cost }],
  };
}
