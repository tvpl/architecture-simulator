// ─── AWS Service Types ───────────────────────────────────────────────────────

export const AWS_SERVICE_TYPES = [
  // Compute
  "ec2",
  "ecs",
  "eks",
  "lambda",
  "fargate",
  "ecr",
  // Networking
  "vpc",
  "subnet",
  "alb",
  "nlb",
  "api-gateway",
  "cloudfront",
  "route53",
  "security-group",
  // Messaging
  "sqs",
  "sns",
  "eventbridge",
  "msk",
  "kinesis",
  "ses",
  // Storage
  "s3",
  "rds",
  "dynamodb",
  "elasticache",
  "efs",
  // Security
  "iam",
  "waf",
  "secrets-manager",
  "cognito",
  "cloudtrail",
  // Integration
  "step-functions",
  "cloudwatch",
  "codepipeline",
  "xray",
  // Analytics
  "redshift",
  "athena",
  "opensearch",
  "glue",
  "sagemaker",
  "bedrock",
  // Integration (express)
  "sfn-express",
  // Messaging (pipes)
  "eventbridge-pipes",
  // Annotations
  "note",
  "region",
] as const;

export type AWSServiceType = (typeof AWS_SERVICE_TYPES)[number];

export const NODE_CATEGORIES = [
  "compute",
  "networking",
  "messaging",
  "storage",
  "security",
  "integration",
  "analytics",
  "annotations",
] as const;

export type NodeCategory = (typeof NODE_CATEGORIES)[number];

// ─── Per-Service Configuration Types ─────────────────────────────────────────

export interface EC2Config {
  instanceType: string;
  count: number;
  spotEnabled: boolean;
  ebsVolumeGB: number;
}

export interface ECSConfig {
  taskCount: number;
  cpu: number;
  memoryMB: number;
  launchType: "fargate" | "ec2";
}

export interface EKSConfig {
  nodeCount: number;
  instanceType: string;
  minNodes: number;
  maxNodes: number;
}

export interface LambdaConfig {
  memoryMB: number;
  timeoutSec: number;
  concurrency: number;
  requestsPerMonth: number;
  avgDurationMs: number;
}

export interface FargateConfig {
  taskCount: number;
  cpu: number;
  memoryGB: number;
}

export interface VPCConfig {
  cidrBlock: string;
  region: string;
  enableDnsHostnames: boolean;
}

export interface SubnetConfig {
  cidrBlock: string;
  availabilityZone: string;
  isPublic: boolean;
}

export interface ALBConfig {
  type: "application";
  crossZone: boolean;
  idleTimeoutSec: number;
}

export interface NLBConfig {
  type: "network";
  crossZone: boolean;
}

export interface APIGatewayConfig {
  type: "rest" | "http" | "websocket";
  requestsPerMonth: number;
  cacheSizeGB: number;
  throttleRPS: number;
}

export interface CloudFrontConfig {
  priceClass: "PriceClass_All" | "PriceClass_200" | "PriceClass_100";
  requestsPerMonth: number;
  dataTransferGB: number;
}

export interface Route53Config {
  hostedZones: number;
  queriesPerMonth: number;
}

export interface SecurityGroupConfig {
  inboundRules: number;
  outboundRules: number;
}

export interface SQSConfig {
  type: "standard" | "fifo";
  visibilityTimeoutSec: number;
  retentionDays: number;
  messagesPerMonth: number;
}

export interface SNSConfig {
  type: "standard" | "fifo";
  subscriptions: number;
  messagesPerMonth: number;
}

export interface EventBridgeConfig {
  rulesCount: number;
  eventsPerMonth: number;
}

export interface MSKConfig {
  brokerCount: number;
  instanceType: string;
  storagePerBrokerGB: number;
  partitions: number;
  replicationFactor: number;
}

export interface KinesisConfig {
  shardCount: number;
  retentionHours: number;
  dataInGB: number;
}

export interface S3Config {
  storageClass: "STANDARD" | "IA" | "GLACIER" | "DEEP_ARCHIVE";
  storageSizeGB: number;
  requestsPerMonth: number;
}

export interface RDSConfig {
  engine: "mysql" | "postgres" | "aurora-mysql" | "aurora-postgres";
  instanceClass: string;
  multiAZ: boolean;
  storageGB: number;
  readReplicas: number;
}

export interface DynamoDBConfig {
  readCapacityUnits: number;
  writeCapacityUnits: number;
  capacityMode: "provisioned" | "on-demand";
  storageGB: number;
}

export interface ElastiCacheConfig {
  engine: "redis" | "memcached";
  nodeType: string;
  nodeCount: number;
  replicationEnabled: boolean;
}

export interface EFSConfig {
  storageClass: "standard" | "infrequent-access";
  throughputMode: "bursting" | "provisioned";
  storageSizeGB: number;
}

export interface IAMConfig {
  roleName: string;
  policies: string[];
}

export interface WAFConfig {
  rulesCount: number;
  requestsPerMonth: number;
}

export interface SecretsManagerConfig {
  secretsCount: number;
  rotationEnabled: boolean;
}

export interface CognitoConfig {
  userPoolSize: number;
  mfaEnabled: boolean;
}

export interface StepFunctionsConfig {
  type: "standard" | "express";
  transitionsPerMonth: number;
}

export interface CloudWatchConfig {
  metricsCount: number;
  logsIngestGB: number;
  alarmsCount: number;
}

export interface ECRConfig {
  repositoryCount: number;
  imagesCount: number;
  storageGB: number;
}

export interface SESConfig {
  emailsPerMonth: number;
  dedicatedIPs: number;
  bounceRateTarget: number;
}

export interface CloudTrailConfig {
  trailsCount: number;
  eventsPerMonth: number;
  s3BucketEnabled: boolean;
}

export interface CodePipelineConfig {
  pipelinesCount: number;
  actionsPerMonth: number;
}

export interface XRayConfig {
  tracesPerMonth: number;
  retentionDays: number;
}

export interface RedshiftConfig {
  nodeType: string;
  nodeCount: number;
  storageGB: number;
  multiAZ: boolean;
}

export interface AthenaConfig {
  queriesPerMonth: number;
  dataScanTB: number;
}

export interface OpenSearchConfig {
  instanceType: string;
  instanceCount: number;
  storageGB: number;
  dedicatedMaster: boolean;
}

export interface GlueConfig {
  jobsCount: number;
  dpuHoursPerMonth: number;
  crawlersCount: number;
}

export interface SageMakerConfig {
  instanceType: string;
  instanceCount: number;
  storageGB: number;
  endpointEnabled: boolean;
}

export interface BedrockConfig {
  modelId: string;
  requestsPerMonth: number;
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
}

export interface SFNExpressConfig {
  executionsPerMonth: number;
  avgDurationSec: number;
  memoryMB: number;
}

export interface EventBridgePipesConfig {
  eventsPerMonth: number;
  filterRatio: number;
}

export interface NoteConfig {
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple";
}

export interface RegionConfig {
  regionCode: string; // e.g. "us-east-1"
  regionName: string; // e.g. "US East (N. Virginia)"
}

// ─── Service Config Map ──────────────────────────────────────────────────────

export interface ServiceConfigMap {
  ec2: EC2Config;
  ecs: ECSConfig;
  eks: EKSConfig;
  lambda: LambdaConfig;
  fargate: FargateConfig;
  ecr: ECRConfig;
  vpc: VPCConfig;
  subnet: SubnetConfig;
  alb: ALBConfig;
  nlb: NLBConfig;
  "api-gateway": APIGatewayConfig;
  cloudfront: CloudFrontConfig;
  route53: Route53Config;
  "security-group": SecurityGroupConfig;
  sqs: SQSConfig;
  sns: SNSConfig;
  eventbridge: EventBridgeConfig;
  msk: MSKConfig;
  kinesis: KinesisConfig;
  ses: SESConfig;
  s3: S3Config;
  rds: RDSConfig;
  dynamodb: DynamoDBConfig;
  elasticache: ElastiCacheConfig;
  efs: EFSConfig;
  iam: IAMConfig;
  waf: WAFConfig;
  "secrets-manager": SecretsManagerConfig;
  cognito: CognitoConfig;
  cloudtrail: CloudTrailConfig;
  "step-functions": StepFunctionsConfig;
  cloudwatch: CloudWatchConfig;
  codepipeline: CodePipelineConfig;
  xray: XRayConfig;
  redshift: RedshiftConfig;
  athena: AthenaConfig;
  opensearch: OpenSearchConfig;
  glue: GlueConfig;
  sagemaker: SageMakerConfig;
  bedrock: BedrockConfig;
  "sfn-express": SFNExpressConfig;
  "eventbridge-pipes": EventBridgePipesConfig;
  note: NoteConfig;
  region: RegionConfig;
}

// ─── Architecture Node ───────────────────────────────────────────────────────

export interface ArchitectureNodeBase {
  id: string;
  label: string;
  category: NodeCategory;
  latencyMs: number;
  positionX: number;
  positionY: number;
  parentId?: string; // For VPC/Subnet containment
  [key: string]: unknown; // Required for React Flow Node<T> compatibility
}

export type ArchitectureNode<T extends AWSServiceType = AWSServiceType> =
  ArchitectureNodeBase & {
    type: T;
    config: ServiceConfigMap[T];
  };

// ─── Container node types (can hold children) ───────────────────────────────

export const CONTAINER_NODE_TYPES: AWSServiceType[] = ["vpc", "subnet", "region"];

export function isContainerNode(type: AWSServiceType): boolean {
  return CONTAINER_NODE_TYPES.includes(type);
}

// ─── Category mapping ────────────────────────────────────────────────────────

export const SERVICE_CATEGORY_MAP: Record<AWSServiceType, NodeCategory> = {
  ec2: "compute",
  ecs: "compute",
  eks: "compute",
  lambda: "compute",
  fargate: "compute",
  ecr: "compute",
  vpc: "networking",
  subnet: "networking",
  alb: "networking",
  nlb: "networking",
  "api-gateway": "networking",
  cloudfront: "networking",
  route53: "networking",
  "security-group": "networking",
  sqs: "messaging",
  sns: "messaging",
  eventbridge: "messaging",
  msk: "messaging",
  kinesis: "messaging",
  ses: "messaging",
  s3: "storage",
  rds: "storage",
  dynamodb: "storage",
  elasticache: "storage",
  efs: "storage",
  iam: "security",
  waf: "security",
  "secrets-manager": "security",
  cognito: "security",
  cloudtrail: "security",
  "step-functions": "integration",
  cloudwatch: "integration",
  codepipeline: "integration",
  xray: "integration",
  redshift: "analytics",
  athena: "analytics",
  opensearch: "analytics",
  glue: "analytics",
  sagemaker: "analytics",
  bedrock: "analytics",
  "sfn-express": "integration",
  "eventbridge-pipes": "messaging",
  note: "annotations",
  region: "annotations",
};
