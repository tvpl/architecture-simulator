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
  function_name = "${name}"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  role          = "arn:aws:iam::ACCOUNT_ID:role/lambda-role"
  memory_size   = ${(c.memoryMB as number) ?? 128}
  timeout       = ${(c.timeoutSec as number) ?? 3}
}`;

    case "ec2":
      return `resource "aws_instance" "${name}" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "${(c.instanceType as string) ?? "t3.micro"}"
  count         = ${(c.count as number) ?? 1}

  tags = {
    Name = "${name}"
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
  skip_final_snapshot = true
}`;

    case "s3":
      return `resource "aws_s3_bucket" "${name}" {
  bucket = "${name.replace(/_/g, "-")}"

  tags = {
    Name = "${name}"
  }
}`;

    case "dynamodb":
      return `resource "aws_dynamodb_table" "${name}" {
  name         = "${name}"
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
    Name = "${name}"
  }
}`;

    case "sqs":
      return `resource "aws_sqs_queue" "${name}" {
  name = "${name}"
}`;

    case "sns":
      return `resource "aws_sns_topic" "${name}" {
  name = "${name}"
}`;

    case "alb":
      return `resource "aws_lb" "${name}" {
  name               = "${name.replace(/_/g, "-")}"
  load_balancer_type = "application"
  internal           = false
}`;

    case "cloudfront":
      return `resource "aws_cloudfront_distribution" "${name}" {
  enabled = true

  origin {
    domain_name = "REPLACE_WITH_ORIGIN"
    origin_id   = "${name}-origin"
  }

  default_cache_behavior {
    target_origin_id       = "${name}-origin"
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
}`;

    case "vpc":
      return `resource "aws_vpc" "${name}" {
  cidr_block           = "${(c.cidrBlock as string) ?? "10.0.0.0/16"}"
  enable_dns_hostnames = ${(c.enableDnsHostnames as boolean) ?? true}

  tags = {
    Name = "${name}"
  }
}`;

    case "subnet":
      return `resource "aws_subnet" "${name}" {
  cidr_block              = "${(c.cidrBlock as string) ?? "10.0.1.0/24"}"
  map_public_ip_on_launch = ${(c.isPublic as boolean) ?? false}

  tags = {
    Name = "${name}"
  }
}`;

    case "api-gateway":
      return `resource "aws_api_gateway_rest_api" "${name}" {
  name = "${name}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}`;

    case "elasticache":
      return `resource "aws_elasticache_cluster" "${name}" {
  cluster_id      = "${name.replace(/_/g, "-")}"
  engine          = "${(c.engine as string) ?? "redis"}"
  node_type       = "${(c.nodeType as string) ?? "cache.t3.micro"}"
  num_cache_nodes = ${(c.nodeCount as number) ?? 1}
}`;

    case "eks":
      return `resource "aws_eks_cluster" "${name}" {
  name     = "${name}"
  role_arn = "arn:aws:iam::ACCOUNT_ID:role/eks-cluster-role"

  vpc_config {
    subnet_ids = ["REPLACE_WITH_SUBNET_IDS"]
  }
}`;

    case "ecs":
      return `resource "aws_ecs_cluster" "${name}" {
  name = "${name}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}`;

    case "kinesis":
      return `resource "aws_kinesis_stream" "${name}" {
  name        = "${name}"
  shard_count = ${(c.shardCount as number) ?? 1}
}`;

    default:
      return `# TODO: add resource for ${node.type} ("${node.label}")`;
  }
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
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "${sanitizedProject}"
      ManagedBy = "terraform"
    }
  }
}

`;

  const resourceBlocks = nodes
    .filter((n) => n.type !== "note")
    .map((n) => generateResource(n))
    .join("\n\n");

  return header + (resourceBlocks || "# No resources defined\n");
}
