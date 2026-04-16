"use client";
/**
 * Flow Store — canonical source of truth for nodes and edges.
 * Partitioned into infrastructure (Layer 1) and solution design (Layer 2).
 * Includes undo/redo via zundo temporal middleware.
 */
import { create, useStore } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";
import { temporal } from "zundo";
import type { TemporalState } from "zundo";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type XYPosition,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import type { ArchitectureNode, AWSServiceType } from "@/domain/entities/node";
import type { AppComponentNode, AppComponentType } from "@/domain/entities/app-component";
import type { ConnectionEdge, ConnectionProtocol } from "@/domain/entities/edge";
import type { LayerType } from "@/domain/entities/layer";
import { SERVICE_DEFAULTS } from "@/domain/constants/defaults";
import { APP_COMPONENT_DEFAULTS } from "@/domain/constants/app-defaults";
import { PROTOCOL_INFO } from "@/domain/entities/edge";
import { canHostAppComponent } from "@/domain/entities/app-component";

// ── React Flow node/edge wrappers ────────────────────────────────────────────

/** Layer 1: React Flow Node wrapping ArchitectureNode */
export type FlowNode = Node<ArchitectureNode>;

/** Layer 2: React Flow Node wrapping AppComponentNode */
export type AppFlowNode = Node<AppComponentNode>;

/** React Flow Edge wrapping ConnectionEdge (shared across layers) */
export type FlowEdge = Edge<ConnectionEdge>;

// ── Project serialization format ─────────────────────────────────────────────

/** V3 format with partitioned layers */
export interface ProjectData {
  version: 3;
  name: string;
  infrastructure: { nodes: FlowNode[]; edges: FlowEdge[] };
  solutionDesign: { nodes: AppFlowNode[]; edges: FlowEdge[] };
  savedAt: string;
}

/** V2 legacy format for backward compat */
interface ProjectDataV2 {
  version: 2;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  savedAt: string;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface FlowState {
  // Layer 1: Infrastructure
  nodes: FlowNode[];
  edges: FlowEdge[];

  // Layer 2: Solution Design
  solutionNodes: AppFlowNode[];
  solutionEdges: FlowEdge[];

  projectName: string;

  // React Flow event handlers — routed by active layer
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange<FlowEdge>;
  onConnect: OnConnect;

  // Solution Design event handlers
  onSolutionNodesChange: OnNodesChange<AppFlowNode>;
  onSolutionEdgesChange: OnEdgesChange<FlowEdge>;
  onSolutionConnect: OnConnect;

  // Layer 1 mutations
  addNode: (type: AWSServiceType, position: XYPosition, label?: string) => string;
  updateNodeData: (nodeId: string, patch: Partial<ArchitectureNode>) => void;
  updateNodeConfig: (nodeId: string, config: Partial<Record<string, unknown>>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Layer 2 mutations
  addAppComponent: (type: AppComponentType, position: XYPosition, hostNodeId: string, label?: string) => string;
  updateAppComponentData: (nodeId: string, patch: Partial<AppComponentNode>) => void;
  updateAppComponentConfig: (nodeId: string, config: Partial<Record<string, unknown>>) => void;
  removeAppComponent: (nodeId: string) => void;
  duplicateAppComponent: (nodeId: string) => void;

  // Shared edge mutations
  updateEdgeData: (edgeId: string, patch: Partial<ConnectionEdge>) => void;
  removeEdge: (edgeId: string) => void;
  removeSolutionEdge: (edgeId: string) => void;

  // Project
  setProjectName: (name: string) => void;
  exportProject: () => ProjectData;
  importProject: (data: ProjectData | ProjectDataV2) => void;
  clearCanvas: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

let nodeCounter = 0;

export const useFlowStore = create<FlowState>()(
  temporal(
    subscribeWithSelector(
      persist(
        (set, get) => ({
    nodes: [],
    edges: [],
    solutionNodes: [],
    solutionEdges: [],
    projectName: "Minha Arquitetura",

    // ── Layer 1 React Flow handlers ─────────────────────────────────────────

    onNodesChange: (changes: NodeChange<FlowNode>[]) => {
      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
      }));
    },

    onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
      }));
    },

    onConnect: (connection: Connection) => {
      const { edges } = get();
      const exists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) return;

      const defaultProtocol: ConnectionProtocol = "https";
      const protocolInfo = PROTOCOL_INFO[defaultProtocol];

      const newEdge: FlowEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        type: "protocol-edge",
        animated: false,
        style: { stroke: protocolInfo.color, strokeWidth: 2 },
        data: {
          id: `edge-${Date.now()}`,
          source: connection.source ?? "",
          target: connection.target ?? "",
          protocol: defaultProtocol,
          latencyMs: protocolInfo.defaultLatencyMs,
          throughputRPS: 1000,
          messageCount: 100,
        },
      };

      set((state) => ({
        edges: addEdge(newEdge, state.edges),
      }));
    },

    // ── Layer 2 React Flow handlers ─────────────────────────────────────────

    onSolutionNodesChange: (changes: NodeChange<AppFlowNode>[]) => {
      set((state) => ({
        solutionNodes: applyNodeChanges(changes, state.solutionNodes),
      }));
    },

    onSolutionEdgesChange: (changes: EdgeChange<FlowEdge>[]) => {
      set((state) => ({
        solutionEdges: applyEdgeChanges(changes, state.solutionEdges),
      }));
    },

    onSolutionConnect: (connection: Connection) => {
      const { solutionEdges } = get();
      const exists = solutionEdges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) return;

      const defaultProtocol: ConnectionProtocol = "http";
      const protocolInfo = PROTOCOL_INFO[defaultProtocol];

      const newEdge: FlowEdge = {
        ...connection,
        id: `sol-edge-${connection.source}-${connection.target}-${Date.now()}`,
        type: "protocol-edge",
        animated: false,
        style: { stroke: protocolInfo.color, strokeWidth: 2 },
        data: {
          id: `sol-edge-${Date.now()}`,
          source: connection.source ?? "",
          target: connection.target ?? "",
          protocol: defaultProtocol,
          latencyMs: protocolInfo.defaultLatencyMs,
          throughputRPS: 1000,
          messageCount: 100,
        },
      };

      set((state) => ({
        solutionEdges: addEdge(newEdge, state.solutionEdges),
      }));
    },

    // ── Layer 1 Node mutations ──────────────────────────────────────────────

    addNode: (type, position, label) => {
      const id = `${type}-${++nodeCounter}-${Date.now()}`;
      const defaults = SERVICE_DEFAULTS[type] ?? {};

      const domainNode: ArchitectureNode = {
        id,
        label: label ?? buildDefaultLabel(type),
        type,
        category: "compute",
        latencyMs: 10,
        positionX: position.x,
        positionY: position.y,
        config: defaults as ArchitectureNode["config"],
      } as ArchitectureNode;

      const flowNode: FlowNode = {
        id,
        type: "service-node",
        position,
        data: domainNode,
        ...(["vpc", "subnet", "security-group", "region"].includes(type)
          ? { type: "container-node" }
          : {}),
      };

      set((state) => ({
        nodes: [...state.nodes, flowNode],
      }));

      return id;
    },

    updateNodeData: (nodeId, patch) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...patch } }
            : n
        ),
      }));
    },

    updateNodeConfig: (nodeId, config) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  config: { ...n.data.config, ...config },
                },
              }
            : n
        ),
      }));
    },

    removeNode: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
        // Also remove any solution design nodes hosted on this infra node
        solutionNodes: state.solutionNodes.filter(
          (n) => n.data.hostInfrastructureNodeId !== nodeId
        ),
      }));
    },

    duplicateNode: (nodeId) => {
      const { nodes } = get();
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;

      const newId = `${source.data.type}-${++nodeCounter}-${Date.now()}`;
      const duplicate: FlowNode = {
        ...source,
        id: newId,
        position: {
          x: source.position.x + 30,
          y: source.position.y + 30,
        },
        selected: false,
        data: {
          ...source.data,
          id: newId,
          label: `${source.data.label} (cópia)`,
        },
      };

      set((state) => ({ nodes: [...state.nodes, duplicate] }));
    },

    // ── Layer 2 Node mutations ──────────────────────────────────────────────

    addAppComponent: (type, position, hostNodeId, label) => {
      const id = `app-${type}-${++nodeCounter}-${Date.now()}`;
      const defaults = APP_COMPONENT_DEFAULTS[type] ?? {};

      const domainNode: AppComponentNode = {
        id,
        label: label ?? buildAppDefaultLabel(type),
        type,
        category: "application",
        hostInfrastructureNodeId: hostNodeId,
        positionX: position.x,
        positionY: position.y,
        config: defaults as AppComponentNode["config"],
      } as AppComponentNode;

      const flowNode: AppFlowNode = {
        id,
        type: "app-service-node",
        position,
        data: domainNode,
      };

      set((state) => ({
        solutionNodes: [...state.solutionNodes, flowNode],
      }));

      return id;
    },

    updateAppComponentData: (nodeId, patch) => {
      set((state) => ({
        solutionNodes: state.solutionNodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...patch } }
            : n
        ),
      }));
    },

    updateAppComponentConfig: (nodeId, config) => {
      set((state) => ({
        solutionNodes: state.solutionNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  config: { ...n.data.config, ...config },
                },
              }
            : n
        ),
      }));
    },

    removeAppComponent: (nodeId) => {
      set((state) => ({
        solutionNodes: state.solutionNodes.filter((n) => n.id !== nodeId),
        solutionEdges: state.solutionEdges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
      }));
    },

    duplicateAppComponent: (nodeId) => {
      const { solutionNodes } = get();
      const source = solutionNodes.find((n) => n.id === nodeId);
      if (!source) return;

      const newId = `app-${source.data.type}-${++nodeCounter}-${Date.now()}`;
      const duplicate: AppFlowNode = {
        ...source,
        id: newId,
        position: {
          x: source.position.x + 30,
          y: source.position.y + 30,
        },
        selected: false,
        data: {
          ...source.data,
          id: newId,
          label: `${source.data.label} (cópia)`,
        },
      };

      set((state) => ({ solutionNodes: [...state.solutionNodes, duplicate] }));
    },

    // ── Edge mutations (Layer 1) ────────────────────────────────────────────

    updateEdgeData: (edgeId, patch) => {
      set((state) => ({
        edges: state.edges.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                data: { ...e.data!, ...patch },
                style: patch.protocol
                  ? { stroke: PROTOCOL_INFO[patch.protocol].color, strokeWidth: 2 }
                  : e.style,
              }
            : e
        ),
      }));
    },

    removeEdge: (edgeId) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== edgeId),
      }));
    },

    removeSolutionEdge: (edgeId) => {
      set((state) => ({
        solutionEdges: state.solutionEdges.filter((e) => e.id !== edgeId),
      }));
    },

    // ── Project ─────────────────────────────────────────────────────────────

    setProjectName: (name) => set({ projectName: name }),

    exportProject: () => ({
      version: 3 as const,
      name: get().projectName,
      infrastructure: {
        nodes: get().nodes,
        edges: get().edges,
      },
      solutionDesign: {
        nodes: get().solutionNodes,
        edges: get().solutionEdges,
      },
      savedAt: new Date().toISOString(),
    }),

    importProject: (data: ProjectData | ProjectDataV2) => {
      if (data.version === 2 || !("infrastructure" in data)) {
        // V2 migration: all nodes/edges go to infrastructure layer
        const v2 = data as ProjectDataV2;
        set({
          nodes: v2.nodes,
          edges: v2.edges,
          solutionNodes: [],
          solutionEdges: [],
          projectName: v2.name,
        });
      } else {
        const v3 = data as ProjectData;
        set({
          nodes: v3.infrastructure.nodes,
          edges: v3.infrastructure.edges,
          solutionNodes: v3.solutionDesign.nodes,
          solutionEdges: v3.solutionDesign.edges,
          projectName: v3.name,
        });
      }
    },

    clearCanvas: () => {
      set({ nodes: [], edges: [], solutionNodes: [], solutionEdges: [] });
    },
        }),
        {
          name: "aws-arch-v3",
          partialize: (state) => ({
            nodes: state.nodes,
            edges: state.edges,
            solutionNodes: state.solutionNodes,
            solutionEdges: state.solutionEdges,
            projectName: state.projectName,
          }),
          // Migrate from v2 to v3 on first load
          migrate: (persisted: unknown) => {
            const state = persisted as Record<string, unknown>;
            // If we have old v2 data (no solutionNodes), add empty arrays
            if (state && !("solutionNodes" in state)) {
              return {
                ...state,
                solutionNodes: [],
                solutionEdges: [],
              };
            }
            return state;
          },
          version: 3,
        }
      )
    ),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        solutionNodes: state.solutionNodes,
        solutionEdges: state.solutionEdges,
      }),
      limit: 50,
    }
  )
);

// ── Temporal store hook (undo/redo) ───────────────────────────────────────────

type TemporalSlice = Pick<FlowState, "nodes" | "edges" | "solutionNodes" | "solutionEdges">;

export const useTemporalFlowStore = <T>(
  selector: (state: TemporalState<TemporalSlice>) => T
): T =>
  useStore(
    (useFlowStore as unknown as { temporal: Parameters<typeof useStore>[0] }).temporal,
    selector as Parameters<typeof useStore>[1]
  ) as T;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectDomainNodes = (state: FlowState): ArchitectureNode[] =>
  state.nodes.map((n) => n.data);

export const selectDomainEdges = (state: FlowState): ConnectionEdge[] =>
  state.edges.map((e) => e.data!).filter(Boolean);

export const selectSolutionDomainNodes = (state: FlowState): AppComponentNode[] =>
  state.solutionNodes.map((n) => n.data);

export const selectSolutionDomainEdges = (state: FlowState): ConnectionEdge[] =>
  state.solutionEdges.map((e) => e.data!).filter(Boolean);

/** Returns infrastructure nodes that can host application components */
export const selectInfraHostOptions = (state: FlowState) =>
  state.nodes.filter((n) => canHostAppComponent(n.data.type));

/** Get the active layer's nodes/edges based on layer type */
export function selectActiveLayerData(state: FlowState, layer: LayerType) {
  if (layer === "architecture") {
    return { nodes: state.nodes, edges: state.edges };
  }
  if (layer === "solution-design") {
    return { nodes: state.solutionNodes as unknown as FlowNode[], edges: state.solutionEdges };
  }
  // cost/simulation read from infra by default
  return { nodes: state.nodes, edges: state.edges };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  lambda: "Lambda Function",
  ec2: "EC2 Instance",
  ecs: "ECS Service",
  eks: "EKS Cluster",
  fargate: "Fargate Task",
  vpc: "VPC",
  subnet: "Subnet",
  alb: "Load Balancer",
  nlb: "Network LB",
  "api-gateway": "API Gateway",
  cloudfront: "CloudFront",
  route53: "Route 53",
  "security-group": "Security Group",
  sqs: "SQS Queue",
  sns: "SNS Topic",
  eventbridge: "EventBridge",
  msk: "Kafka (MSK)",
  kinesis: "Kinesis Stream",
  s3: "S3 Bucket",
  rds: "RDS Database",
  dynamodb: "DynamoDB Table",
  elasticache: "ElastiCache",
  efs: "EFS",
  iam: "IAM Role",
  waf: "WAF",
  "secrets-manager": "Secrets Manager",
  cognito: "Cognito",
  "step-functions": "Step Functions",
  cloudwatch: "CloudWatch",
};

function buildDefaultLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

const APP_TYPE_LABELS: Record<string, string> = {
  microservice: "Microsserviço",
  worker: "Worker",
  consumer: "Consumer",
  producer: "Producer",
  api: "API",
  sidecar: "Sidecar",
  "ingress-controller": "Ingress Controller",
  cronjob: "CronJob",
  gateway: "API Gateway",
  "database-client": "Database Client",
  "cache-client": "Cache Client",
  "batch-processor": "Batch Processor",
};

function buildAppDefaultLabel(type: string): string {
  return APP_TYPE_LABELS[type] ?? type;
}
