/**
 * CloudFormation Template Generator
 * Pure function — zero React/Next.js imports.
 * Takes domain nodes and edges and returns a CF template JSON string.
 */
import type { ArchitectureNode } from "@/domain/entities/node";
import type { ConnectionEdge } from "@/domain/entities/edge";
import type {
  LambdaConfig,
  EC2Config,
  ECSConfig,
  S3Config,
  RDSConfig,
  DynamoDBConfig,
  SQSConfig,
  APIGatewayConfig,
  ElastiCacheConfig,
  CloudWatchConfig,
} from "@/domain/entities/node";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sanitize label to PascalCase, then append first 8 chars of node id for uniqueness */
function makeLogicalId(label: string, id: string): string {
  const pascal = label
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const suffix = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return (pascal || "Resource") + suffix;
}

// ── Resource generators ───────────────────────────────────────────────────────

type CFResource = Record<string, unknown>;

function makeLambda(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as LambdaConfig;
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::Lambda::Function",
      Properties: {
        FunctionName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        Runtime: "nodejs20.x",
        Handler: "index.handler",
        Role: { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/LambdaExecutionRole" },
        MemorySize: cfg?.memoryMB ?? 128,
        Timeout: cfg?.timeoutSec ?? 30,
        ReservedConcurrentExecutions: cfg?.concurrency ?? -1,
        Code: {
          ZipFile: "exports.handler = async (event) => ({ statusCode: 200, body: 'Hello World' });",
        },
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

function makeEC2(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as EC2Config;
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::EC2::Instance",
      Properties: {
        InstanceType: cfg?.instanceType ?? "t3.micro",
        ImageId: "ami-0c02fb55956c7d316",
        KeyName: "placeholder-key",
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/xvda",
            Ebs: { VolumeSize: cfg?.ebsVolumeGB ?? 20, VolumeType: "gp3" },
          },
        ],
        Tags: [
          { Key: "Name", Value: node.label },
          { Key: "Environment", Value: { Ref: "Environment" } },
        ],
      },
    },
  };
}

function makeECS(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as ECSConfig;
  const id = makeLogicalId(node.label, node.id);
  const clusterName = `${id}Cluster`;
  const taskDefName = `${id}TaskDef`;
  const serviceName = `${id}Service`;

  return {
    [clusterName]: {
      Type: "AWS::ECS::Cluster",
      Properties: {
        ClusterName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}-cluster` },
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
    [taskDefName]: {
      Type: "AWS::ECS::TaskDefinition",
      Properties: {
        Family: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        RequiresCompatibilities: [cfg?.launchType?.toUpperCase() ?? "FARGATE"],
        Cpu: String(cfg?.cpu ?? 256),
        Memory: String(cfg?.memoryMB ?? 512),
        NetworkMode: "awsvpc",
        ExecutionRoleArn: { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/ecsTaskExecutionRole" },
        ContainerDefinitions: [
          {
            Name: node.label.toLowerCase().replace(/\s+/g, "-"),
            Image: "placeholder-image:latest",
            Essential: true,
            PortMappings: [{ ContainerPort: 80, Protocol: "tcp" }],
          },
        ],
      },
    },
    [serviceName]: {
      Type: "AWS::ECS::Service",
      DependsOn: [clusterName, taskDefName],
      Properties: {
        Cluster: { Ref: clusterName },
        TaskDefinition: { Ref: taskDefName },
        DesiredCount: cfg?.taskCount ?? 1,
        LaunchType: cfg?.launchType?.toUpperCase() ?? "FARGATE",
        NetworkConfiguration: {
          AwsvpcConfiguration: {
            AssignPublicIp: "ENABLED",
            Subnets: ["subnet-placeholder"],
            SecurityGroups: ["sg-placeholder"],
          },
        },
      },
    },
  };
}

function makeS3(node: ArchitectureNode, index: number): Record<string, CFResource> {
  const cfg = node.config as S3Config;
  const id = makeLogicalId(node.label, node.id);
  const versioningEnabled = cfg?.storageClass === "STANDARD";

  return {
    [id]: {
      Type: "AWS::S3::Bucket",
      Properties: {
        BucketName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}-${index}` },
        ...(versioningEnabled
          ? { VersioningConfiguration: { Status: "Enabled" } }
          : {}),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            { ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
          ],
        },
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

function makeRDS(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as RDSConfig;
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::RDS::DBInstance",
      Properties: {
        DBInstanceIdentifier: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        DBInstanceClass: cfg?.instanceClass ?? "db.t3.micro",
        Engine: "mysql",
        EngineVersion: "8.0",
        MasterUsername: "admin",
        MasterUserPassword: { "Fn::Sub": "{{resolve:secretsmanager:${Environment}/db/password}}" },
        AllocatedStorage: String(cfg?.storageGB ?? 20),
        MultiAZ: cfg?.multiAZ ?? false,
        StorageType: "gp3",
        StorageEncrypted: true,
        DeletionProtection: false,
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
      DeletionPolicy: "Snapshot",
    },
  };
}

function makeDynamoDB(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as DynamoDBConfig;
  const id = makeLogicalId(node.label, node.id);
  const isOnDemand = cfg?.capacityMode === "on-demand";

  return {
    [id]: {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        TableName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        BillingMode: isOnDemand ? "PAY_PER_REQUEST" : "PROVISIONED",
        ...(!isOnDemand
          ? {
              ProvisionedThroughput: {
                ReadCapacityUnits: cfg?.readCapacityUnits ?? 5,
                WriteCapacityUnits: cfg?.writeCapacityUnits ?? 5,
              },
            }
          : {}),
        KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
        SSESpecification: { SSEEnabled: true },
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

function makeSQS(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as SQSConfig;
  const id = makeLogicalId(node.label, node.id);
  const isFifo = cfg?.type === "fifo";

  return {
    [id]: {
      Type: "AWS::SQS::Queue",
      Properties: {
        QueueName: {
          "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}${isFifo ? ".fifo" : ""}`,
        },
        ...(isFifo ? { FifoQueue: true, ContentBasedDeduplication: true } : {}),
        VisibilityTimeout: cfg?.visibilityTimeoutSec ?? 30,
        MessageRetentionPeriod: (cfg?.retentionDays ?? 4) * 86400,
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

function makeSNS(node: ArchitectureNode): Record<string, CFResource> {
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::SNS::Topic",
      Properties: {
        TopicName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

function makeAPIGateway(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as APIGatewayConfig;
  const id = makeLogicalId(node.label, node.id);
  const apiId = `${id}Api`;
  const stageId = `${id}Stage`;

  return {
    [apiId]: {
      Type: "AWS::ApiGateway::RestApi",
      Properties: {
        Name: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        Description: `API Gateway for ${node.label}`,
        EndpointConfiguration: { Types: ["REGIONAL"] },
        ...(cfg?.throttleRPS
          ? {
              Policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{ Effect: "Allow", Principal: "*", Action: "execute-api:Invoke", Resource: "*" }],
              }),
            }
          : {}),
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
    [stageId]: {
      Type: "AWS::ApiGateway::Stage",
      DependsOn: [apiId],
      Properties: {
        RestApiId: { Ref: apiId },
        StageName: { Ref: "Environment" },
        Description: `${node.label} ${cfg?.type ?? "rest"} API Stage`,
        MethodSettings: [
          {
            ResourcePath: "/*",
            HttpMethod: "*",
            ThrottlingBurstLimit: cfg?.throttleRPS ?? 1000,
            ThrottlingRateLimit: cfg?.throttleRPS ?? 500,
          },
        ],
      },
    },
  };
}

function makeALB(node: ArchitectureNode): Record<string, CFResource> {
  const id = makeLogicalId(node.label, node.id);
  const lbId = `${id}Lb`;
  const listenerId = `${id}Listener`;

  return {
    [lbId]: {
      Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
      Properties: {
        Name: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        Type: "application",
        Scheme: "internet-facing",
        Subnets: ["subnet-placeholder-1", "subnet-placeholder-2"],
        SecurityGroups: ["sg-placeholder"],
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
    [listenerId]: {
      Type: "AWS::ElasticLoadBalancingV2::Listener",
      DependsOn: [lbId],
      Properties: {
        LoadBalancerArn: { Ref: lbId },
        Port: 80,
        Protocol: "HTTP",
        DefaultActions: [
          {
            Type: "fixed-response",
            FixedResponseConfig: { StatusCode: "200", ContentType: "text/plain", MessageBody: "OK" },
          },
        ],
      },
    },
  };
}

function makeVPC(node: ArchitectureNode): Record<string, CFResource> {
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::EC2::VPC",
      Properties: {
        CidrBlock: "10.0.0.0/16",
        EnableDnsSupport: true,
        EnableDnsHostnames: true,
        Tags: [
          { Key: "Name", Value: node.label },
          { Key: "Environment", Value: { Ref: "Environment" } },
        ],
      },
    },
  };
}

function makeSubnet(node: ArchitectureNode, index: number): Record<string, CFResource> {
  const id = makeLogicalId(node.label, node.id);
  // Derive CidrBlock from index: 10.0.<index>.0/24
  const octet = (index % 256).toString();
  return {
    [id]: {
      Type: "AWS::EC2::Subnet",
      Properties: {
        CidrBlock: `10.0.${octet}.0/24`,
        AvailabilityZone: { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        MapPublicIpOnLaunch: false,
        Tags: [
          { Key: "Name", Value: node.label },
          { Key: "Environment", Value: { Ref: "Environment" } },
        ],
      },
    },
  };
}

function makeElastiCache(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as ElastiCacheConfig;
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::ElastiCache::ReplicationGroup",
      Properties: {
        ReplicationGroupDescription: node.label,
        ReplicationGroupId: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` },
        CacheNodeType: cfg?.nodeType ?? "cache.t3.micro",
        Engine: cfg?.engine ?? "redis",
        NumCacheClusters: cfg?.nodeCount ?? 1,
        AutomaticFailoverEnabled: cfg?.replicationEnabled ?? false,
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

function makeCloudWatch(node: ArchitectureNode): Record<string, CFResource> {
  const cfg = node.config as CloudWatchConfig;
  const id = makeLogicalId(node.label, node.id);
  return {
    [id]: {
      Type: "AWS::Logs::LogGroup",
      Properties: {
        LogGroupName: {
          "Fn::Sub": `/aws/${node.label.toLowerCase().replace(/\s+/g, "-")}/\${Environment}`,
        },
        RetentionInDays: cfg?.logsIngestGB ? 30 : 7,
        Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }],
      },
    },
  };
}

// ── Outputs ───────────────────────────────────────────────────────────────────

function buildOutputs(nodes: ArchitectureNode[]): Record<string, unknown> {
  const outputs: Record<string, unknown> = {};

  for (const node of nodes) {
    const id = makeLogicalId(node.label, node.id);

    if (node.type === "lambda") {
      outputs[`${id}Arn`] = {
        Description: `ARN of Lambda function ${node.label}`,
        Value: { "Fn::GetAtt": [id, "Arn"] },
        Export: { Name: { "Fn::Sub": `\${AWS::StackName}-${id}Arn` } },
      };
    } else if (node.type === "s3") {
      outputs[`${id}BucketName`] = {
        Description: `Bucket name for ${node.label}`,
        Value: { Ref: id },
        Export: { Name: { "Fn::Sub": `\${AWS::StackName}-${id}BucketName` } },
      };
    } else if (node.type === "rds") {
      outputs[`${id}Endpoint`] = {
        Description: `RDS endpoint for ${node.label}`,
        Value: { "Fn::GetAtt": [id, "Endpoint.Address"] },
        Export: { Name: { "Fn::Sub": `\${AWS::StackName}-${id}Endpoint` } },
      };
    } else if (node.type === "sqs") {
      outputs[`${id}Url`] = {
        Description: `SQS Queue URL for ${node.label}`,
        Value: { Ref: id },
        Export: { Name: { "Fn::Sub": `\${AWS::StackName}-${id}Url` } },
      };
    }
  }

  return outputs;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateCloudFormationTemplate(
  nodes: ArchitectureNode[],
  _edges: ConnectionEdge[],
  projectName: string = "AWS Architecture"
): string {
  const resources: Record<string, CFResource> = {};

  // Track per-type counts for index-based naming
  const typeCounters: Record<string, number> = {};

  for (const node of nodes) {
    const idx = (typeCounters[node.type] = (typeCounters[node.type] ?? 0) + 1);

    let generated: Record<string, CFResource> = {};

    switch (node.type) {
      case "lambda":
        generated = makeLambda(node);
        break;
      case "ec2":
        generated = makeEC2(node);
        break;
      case "ecs":
        generated = makeECS(node);
        break;
      case "s3":
        generated = makeS3(node, idx);
        break;
      case "rds":
        generated = makeRDS(node);
        break;
      case "dynamodb":
        generated = makeDynamoDB(node);
        break;
      case "sqs":
        generated = makeSQS(node);
        break;
      case "sns":
        generated = makeSNS(node);
        break;
      case "api-gateway":
        generated = makeAPIGateway(node);
        break;
      case "alb":
        generated = makeALB(node);
        break;
      case "vpc":
        generated = makeVPC(node);
        break;
      case "subnet":
        generated = makeSubnet(node, idx);
        break;
      case "elasticache":
        generated = makeElastiCache(node);
        break;
      case "cloudwatch":
        generated = makeCloudWatch(node);
        break;
      case "ecr": {
        const id = makeLogicalId(node.label, node.id);
        generated = { [id]: { Type: "AWS::ECR::Repository", Properties: { RepositoryName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` }, ImageScanningConfiguration: { ScanOnPush: true }, Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }] } } };
        break;
      }
      case "redshift": {
        const cfg = node.config as import("../entities/node").RedshiftConfig;
        const id = makeLogicalId(node.label, node.id);
        generated = { [id]: { Type: "AWS::Redshift::Cluster", Properties: { ClusterType: cfg.nodeCount > 1 ? "multi-node" : "single-node", DBName: "datawarehouse", MasterUsername: "admin", MasterUserPassword: { "Fn::Sub": `\${Environment}RedshiftPassword` }, NodeType: cfg.nodeType ?? "dc2.large", NumberOfNodes: cfg.nodeCount, Encrypted: true, Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }] } } };
        break;
      }
      case "opensearch": {
        const id = makeLogicalId(node.label, node.id);
        const cfg = node.config as import("../entities/node").OpenSearchConfig;
        generated = { [id]: { Type: "AWS::OpenSearchService::Domain", Properties: { DomainName: { "Fn::Sub": `\${Environment}-${node.label.toLowerCase().replace(/\s+/g, "-")}` }, ClusterConfig: { InstanceType: cfg.instanceType, InstanceCount: cfg.instanceCount, DedicatedMasterEnabled: cfg.dedicatedMaster }, EBSOptions: { EBSEnabled: true, VolumeSize: cfg.storageGB, VolumeType: "gp3" }, Tags: [{ Key: "Environment", Value: { Ref: "Environment" } }] } } };
        break;
      }
      case "note":
        // Annotations are canvas-only, not CloudFormation resources
        generated = {};
        break;
      default:
        // Unsupported service — skip silently
        generated = {};
        break;
    }

    Object.assign(resources, generated);
  }

  const template = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: `Generated by AWS Architecture Simulator — ${projectName}`,
    Parameters: {
      Environment: {
        Type: "String",
        Default: "dev",
        AllowedValues: ["dev", "staging", "prod"],
        Description: "Deployment environment",
      },
    },
    Resources: resources,
    Outputs: buildOutputs(nodes),
  };

  return JSON.stringify(template, null, 2);
}
