// ─── Connection Protocols ────────────────────────────────────────────────────

export const CONNECTION_PROTOCOLS = [
  "https",
  "http",
  "grpc",
  "websocket",
  "kafka",
  "sqs",
  "sns",
  "eventbridge",
  "kinesis",
  "internal",
] as const;

export type ConnectionProtocol = (typeof CONNECTION_PROTOCOLS)[number];

// ─── Connection Edge ─────────────────────────────────────────────────────────

export interface ConnectionEdge {
  id: string;
  source: string;
  target: string;
  protocol: ConnectionProtocol;
  latencyMs: number;
  throughputRPS: number;
  messageCount: number;
  label?: string;
  [key: string]: unknown; // Required for React Flow Edge<T> compatibility
}

// ─── Protocol metadata ───────────────────────────────────────────────────────

export interface ProtocolInfo {
  name: string;
  displayName: string;
  color: string;
  defaultLatencyMs: number;
  isAsync: boolean;
}

export const PROTOCOL_INFO: Record<ConnectionProtocol, ProtocolInfo> = {
  https: {
    name: "https",
    displayName: "HTTPS",
    color: "#22c55e",
    defaultLatencyMs: 50,
    isAsync: false,
  },
  http: {
    name: "http",
    displayName: "HTTP",
    color: "#3b82f6",
    defaultLatencyMs: 30,
    isAsync: false,
  },
  grpc: {
    name: "grpc",
    displayName: "gRPC",
    color: "#8b5cf6",
    defaultLatencyMs: 10,
    isAsync: false,
  },
  websocket: {
    name: "websocket",
    displayName: "WebSocket",
    color: "#f97316",
    defaultLatencyMs: 5,
    isAsync: true,
  },
  kafka: {
    name: "kafka",
    displayName: "Kafka",
    color: "#ef4444",
    defaultLatencyMs: 15,
    isAsync: true,
  },
  sqs: {
    name: "sqs",
    displayName: "SQS",
    color: "#f59e0b",
    defaultLatencyMs: 20,
    isAsync: true,
  },
  sns: {
    name: "sns",
    displayName: "SNS",
    color: "#ec4899",
    defaultLatencyMs: 10,
    isAsync: true,
  },
  eventbridge: {
    name: "eventbridge",
    displayName: "EventBridge",
    color: "#14b8a6",
    defaultLatencyMs: 25,
    isAsync: true,
  },
  kinesis: {
    name: "kinesis",
    displayName: "Kinesis",
    color: "#6366f1",
    defaultLatencyMs: 20,
    isAsync: true,
  },
  internal: {
    name: "internal",
    displayName: "Internal",
    color: "#64748b",
    defaultLatencyMs: 1,
    isAsync: false,
  },
};
