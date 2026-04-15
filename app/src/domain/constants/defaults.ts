/**
 * Default configuration values for each AWS service.
 * Used when dropping a new node onto the canvas.
 */
import type { ServiceConfigMap } from "../entities/node";

export const SERVICE_DEFAULTS: ServiceConfigMap = {
  ec2: {
    instanceType: "t3.medium",
    count: 2,
    spotEnabled: false,
    ebsVolumeGB: 50,
  },
  ecs: {
    taskCount: 2,
    cpu: 512,
    memoryMB: 1024,
    launchType: "fargate",
  },
  eks: {
    nodeCount: 3,
    instanceType: "t3.medium",
    minNodes: 1,
    maxNodes: 10,
  },
  lambda: {
    memoryMB: 256,
    timeoutSec: 30,
    concurrency: 0,
    requestsPerMonth: 1_000_000,
    avgDurationMs: 100,
  },
  fargate: {
    taskCount: 2,
    cpu: 512,
    memoryGB: 1,
  },
  vpc: {
    cidrBlock: "10.0.0.0/16",
    region: "us-east-1",
    enableDnsHostnames: true,
  },
  subnet: {
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    isPublic: false,
  },
  alb: {
    type: "application",
    crossZone: true,
    idleTimeoutSec: 60,
  },
  nlb: {
    type: "network",
    crossZone: true,
  },
  "api-gateway": {
    type: "rest",
    requestsPerMonth: 1_000_000,
    cacheSizeGB: 0,
    throttleRPS: 10_000,
  },
  cloudfront: {
    priceClass: "PriceClass_100",
    requestsPerMonth: 1_000_000,
    dataTransferGB: 100,
  },
  route53: {
    hostedZones: 1,
    queriesPerMonth: 1_000_000,
  },
  "security-group": {
    inboundRules: 3,
    outboundRules: 1,
  },
  sqs: {
    type: "standard",
    visibilityTimeoutSec: 30,
    retentionDays: 4,
    messagesPerMonth: 1_000_000,
  },
  sns: {
    type: "standard",
    subscriptions: 3,
    messagesPerMonth: 1_000_000,
  },
  eventbridge: {
    rulesCount: 5,
    eventsPerMonth: 1_000_000,
  },
  msk: {
    brokerCount: 3,
    instanceType: "kafka.m5.large",
    storagePerBrokerGB: 100,
    partitions: 10,
    replicationFactor: 3,
  },
  kinesis: {
    shardCount: 2,
    retentionHours: 24,
    dataInGB: 10,
  },
  s3: {
    storageClass: "STANDARD",
    storageSizeGB: 100,
    requestsPerMonth: 1_000_000,
  },
  rds: {
    engine: "postgres",
    instanceClass: "db.t3.medium",
    multiAZ: true,
    storageGB: 100,
    readReplicas: 1,
  },
  dynamodb: {
    readCapacityUnits: 100,
    writeCapacityUnits: 100,
    capacityMode: "provisioned",
    storageGB: 10,
  },
  elasticache: {
    engine: "redis",
    nodeType: "cache.t3.medium",
    nodeCount: 2,
    replicationEnabled: true,
  },
  efs: {
    storageClass: "standard",
    throughputMode: "bursting",
    storageSizeGB: 50,
  },
  iam: {
    roleName: "MyRole",
    policies: ["AWSLambdaBasicExecutionRole"],
  },
  waf: {
    rulesCount: 5,
    requestsPerMonth: 1_000_000,
  },
  "secrets-manager": {
    secretsCount: 5,
    rotationEnabled: true,
  },
  cognito: {
    userPoolSize: 10_000,
    mfaEnabled: false,
  },
  "step-functions": {
    type: "standard",
    transitionsPerMonth: 100_000,
  },
  cloudwatch: {
    metricsCount: 50,
    logsIngestGB: 10,
    alarmsCount: 20,
  },
  ecr: {
    repositoryCount: 5,
    imagesCount: 50,
    storageGB: 10,
  },
  ses: {
    emailsPerMonth: 100_000,
    dedicatedIPs: 0,
    bounceRateTarget: 5,
  },
  cloudtrail: {
    trailsCount: 1,
    eventsPerMonth: 1_000_000,
    s3BucketEnabled: true,
  },
  codepipeline: {
    pipelinesCount: 3,
    actionsPerMonth: 10_000,
  },
  xray: {
    tracesPerMonth: 100_000,
    retentionDays: 30,
  },
  redshift: {
    nodeType: "dc2.large",
    nodeCount: 2,
    storageGB: 160,
    multiAZ: false,
  },
  athena: {
    queriesPerMonth: 1_000,
    dataScanTB: 1,
  },
  opensearch: {
    instanceType: "t3.small.search",
    instanceCount: 2,
    storageGB: 100,
    dedicatedMaster: false,
  },
  glue: {
    jobsCount: 5,
    dpuHoursPerMonth: 100,
    crawlersCount: 3,
  },
  sagemaker: {
    instanceType: "ml.t3.medium",
    instanceCount: 1,
    storageGB: 50,
    endpointEnabled: true,
  },
  note: {
    content: "Adicione uma anotação aqui...",
    color: "yellow",
  },
};
