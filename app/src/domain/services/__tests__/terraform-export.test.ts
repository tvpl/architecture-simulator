/**
 * Tests for Terraform HCL template generation.
 */
import { describe, it, expect } from "vitest";
import { generateTerraformTemplate } from "../terraform-export";
import type { ArchitectureNode } from "../../entities/node";
import type { ConnectionEdge } from "../../entities/edge";

function makeNode(
  id: string,
  type: string,
  label: string,
  config: Record<string, unknown> = {}
): ArchitectureNode {
  return {
    id,
    label,
    type: type as ArchitectureNode["type"],
    category: "compute",
    latencyMs: 10,
    positionX: 0,
    positionY: 0,
    config,
  } as unknown as ArchitectureNode;
}

describe("generateTerraformTemplate", () => {
  it("empty nodes output contains terraform block with required_providers", () => {
    const result = generateTerraformTemplate([], [], "MyProject");
    expect(result).toContain("terraform {");
    expect(result).toContain("required_providers");
  });

  it("empty nodes output contains aws provider block", () => {
    const result = generateTerraformTemplate([], [], "MyProject");
    expect(result).toContain('provider "aws"');
  });

  it("Lambda node produces aws_lambda_function resource", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "MyFunction", {
        memoryMB: 256,
        timeoutSec: 10,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("aws_lambda_function");
  });

  it("EC2 node produces aws_instance resource", () => {
    const nodes = [
      makeNode("ec2-1", "ec2", "WebServer", {
        instanceType: "t3.micro",
        count: 1,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("aws_instance");
  });

  it("RDS node produces aws_db_instance resource", () => {
    const nodes = [
      makeNode("rds-1", "rds", "Database", {
        engine: "mysql",
        instanceClass: "db.t3.micro",
        storageGB: 20,
        multiAZ: false,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("aws_db_instance");
  });

  it("node label with spaces is snake_cased in resource name", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "My Lambda Function", {
        memoryMB: 128,
        timeoutSec: 3,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("my_lambda_function");
    expect(result).not.toMatch(/"My Lambda Function"/);
  });

  it("multiple nodes all appear in the output", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "handler", { memoryMB: 128, timeoutSec: 3 }),
      makeNode("s3-1", "s3", "storage", {}),
      makeNode("rds-1", "rds", "database", {
        engine: "mysql",
        instanceClass: "db.t3.micro",
        storageGB: 20,
        multiAZ: false,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("aws_lambda_function");
    expect(result).toContain("aws_s3_bucket");
    expect(result).toContain("aws_db_instance");
  });

  it("project name appears as a comment in the header", () => {
    const result = generateTerraformTemplate([], [], "My Architecture");
    expect(result).toContain("My Architecture");
  });

  it("project name is sanitized and used in provider default_tags", () => {
    const result = generateTerraformTemplate([], [], "My Cool Project");
    // toTfName converts spaces to underscores → my_cool_project
    expect(result).toContain("my_cool_project");
  });

  it("note nodes are excluded from output resources", () => {
    const edges: ConnectionEdge[] = [];
    const nodes = [makeNode("note-1", "note", "A note", { content: "text" })];
    const result = generateTerraformTemplate(nodes, edges, "Test");
    // Should not have any resource block from a note
    expect(result).not.toMatch(/^resource "/m);
  });

  it("S3 node produces aws_s3_bucket resource", () => {
    const nodes = [
      makeNode("s3-1", "s3", "mybucket", {
        storageClass: "STANDARD",
        storageSizeGB: 100,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("aws_s3_bucket");
  });

  it("DynamoDB node produces aws_dynamodb_table resource", () => {
    const nodes = [
      makeNode("ddb-1", "dynamodb", "usertable", {
        capacityMode: "provisioned",
        readCapacityUnits: 5,
        writeCapacityUnits: 5,
      }),
    ];
    const result = generateTerraformTemplate(nodes, [], "Test");
    expect(result).toContain("aws_dynamodb_table");
  });
});
