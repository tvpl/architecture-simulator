/**
 * Architecture simulation engine.
 * Pure domain logic — no React, no Next.js, no external dependencies.
 *
 * Performs graph traversal to compute:
 *   - End-to-end latency per path
 *   - Bottleneck identification
 *   - Resource utilization
 *   - Cost breakdown
 *   - Actionable recommendations
 */
import type { ArchitectureNode } from "../entities/node";
import type { ConnectionEdge } from "../entities/edge";
import type {
  SimulationResult,
  Bottleneck,
  PathAnalysis,
  ResourceUtilization,
  Recommendation,
  CostBreakdownItem,
} from "../entities/simulation";
import { calculateNodeLatency } from "./latency";
import { calculateMaxThroughput, calculateUtilization } from "./throughput";
import { calculateAvailability } from "./availability";
import { buildCostBreakdown } from "./cost";

// ── Graph helpers ──────────────────────────────────────────────────────────

interface AdjacencyMap {
  outgoing: Map<string, string[]>; // nodeId -> [targetNodeIds]
  incoming: Map<string, string[]>; // nodeId -> [sourceNodeIds]
  edgesBySourceTarget: Map<string, ConnectionEdge>;
}

function buildAdjacencyMap(
  nodes: ArchitectureNode[],
  edges: ConnectionEdge[]
): AdjacencyMap {
  const outgoing = new Map<string, string[]>(
    nodes.map((n) => [n.id, []])
  );
  const incoming = new Map<string, string[]>(
    nodes.map((n) => [n.id, []])
  );
  const edgesBySourceTarget = new Map<string, ConnectionEdge>();

  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
    edgesBySourceTarget.set(`${edge.source}:${edge.target}`, edge);
  }

  return { outgoing, incoming, edgesBySourceTarget };
}

function findEntryNodes(
  nodes: ArchitectureNode[],
  incoming: Map<string, string[]>
): ArchitectureNode[] {
  // Container nodes (VPC, Subnet) are not entry points
  const containerTypes = new Set(["vpc", "subnet", "security-group"]);
  const entries = nodes.filter(
    (n) =>
      !containerTypes.has(n.type) &&
      (incoming.get(n.id)?.length === 0 || n.type === "cloudfront" || n.type === "alb" || n.type === "api-gateway")
  );
  // Deduplicate: prefer CloudFront > ALB/NLB > API Gateway > others
  if (entries.length === 0) return nodes.slice(0, 1);
  return entries;
}

// ── Path traversal ─────────────────────────────────────────────────────────

interface TraversalPath {
  nodeIds: string[];
  latencyMs: number;
  messages: number;
}

function traversePaths(
  startId: string,
  graph: AdjacencyMap,
  nodeMap: Map<string, ArchitectureNode>,
  maxDepth = 50
): TraversalPath[] {
  const results: TraversalPath[] = [];
  const containerTypes = new Set(["vpc", "subnet", "security-group", "iam", "cloudwatch"]);

  function dfs(
    nodeId: string,
    visited: Set<string>,
    currentPath: string[],
    currentLatency: number,
    currentMessages: number,
    depth: number
  ) {
    if (depth > maxDepth) return;
    if (visited.has(nodeId)) return; // cycle guard

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const newVisited = new Set(visited).add(nodeId);
    const newPath = [...currentPath, nodeId];

    // Skip container nodes in latency calculation
    const nodeLatency = containerTypes.has(node.type)
      ? 0
      : calculateNodeLatency(node, { incomingRPS: currentMessages, region: "us-east-1" });

    const newLatency = currentLatency + nodeLatency;
    const targets = graph.outgoing.get(nodeId) ?? [];

    if (targets.length === 0) {
      // Leaf node — record path
      results.push({
        nodeIds: newPath,
        latencyMs: newLatency,
        messages: currentMessages,
      });
      return;
    }

    for (const targetId of targets) {
      const edgeKey = `${nodeId}:${targetId}`;
      const edge = graph.edgesBySourceTarget.get(edgeKey);
      const edgeLatency = edge?.latencyMs ?? 0;
      const edgeMessages = edge?.messageCount ?? currentMessages;

      dfs(
        targetId,
        newVisited,
        newPath,
        newLatency + edgeLatency,
        edgeMessages,
        depth + 1
      );
    }
  }

  const startNode = nodeMap.get(startId);
  if (!startNode) return results;

  const initialMessages = getInitialMessageCount(startNode);
  dfs(startId, new Set(), [], 0, initialMessages, 0);
  return results;
}

function getInitialMessageCount(node: ArchitectureNode): number {
  switch (node.type) {
    case "api-gateway": {
      const cfg = node.config as import("../entities/node").APIGatewayConfig;
      return cfg.requestsPerMonth / (30 * 24 * 3600); // per second
    }
    case "sqs": {
      const cfg = node.config as import("../entities/node").SQSConfig;
      return cfg.messagesPerMonth / (30 * 24 * 3600);
    }
    case "sns": {
      const cfg = node.config as import("../entities/node").SNSConfig;
      return cfg.messagesPerMonth / (30 * 24 * 3600);
    }
    case "kinesis": {
      const cfg = node.config as import("../entities/node").KinesisConfig;
      return cfg.shardCount * 1000;
    }
    case "msk": {
      const cfg = node.config as import("../entities/node").MSKConfig;
      return cfg.partitions * 1000;
    }
    default:
      return 100; // default RPS
  }
}

// ── Bottleneck detection ───────────────────────────────────────────────────

function detectBottlenecks(
  nodes: ArchitectureNode[],
  nodeLatencies: Map<string, number>,
  nodeUtilizations: Map<string, number>
): Bottleneck[] {
  const latencies = Array.from(nodeLatencies.values()).filter((l) => l > 0);
  if (latencies.length === 0) return [];

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const bottlenecks: Bottleneck[] = [];

  for (const node of nodes) {
    const latency = nodeLatencies.get(node.id) ?? 0;
    const utilization = nodeUtilizations.get(node.id) ?? 0;

    if (latency > avgLatency * 2 || utilization > 80) {
      let reason = "";
      if (utilization > 90)
        reason = `Utilização crítica (${utilization.toFixed(0)}%)`;
      else if (utilization > 80)
        reason = `Alta utilização (${utilization.toFixed(0)}%)`;
      else if (latency > avgLatency * 3)
        reason = `Latência muito alta (${latency.toFixed(0)}ms vs média ${avgLatency.toFixed(0)}ms)`;
      else
        reason = `Latência elevada (${latency.toFixed(0)}ms)`;

      bottlenecks.push({
        nodeId: node.id,
        nodeName: node.label,
        latencyMs: latency,
        type: node.type,
        reason,
      });
    }
  }

  return bottlenecks.sort((a, b) => b.latencyMs - a.latencyMs);
}

// ── Recommendations ────────────────────────────────────────────────────────

function generateRecommendations(
  nodes: ArchitectureNode[],
  bottlenecks: Bottleneck[],
  costBreakdown: CostBreakdownItem[],
  nodeUtilizations: Map<string, number>
): Recommendation[] {
  const recs: Recommendation[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const bottleneck of bottlenecks) {
    const node = nodeMap.get(bottleneck.nodeId);
    if (!node) continue;

    switch (node.type) {
      case "lambda": {
        const cfg = node.config as import("../entities/node").LambdaConfig;
        if (cfg.concurrency === 0) {
          recs.push({
            severity: "warning",
            category: "performance",
            title: `Habilitar Provisioned Concurrency no Lambda "${node.label}"`,
            description:
              "Cold starts estão aumentando a latência. Configure Provisioned Concurrency para reduzir latência de inicialização a quase zero.",
            affectedNodeIds: [node.id],
          });
        }
        if (cfg.memoryMB < 512) {
          recs.push({
            severity: "info",
            category: "performance",
            title: `Aumentar memória do Lambda "${node.label}"`,
            description:
              "Aumentar a memória do Lambda também aumenta a CPU proporcional, podendo reduzir duração e custo total.",
            affectedNodeIds: [node.id],
          });
        }
        break;
      }

      case "rds": {
        const cfg = node.config as import("../entities/node").RDSConfig;
        if (!cfg.multiAZ) {
          recs.push({
            severity: "critical",
            category: "reliability",
            title: `Habilitar Multi-AZ no RDS "${node.label}"`,
            description:
              "Single-AZ RDS não possui SLA de disponibilidade. Multi-AZ garante failover automático e uptime de 99.99%.",
            affectedNodeIds: [node.id],
          });
        }
        if (cfg.readReplicas === 0 && bottleneck.latencyMs > 20) {
          recs.push({
            severity: "warning",
            category: "performance",
            title: `Adicionar Read Replicas ao RDS "${node.label}"`,
            description:
              "Alta carga de leitura detectada. Read Replicas distribuem o tráfego de leitura e reduzem latência.",
            affectedNodeIds: [node.id],
          });
        }
        break;
      }

      case "dynamodb": {
        const cfg = node.config as import("../entities/node").DynamoDBConfig;
        if (cfg.capacityMode === "provisioned") {
          const utilization = nodeUtilizations.get(node.id) ?? 0;
          if (utilization > 85) {
            recs.push({
              severity: "critical",
              category: "performance",
              title: `DynamoDB "${node.label}" próximo do limite de capacidade`,
              description:
                "Utilização acima de 85% causará throttling. Considere aumentar as RCU/WCU ou migrar para modo on-demand.",
              affectedNodeIds: [node.id],
            });
          }
        }
        break;
      }

      case "msk": {
        const cfg = node.config as import("../entities/node").MSKConfig;
        if (cfg.replicationFactor < 3) {
          recs.push({
            severity: "warning",
            category: "reliability",
            title: `Aumentar fator de replicação no MSK "${node.label}"`,
            description:
              "Replication factor < 3 reduz a durabilidade das mensagens. Recomendado mínimo de 3 para produção.",
            affectedNodeIds: [node.id],
          });
        }
        break;
      }

      case "ec2": {
        const cfg = node.config as import("../entities/node").EC2Config;
        if (cfg.count < 2) {
          recs.push({
            severity: "warning",
            category: "reliability",
            title: `EC2 "${node.label}" sem redundância`,
            description:
              "Uma única instância EC2 não possui SLA de disponibilidade. Use pelo menos 2 instâncias em AZs diferentes com Auto Scaling.",
            affectedNodeIds: [node.id],
          });
        }
        break;
      }
    }
  }

  // Cost optimizations
  const sortedByCost = [...costBreakdown].sort(
    (a, b) => b.monthlyCostUSD - a.monthlyCostUSD
  );
  const topCostNode = sortedByCost[0];
  if (topCostNode && topCostNode.monthlyCostUSD > 500) {
    recs.push({
      severity: "info",
      category: "cost",
      title: `"${topCostNode.component}" representa o maior custo`,
      description: `Este serviço custa ~$${topCostNode.monthlyCostUSD.toFixed(0)}/mês (${topCostNode.percentage.toFixed(0)}% do total). Avalie Reserved Instances ou Savings Plans para reduzir o custo.`,
      affectedNodeIds: [topCostNode.nodeId],
    });
  }

  // Security recommendations
  const hasWAF = nodes.some((n) => n.type === "waf");
  const hasPublicEndpoint = nodes.some(
    (n) =>
      n.type === "api-gateway" ||
      n.type === "alb" ||
      n.type === "cloudfront"
  );
  if (hasPublicEndpoint && !hasWAF) {
    recs.push({
      severity: "warning",
      category: "security",
      title: "Endpoint público sem WAF",
      description:
        "Adicione AWS WAF ao CloudFront ou ALB para proteção contra ataques comuns (OWASP Top 10, DDoS L7).",
      affectedNodeIds: nodes
        .filter((n) => ["api-gateway", "alb", "cloudfront"].includes(n.type))
        .map((n) => n.id),
    });
  }

  const hasSecretsManager = nodes.some((n) => n.type === "secrets-manager");
  const hasDatabase = nodes.some((n) =>
    ["rds", "dynamodb", "elasticache"].includes(n.type)
  );
  if (hasDatabase && !hasSecretsManager) {
    recs.push({
      severity: "info",
      category: "security",
      title: "Gerenciar credenciais com Secrets Manager",
      description:
        "Bancos de dados detectados sem Secrets Manager. Use-o para rotacionar credenciais automaticamente e evitar hardcoding.",
      affectedNodeIds: nodes
        .filter((n) => ["rds", "dynamodb", "elasticache"].includes(n.type))
        .map((n) => n.id),
    });
  }

  return recs;
}

// ── Main engine ────────────────────────────────────────────────────────────

export function runSimulation(
  nodes: ArchitectureNode[],
  edges: ConnectionEdge[]
): SimulationResult {
  if (nodes.length === 0) {
    return {
      totalLatencyMs: 0,
      totalMessages: 0,
      totalProcessingTimeMs: 0,
      bottlenecks: [],
      pathAnalysis: [],
      resourceUtilization: [],
      totalMonthlyCostUSD: 0,
      costBreakdown: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const graph = buildAdjacencyMap(nodes, edges);
  const entryNodes = findEntryNodes(nodes, graph.incoming);

  // Traverse all paths from all entry points
  const allPaths: TraversalPath[] = [];
  for (const entry of entryNodes) {
    allPaths.push(...traversePaths(entry.id, graph, nodeMap));
  }

  // Build per-node latency and message metrics
  const nodeLatencyMap = new Map<string, number>();
  const nodeMessageMap = new Map<string, number>();

  for (const path of allPaths) {
    for (const nodeId of path.nodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const lat = calculateNodeLatency(node, {
        incomingRPS: path.messages,
        region: "us-east-1",
      });
      nodeLatencyMap.set(nodeId, Math.max(nodeLatencyMap.get(nodeId) ?? 0, lat));
      nodeMessageMap.set(
        nodeId,
        Math.max(nodeMessageMap.get(nodeId) ?? 0, path.messages)
      );
    }
  }

  // Utilization per node
  const nodeUtilizationMap = new Map<string, number>();
  for (const node of nodes) {
    const rps = nodeMessageMap.get(node.id) ?? 0;
    nodeUtilizationMap.set(node.id, calculateUtilization(node, rps));
  }

  // Aggregate path analysis
  const longestLatency = allPaths.reduce(
    (max, p) => Math.max(max, p.latencyMs),
    0
  );
  const totalMessages = allPaths.reduce((sum, p) => sum + p.messages, 0);

  const pathAnalysis: PathAnalysis[] = allPaths
    .sort((a, b) => b.latencyMs - a.latencyMs)
    .slice(0, 10) // top 10 paths
    .map((p) => ({
      path: p.nodeIds,
      pathNames: p.nodeIds.map((id) => nodeMap.get(id)?.label ?? id),
      totalLatencyMs: p.latencyMs,
      totalMessages: p.messages,
      isLongest: p.latencyMs === longestLatency,
    }));

  // Resource utilization
  const resourceUtilization: ResourceUtilization[] = nodes
    .filter((n) => !["vpc", "subnet", "security-group"].includes(n.type))
    .map((node) => {
      const rps = nodeMessageMap.get(node.id) ?? 0;
      const utilization = nodeUtilizationMap.get(node.id) ?? 0;
      const maxRPS = calculateMaxThroughput(node);
      const availability = calculateAvailability(node);

      return {
        nodeId: node.id,
        nodeName: node.label,
        nodeType: node.type,
        utilization,
        throughput: `${rps.toFixed(0)} / ${maxRPS.toLocaleString()} RPS`,
        availability: `${availability.toFixed(2)}%`,
      };
    })
    .sort((a, b) => b.utilization - a.utilization);

  // Cost
  const costBreakdown = buildCostBreakdown(nodes);
  const totalCost = costBreakdown.reduce(
    (sum, item) => sum + item.monthlyCostUSD,
    0
  );

  // Bottlenecks
  const bottlenecks = detectBottlenecks(
    nodes,
    nodeLatencyMap,
    nodeUtilizationMap
  );

  // Recommendations
  const recommendations = generateRecommendations(
    nodes,
    bottlenecks,
    costBreakdown,
    nodeUtilizationMap
  );

  return {
    totalLatencyMs: longestLatency,
    totalMessages,
    totalProcessingTimeMs: longestLatency * totalMessages,
    bottlenecks,
    pathAnalysis,
    resourceUtilization,
    totalMonthlyCostUSD: totalCost,
    costBreakdown,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}
