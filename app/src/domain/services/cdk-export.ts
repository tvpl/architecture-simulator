/**
 * AWS CDK TypeScript app generator — produces a complete CDK app from architecture nodes.
 * Pure domain logic: no React, Next.js, or store imports.
 */
import type { ArchitectureNode } from "../entities/node";
import type { ConnectionEdge } from "../entities/edge";

/** Sanitize a label to a valid TypeScript identifier */
function toId(label: string): string {
  return label
    .replace(/[\s-]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[0-9]/, "R$&");
}

/** Capitalize first letter */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Convert project name to a valid PascalCase class name */
function toClassName(projectName: string): string {
  const words = projectName.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  return words.map(capitalize).join("") || "AwsArchitecture";
}

function cfg(node: ArchitectureNode): Record<string, unknown> {
  return node.config as unknown as Record<string, unknown>;
}

function generateConstruct(node: ArchitectureNode, stackName: string): string {
  const id = toId(node.label) || `Resource${node.id.slice(0, 8)}`;
  const c = cfg(node);

  switch (node.type) {
    case "lambda":
      return `    const ${id} = new lambda.Function(this, '${id}', {
      functionName: '${id}',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      memorySize: ${(c.memoryMB as number) ?? 128},
      timeout: cdk.Duration.seconds(${(c.timeoutSec as number) ?? 30}),
      environment: {
        PROJECT: ${stackName},
      },
    });`;

    case "s3":
      return `    const ${id} = new s3.Bucket(this, '${id}', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });`;

    case "rds":
      return `    const ${id} = new rds.DatabaseInstance(this, '${id}', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: ${(c.storageGB as number) ?? 20},
      multiAz: false,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });`;

    case "dynamodb":
      return `    const ${id} = new dynamodb.Table(this, '${id}', {
      tableName: '${id}',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: ${
        (c.capacityMode as string) === "on-demand"
          ? "dynamodb.BillingMode.PAY_PER_REQUEST"
          : `dynamodb.BillingMode.PROVISIONED,\n      readCapacity: ${(c.readCapacityUnits as number) ?? 5},\n      writeCapacity: ${(c.writeCapacityUnits as number) ?? 5}`
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });`;

    case "sqs":
      return `    const ${id} = new sqs.Queue(this, '${id}', {
      queueName: '${id}',
    });`;

    case "sns":
      return `    const ${id} = new sns.Topic(this, '${id}', {
      topicName: '${id}',
    });`;

    case "alb":
      return `    const ${id} = new elbv2.ApplicationLoadBalancer(this, '${id}', {
      loadBalancerName: '${id}',
      internetFacing: true,
    });`;

    case "vpc":
      return `    const ${id} = new ec2.Vpc(this, '${id}', {
      vpcName: '${id}',
      maxAzs: 2,
      natGateways: 1,
    });`;

    case "ecs":
      return `    const ${id} = new ecs.Cluster(this, '${id}', {
      clusterName: '${id}',
      containerInsights: true,
    });`;

    case "eks":
      return `    const ${id} = new eks.Cluster(this, '${id}', {
      clusterName: '${id}',
      version: eks.KubernetesVersion.V1_29,
    });`;

    case "elasticache":
      return `    // ElastiCache via low-level CfnCacheCluster (no high-level L2 construct available)
    const ${id} = new elasticache.CfnCacheCluster(this, '${id}', {
      engine: '${(c.engine as string) ?? "redis"}',
      cacheNodeType: '${(c.nodeType as string) ?? "cache.t3.micro"}',
      numCacheNodes: ${(c.nodeCount as number) ?? 1},
    });`;

    case "kinesis":
      return `    const ${id} = new kinesis.Stream(this, '${id}', {
      streamName: '${id}',
      shardCount: ${(c.shardCount as number) ?? 1},
    });`;

    case "api-gateway":
      return `    const ${id} = new apigateway.RestApi(this, '${id}', {
      restApiName: '${id}',
    });`;

    case "cloudfront":
      return `    // TODO: configure origins before deploying CloudFront distribution
    // const ${id} = new cloudfront.Distribution(this, '${id}', {
    //   defaultBehavior: { origin: new origins.HttpOrigin('REPLACE_WITH_ORIGIN') },
    // });`;

    default:
      return `    // TODO: ${node.type} — "${node.label}" (no CDK construct mapped)`;
  }
}

function collectImports(nodes: ArchitectureNode[]): string[] {
  const imports = new Set<string>();
  imports.add("import * as cdk from 'aws-cdk-lib';");
  imports.add("import { Construct } from 'constructs';");

  for (const node of nodes) {
    switch (node.type) {
      case "lambda":
        imports.add("import * as lambda from 'aws-cdk-lib/aws-lambda';");
        break;
      case "s3":
        imports.add("import * as s3 from 'aws-cdk-lib/aws-s3';");
        break;
      case "rds":
        imports.add("import * as rds from 'aws-cdk-lib/aws-rds';");
        imports.add("import * as ec2 from 'aws-cdk-lib/aws-ec2';");
        break;
      case "dynamodb":
        imports.add("import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';");
        break;
      case "sqs":
        imports.add("import * as sqs from 'aws-cdk-lib/aws-sqs';");
        break;
      case "sns":
        imports.add("import * as sns from 'aws-cdk-lib/aws-sns';");
        break;
      case "alb":
        imports.add("import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';");
        imports.add("import * as ec2 from 'aws-cdk-lib/aws-ec2';");
        break;
      case "vpc":
        imports.add("import * as ec2 from 'aws-cdk-lib/aws-ec2';");
        break;
      case "ecs":
        imports.add("import * as ecs from 'aws-cdk-lib/aws-ecs';");
        break;
      case "eks":
        imports.add("import * as eks from 'aws-cdk-lib/aws-eks';");
        break;
      case "elasticache":
        imports.add("import * as elasticache from 'aws-cdk-lib/aws-elasticache';");
        break;
      case "kinesis":
        imports.add("import * as kinesis from 'aws-cdk-lib/aws-kinesis';");
        break;
      case "api-gateway":
        imports.add("import * as apigateway from 'aws-cdk-lib/aws-apigateway';");
        break;
      case "cloudfront":
        imports.add("import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';");
        break;
    }
  }

  return [...imports].sort();
}

export function generateCDKApp(
  nodes: ArchitectureNode[],
  _edges: ConnectionEdge[],
  projectName: string
): string {
  const stackClassName = `${toClassName(projectName)}Stack`;
  const filteredNodes = nodes.filter((n) => n.type !== "note");

  const imports = collectImports(filteredNodes);
  const constructs = filteredNodes.map((n) => generateConstruct(n, "this.stackName")).join("\n\n");

  return `// cdk.json (create this file alongside the stack):
// {
//   "app": "npx ts-node --prefer-ts-exts bin/app.ts",
//   "context": { "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true }
// }
//
// Install: npm install aws-cdk-lib constructs

// ─── AWS CDK TypeScript App ───────────────────────────────────────────────────
// Project : ${projectName}
// Generated: ${new Date().toISOString()}
// ─────────────────────────────────────────────────────────────────────────────
// Prerequisites:
//   npm install -g aws-cdk
//   npm install aws-cdk-lib constructs
//   cdk bootstrap
//   cdk deploy
// ─────────────────────────────────────────────────────────────────────────────

${imports.join("\n")}

export class ${stackClassName} extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

${constructs || "    // No resources defined"}
  }
}

const app = new cdk.App();
new ${stackClassName}(app, '${projectName}', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
app.synth();
`;
}
