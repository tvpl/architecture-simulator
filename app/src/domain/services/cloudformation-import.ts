/**
 * CloudFormation Import Service
 * Pure function — zero React/Next.js imports.
 * Parses a CloudFormation JSON template and returns nodes/edges for the canvas.
 */

// ── Result type ───────────────────────────────────────────────────────────────

export interface CFImportResult {
  nodes: Array<{
    type: string;         // AWS_SERVICE_TYPE string
    label: string;        // resource logical ID
    config: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;       // logical ID
    target: string;       // logical ID
    protocol: string;
  }>;
  warnings: string[];     // unrecognized resource types
}

// ── CF type → our service type map ───────────────────────────────────────────

const CF_TYPE_MAP: Record<string, string> = {
  "AWS::Lambda::Function": "lambda",
  "AWS::EC2::Instance": "ec2",
  "AWS::ECS::Service": "ecs",
  "AWS::ECS::Cluster": "ecs",
  "AWS::EKS::Cluster": "eks",
  "AWS::RDS::DBInstance": "rds",
  "AWS::RDS::DBCluster": "aurora",
  "AWS::S3::Bucket": "s3",
  "AWS::DynamoDB::Table": "dynamodb",
  "AWS::ElastiCache::ReplicationGroup": "elasticache",
  "AWS::ElastiCache::CacheCluster": "elasticache",
  "AWS::SQS::Queue": "sqs",
  "AWS::SNS::Topic": "sns",
  "AWS::CloudFront::Distribution": "cloudfront",
  "AWS::ElasticLoadBalancingV2::LoadBalancer": "alb",
  "AWS::ApiGateway::RestApi": "api-gateway",
  "AWS::ApiGatewayV2::Api": "api-gateway",
  "AWS::WAFv2::WebACL": "waf",
  "AWS::WAF::WebACL": "waf",
  "AWS::Route53::RecordSet": "route53",
  "AWS::Route53::RecordSetGroup": "route53",
  "AWS::KMS::Key": "kms",
  "AWS::SecretsManager::Secret": "secrets-manager",
  "AWS::Cognito::UserPool": "cognito",
  "AWS::IAM::Role": "iam",
  "AWS::IAM::Policy": "iam",
  "AWS::CloudTrail::Trail": "cloudtrail",
  "AWS::StepFunctions::StateMachine": "step-functions",
  "AWS::AppSync::GraphQLApi": "app-sync",
  "AWS::Kinesis::Stream": "kinesis",
  "AWS::MSK::Cluster": "msk",
  "AWS::Events::Rule": "eventbridge",
  "AWS::EFS::FileSystem": "efs",
  "AWS::Redshift::Cluster": "redshift",
  "AWS::Glue::Job": "glue",
  "AWS::SageMaker::Model": "sagemaker",
  "AWS::EC2::VPC": "vpc",
  "AWS::EC2::Subnet": "subnet",
  "AWS::EC2::SecurityGroup": "security-group",
  "AWS::CodePipeline::Pipeline": "codepipeline",
  "AWS::Fargate::TaskDefinition": "fargate",
  "AWS::ECS::TaskDefinition": "fargate",
};

// ── Config extractor ──────────────────────────────────────────────────────────

function extractConfig(
  serviceType: string,
  properties: Record<string, unknown>
): Record<string, unknown> {
  const p = properties;
  switch (serviceType) {
    case "lambda":
      return {
        memoryMB: (p.MemorySize as number) ?? 128,
        timeoutSec: (p.Timeout as number) ?? 30,
      };
    case "rds":
      return {
        instanceType: (p.DBInstanceClass as string) ?? "db.t3.micro",
      };
    default:
      return {};
  }
}

// ── Reference scanner ─────────────────────────────────────────────────────────

/**
 * Recursively walk a value and collect all logical IDs referenced via
 * { Ref: "LogicalId" } or { "Fn::GetAtt": ["LogicalId", "..."] }.
 */
function collectRefs(value: unknown, knownIds: Set<string>): string[] {
  const refs: string[] = [];

  if (value === null || typeof value !== "object") return refs;

  if (Array.isArray(value)) {
    for (const item of value) {
      refs.push(...collectRefs(item, knownIds));
    }
    return refs;
  }

  const obj = value as Record<string, unknown>;

  // { Ref: "LogicalId" }
  if ("Ref" in obj && typeof obj.Ref === "string" && knownIds.has(obj.Ref)) {
    refs.push(obj.Ref);
  }

  // { "Fn::GetAtt": ["LogicalId", "Attr"] }
  if ("Fn::GetAtt" in obj && Array.isArray(obj["Fn::GetAtt"])) {
    const arr = obj["Fn::GetAtt"] as unknown[];
    if (arr.length >= 1 && typeof arr[0] === "string" && knownIds.has(arr[0])) {
      refs.push(arr[0]);
    }
  }

  // Recurse into all child values
  for (const key of Object.keys(obj)) {
    if (key !== "Ref" && key !== "Fn::GetAtt") {
      refs.push(...collectRefs(obj[key], knownIds));
    }
  }

  return refs;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function importFromCloudFormation(cfText: string): CFImportResult {
  const result: CFImportResult = { nodes: [], edges: [], warnings: [] };

  // 1. Parse
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cfText) as Record<string, unknown>;
  } catch {
    result.warnings.push(
      "Apenas JSON é suportado. Use o console AWS para exportar como JSON."
    );
    return result;
  }

  // 2. Extract Resources section
  if (!parsed || typeof parsed.Resources !== "object" || parsed.Resources === null) {
    result.warnings.push("Template não contém uma seção 'Resources' válida.");
    return result;
  }

  const resources = parsed.Resources as Record<string, unknown>;

  // Build set of all logical IDs (needed for ref resolution)
  const allLogicalIds = new Set(Object.keys(resources));

  // 3. Map resources to nodes
  const recognizedIds = new Set<string>();

  for (const [logicalId, rawResource] of Object.entries(resources)) {
    const resource = rawResource as Record<string, unknown>;
    const cfType = resource.Type as string | undefined;

    if (!cfType) continue;

    const serviceType = CF_TYPE_MAP[cfType];

    if (!serviceType) {
      result.warnings.push(`Tipo não reconhecido ignorado: ${cfType} (${logicalId})`);
      continue;
    }

    const properties =
      resource.Properties && typeof resource.Properties === "object"
        ? (resource.Properties as Record<string, unknown>)
        : {};

    result.nodes.push({
      type: serviceType,
      label: logicalId,
      config: extractConfig(serviceType, properties),
    });

    recognizedIds.add(logicalId);
  }

  // 4. Build edges from Ref / Fn::GetAtt references between recognized resources
  const edgeSet = new Set<string>();

  for (const [logicalId, rawResource] of Object.entries(resources)) {
    if (!recognizedIds.has(logicalId)) continue;

    const resource = rawResource as Record<string, unknown>;
    const properties =
      resource.Properties && typeof resource.Properties === "object"
        ? resource.Properties
        : {};

    const refs = collectRefs(properties, allLogicalIds);

    for (const ref of refs) {
      // Skip self-references and refs to unrecognized resources
      if (ref === logicalId || !recognizedIds.has(ref)) continue;

      const edgeKey = `${logicalId}->${ref}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      result.edges.push({
        source: logicalId,
        target: ref,
        protocol: "https",
      });
    }
  }

  return result;
}
