/**
 * Tests for CloudFormation template generation.
 */
import { describe, it, expect } from "vitest";
import { generateCloudFormationTemplate } from "../cloudformation";
import type { ArchitectureNode } from "../../entities/node";
import type { ConnectionEdge } from "../../entities/edge";

function makeNode(id: string, type: string, label: string, config: Record<string, unknown> = {}): ArchitectureNode {
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

describe("generateCloudFormationTemplate", () => {
  it("returns valid JSON string", () => {
    const result = generateCloudFormationTemplate([], [], "Test");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("contains correct template version", () => {
    const template = JSON.parse(generateCloudFormationTemplate([], [], "Test"));
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
  });

  it("includes project name in description", () => {
    const template = JSON.parse(generateCloudFormationTemplate([], [], "Minha Arquitetura"));
    expect(template.Description).toContain("Minha Arquitetura");
  });

  it("generates Lambda function resource", () => {
    const nodes = [makeNode("fn-1", "lambda", "Minha Lambda", {
      memoryMB: 512,
      timeoutSec: 30,
      concurrency: 0,
      requestsPerMonth: 1_000_000,
      avgDurationMs: 100,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const hasLambda = resources.some((r) => r.Type === "AWS::Lambda::Function");
    expect(hasLambda).toBe(true);
  });

  it("generates S3 bucket resource", () => {
    const nodes = [makeNode("s3-1", "s3", "Meu Bucket", {
      storageClass: "STANDARD",
      storageSizeGB: 100,
      requestsPerMonth: 1_000_000,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const hasS3 = resources.some((r) => r.Type === "AWS::S3::Bucket");
    expect(hasS3).toBe(true);
  });

  it("generates DynamoDB table resource", () => {
    const nodes = [makeNode("db-1", "dynamodb", "Tabela", {
      readCapacityUnits: 5,
      writeCapacityUnits: 5,
      capacityMode: "provisioned",
      storageGB: 10,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const hasTable = resources.some((r) => r.Type === "AWS::DynamoDB::Table");
    expect(hasTable).toBe(true);
  });

  it("generates RDS instance resource", () => {
    const nodes = [makeNode("rds-1", "rds", "Database", {
      engine: "mysql",
      instanceClass: "db.t3.medium",
      multiAZ: false,
      storageGB: 100,
      readReplicas: 0,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const hasRDS = resources.some((r) => r.Type === "AWS::RDS::DBInstance");
    expect(hasRDS).toBe(true);
  });

  it("generates SQS queue resource", () => {
    const nodes = [makeNode("sqs-1", "sqs", "Fila", {
      type: "standard",
      visibilityTimeoutSec: 30,
      retentionDays: 7,
      messagesPerMonth: 100_000,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const hasSQS = resources.some((r) => r.Type === "AWS::SQS::Queue");
    expect(hasSQS).toBe(true);
  });

  it("generates VPC resource", () => {
    const nodes = [makeNode("vpc-1", "vpc", "Minha VPC", {
      cidrBlock: "10.0.0.0/16",
      region: "us-east-1",
      enableDnsHostnames: true,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const hasVPC = resources.some((r) => r.Type === "AWS::EC2::VPC");
    expect(hasVPC).toBe(true);
  });

  it("adds outputs for Lambda ARNs", () => {
    const nodes = [makeNode("fn-1", "lambda", "Minha Funcao", {
      memoryMB: 256, timeoutSec: 15, concurrency: 0, requestsPerMonth: 100_000, avgDurationMs: 50,
    })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
  });

  it("handles multiple nodes without collision", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "Funcao A", { memoryMB: 256, timeoutSec: 15, concurrency: 0, requestsPerMonth: 100_000, avgDurationMs: 50 }),
      makeNode("fn-2", "lambda", "Funcao B", { memoryMB: 512, timeoutSec: 30, concurrency: 0, requestsPerMonth: 500_000, avgDurationMs: 100 }),
      makeNode("s3-1", "s3", "Bucket", { storageClass: "STANDARD", storageSizeGB: 100, requestsPerMonth: 10_000 }),
    ];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, [], "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    const lambdaResources = resources.filter((r) => r.Type === "AWS::Lambda::Function");
    expect(lambdaResources.length).toBe(2);
  });

  it("includes Environment parameter", () => {
    const template = JSON.parse(generateCloudFormationTemplate([], [], "Test"));
    expect(template.Parameters.Environment).toBeDefined();
    expect(template.Parameters.Environment.AllowedValues).toEqual(["dev", "staging", "prod"]);
  });

  it("ignores note nodes (no CloudFormation resource)", () => {
    const edges: ConnectionEdge[] = [];
    const nodes = [makeNode("note-1", "note", "Uma nota", { content: "texto", color: "yellow" })];
    const template = JSON.parse(generateCloudFormationTemplate(nodes, edges, "Test"));
    const resources = Object.values(template.Resources) as { Type: string }[];
    // note nodes should produce no CF resources
    expect(resources.length).toBe(0);
  });
});
