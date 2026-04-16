/**
 * Tests for AWS CDK TypeScript app generation.
 */
import { describe, it, expect } from "vitest";
import { generateCDKApp } from "../cdk-export";
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

describe("generateCDKApp", () => {
  it("empty nodes output contains cdk import and Stack", () => {
    const result = generateCDKApp([], [], "TestProject");
    expect(result).toContain("import * as cdk");
    expect(result).toContain("Stack");
  });

  it("output contains constructs import", () => {
    const result = generateCDKApp([], [], "TestProject");
    expect(result).toContain("from 'constructs'");
  });

  it("Lambda node produces lambda.Function construct", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "MyFunction", {
        memoryMB: 256,
        timeoutSec: 10,
      }),
    ];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("lambda.Function");
  });

  it("Lambda node includes lambda import", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "MyFunction", { memoryMB: 128 }),
    ];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("aws-cdk-lib/aws-lambda");
  });

  it("S3 node produces s3.Bucket construct", () => {
    const nodes = [
      makeNode("s3-1", "s3", "MyBucket", {
        storageClass: "STANDARD",
        storageSizeGB: 100,
      }),
    ];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("s3.Bucket");
  });

  it("S3 node includes s3 import", () => {
    const nodes = [makeNode("s3-1", "s3", "MyBucket", {})];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("aws-cdk-lib/aws-s3");
  });

  it("DynamoDB node produces dynamodb.Table construct", () => {
    const nodes = [
      makeNode("ddb-1", "dynamodb", "UserTable", {
        capacityMode: "provisioned",
        readCapacityUnits: 5,
        writeCapacityUnits: 5,
      }),
    ];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("dynamodb.Table");
  });

  it("DynamoDB node includes dynamodb import", () => {
    const nodes = [
      makeNode("ddb-1", "dynamodb", "UserTable", { capacityMode: "on-demand" }),
    ];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("aws-cdk-lib/aws-dynamodb");
  });

  it("project name is used as the stack class name", () => {
    const result = generateCDKApp([], [], "MyAwesomeProject");
    // toClassName converts to PascalCase + "Stack" suffix
    expect(result).toContain("MyAwesomeProjectStack");
  });

  it("project name appears in the instantiation at the bottom", () => {
    const result = generateCDKApp([], [], "InventoryService");
    expect(result).toContain("InventoryServiceStack");
    // Should be instantiated with new <StackName>(app, ...)
    expect(result).toMatch(/new InventoryServiceStack\(app/);
  });

  it("output contains app.synth() call", () => {
    const result = generateCDKApp([], [], "Test");
    expect(result).toContain("app.synth()");
  });

  it("output contains class extending cdk.Stack", () => {
    const result = generateCDKApp([], [], "TestProject");
    expect(result).toContain("extends cdk.Stack");
  });

  it("note nodes are excluded from output constructs", () => {
    const edges: ConnectionEdge[] = [];
    const nodes = [makeNode("note-1", "note", "A note", { content: "text" })];
    const result = generateCDKApp(nodes, edges, "Test");
    // Note nodes don't add any specific AWS construct imports
    expect(result).not.toContain("aws-cdk-lib/aws-lambda");
    expect(result).not.toContain("aws-cdk-lib/aws-s3");
  });

  it("multiple nodes all appear in the output", () => {
    const nodes = [
      makeNode("fn-1", "lambda", "handler", { memoryMB: 128 }),
      makeNode("s3-1", "s3", "storage", {}),
      makeNode("ddb-1", "dynamodb", "table", { capacityMode: "on-demand" }),
    ];
    const result = generateCDKApp(nodes, [], "Test");
    expect(result).toContain("lambda.Function");
    expect(result).toContain("s3.Bucket");
    expect(result).toContain("dynamodb.Table");
  });

  it("output contains project name in header comment", () => {
    const result = generateCDKApp([], [], "CoolArch");
    expect(result).toContain("CoolArch");
  });
});
