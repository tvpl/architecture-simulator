"use client";
/**
 * Flow Store — canonical source of truth for nodes and edges on the canvas.
 * Wraps @xyflow/react state management with domain-aware CRUD operations.
 */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
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
import type { ConnectionEdge, ConnectionProtocol } from "@/domain/entities/edge";
import { SERVICE_DEFAULTS } from "@/domain/constants/defaults";
import { PROTOCOL_INFO } from "@/domain/entities/edge";

// ── React Flow node/edge wrappers ────────────────────────────────────────────

/** The React Flow Node wrapping our ArchitectureNode domain entity */
export type FlowNode = Node<ArchitectureNode>;

/** The React Flow Edge wrapping our ConnectionEdge domain entity */
export type FlowEdge = Edge<ConnectionEdge>;

// ── Project serialization format ─────────────────────────────────────────────

export interface ProjectData {
  version: 2;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  savedAt: string;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  projectName: string;

  // React Flow event handlers (stable references)
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange<FlowEdge>;
  onConnect: OnConnect;

  // Domain-level mutations
  addNode: (type: AWSServiceType, position: XYPosition, label?: string) => string;
  updateNodeData: (nodeId: string, patch: Partial<ArchitectureNode>) => void;
  updateNodeConfig: (nodeId: string, config: Partial<Record<string, unknown>>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  updateEdgeData: (edgeId: string, patch: Partial<ConnectionEdge>) => void;
  removeEdge: (edgeId: string) => void;

  // Project
  setProjectName: (name: string) => void;
  exportProject: () => ProjectData;
  importProject: (data: ProjectData) => void;
  clearCanvas: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

let nodeCounter = 0;

export const useFlowStore = create<FlowState>()(
  subscribeWithSelector((set, get) => ({
    nodes: [],
    edges: [],
    projectName: "Minha Arquitetura",

    // ── React Flow handlers ─────────────────────────────────────────────────

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
      // Prevent duplicate connections
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

    // ── Node mutations ──────────────────────────────────────────────────────

    addNode: (type, position, label) => {
      const id = `${type}-${++nodeCounter}-${Date.now()}`;
      const defaults = SERVICE_DEFAULTS[type] ?? {};

      const domainNode: ArchitectureNode = {
        id,
        label: label ?? buildDefaultLabel(type),
        type,
        category: "compute", // will be overridden by registry lookup in UI
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
        // Container nodes use the 'group' type for React Flow parent/child
        ...(["vpc", "subnet", "security-group"].includes(type)
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

    // ── Edge mutations ──────────────────────────────────────────────────────

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

    // ── Project ─────────────────────────────────────────────────────────────

    setProjectName: (name) => set({ projectName: name }),

    exportProject: () => ({
      version: 2,
      name: get().projectName,
      nodes: get().nodes,
      edges: get().edges,
      savedAt: new Date().toISOString(),
    }),

    importProject: (data) => {
      set({
        nodes: data.nodes,
        edges: data.edges,
        projectName: data.name,
      });
    },

    clearCanvas: () => {
      set({ nodes: [], edges: [] });
    },
  }))
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectDomainNodes = (state: FlowState): ArchitectureNode[] =>
  state.nodes.map((n) => n.data);

export const selectDomainEdges = (state: FlowState): ConnectionEdge[] =>
  state.edges.map((e) => e.data!).filter(Boolean);

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
