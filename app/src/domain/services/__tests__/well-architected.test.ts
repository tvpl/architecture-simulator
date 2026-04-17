/**
 * Tests for the Well-Architected Framework analyzer.
 */
import { describe, it, expect } from "vitest";
import { analyzeArchitecture } from "../well-architected";
import type { WAReport, WAPillar } from "../well-architected";
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

const ALL_PILLAR_KEYS: WAPillar[] = [
  "operational-excellence",
  "security",
  "reliability",
  "performance",
  "cost",
  "sustainability",
];

describe("analyzeArchitecture", () => {
  describe("empty architecture", () => {
    let report: WAReport;

    it("returns a WAReport with 6 pillars", () => {
      report = analyzeArchitecture([], []);
      expect(report.pillars).toHaveLength(6);
    });

    it("overallScore is a number between 0 and 100", () => {
      report = analyzeArchitecture([], []);
      expect(typeof report.overallScore).toBe("number");
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it("every pillar score is between 0 and 100", () => {
      report = analyzeArchitecture([], []);
      for (const pillar of report.pillars) {
        expect(pillar.score).toBeGreaterThanOrEqual(0);
        expect(pillar.score).toBeLessThanOrEqual(100);
      }
    });

    it("all 6 pillar keys are present", () => {
      report = analyzeArchitecture([], []);
      const keys = report.pillars.map((p) => p.pillar);
      for (const key of ALL_PILLAR_KEYS) {
        expect(keys).toContain(key);
      }
    });

    it("has generatedAt timestamp", () => {
      report = analyzeArchitecture([], []);
      expect(typeof report.generatedAt).toBe("number");
      expect(report.generatedAt).toBeGreaterThan(0);
    });
  });

  describe("WAReport structure", () => {
    it("has overallScore property that is a number", () => {
      const report = analyzeArchitecture([], []);
      expect(report).toHaveProperty("overallScore");
      expect(typeof report.overallScore).toBe("number");
    });

    it("has totalFindings property", () => {
      const report = analyzeArchitecture([], []);
      expect(report).toHaveProperty("totalFindings");
      expect(typeof report.totalFindings).toBe("number");
    });

    it("has criticalCount and highCount properties", () => {
      const report = analyzeArchitecture([], []);
      expect(report).toHaveProperty("criticalCount");
      expect(report).toHaveProperty("highCount");
    });

    it("each pillar has required fields", () => {
      const report = analyzeArchitecture([], []);
      for (const pillar of report.pillars) {
        expect(pillar).toHaveProperty("pillar");
        expect(pillar).toHaveProperty("displayName");
        expect(pillar).toHaveProperty("score");
        expect(pillar).toHaveProperty("maxScore", 100);
        expect(pillar).toHaveProperty("findings");
        expect(Array.isArray(pillar.findings)).toBe(true);
      }
    });
  });

  describe("architecture with CloudWatch", () => {
    it("operational excellence score is greater than 0", () => {
      const nodes = [makeNode("cw-1", "cloudwatch", "Monitoring", {})];
      const report = analyzeArchitecture(nodes, []);
      const opEx = report.pillars.find(
        (p) => p.pillar === "operational-excellence"
      );
      expect(opEx).toBeDefined();
      expect(opEx!.score).toBeGreaterThan(0);
    });

    it("operational excellence findings do not include 'Sem monitoramento' critical finding", () => {
      const nodes = [makeNode("cw-1", "cloudwatch", "Monitoring", {})];
      const report = analyzeArchitecture(nodes, []);
      const opEx = report.pillars.find(
        (p) => p.pillar === "operational-excellence"
      );
      const monitoringFinding = opEx?.findings.find(
        (f) => f.severity === "critical" && f.title === "Sem monitoramento"
      );
      expect(monitoringFinding).toBeUndefined();
    });
  });

  describe("architecture with WAF", () => {
    it("security pillar has a higher score when WAF is present with public services", () => {
      const nodesWithoutWAF = [
        makeNode("alb-1", "alb", "LoadBalancer", {}),
      ];
      const nodesWithWAF = [
        makeNode("alb-1", "alb", "LoadBalancer", {}),
        makeNode("waf-1", "waf", "WebFirewall", {}),
      ];
      const reportWithout = analyzeArchitecture(nodesWithoutWAF, []);
      const reportWith = analyzeArchitecture(nodesWithWAF, []);

      const secWithout = reportWithout.pillars.find(
        (p) => p.pillar === "security"
      );
      const secWith = reportWith.pillars.find((p) => p.pillar === "security");

      expect(secWith!.score).toBeGreaterThan(secWithout!.score);
    });

    it("security pillar findings do not include 'Sem WAF' critical finding when WAF is present", () => {
      const nodes = [
        makeNode("alb-1", "alb", "LoadBalancer", {}),
        makeNode("waf-1", "waf", "WebFirewall", {}),
      ];
      const report = analyzeArchitecture(nodes, []);
      const sec = report.pillars.find((p) => p.pillar === "security");
      const wafFinding = sec?.findings.find(
        (f) => f.severity === "critical" && f.title === "Sem WAF"
      );
      expect(wafFinding).toBeUndefined();
    });
  });

  describe("Lambda-only architecture (no monitoring)", () => {
    it("has at least one finding with severity high or medium", () => {
      const nodes = [
        makeNode("fn-1", "lambda", "Handler", {
          memoryMB: 128,
          timeoutSec: 3,
        }),
      ];
      const report = analyzeArchitecture(nodes, []);
      const allFindings = report.pillars.flatMap((p) => p.findings);
      const hasHighOrMedium = allFindings.some(
        (f) => f.severity === "high" || f.severity === "medium"
      );
      expect(hasHighOrMedium).toBe(true);
    });

    it("operational excellence score is 0 without monitoring services", () => {
      const nodes = [
        makeNode("fn-1", "lambda", "Handler", {
          memoryMB: 128,
          timeoutSec: 3,
        }),
      ];
      const report = analyzeArchitecture(nodes, []);
      const opEx = report.pillars.find(
        (p) => p.pillar === "operational-excellence"
      );
      expect(opEx!.score).toBe(0);
    });
  });

  describe("pillar keys coverage", () => {
    it('pillar "operational-excellence" is present', () => {
      const report = analyzeArchitecture([], []);
      expect(report.pillars.map((p) => p.pillar)).toContain(
        "operational-excellence"
      );
    });

    it('pillar "security" is present', () => {
      const report = analyzeArchitecture([], []);
      expect(report.pillars.map((p) => p.pillar)).toContain("security");
    });

    it('pillar "reliability" is present', () => {
      const report = analyzeArchitecture([], []);
      expect(report.pillars.map((p) => p.pillar)).toContain("reliability");
    });

    it('pillar "performance" is present', () => {
      const report = analyzeArchitecture([], []);
      expect(report.pillars.map((p) => p.pillar)).toContain("performance");
    });

    it('pillar "cost" is present', () => {
      const report = analyzeArchitecture([], []);
      expect(report.pillars.map((p) => p.pillar)).toContain("cost");
    });

    it('pillar "sustainability" is present', () => {
      const report = analyzeArchitecture([], []);
      expect(report.pillars.map((p) => p.pillar)).toContain("sustainability");
    });
  });

  describe("edges parameter", () => {
    it("accepts an array of edges without error", () => {
      const edges: ConnectionEdge[] = [];
      expect(() => analyzeArchitecture([], edges)).not.toThrow();
    });
  });
});
