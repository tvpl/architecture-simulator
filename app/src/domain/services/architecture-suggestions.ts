/**
 * architecture-suggestions.ts — Pure domain function, no React.
 * Produces best-practice hints for nodes based on graph topology and config.
 */

export type SuggestionSeverity = "tip" | "warning" | "improvement";

export interface NodeSuggestion {
  nodeId: string;
  severity: SuggestionSeverity;
  title: string;
  description: string;
  action?: string;
}

type InputNode = {
  id: string;
  type: string;
  data: { type: string; config: Record<string, unknown> };
};

type InputEdge = { source: string; target: string };

const MAX_PER_NODE = 3;
const MAX_TOTAL = 15;

function hasType(nodes: InputNode[], ...types: string[]): boolean {
  return nodes.some((n) => types.includes(n.data.type));
}

function nodeHasEdge(nodeId: string, edges: InputEdge[]): boolean {
  return edges.some((e) => e.source === nodeId || e.target === nodeId);
}

/** Returns true when nodeId and at least one node of targetType are connected via edges. */
function isConnectedToType(
  nodeId: string,
  targetTypes: string[],
  nodes: InputNode[],
  edges: InputEdge[]
): boolean {
  const targetIds = new Set(
    nodes.filter((n) => targetTypes.includes(n.data.type)).map((n) => n.id)
  );
  return edges.some(
    (e) =>
      (e.source === nodeId && targetIds.has(e.target)) ||
      (e.target === nodeId && targetIds.has(e.source))
  );
}

function getSuggestionsForNode(
  node: InputNode,
  allNodes: InputNode[],
  edges: InputEdge[]
): NodeSuggestion[] {
  const results: NodeSuggestion[] = [];
  const type = node.data.type;
  const cfg = node.data.config;

  const push = (s: Omit<NodeSuggestion, "nodeId">) => {
    if (results.length < MAX_PER_NODE) {
      results.push({ nodeId: node.id, ...s });
    }
  };

  // ── LAMBDA ─────────────────────────────────────────────────────────────────
  if (type === "lambda") {
    // No edges at all
    if (!nodeHasEdge(node.id, edges)) {
      push({
        severity: "warning",
        title: "Lambda sem conexões",
        description: "Esta função não está conectada a nenhum serviço.",
      });
    }

    // No SQS node anywhere connected to/from this lambda
    const sqsExists = hasType(allNodes, "sqs");
    if (!sqsExists || !isConnectedToType(node.id, ["sqs"], allNodes, edges)) {
      push({
        severity: "tip",
        title: "Considere uma Dead Letter Queue",
        description:
          "Lambdas sem DLQ perdem mensagens em caso de falha. Conecte um SQS como DLQ.",
        action: "Adicionar SQS como DLQ",
      });
    }

    // Low memory + high volume
    const memoryMB = cfg.memoryMB;
    const requestsPerMonth = cfg.requestsPerMonth;
    if (
      typeof memoryMB === "number" &&
      typeof requestsPerMonth === "number" &&
      memoryMB < 256 &&
      requestsPerMonth > 1_000_000
    ) {
      push({
        severity: "improvement",
        title: "Memória baixa para alto volume",
        description:
          "Aumente a memória para melhorar performance e reduzir custo total.",
      });
    }
  }

  // ── RDS ────────────────────────────────────────────────────────────────────
  if (type === "rds") {
    if (!hasType(allNodes, "elasticache")) {
      push({
        severity: "improvement",
        title: "Adicione cache para RDS",
        description:
          "ElastiCache reduz latência e carga no banco de dados.",
      });
    }

    if (!hasType(allNodes, "alb", "api-gateway")) {
      push({
        severity: "tip",
        title: "RDS exposto diretamente?",
        description:
          "Considere colocar um Load Balancer ou API Gateway na frente.",
      });
    }
  }

  // ── EC2 ────────────────────────────────────────────────────────────────────
  if (type === "ec2") {
    if (!hasType(allNodes, "alb")) {
      push({
        severity: "improvement",
        title: "Sem Load Balancer",
        description:
          "Adicione um ALB para distribuição de carga e alta disponibilidade.",
      });
    }
  }

  // ── API Gateway ────────────────────────────────────────────────────────────
  if (type === "api-gateway") {
    if (!hasType(allNodes, "waf")) {
      push({
        severity: "warning",
        title: "Sem WAF na borda",
        description:
          "Considere proteger o API Gateway com WAF para prevenir ataques.",
      });
    }

    if (!hasType(allNodes, "cognito", "iam")) {
      push({
        severity: "tip",
        title: "Autenticação não configurada",
        description:
          "Adicione Cognito ou IAM Authorizer para proteger os endpoints.",
      });
    }
  }

  // ── ECS / EKS / FARGATE ────────────────────────────────────────────────────
  if (type === "ecs" || type === "eks" || type === "fargate") {
    if (!hasType(allNodes, "elasticache")) {
      push({
        severity: "tip",
        title: "Cache de sessão",
        description:
          "ElastiCache melhora performance para aplicações em containers.",
      });
    }

    if (!hasType(allNodes, "s3")) {
      push({
        severity: "tip",
        title: "Storage de objetos",
        description:
          "Considere S3 para armazenar assets, logs ou backups.",
      });
    }
  }

  // ── S3 ─────────────────────────────────────────────────────────────────────
  if (type === "s3") {
    // Check if cloudfront is connected (directly or anywhere in the graph touching this node)
    const cloudfrontConnected = isConnectedToType(
      node.id,
      ["cloudfront"],
      allNodes,
      edges
    );
    if (!cloudfrontConnected) {
      push({
        severity: "tip",
        title: "Distribuição global",
        description:
          "Adicione CloudFront para entrega de conteúdo mais rápida globalmente.",
      });
    }
  }

  return results;
}

export function getArchitectureSuggestions(
  nodes: InputNode[],
  edges: InputEdge[]
): NodeSuggestion[] {
  const all: NodeSuggestion[] = [];

  for (const node of nodes) {
    if (all.length >= MAX_TOTAL) break;

    const nodeSuggestions = getSuggestionsForNode(node, nodes, edges);

    // Deduplicate by title within node (already guaranteed since push checks MAX_PER_NODE)
    const seen = new Set<string>();
    for (const s of nodeSuggestions) {
      const key = `${s.nodeId}-${s.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        all.push(s);
        if (all.length >= MAX_TOTAL) break;
      }
    }
  }

  return all;
}
