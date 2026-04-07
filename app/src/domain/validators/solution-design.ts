/**
 * Solution Design (Layer 2) validation rules.
 * Validates app components and their cross-layer relationships with infrastructure.
 */
import type { ArchitectureNode } from "../entities/node";
import type { AppComponentNode } from "../entities/app-component";
import { canHostAppComponent, HOSTABLE_INFRA_TYPES } from "../entities/app-component";
import type { ConnectionEdge } from "../entities/edge";
import type { ValidationResult, ValidationError, ValidationWarning } from "../entities/simulation";

/**
 * Validate solution design components in isolation.
 */
export function validateSolutionDesign(
  appNodes: AppComponentNode[],
  appEdges: ConnectionEdge[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (appNodes.length === 0) {
    return { isValid: true, errors, warnings };
  }

  const nodeIds = new Set(appNodes.map((n) => n.id));

  // Edge reference validation
  for (const edge of appEdges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        edgeId: edge.id,
        message: `Aresta referencia componente de origem inexistente: ${edge.source}`,
        code: "L2_INVALID_EDGE_SOURCE",
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        edgeId: edge.id,
        message: `Aresta referencia componente de destino inexistente: ${edge.target}`,
        code: "L2_INVALID_EDGE_TARGET",
      });
    }
  }

  // Missing labels
  for (const node of appNodes) {
    if (!node.label || node.label.trim() === "") {
      errors.push({
        nodeId: node.id,
        message: "Componente sem nome definido.",
        code: "L2_MISSING_LABEL",
      });
    }
  }

  // Missing host
  for (const node of appNodes) {
    if (!node.hostInfrastructureNodeId) {
      errors.push({
        nodeId: node.id,
        message: `"${node.label}" não está associado a nenhuma infraestrutura host.`,
        code: "L2_NO_HOST",
      });
    }
  }

  // Isolated components
  const connected = new Set<string>();
  for (const edge of appEdges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }
  for (const node of appNodes) {
    if (!connected.has(node.id) && appNodes.length > 1) {
      warnings.push({
        nodeId: node.id,
        message: `"${node.label}" não está conectado a nenhum outro componente.`,
        code: "L2_ISOLATED",
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Cross-layer validation between infrastructure (L1) and solution design (L2).
 */
export function validateCrossLayer(
  infraNodes: ArchitectureNode[],
  appNodes: AppComponentNode[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (appNodes.length === 0) {
    return { isValid: true, errors, warnings };
  }

  const infraMap = new Map(infraNodes.map((n) => [n.id, n]));

  for (const appNode of appNodes) {
    const hostId = appNode.hostInfrastructureNodeId;
    if (!hostId) continue;

    const host = infraMap.get(hostId);

    // Host no longer exists (was deleted from L1)
    if (!host) {
      errors.push({
        nodeId: appNode.id,
        message: `"${appNode.label}" referencia infraestrutura host que foi removida.`,
        code: "CROSS_HOST_MISSING",
      });
      continue;
    }

    // Host type can't run app components
    if (!canHostAppComponent(host.type)) {
      errors.push({
        nodeId: appNode.id,
        message: `"${appNode.label}" está hospedado em "${host.label}" (${host.type}), que não suporta aplicações. Use: ${HOSTABLE_INFRA_TYPES.join(", ")}.`,
        code: "CROSS_INVALID_HOST_TYPE",
      });
    }
  }

  // Check for messaging components without corresponding messaging infra
  const hasMessagingInfra = infraNodes.some((n) =>
    ["sqs", "sns", "msk", "kinesis", "eventbridge"].includes(n.type)
  );
  const hasConsumerOrProducer = appNodes.some((n) =>
    ["consumer", "producer"].includes(n.type)
  );
  if (hasConsumerOrProducer && !hasMessagingInfra) {
    warnings.push({
      message: "Consumers/Producers detectados sem infraestrutura de mensageria (SQS, SNS, MSK, Kinesis) na camada de Arquitetura.",
      code: "CROSS_NO_MESSAGING_INFRA",
    });
  }

  // Check for database clients without database infra
  const hasDbInfra = infraNodes.some((n) =>
    ["rds", "dynamodb"].includes(n.type)
  );
  const hasDbClient = appNodes.some((n) => n.type === "database-client");
  if (hasDbClient && !hasDbInfra) {
    warnings.push({
      message: "Database Client detectado sem banco de dados (RDS, DynamoDB) na camada de Arquitetura.",
      code: "CROSS_NO_DB_INFRA",
    });
  }

  // Check for cache clients without cache infra
  const hasCacheInfra = infraNodes.some((n) => n.type === "elasticache");
  const hasCacheClient = appNodes.some((n) => n.type === "cache-client");
  if (hasCacheClient && !hasCacheInfra) {
    warnings.push({
      message: "Cache Client detectado sem ElastiCache na camada de Arquitetura.",
      code: "CROSS_NO_CACHE_INFRA",
    });
  }

  // Host capacity warning: too many components on one host
  const hostCounts = new Map<string, number>();
  for (const appNode of appNodes) {
    if (appNode.hostInfrastructureNodeId) {
      hostCounts.set(
        appNode.hostInfrastructureNodeId,
        (hostCounts.get(appNode.hostInfrastructureNodeId) ?? 0) + 1
      );
    }
  }
  for (const [hostId, count] of hostCounts) {
    if (count > 10) {
      const host = infraMap.get(hostId);
      warnings.push({
        nodeId: hostId,
        message: `"${host?.label ?? hostId}" hospeda ${count} componentes. Considere distribuir entre mais instâncias.`,
        code: "CROSS_HOST_OVERLOADED",
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}
