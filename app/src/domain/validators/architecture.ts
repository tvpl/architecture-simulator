/**
 * Architecture validation rules.
 * Returns errors and warnings without throwing exceptions.
 */
import type { ArchitectureNode } from "../entities/node";
import type { ConnectionEdge } from "../entities/edge";
import type { ValidationResult } from "../entities/simulation";

export function validateArchitecture(
  nodes: ArchitectureNode[],
  edges: ConnectionEdge[]
): ValidationResult {
  const errors: import("../entities/simulation").ValidationError[] = [];
  const warnings: import("../entities/simulation").ValidationWarning[] = [];

  if (nodes.length === 0) {
    errors.push({
      message: "O diagrama não possui componentes. Adicione pelo menos um serviço.",
      code: "EMPTY_DIAGRAM",
    });
    return { isValid: false, errors, warnings };
  }

  const nodeIds = new Set(nodes.map((n) => n.id));

  // Validate edge references
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        edgeId: edge.id,
        message: `Aresta referencia nó de origem inexistente: ${edge.source}`,
        code: "INVALID_EDGE_SOURCE",
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        edgeId: edge.id,
        message: `Aresta referencia nó de destino inexistente: ${edge.target}`,
        code: "INVALID_EDGE_TARGET",
      });
    }
    if (edge.source === edge.target) {
      errors.push({
        edgeId: edge.id,
        message: "Self-loop detectado: um nó não pode conectar a si mesmo.",
        code: "SELF_LOOP",
      });
    }
  }

  // Detect duplicate edges
  const edgeSignatures = new Set<string>();
  for (const edge of edges) {
    const sig = `${edge.source}:${edge.target}`;
    if (edgeSignatures.has(sig)) {
      warnings.push({
        edgeId: edge.id,
        message: `Conexão duplicada entre ${edge.source} e ${edge.target}`,
        code: "DUPLICATE_EDGE",
      });
    }
    edgeSignatures.add(sig);
  }

  // Detect cycle (DFS)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
  }

  const containerTypes = new Set(["vpc", "subnet", "security-group"]);
  const visitedForCycle = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true;
    if (visitedForCycle.has(nodeId)) return false;
    visitedForCycle.add(nodeId);
    inStack.add(nodeId);
    for (const targetId of outgoing.get(nodeId) ?? []) {
      if (hasCycle(targetId)) return true;
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!containerTypes.has(node.type) && hasCycle(node.id)) {
      warnings.push({
        nodeId: node.id,
        message: "Ciclo detectado no grafo. Pode indicar dependência circular entre serviços.",
        code: "CYCLE_DETECTED",
      });
      break; // One warning is enough
    }
  }

  // Isolated nodes
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }
  for (const node of nodes) {
    if (
      !connectedNodes.has(node.id) &&
      !containerTypes.has(node.type) &&
      node.type !== "iam" &&
      node.type !== "cloudwatch"
    ) {
      warnings.push({
        nodeId: node.id,
        message: `"${node.label}" não está conectado a nenhum outro componente.`,
        code: "ISOLATED_NODE",
      });
    }
  }

  // Security: no WAF with public endpoints
  const hasWAF = nodes.some((n) => n.type === "waf");
  const publicEndpoints = nodes.filter((n) =>
    ["api-gateway", "alb", "cloudfront"].includes(n.type)
  );
  if (publicEndpoints.length > 0 && !hasWAF) {
    warnings.push({
      message: "Endpoint(s) público(s) detectado(s) sem AWS WAF para proteção.",
      code: "NO_WAF",
    });
  }

  // RDS without Multi-AZ
  for (const node of nodes) {
    if (node.type === "rds") {
      const cfg = node.config as import("../entities/node").RDSConfig;
      if (!cfg.multiAZ) {
        warnings.push({
          nodeId: node.id,
          message: `RDS "${node.label}" está sem Multi-AZ. Sem SLA de alta disponibilidade.`,
          code: "RDS_NO_MULTIAZ",
        });
      }
    }
  }

  // Validate node configs
  for (const node of nodeMap.values()) {
    if (!node.label || node.label.trim() === "") {
      errors.push({
        nodeId: node.id,
        message: "Nó sem label definido.",
        code: "MISSING_LABEL",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
