/**
 * Architecture templates — pre-built AWS diagrams the user can import as a starting point.
 * Each template is a valid ProjectData object.
 */
import type { ProjectData, FlowNode, FlowEdge, AppFlowNode } from "@/stores/flow-store";

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "serverless"
    | "containers"
    | "data"
    | "security"
    | "microservices"
    | "full-stack"
    | "hosting"
    | "bff"
    | "ai-ml"
    | "event-driven"
    | "multi-region";
  tags: string[];
  estimatedCostUSD: number;
  data: ProjectData;
}

/** Wraps V2-style flat nodes/edges into V3 ProjectData format */
function toV3(
  name: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  solNodes: AppFlowNode[] = [],
  solEdges: FlowEdge[] = []
): ProjectData {
  return {
    version: 3,
    name,
    infrastructure: { nodes, edges },
    solutionDesign: { nodes: solNodes, edges: solEdges },
    savedAt: ts(),
  };
}

const ts = () => new Date().toISOString();

// ── Template helpers ──────────────────────────────────────────────────────────

function node(id: string, type: string, label: string, x: number, y: number, config?: Record<string, unknown>): FlowNode {
  return {
    id,
    type: type === "vpc" || type === "subnet" || type === "region" ? "container-node" : "service-node",
    position: { x, y },
    data: {
      id,
      label,
      type,
      category: "compute",
      latencyMs: 10,
      positionX: x,
      positionY: y,
      config: config ?? {},
    } as unknown as import("@/domain/entities/node").ArchitectureNode,
  };
}

function edge(source: string, target: string, protocol = "https"): FlowEdge {
  const id = `edge-${source}-${target}`;
  return {
    id,
    source,
    target,
    type: "protocol-edge",
    animated: false,
    style: { strokeWidth: 2 },
    data: {
      id,
      source,
      target,
      protocol,
      latencyMs: 10,
      throughputRPS: 1000,
      messageCount: 100,
    } as unknown as import("@/domain/entities/edge").ConnectionEdge,
  };
}

function appNode(
  id: string,
  type: string,
  label: string,
  hostId: string,
  x: number,
  y: number,
  config?: Record<string, unknown>
): AppFlowNode {
  return {
    id,
    type: "app-service-node",
    position: { x, y },
    data: {
      id,
      label,
      type,
      category: "application",
      hostInfrastructureNodeId: hostId,
      positionX: x,
      positionY: y,
      config: config ?? {},
    } as unknown as import("@/domain/entities/app-component").AppComponentNode,
  };
}

// ── 1. Serverless API ─────────────────────────────────────────────────────────

const serverlessApi: ArchitectureTemplate = {
  id: "serverless-api",
  name: "API Serverless",
  description: "API REST moderna com API Gateway, Lambda e DynamoDB. Ideal para microserviços sem servidor.",
  category: "serverless",
  tags: ["serverless", "api", "lambda", "dynamodb"],
  estimatedCostUSD: 12,
  data: toV3("API Serverless", [
      node("waf-1", "waf", "WAF", 380, 40, { rulesCount: 5, requestsPerMonth: 1_000_000 }),
      node("apigw-1", "api-gateway", "API Gateway", 380, 160, { type: "rest", requestsPerMonth: 1_000_000, cacheSizeGB: 0, throttleRPS: 5000 }),
      node("fn-1", "lambda", "Função de Negócio", 220, 310, { memoryMB: 512, timeoutSec: 30, concurrency: 0, requestsPerMonth: 1_000_000, avgDurationMs: 150 }),
      node("fn-auth", "lambda", "Autorização", 540, 310, { memoryMB: 128, timeoutSec: 5, concurrency: 100, requestsPerMonth: 1_000_000, avgDurationMs: 50 }),
      node("db-1", "dynamodb", "Tabela Principal", 220, 460, { readCapacityUnits: 10, writeCapacityUnits: 5, capacityMode: "on-demand", storageGB: 10 }),
      node("cache-1", "elasticache", "Cache Redis", 540, 460, { engine: "redis", nodeType: "cache.t3.micro", nodeCount: 1, replicationEnabled: false }),
      node("cw-1", "cloudwatch", "Monitoramento", 380, 560, { metricsCount: 20, logsIngestGB: 5, alarmsCount: 5 }),
    ], [
      edge("waf-1", "apigw-1"),
      edge("apigw-1", "fn-auth"),
      edge("apigw-1", "fn-1"),
      edge("fn-1", "db-1"),
      edge("fn-1", "cache-1"),
      edge("fn-1", "cw-1"),
    ]),
};

// ── 2. Web App com ALB ────────────────────────────────────────────────────────

const webApp: ArchitectureTemplate = {
  id: "web-app-alb",
  name: "Web App com Load Balancer",
  description: "Aplicação web com CloudFront CDN, ALB para balanceamento, EC2 em cluster e banco RDS Multi-AZ.",
  category: "containers",
  tags: ["web", "alb", "ec2", "rds", "cloudfront"],
  estimatedCostUSD: 380,
  data: toV3("Web App com Load Balancer", [
      node("waf-1", "waf", "WAF", 420, 30, { rulesCount: 10, requestsPerMonth: 5_000_000 }),
      node("cf-1", "cloudfront", "CloudFront CDN", 420, 130, { priceClass: "PriceClass_200", requestsPerMonth: 5_000_000, dataTransferGB: 100 }),
      node("r53-1", "route53", "Route 53", 160, 130, { hostedZones: 1, queriesPerMonth: 1_000_000 }),
      node("alb-1", "alb", "Application LB", 420, 260, { type: "application", crossZone: true, idleTimeoutSec: 60 }),
      node("ec2-a", "ec2", "App Server A", 260, 400, { instanceType: "t3.large", count: 2, spotEnabled: false, ebsVolumeGB: 30 }),
      node("ec2-b", "ec2", "App Server B", 580, 400, { instanceType: "t3.large", count: 2, spotEnabled: false, ebsVolumeGB: 30 }),
      node("rds-1", "rds", "RDS PostgreSQL", 420, 550, { engine: "postgres", instanceClass: "db.t3.medium", multiAZ: true, storageGB: 100, readReplicas: 1 }),
      node("sm-1", "secrets-manager", "Secrets Manager", 700, 550, { secretsCount: 5, rotationEnabled: true }),
      node("cw-1", "cloudwatch", "CloudWatch", 160, 550, { metricsCount: 50, logsIngestGB: 20, alarmsCount: 15 }),
    ], [
      edge("r53-1", "cf-1"),
      edge("waf-1", "cf-1"),
      edge("cf-1", "alb-1"),
      edge("alb-1", "ec2-a"),
      edge("alb-1", "ec2-b"),
      edge("ec2-a", "rds-1"),
      edge("ec2-b", "rds-1"),
      edge("ec2-a", "sm-1"),
      edge("ec2-a", "cw-1"),
    ]),
};

// ── 3. Microsserviços com ECS ─────────────────────────────────────────────────

const microservices: ArchitectureTemplate = {
  id: "microservices-ecs",
  name: "Microsserviços com ECS",
  description: "Arquitetura de microsserviços com ECS/Fargate, comunicação assíncrona via SQS/SNS e DynamoDB por serviço.",
  category: "microservices",
  tags: ["microservices", "ecs", "fargate", "sqs", "sns"],
  estimatedCostUSD: 520,
  data: toV3("Microsserviços com ECS", [
      node("apigw-1", "api-gateway", "API Gateway", 420, 40, { type: "rest", requestsPerMonth: 2_000_000, cacheSizeGB: 0, throttleRPS: 10000 }),
      node("ecs-orders", "ecs", "Serviço Pedidos", 180, 180, { taskCount: 3, cpu: 512, memoryMB: 1024, launchType: "fargate" }),
      node("ecs-users", "ecs", "Serviço Usuários", 420, 180, { taskCount: 2, cpu: 256, memoryMB: 512, launchType: "fargate" }),
      node("ecs-notify", "ecs", "Serviço Notificações", 660, 180, { taskCount: 2, cpu: 256, memoryMB: 512, launchType: "fargate" }),
      node("sqs-orders", "sqs", "Fila Pedidos", 180, 340, { type: "standard", visibilityTimeoutSec: 30, retentionDays: 7, messagesPerMonth: 500_000 }),
      node("sns-events", "sns", "Tópico Eventos", 420, 340, { type: "standard", subscriptions: 3, messagesPerMonth: 1_000_000 }),
      node("db-orders", "dynamodb", "DB Pedidos", 60, 480, { readCapacityUnits: 20, writeCapacityUnits: 10, capacityMode: "on-demand", storageGB: 20 }),
      node("db-users", "dynamodb", "DB Usuários", 300, 480, { readCapacityUnits: 10, writeCapacityUnits: 5, capacityMode: "on-demand", storageGB: 10 }),
      node("cognito-1", "cognito", "Cognito User Pool", 660, 480, { userPoolSize: 50_000, mfaEnabled: true }),
      node("cw-1", "cloudwatch", "CloudWatch", 420, 580, { metricsCount: 80, logsIngestGB: 30, alarmsCount: 20 }),
    ], [
      edge("apigw-1", "ecs-orders"),
      edge("apigw-1", "ecs-users"),
      edge("apigw-1", "ecs-notify"),
      edge("ecs-orders", "sqs-orders"),
      edge("ecs-orders", "sns-events"),
      edge("ecs-orders", "db-orders"),
      edge("ecs-users", "db-users"),
      edge("ecs-users", "cognito-1"),
      edge("sns-events", "ecs-notify", "sns"),
      edge("ecs-orders", "cw-1"),
    ],
    // Solution Design (L2): app components hosted on ECS services
    [
      appNode("app-orders-api", "api", "Orders API", "ecs-orders", 100, 80, { type: "rest", port: 8080, replicas: 3, memory: "512Mi", cpu: "250m" }),
      appNode("app-orders-worker", "worker", "Order Processor", "ecs-orders", 100, 220, { replicas: 2, concurrency: 5, memory: "256Mi", cpu: "125m" }),
      appNode("app-users-api", "api", "Users API", "ecs-users", 380, 80, { type: "rest", port: 8080, replicas: 2, memory: "256Mi", cpu: "125m" }),
      appNode("app-notify-consumer", "consumer", "Event Consumer", "ecs-notify", 600, 80, { groupId: "notifications", topics: ["events"], batchSize: 10, replicas: 2, memory: "256Mi", cpu: "125m" }),
      appNode("app-orders-producer", "producer", "Event Producer", "ecs-orders", 340, 220, { topics: ["events"], serializationFormat: "json", batchSize: 100 }),
      appNode("app-orders-db", "database-client", "Orders DB Client", "ecs-orders", 100, 360, { connectionPoolSize: 10, timeoutMs: 5000, retryAttempts: 3 }),
      appNode("app-users-db", "database-client", "Users DB Client", "ecs-users", 380, 360, { connectionPoolSize: 5, timeoutMs: 5000, retryAttempts: 3 }),
    ], [
      edge("app-orders-api", "app-orders-worker", "http"),
      edge("app-orders-api", "app-orders-db", "http"),
      edge("app-orders-worker", "app-orders-producer", "http"),
      edge("app-users-api", "app-users-db", "http"),
      edge("app-orders-producer", "app-notify-consumer", "sqs"),
    ]),
};

// ── 4. Pipeline de Dados ──────────────────────────────────────────────────────

const dataPipeline: ArchitectureTemplate = {
  id: "data-pipeline",
  name: "Pipeline de Dados em Tempo Real",
  description: "Ingestão de eventos via Kinesis, processamento com Lambda e armazenamento em S3 com análise via CloudWatch.",
  category: "data",
  tags: ["kinesis", "lambda", "s3", "data", "streaming"],
  estimatedCostUSD: 185,
  data: toV3("Pipeline de Dados em Tempo Real", [
      node("kinesis-1", "kinesis", "Kinesis Stream", 400, 60, { shardCount: 4, retentionHours: 24, dataInGB: 50 }),
      node("fn-process", "lambda", "Processador", 220, 200, { memoryMB: 1024, timeoutSec: 60, concurrency: 100, requestsPerMonth: 10_000_000, avgDurationMs: 200 }),
      node("fn-enrich", "lambda", "Enriquecedor", 580, 200, { memoryMB: 512, timeoutSec: 30, concurrency: 50, requestsPerMonth: 5_000_000, avgDurationMs: 100 }),
      node("s3-raw", "s3", "S3 Raw Data", 120, 360, { storageClass: "STANDARD", storageSizeGB: 500, requestsPerMonth: 1_000_000 }),
      node("s3-processed", "s3", "S3 Processed", 400, 360, { storageClass: "STANDARD", storageSizeGB: 200, requestsPerMonth: 500_000 }),
      node("s3-archive", "s3", "S3 Arquivo", 680, 360, { storageClass: "GLACIER", storageSizeGB: 2000, requestsPerMonth: 10_000 }),
      node("sns-alerts", "sns", "Alertas SNS", 400, 500, { type: "standard", subscriptions: 5, messagesPerMonth: 100_000 }),
      node("cw-1", "cloudwatch", "Monitoramento", 160, 500, { metricsCount: 40, logsIngestGB: 50, alarmsCount: 10 }),
    ], [
      edge("kinesis-1", "fn-process", "kinesis"),
      edge("kinesis-1", "fn-enrich", "kinesis"),
      edge("fn-process", "s3-raw"),
      edge("fn-process", "s3-processed"),
      edge("fn-enrich", "s3-processed"),
      edge("fn-enrich", "s3-archive"),
      edge("fn-process", "cw-1"),
      edge("fn-process", "sns-alerts"),
    ]),
};

// ── 5. Arquitetura Segura com WAF ─────────────────────────────────────────────

const secureArchitecture: ArchitectureTemplate = {
  id: "secure-web-app",
  name: "Aplicação Web Segura",
  description: "Arquitetura com múltiplas camadas de segurança: WAF, CloudFront, ALB, ECS, RDS Multi-AZ e Secrets Manager.",
  category: "security",
  tags: ["security", "waf", "cloudfront", "ecs", "rds", "cognito"],
  estimatedCostUSD: 650,
  data: toV3("Aplicação Web Segura", [
      node("route53-1", "route53", "Route 53", 100, 80, { hostedZones: 1, queriesPerMonth: 2_000_000 }),
      node("waf-1", "waf", "AWS WAF", 420, 40, { rulesCount: 15, requestsPerMonth: 3_000_000 }),
      node("cf-1", "cloudfront", "CloudFront", 420, 150, { priceClass: "PriceClass_All", requestsPerMonth: 3_000_000, dataTransferGB: 200 }),
      node("cognito-1", "cognito", "Cognito", 720, 150, { userPoolSize: 100_000, mfaEnabled: true }),
      node("alb-1", "alb", "Internal ALB", 420, 290, { type: "application", crossZone: true, idleTimeoutSec: 60 }),
      node("ecs-1", "ecs", "ECS Cluster", 280, 420, { taskCount: 4, cpu: 1024, memoryMB: 2048, launchType: "fargate" }),
      node("ecs-2", "ecs", "ECS Workers", 560, 420, { taskCount: 2, cpu: 512, memoryMB: 1024, launchType: "fargate" }),
      node("rds-1", "rds", "RDS Aurora", 280, 560, { engine: "aurora-postgres", instanceClass: "db.r5.large", multiAZ: true, storageGB: 200, readReplicas: 2 }),
      node("sm-1", "secrets-manager", "Secrets Manager", 560, 560, { secretsCount: 10, rotationEnabled: true }),
      node("iam-1", "iam", "IAM Roles", 780, 420, { roleName: "ECSTaskRole", policies: ["AmazonDynamoDBFullAccess", "AmazonS3ReadOnlyAccess"] }),
      node("cw-1", "cloudwatch", "CloudWatch", 100, 560, { metricsCount: 100, logsIngestGB: 40, alarmsCount: 25 }),
    ], [
      edge("route53-1", "cf-1"),
      edge("waf-1", "cf-1"),
      edge("cf-1", "cognito-1"),
      edge("cf-1", "alb-1"),
      edge("alb-1", "ecs-1"),
      edge("alb-1", "ecs-2"),
      edge("ecs-1", "rds-1"),
      edge("ecs-1", "sm-1"),
      edge("ecs-2", "sm-1"),
      edge("ecs-1", "cw-1"),
    ]),
};

// ── 6. Event-Driven com Step Functions ────────────────────────────────────────

const eventDriven: ArchitectureTemplate = {
  id: "event-driven",
  name: "Arquitetura Event-Driven",
  description: "Orquestração de workflows com Step Functions, eventos via EventBridge, filas SQS e processamento Lambda.",
  category: "serverless",
  tags: ["event-driven", "step-functions", "eventbridge", "sqs", "lambda"],
  estimatedCostUSD: 95,
  data: toV3("Arquitetura Event-Driven", [
      node("apigw-1", "api-gateway", "API Gateway", 400, 40, { type: "rest", requestsPerMonth: 500_000, cacheSizeGB: 0, throttleRPS: 2000 }),
      node("sf-1", "step-functions", "Orquestrador", 400, 180, { type: "standard", transitionsPerMonth: 500_000 }),
      node("eb-1", "eventbridge", "EventBridge", 200, 320, { rulesCount: 8, eventsPerMonth: 1_000_000 }),
      node("sqs-1", "sqs", "Fila Principal", 400, 320, { type: "standard", visibilityTimeoutSec: 60, retentionDays: 7, messagesPerMonth: 500_000 }),
      node("sqs-dlq", "sqs", "Dead Letter Queue", 600, 320, { type: "standard", visibilityTimeoutSec: 30, retentionDays: 14, messagesPerMonth: 10_000 }),
      node("fn-1", "lambda", "Processador A", 180, 470, { memoryMB: 256, timeoutSec: 30, concurrency: 50, requestsPerMonth: 500_000, avgDurationMs: 200 }),
      node("fn-2", "lambda", "Processador B", 400, 470, { memoryMB: 512, timeoutSec: 60, concurrency: 30, requestsPerMonth: 300_000, avgDurationMs: 400 }),
      node("db-1", "dynamodb", "Estado Workflow", 280, 610, { readCapacityUnits: 5, writeCapacityUnits: 5, capacityMode: "on-demand", storageGB: 5 }),
      node("sns-1", "sns", "Notificações", 560, 470, { type: "standard", subscriptions: 3, messagesPerMonth: 200_000 }),
    ], [
      edge("apigw-1", "sf-1"),
      edge("sf-1", "eb-1"),
      edge("sf-1", "sqs-1"),
      edge("sqs-1", "sqs-dlq"),
      edge("eb-1", "fn-1"),
      edge("sqs-1", "fn-2", "sqs"),
      edge("fn-1", "db-1"),
      edge("fn-2", "db-1"),
      edge("fn-2", "sns-1"),
    ]),
};

// ── 7. Full-Stack EKS (L1 + L2 complete) ────────────────────────────────────

const fullStackEks: ArchitectureTemplate = {
  id: "full-stack-eks",
  name: "Full-Stack EKS com Design de Solução",
  description: "Infraestrutura EKS completa com design de solução: API Gateway, microsserviços com sidecar, consumers e cache.",
  category: "full-stack",
  tags: ["eks", "kubernetes", "microservices", "full-stack", "sidecar", "cache"],
  estimatedCostUSD: 890,
  data: toV3("Full-Stack EKS", [
      node("r53", "route53", "Route 53", 400, 30, { hostedZones: 1, queriesPerMonth: 5_000_000 }),
      node("cf", "cloudfront", "CloudFront", 400, 130, { priceClass: "PriceClass_200", requestsPerMonth: 10_000_000, dataTransferGB: 500 }),
      node("alb", "alb", "ALB Ingress", 400, 250, { type: "application", crossZone: true, idleTimeoutSec: 60 }),
      node("eks-1", "eks", "EKS Cluster", 400, 380, { nodeCount: 5, instanceType: "m5.xlarge", minNodes: 3, maxNodes: 10 }),
      node("rds-1", "rds", "RDS Aurora", 200, 530, { engine: "aurora-postgres", instanceClass: "db.r5.large", multiAZ: true, storageGB: 200, readReplicas: 2 }),
      node("cache-1", "elasticache", "Redis Cluster", 600, 530, { engine: "redis", nodeType: "cache.r5.large", nodeCount: 3, replicationEnabled: true }),
      node("msk-1", "msk", "MSK Kafka", 400, 650, { brokerCount: 3, instanceType: "kafka.m5.large", storagePerBrokerGB: 100, kafkaVersion: "3.5.1" }),
      node("cw", "cloudwatch", "CloudWatch", 100, 650, { metricsCount: 150, logsIngestGB: 50, alarmsCount: 30 }),
    ], [
      edge("r53", "cf"),
      edge("cf", "alb"),
      edge("alb", "eks-1"),
      edge("eks-1", "rds-1"),
      edge("eks-1", "cache-1"),
      edge("eks-1", "msk-1"),
      edge("eks-1", "cw"),
    ],
    // Solution Design — K8s workloads
    [
      appNode("ingress", "ingress-controller", "NGINX Ingress", "eks-1", 350, 40, { type: "nginx", tls: true, hosts: ["api.example.com"], replicas: 2, memory: "256Mi", cpu: "250m" }),
      appNode("gw", "gateway", "API Gateway Mesh", "eks-1", 350, 150, { type: "api-gateway", port: 8080, replicas: 2, rateLimit: 10000, memory: "512Mi", cpu: "500m", circuitBreakerEnabled: true, retryPolicy: true }),
      appNode("svc-a", "microservice", "Service A", "eks-1", 150, 280, { replicas: 3, cpu: "500m", memory: "512Mi", port: 8080, healthCheckPath: "/health", minReplicas: 2, maxReplicas: 8, targetCPUPercent: 70 }),
      appNode("svc-b", "microservice", "Service B", "eks-1", 550, 280, { replicas: 2, cpu: "250m", memory: "256Mi", port: 8080, healthCheckPath: "/health", minReplicas: 1, maxReplicas: 5, targetCPUPercent: 75 }),
      appNode("sidecar-a", "sidecar", "Envoy Proxy", "eks-1", 150, 400, { type: "envoy", port: 15001, protocol: "grpc", memory: "128Mi", cpu: "100m" }),
      appNode("producer-1", "producer", "Event Producer", "eks-1", 350, 400, { topics: ["orders", "inventory"], serializationFormat: "avro", batchSize: 500, acks: "all" }),
      appNode("consumer-1", "consumer", "Order Consumer", "eks-1", 150, 520, { groupId: "order-processing", topics: ["orders"], batchSize: 50, replicas: 3, memory: "512Mi", cpu: "250m" }),
      appNode("db-client", "database-client", "DB Pool", "eks-1", 350, 520, { connectionPoolSize: 20, timeoutMs: 5000, retryAttempts: 3 }),
      appNode("cache-cl", "cache-client", "Redis Client", "eks-1", 550, 520, { connectionPoolSize: 10, timeoutMs: 1000, ttlSeconds: 300 }),
    ], [
      edge("ingress", "gw", "https"),
      edge("gw", "svc-a", "http"),
      edge("gw", "svc-b", "http"),
      edge("svc-a", "sidecar-a", "grpc"),
      edge("svc-a", "producer-1", "http"),
      edge("svc-a", "db-client", "http"),
      edge("svc-b", "cache-cl", "http"),
      edge("producer-1", "consumer-1", "kafka"),
      edge("consumer-1", "db-client", "http"),
    ]),
};

// ── 8. Site Estático com CloudFront ──────────────────────────────────────────

const staticSiteCDN: ArchitectureTemplate = {
  id: "static-site-cdn",
  name: "Site Estático com CloudFront",
  category: "hosting",
  tags: ["s3", "cloudfront", "route53", "cdn", "iniciante", "hosting"],
  estimatedCostUSD: 5,
  description: "Site estático no S3 com entrega global via CloudFront e DNS no Route53. Ideal para landing pages, blogs e SPAs. Custo mínimo.",
  data: toV3("Site Estático com CloudFront", [
    node("r53", "route53", "Route53", 100, 200),
    node("cf", "cloudfront", "CloudFront", 350, 200),
    node("bucket", "s3", "S3 Bucket", 600, 200),
  ], [
    edge("r53", "cf"),
    edge("cf", "bucket"),
  ]),
};

// ── 9. Portal Web com WAF e CDN ───────────────────────────────────────────────

const portalWebWaf: ArchitectureTemplate = {
  id: "portal-web-waf",
  name: "Portal Web com WAF e CDN",
  category: "hosting",
  tags: ["waf", "cloudfront", "alb", "ecs", "rds", "producao", "hosting"],
  estimatedCostUSD: 280,
  description: "Portal web de produção com WAF na borda, CloudFront como CDN, ALB para balanceamento, ECS para a aplicação e RDS com ElastiCache para performance.",
  data: toV3("Portal Web com WAF e CDN", [
    node("r53", "route53", "Route53", 50, 300),
    node("cf", "cloudfront", "CloudFront", 250, 300),
    node("waf", "waf", "WAF", 450, 300),
    node("alb", "alb", "ALB", 650, 300),
    node("app", "ecs", "ECS App", 850, 200),
    node("db", "rds", "RDS", 850, 400),
    node("cache", "elasticache", "ElastiCache", 1050, 200),
    node("assets", "s3", "S3 Assets", 1050, 400),
  ], [
    edge("r53", "cf"),
    edge("cf", "waf"),
    edge("waf", "alb"),
    edge("alb", "app"),
    edge("app", "db", "sql"),
    edge("app", "cache", "tcp"),
    edge("app", "assets"),
  ]),
};

// ── 10. CDN com Lambda@Edge ───────────────────────────────────────────────────

const cdnLambdaEdge: ArchitectureTemplate = {
  id: "cdn-lambda-edge",
  name: "CDN com Lambda@Edge",
  category: "hosting",
  tags: ["cloudfront", "s3", "lambda", "edge", "personalizacao", "hosting"],
  estimatedCostUSD: 25,
  description: "CloudFront com origem S3 e funções Lambda para personalização, redirecionamentos e autenticação na borda. Sem servidores para gerenciar.",
  data: toV3("CDN com Lambda@Edge", [
    node("r53", "route53", "Route53", 100, 250),
    node("cf", "cloudfront", "CloudFront", 350, 250),
    node("fn", "lambda", "Lambda@Edge", 600, 150, { memoryMB: 128, timeoutSec: 5, requestsPerMonth: 500000 }),
    node("bucket", "s3", "S3 Origin", 600, 350),
    node("note1", "note", "Processa auth e redirecionamentos na borda", 850, 250),
  ], [
    edge("r53", "cf"),
    edge("cf", "fn"),
    edge("cf", "bucket"),
  ]),
};

// ── 11. Padrão BFF ────────────────────────────────────────────────────────────

const bffPattern: ArchitectureTemplate = {
  id: "bff-pattern",
  name: "Padrão BFF (Backend for Frontend)",
  category: "bff",
  tags: ["bff", "api-gateway", "lambda", "ecs", "rds", "elasticache", "arquitetura"],
  estimatedCostUSD: 420,
  description: "Padrão BFF com três backends especializados por canal (Web, Mobile, Parceiros). Cada BFF agrega dados dos microsserviços sem expor a complexidade ao cliente.",
  data: toV3("Padrão BFF (Backend for Frontend)", [
    node("cf", "cloudfront", "CloudFront", 50, 300),
    node("waf", "waf", "WAF", 220, 300),
    node("gw", "api-gateway", "API Gateway", 420, 300),
    node("bff-web", "lambda", "BFF Web", 650, 150, { memoryMB: 512, timeoutSec: 30, requestsPerMonth: 1000000 }),
    node("bff-mob", "lambda", "BFF Mobile", 650, 300, { memoryMB: 256, timeoutSec: 30, requestsPerMonth: 2000000 }),
    node("bff-part", "lambda", "BFF Parceiros", 650, 450, { memoryMB: 512, timeoutSec: 30, requestsPerMonth: 500000 }),
    node("svc-user", "ecs", "Serviço Usuários", 900, 150),
    node("svc-prod", "ecs", "Serviço Produtos", 900, 300),
    node("svc-order", "ecs", "Serviço Pedidos", 900, 450),
    node("db", "rds", "RDS", 1100, 250),
    node("cache", "elasticache", "ElastiCache", 1100, 400),
  ], [
    edge("cf", "waf"),
    edge("waf", "gw"),
    edge("gw", "bff-web"),
    edge("gw", "bff-mob"),
    edge("gw", "bff-part"),
    edge("bff-web", "svc-user"),
    edge("bff-mob", "svc-prod"),
    edge("bff-part", "svc-order"),
    edge("svc-user", "db", "sql"),
    edge("svc-prod", "db", "sql"),
    edge("svc-order", "db", "sql"),
    edge("svc-user", "cache", "tcp"),
    edge("svc-prod", "cache", "tcp"),
  ]),
};

// ── 12. Microsserviços com API Gateway ────────────────────────────────────────

const microservicesApiGw: ArchitectureTemplate = {
  id: "microservices-api-gw",
  name: "Microsserviços com API Gateway",
  category: "bff",
  tags: ["api-gateway", "ecs", "rds", "sqs", "cognito", "microsservicos"],
  estimatedCostUSD: 650,
  description: "Microsserviços com API Gateway como ponto de entrada único, Cognito para autenticação JWT, serviços ECS independentes e comunicação assíncrona via SQS.",
  data: toV3("Microsserviços com API Gateway", [
    node("cog", "cognito", "Cognito", 50, 300),
    node("gw", "api-gateway", "API Gateway", 280, 300),
    node("auth", "ecs", "Auth Service", 510, 150),
    node("user", "ecs", "User Service", 510, 300),
    node("order", "ecs", "Order Service", 510, 450),
    node("q", "sqs", "SQS Orders", 740, 450),
    node("notif", "ecs", "Notification Service", 970, 450),
    node("userdb", "rds", "Users DB", 740, 250),
    node("orderdb", "dynamodb", "Orders DB", 740, 350),
    node("pub", "sns", "SNS", 1180, 400),
  ], [
    edge("cog", "gw"),
    edge("gw", "auth"),
    edge("gw", "user"),
    edge("gw", "order"),
    edge("user", "userdb", "sql"),
    edge("order", "orderdb", "nosql"),
    edge("order", "q", "amqp"),
    edge("q", "notif", "amqp"),
    edge("notif", "pub", "amqp"),
  ]),
};

// ── 13. GraphQL com AppSync ───────────────────────────────────────────────────

const graphqlAppSync: ArchitectureTemplate = {
  id: "graphql-appsync",
  name: "GraphQL com AppSync",
  category: "bff",
  tags: ["appsync", "graphql", "cognito", "lambda", "dynamodb", "elasticache"],
  estimatedCostUSD: 180,
  description: "API GraphQL totalmente gerenciada com AppSync, autenticação Cognito, resolvers Lambda e DynamoDB como banco principal com cache de subscriptions.",
  data: toV3("GraphQL com AppSync", [
    node("cog", "cognito", "Cognito", 100, 300),
    node("sync", "app-sync", "AppSync", 350, 300),
    node("fn", "lambda", "Resolvers", 600, 200),
    node("db", "dynamodb", "DynamoDB", 600, 350),
    node("cache", "elasticache", "ElastiCache", 600, 480),
  ], [
    edge("cog", "sync"),
    edge("sync", "fn"),
    edge("sync", "db", "nosql"),
    edge("sync", "cache", "tcp"),
  ]),
};

// ── 14. API Serverless Completa ───────────────────────────────────────────────

const serverlessFullApi: ArchitectureTemplate = {
  id: "serverless-full-api",
  name: "API Serverless Completa",
  category: "serverless",
  tags: ["serverless", "api-gateway", "lambda", "dynamodb", "sqs", "sns", "iniciante"],
  estimatedCostUSD: 35,
  description: "Stack serverless end-to-end: API Gateway, Lambda, DynamoDB, SQS e SNS. Escala automaticamente e custo próximo de zero em baixo volume. Ótimo ponto de partida.",
  data: toV3("API Serverless Completa", [
    node("r53", "route53", "Route53", 50, 300),
    node("gw", "api-gateway", "API Gateway", 280, 300),
    node("fn", "lambda", "Handler", 510, 300, { memoryMB: 256, timeoutSec: 30, requestsPerMonth: 500000 }),
    node("db", "dynamodb", "DynamoDB", 740, 200),
    node("q", "sqs", "SQS", 740, 400),
    node("worker", "lambda", "Worker", 970, 400, { memoryMB: 256, timeoutSec: 60, requestsPerMonth: 200000 }),
    node("pub", "sns", "SNS", 1180, 400),
    node("email", "ses", "SES", 1380, 400),
  ], [
    edge("r53", "gw"),
    edge("gw", "fn"),
    edge("fn", "db", "nosql"),
    edge("fn", "q", "amqp"),
    edge("q", "worker", "amqp"),
    edge("worker", "pub", "amqp"),
    edge("pub", "email", "amqp"),
  ]),
};

// ── 15. IA Generativa com Bedrock (RAG) ───────────────────────────────────────

const aiBedrockRag: ArchitectureTemplate = {
  id: "ai-bedrock-rag",
  name: "IA Generativa com Bedrock (RAG)",
  category: "ai-ml",
  tags: ["bedrock", "lambda", "s3", "dynamodb", "api-gateway", "rag", "chatbot", "ia"],
  estimatedCostUSD: 120,
  description: "Sistema RAG (Retrieval-Augmented Generation) com Amazon Bedrock. Lambda orquestra busca em documentos no S3 e usa Bedrock para gerar respostas contextualizadas.",
  data: toV3("IA Generativa com Bedrock (RAG)", [
    node("gw", "api-gateway", "API Gateway", 100, 300),
    node("orch", "lambda", "Orchestrator", 350, 300, { memoryMB: 512, timeoutSec: 60, requestsPerMonth: 50000 }),
    node("llm", "bedrock", "Bedrock (Claude)", 600, 180, { modelId: "anthropic.claude-3-sonnet", requestsPerMonth: 50000, inputTokensPerRequest: 2000, outputTokensPerRequest: 800 }),
    node("docs", "s3", "S3 Documents", 600, 320),
    node("sess", "dynamodb", "Sessions DB", 600, 450),
  ], [
    edge("gw", "orch"),
    edge("orch", "llm"),
    edge("orch", "docs"),
    edge("orch", "sess", "nosql"),
  ]),
};

// ── 16. Pipeline de ML com SageMaker ─────────────────────────────────────────

const mlSagemakerPipeline: ArchitectureTemplate = {
  id: "ml-sagemaker-pipeline",
  name: "Pipeline de ML com SageMaker",
  category: "ai-ml",
  tags: ["sagemaker", "s3", "glue", "lambda", "api-gateway", "ml", "treinamento"],
  estimatedCostUSD: 350,
  description: "Pipeline completo de ML: dados brutos no S3, ETL com Glue, treinamento e inferência SageMaker, e API Gateway para servir predições via Lambda.",
  data: toV3("Pipeline de ML com SageMaker", [
    node("raw", "s3", "S3 Raw Data", 50, 300),
    node("etl", "glue-workflow", "AWS Glue", 280, 300),
    node("clean", "s3", "S3 Processed", 510, 300),
    node("sm", "sagemaker", "SageMaker", 740, 300),
    node("pred", "lambda", "Predictor", 970, 300),
    node("gw", "api-gateway", "API Gateway", 1180, 300),
  ], [
    edge("raw", "etl"),
    edge("etl", "clean"),
    edge("clean", "sm"),
    edge("sm", "pred"),
    edge("pred", "gw"),
  ]),
};

// ── 17. Event-Driven com EventBridge ─────────────────────────────────────────

const eventDrivenEB: ArchitectureTemplate = {
  id: "event-driven-eventbridge",
  name: "Event-Driven com EventBridge",
  category: "event-driven",
  tags: ["eventbridge", "lambda", "sqs", "sns", "dynamodb", "eventos", "async"],
  estimatedCostUSD: 55,
  description: "Arquitetura orientada a eventos: produtores publicam no EventBridge que roteia para consumidores via regras. SQS garante entrega, SNS para fan-out.",
  data: toV3("Event-Driven com EventBridge", [
    node("gw", "api-gateway", "API Gateway", 50, 300),
    node("prod", "lambda", "Producer", 280, 300),
    node("eb", "eventbridge", "EventBridge", 510, 300),
    node("qa", "sqs", "Queue A", 740, 150),
    node("cons", "lambda", "Consumer", 740, 300),
    node("qb", "sqs", "Queue B", 740, 450),
    node("wka", "lambda", "Worker A", 970, 150),
    node("db", "dynamodb", "DynamoDB", 1180, 225),
    node("wkb", "lambda", "Worker B", 970, 450),
    node("pub", "sns", "SNS", 1180, 450),
  ], [
    edge("gw", "prod"),
    edge("prod", "eb", "amqp"),
    edge("eb", "qa", "amqp"),
    edge("eb", "cons", "amqp"),
    edge("eb", "qb", "amqp"),
    edge("qa", "wka", "amqp"),
    edge("wka", "db", "nosql"),
    edge("cons", "db", "nosql"),
    edge("qb", "wkb", "amqp"),
    edge("wkb", "pub", "amqp"),
  ]),
};

// ── 18. CQRS com EventBridge Pipes ───────────────────────────────────────────

const cqrsEBPipes: ArchitectureTemplate = {
  id: "cqrs-eventbridge-pipes",
  name: "CQRS com EventBridge Pipes",
  category: "event-driven",
  tags: ["cqrs", "eventbridge-pipes", "dynamodb", "lambda", "elasticache", "padroes"],
  estimatedCostUSD: 95,
  description: "Padrão CQRS: comandos gravam no DynamoDB, EventBridge Pipes captura DynamoDB Streams e projeta para ElastiCache. Leituras são rápidas via cache.",
  data: toV3("CQRS com EventBridge Pipes", [
    node("gw", "api-gateway", "API Gateway", 50, 300),
    node("cmd", "lambda", "Command Handler", 280, 180),
    node("qry", "lambda", "Query Handler", 280, 420),
    node("db", "dynamodb", "DynamoDB", 510, 180),
    node("pipes", "eventbridge-pipes", "EventBridge Pipes", 740, 180),
    node("proj", "lambda", "Projection", 970, 180),
    node("cache", "elasticache", "ElastiCache", 1180, 300),
  ], [
    edge("gw", "cmd"),
    edge("gw", "qry"),
    edge("cmd", "db", "nosql"),
    edge("db", "pipes", "amqp"),
    edge("pipes", "proj", "amqp"),
    edge("proj", "cache", "tcp"),
    edge("qry", "cache", "tcp"),
  ]),
};

// ── 19. Notificações Multi-Canal ──────────────────────────────────────────────

const notificationsMultichannel: ArchitectureTemplate = {
  id: "notifications-multichannel",
  name: "Notificações Multi-Canal",
  category: "event-driven",
  tags: ["sns", "sqs", "ses", "lambda", "dynamodb", "notificacoes", "email"],
  estimatedCostUSD: 20,
  description: "Sistema de notificações: SNS distribui para filas SQS especializadas por canal. Workers Lambda processam cada canal — email (SES), push e SMS.",
  data: toV3("Notificações Multi-Canal", [
    node("gw", "api-gateway", "API Gateway", 50, 350),
    node("disp", "lambda", "Dispatcher", 280, 350),
    node("pub", "sns", "SNS", 510, 350),
    node("qemail", "sqs", "Email Queue", 740, 200),
    node("qpush", "sqs", "Push Queue", 740, 350),
    node("qsms", "sqs", "SMS Queue", 740, 500),
    node("wemail", "lambda", "Email Worker", 970, 200),
    node("wpush", "lambda", "Push Worker", 970, 350),
    node("wsms", "lambda", "SMS Worker", 970, 500),
    node("email", "ses", "SES", 1180, 200),
    node("pushdb", "dynamodb", "Push Tokens", 1180, 350),
  ], [
    edge("gw", "disp"),
    edge("disp", "pub", "amqp"),
    edge("pub", "qemail", "amqp"),
    edge("pub", "qpush", "amqp"),
    edge("pub", "qsms", "amqp"),
    edge("qemail", "wemail", "amqp"),
    edge("qpush", "wpush", "amqp"),
    edge("qsms", "wsms", "amqp"),
    edge("wemail", "email"),
    edge("wpush", "pushdb", "nosql"),
  ]),
};

// ── 20. Containers ECS com Fargate ────────────────────────────────────────────

const ecsAutoScaling: ArchitectureTemplate = {
  id: "ecs-autoscaling",
  name: "Containers ECS com Fargate",
  category: "containers",
  tags: ["ecs", "fargate", "alb", "aurora", "elasticache", "s3", "producao", "containers"],
  estimatedCostUSD: 380,
  description: "Stack de containers com Fargate gerenciado, ALB para balanceamento, Aurora para banco com HA e ElastiCache para sessões. Workers assíncronos via SQS.",
  data: toV3("Containers ECS com Fargate", [
    node("r53", "route53", "Route53", 50, 300),
    node("cf", "cloudfront", "CloudFront", 250, 300),
    node("waf", "waf", "WAF", 450, 300),
    node("alb", "alb", "ALB", 650, 300),
    node("api", "fargate", "API Service", 880, 180),
    node("wrk", "fargate", "Worker Service", 880, 420),
    node("db", "aurora", "Aurora", 1100, 250),
    node("cache", "elasticache", "ElastiCache", 1100, 150),
    node("store", "s3", "S3 Storage", 1100, 430),
    node("q", "sqs", "SQS", 680, 450),
  ], [
    edge("r53", "cf"),
    edge("cf", "waf"),
    edge("waf", "alb"),
    edge("alb", "api"),
    edge("alb", "wrk"),
    edge("api", "db", "sql"),
    edge("api", "cache", "tcp"),
    edge("api", "store"),
    edge("q", "wrk", "amqp"),
    edge("wrk", "db", "sql"),
  ]),
};

// ── 21. Disaster Recovery Multi-Região ───────────────────────────────────────

const multiRegionDr: ArchitectureTemplate = {
  id: "multi-region-dr",
  name: "Disaster Recovery Multi-Região",
  category: "multi-region",
  tags: ["multi-region", "route53", "cloudfront", "rds", "failover", "dr", "resiliencia"],
  estimatedCostUSD: 850,
  description: "DR ativo-passivo em duas regiões AWS. Route53 com health checks faz failover automático. RDS com réplica cross-region. CloudFront entrega global.",
  data: toV3("Disaster Recovery Multi-Região", [
    node("r53", "route53", "Route53 (Failover)", 580, 50),
    node("cf", "cloudfront", "CloudFront", 580, 200),
    node("reg1", "region", "us-east-1 (Primária)", 50, 350),
    node("alb1", "alb", "ALB Primary", 150, 450),
    node("app1", "ecs", "App Service", 330, 450),
    node("db1", "rds", "RDS Primary", 150, 600),
    node("reg2", "region", "us-west-2 (DR)", 800, 350),
    node("alb2", "alb", "ALB DR", 900, 450),
    node("app2", "ecs", "App Service (DR)", 1070, 450),
    node("db2", "rds", "RDS Replica", 900, 600),
  ], [
    edge("r53", "cf"),
    edge("cf", "alb1"),
    edge("cf", "alb2"),
    edge("alb1", "app1"),
    edge("app1", "db1", "sql"),
    edge("alb2", "app2"),
    edge("app2", "db2", "sql"),
    edge("db1", "db2", "sql"),
  ]),
};

// ── 22. Zero Trust com Cognito e WAF ─────────────────────────────────────────

const zeroTrustCognito: ArchitectureTemplate = {
  id: "zero-trust-cognito",
  name: "Zero Trust com Cognito e WAF",
  category: "security",
  tags: ["waf", "cognito", "api-gateway", "lambda", "kms", "secrets-manager", "cloudtrail", "seguranca", "zero-trust"],
  estimatedCostUSD: 110,
  description: "Arquitetura Zero Trust: WAF bloqueia ameaças, Cognito autentica usuários, API Gateway valida tokens JWT, KMS cifra dados e CloudTrail registra auditoria.",
  data: toV3("Zero Trust com Cognito e WAF", [
    node("cf", "cloudfront", "CloudFront", 50, 300),
    node("waf", "waf", "WAF", 250, 300),
    node("cog", "cognito", "Cognito", 450, 180),
    node("gw", "api-gateway", "API Gateway", 450, 300),
    node("fn", "lambda", "Handler", 680, 300, { memoryMB: 512, timeoutSec: 30, requestsPerMonth: 500000 }),
    node("db", "dynamodb", "DynamoDB", 900, 200),
    node("sec", "secrets-manager", "Secrets Manager", 900, 400),
    node("kms", "kms", "KMS", 1100, 300),
    node("trail", "cloudtrail", "CloudTrail", 680, 100),
  ], [
    edge("cf", "waf"),
    edge("waf", "cog"),
    edge("waf", "gw"),
    edge("cog", "gw"),
    edge("gw", "fn"),
    edge("fn", "db", "nosql"),
    edge("fn", "sec"),
    edge("sec", "kms"),
  ]),
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  serverlessApi,
  webApp,
  microservices,
  dataPipeline,
  secureArchitecture,
  eventDriven,
  fullStackEks,
  staticSiteCDN,
  portalWebWaf,
  cdnLambdaEdge,
  bffPattern,
  microservicesApiGw,
  graphqlAppSync,
  serverlessFullApi,
  aiBedrockRag,
  mlSagemakerPipeline,
  eventDrivenEB,
  cqrsEBPipes,
  notificationsMultichannel,
  ecsAutoScaling,
  multiRegionDr,
  zeroTrustCognito,
];

export const TEMPLATE_CATEGORY_LABELS: Record<ArchitectureTemplate["category"], string> = {
  serverless: "Serverless",
  containers: "Containers",
  data: "Dados",
  security: "Segurança",
  microservices: "Microsserviços",
  "full-stack": "Full-Stack",
  hosting: "Web & Hosting",
  bff: "API & BFF",
  "ai-ml": "IA & ML",
  "event-driven": "Event-Driven",
  "multi-region": "Multi-Região",
};
