/**
 * Terraform HCL generator — produces valid Terraform configuration from architecture nodes.
 * Pure domain logic: no React, Next.js, or store imports.
 */
import type { ArchitectureNode } from "../entities/node";
import type { ConnectionEdge } from "../entities/edge";

/** Sanitize a label to a valid Terraform resource name */
function toTfName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^[0-9]/, "r$&"); // Terraform names can't start with a digit
}

function cfg(node: ArchitectureNode): Record<string, unknown> {
  return node.config as unknown as Record<string, unknown>;
}

function generateResource(node: ArchitectureNode): string {
  const name = toTfName(node.label) || `resource_${node.id.slice(0, 8)}`;
  const c = cfg(node);

  switch (node.type) {
    case "lambda":
      return `resource "aws_lambda_function" "${name}" {
  function_name = "\${local.project}-${name}"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  role          = "arn:aws:iam::ACCOUNT_ID:role/lambda-role"
  memory_size   = ${(c.memoryMB as number) ?? 128}
  timeout       = ${(c.timeoutSec as number) ?? 3}

  environment {
    variables = {
      PROJECT = var.project_name
    }
  }

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "ec2":
      return `resource "aws_instance" "${name}" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "${(c.instanceType as string) ?? "t3.micro"}"
  count         = ${(c.count as number) ?? 1}

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "rds":
      return `resource "aws_db_instance" "${name}" {
  engine            = "${(c.engine as string) ?? "mysql"}"
  instance_class    = "${(c.instanceClass as string) ?? "db.t3.micro"}"
  allocated_storage = ${(c.storageGB as number) ?? 20}
  multi_az          = ${(c.multiAZ as boolean) ?? false}
  username          = "admin"
  password          = "CHANGE_ME"
  skip_final_snapshot       = false
  final_snapshot_identifier = "\${local.project}-final-snapshot"

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "s3": {
      const bucketName = name.replace(/_/g, "-");
      return `resource "aws_s3_bucket" "${name}" {
  bucket        = "\${local.project}-${bucketName}"
  force_destroy = false

  tags = {
    Name    = "\${local.project}-${bucketName}"
    Project = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "${name}_versioning" {
  bucket = aws_s3_bucket.${name}.id

  versioning_configuration {
    status = "Enabled"
  }
}`;
    }

    case "dynamodb":
      return `resource "aws_dynamodb_table" "${name}" {
  name         = "\${local.project}-${name}"
  billing_mode = "${(c.capacityMode as string) === "on-demand" ? "PAY_PER_REQUEST" : "PROVISIONED"}"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
${
  (c.capacityMode as string) !== "on-demand"
    ? `  read_capacity  = ${(c.readCapacityUnits as number) ?? 5}
  write_capacity = ${(c.writeCapacityUnits as number) ?? 5}`
    : ""
}
  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "sqs":
      return `resource "aws_sqs_queue" "${name}" {
  name = "\${local.project}-${name}"

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "sns":
      return `resource "aws_sns_topic" "${name}" {
  name = "\${local.project}-${name}"

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "alb":
      return `resource "aws_lb" "${name}" {
  name               = "\${local.project}-${name.replace(/_/g, "-")}"
  load_balancer_type = "application"
  internal           = false

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "cloudfront":
      return `resource "aws_cloudfront_distribution" "${name}" {
  enabled = true

  origin {
    domain_name = "REPLACE_WITH_ORIGIN"
    origin_id   = "\${local.project}-${name}-origin"
  }

  default_cache_behavior {
    target_origin_id       = "\${local.project}-${name}-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "vpc":
      return `resource "aws_vpc" "${name}" {
  cidr_block           = "${(c.cidrBlock as string) ?? "10.0.0.0/16"}"
  enable_dns_hostnames = ${(c.enableDnsHostnames as boolean) ?? true}

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "subnet":
      return `resource "aws_subnet" "${name}" {
  cidr_block              = "${(c.cidrBlock as string) ?? "10.0.1.0/24"}"
  map_public_ip_on_launch = ${(c.isPublic as boolean) ?? false}

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "api-gateway":
      return `resource "aws_api_gateway_rest_api" "${name}" {
  name = "\${local.project}-${name}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "elasticache":
      return `resource "aws_elasticache_cluster" "${name}" {
  cluster_id      = "\${local.project}-${name.replace(/_/g, "-")}"
  engine          = "${(c.engine as string) ?? "redis"}"
  node_type       = "${(c.nodeType as string) ?? "cache.t3.micro"}"
  num_cache_nodes = ${(c.nodeCount as number) ?? 1}

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "eks":
      return `resource "aws_eks_cluster" "${name}" {
  name     = "\${local.project}-${name}"
  role_arn = "arn:aws:iam::ACCOUNT_ID:role/eks-cluster-role"

  vpc_config {
    subnet_ids = ["REPLACE_WITH_SUBNET_IDS"]
  }

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "ecs":
      return `resource "aws_ecs_cluster" "${name}" {
  name = "\${local.project}-${name}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    case "kinesis":
      return `resource "aws_kinesis_stream" "${name}" {
  name        = "\${local.project}-${name}"
  shard_count = ${(c.shardCount as number) ?? 1}

  tags = {
    Name    = "\${local.project}-${name}"
    Project = var.project_name
  }
}`;

    default:
      return `# TODO: add resource for ${node.type} ("${node.label}")`;
  }
}

function generateOutputs(nodes: ArchitectureNode[]): string {
  const blocks: string[] = [];

  for (const node of nodes) {
    if (node.type === "note") continue;
    const name = toTfName(node.label) || `resource_${node.id.slice(0, 8)}`;

    switch (node.type) {
      case "lambda":
        blocks.push(`output "${name}_arn" {
  description = "ARN of Lambda function ${node.label}"
  value       = aws_lambda_function.${name}.arn
}

output "${name}_invoke_arn" {
  description = "Invoke ARN of Lambda function ${node.label}"
  value       = aws_lambda_function.${name}.invoke_arn
}`);
        break;

      case "rds":
        blocks.push(`output "${name}_endpoint" {
  description = "Endpoint of RDS instance ${node.label}"
  value       = aws_db_instance.${name}.endpoint
}`);
        break;

      case "s3":
        blocks.push(`output "${name}_bucket_name" {
  description = "Name of S3 bucket ${node.label}"
  value       = aws_s3_bucket.${name}.id
}

output "${name}_bucket_arn" {
  description = "ARN of S3 bucket ${node.label}"
  value       = aws_s3_bucket.${name}.arn
}`);
        break;

      case "alb":
        blocks.push(`output "${name}_dns_name" {
  description = "DNS name of ALB ${node.label}"
  value       = aws_lb.${name}.dns_name
}`);
        break;

      case "api-gateway":
        blocks.push(`output "${name}_execution_arn" {
  description = "Execution ARN of API Gateway ${node.label}"
  value       = aws_api_gateway_rest_api.${name}.execution_arn
}`);
        break;
    }
  }

  return blocks.join("\n\n");
}

export function generateTerraformTemplate(
  nodes: ArchitectureNode[],
  _edges: ConnectionEdge[],
  projectName: string
): string {
  const sanitizedProject = toTfName(projectName) || "aws_architecture";

  const header = `# ─── Terraform HCL ───────────────────────────────────────────────────────────
# Project : ${projectName}
# Generated: ${new Date().toISOString()}
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "${sanitizedProject}"
      ManagedBy = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "${sanitizedProject}"
}

locals {
  project = var.project_name
}

`;

  const filteredNodes = nodes.filter((n) => n.type !== "note");
  const resourceBlocks = filteredNodes.map((n) => generateResource(n)).join("\n\n");

  const outputBlocks = generateOutputs(filteredNodes);

  const body = resourceBlocks || "# No resources defined\n";
  const outputs = outputBlocks
    ? `\n\n# ─── Outputs ────────────────────────────────────────────────────────────────\n\n${outputBlocks}\n`
    : "";

  return header + body + outputs;
}
