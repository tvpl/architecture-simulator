/**
 * K8s manifest generator — produces valid Kubernetes YAML from Layer 2 app components.
 * Generates Deployments, Services, HPA, CronJobs, Ingress, ConfigMaps as appropriate.
 */
import type { AppComponentNode } from "../entities/app-component";
import type { ArchitectureNode } from "../entities/node";

export function generateK8sManifests(
  appNodes: AppComponentNode[],
  infraNodes: ArchitectureNode[]
): string {
  if (appNodes.length === 0) return "# Nenhum componente de solução definido\n";

  const infraMap = new Map(infraNodes.map((n) => [n.id, n]));
  const docs: string[] = [
    "# ─── Kubernetes Manifests ───────────────────────────────────────",
    `# Gerado por Architecture Simulator em ${new Date().toISOString()}`,
    `# Total: ${appNodes.length} componente(s)`,
    "",
  ];

  for (const node of appNodes) {
    const host = infraMap.get(node.hostInfrastructureNodeId);
    const hostLabel = host?.label ?? "unknown";
    docs.push(`# ── ${node.label} (${node.type}) — Host: ${hostLabel} ──`);

    switch (node.type) {
      case "microservice":
      case "api":
      case "worker":
      case "gateway":
        docs.push(generateDeployment(node));
        if (["microservice", "api", "gateway"].includes(node.type)) {
          docs.push(generateService(node));
        }
        if (hasAutoscaling(node)) {
          docs.push(generateHPA(node));
        }
        break;
      case "consumer":
      case "producer":
        docs.push(generateDeployment(node));
        break;
      case "cronjob":
        docs.push(generateCronJob(node));
        break;
      case "ingress-controller":
        docs.push(generateIngress(node));
        break;
      case "batch-processor":
        docs.push(generateJob(node));
        break;
      case "database-client":
      case "cache-client":
        docs.push(generateConfigMap(node));
        break;
      case "sidecar":
        docs.push(generateSidecarAnnotation(node));
        break;
    }
  }

  return docs.join("\n");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cfg(node: AppComponentNode): Record<string, unknown> {
  return node.config as unknown as Record<string, unknown>;
}

function safeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function hasAutoscaling(node: AppComponentNode): boolean {
  const c = cfg(node);
  return (c.minReplicas as number) > 0 && (c.maxReplicas as number) > (c.minReplicas as number);
}

// ── Generators ───────────────────────────────────────────────────────────────

function generateDeployment(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const ns = (c.namespace as string) || "default";
  const replicas = (c.replicas as number) || 1;
  const image = (c.image as string) || `${name}:latest`;
  const cpu = (c.cpu as string) || "250m";
  const mem = (c.memory as string) || "256Mi";
  const cpuLimit = (c.cpuLimit as string) || scaleCPU(cpu);
  const memLimit = (c.memoryLimit as string) || scaleMem(mem);
  const port = (c.port as number) || 8080;
  const healthPath = (c.healthCheckPath as string) || "";
  const readinessPath = (c.readinessPath as string) || healthPath;

  let probes = "";
  if (healthPath) {
    probes = `
          # Liveness: reinicia o container se falhar
          livenessProbe:
            httpGet:
              path: ${healthPath}
              port: ${port}
            initialDelaySeconds: 15
            periodSeconds: 10
          # Readiness: remove do balanceador se falhar
          readinessProbe:
            httpGet:
              path: ${readinessPath || healthPath}
              port: ${port}
            initialDelaySeconds: 5
            periodSeconds: 5`;
  }

  return `---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app: ${name}
    managed-by: arch-simulator
    component-type: ${node.type}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
        managed-by: arch-simulator
    spec:
      containers:
        - name: ${name}
          image: ${image}
          ports:
            - containerPort: ${port}
          resources:
            # Requests: recursos garantidos ao container
            requests:
              cpu: "${cpu}"
              memory: "${mem}"
            # Limits: máximo permitido (throttle CPU / OOMKill memória)
            limits:
              cpu: "${cpuLimit}"
              memory: "${memLimit}"${probes}
`;
}

function generateService(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const ns = (c.namespace as string) || "default";
  const port = (c.port as number) || 8080;
  const svcType = (c.serviceType as string) || "ClusterIP";

  return `---
apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app: ${name}
    managed-by: arch-simulator
spec:
  type: ${svcType}
  selector:
    app: ${name}
  ports:
    - port: ${port}
      targetPort: ${port}
      protocol: TCP
`;
}

function generateHPA(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const ns = (c.namespace as string) || "default";
  const minR = (c.minReplicas as number) || 1;
  const maxR = (c.maxReplicas as number) || 5;
  const targetCPU = (c.targetCPUPercent as number) || 70;

  return `---
# HPA: escala automaticamente entre ${minR} e ${maxR} réplicas
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}
  namespace: ${ns}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}
  minReplicas: ${minR}
  maxReplicas: ${maxR}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${targetCPU}
`;
}

function generateCronJob(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const ns = (c.namespace as string) || "default";
  const schedule = (c.schedule as string) || "0 * * * *";
  const image = (c.image as string) || `${name}:latest`;
  const cpu = (c.cpu as string) || "250m";
  const mem = (c.memory as string) || "256Mi";
  const concPolicy = (c.concurrencyPolicy as string) || "Forbid";

  return `---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app: ${name}
    managed-by: arch-simulator
spec:
  schedule: "${schedule}"
  concurrencyPolicy: ${concPolicy}
  successfulJobsHistoryLimit: ${(c.successfulJobsHistoryLimit as number) || 3}
  failedJobsHistoryLimit: ${(c.failedJobsHistoryLimit as number) || 1}
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: ${name}
              image: ${image}
              resources:
                requests:
                  cpu: "${cpu}"
                  memory: "${mem}"
          restartPolicy: OnFailure
`;
}

function generateIngress(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const hosts = (c.hosts as string[]) || ["example.com"];
  const paths = (c.paths as string[]) || ["/"];
  const tls = (c.tls as boolean) ?? true;

  const rules = hosts.map((host) =>
    `    - host: ${host}
      http:
        paths:${paths.map((p) => `
          - path: ${p}
            pathType: Prefix
            backend:
              service:
                name: ${name}-svc
                port:
                  number: 80`).join("")}`
  ).join("\n");

  const tlsBlock = tls ? `
  tls:${hosts.map((h) => `
    - hosts:
        - ${h}
      secretName: ${safeLabel(h)}-tls`).join("")}` : "";

  return `---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
  annotations:
    kubernetes.io/ingress.class: ${(c.type as string) || "nginx"}
spec:${tlsBlock}
  rules:
${rules}
`;
}

function generateJob(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const ns = (c.namespace as string) || "default";
  const image = (c.image as string) || `${name}:latest`;
  const parallelism = (c.parallelism as number) || 1;

  return `---
apiVersion: batch/v1
kind: Job
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app: ${name}
    managed-by: arch-simulator
spec:
  parallelism: ${parallelism}
  backoffLimit: ${(c.retryAttempts as number) || 3}
  activeDeadlineSeconds: ${(c.timeoutMs as number) ? Math.ceil((c.timeoutMs as number) / 1000) : 3600}
  template:
    spec:
      containers:
        - name: ${name}
          image: ${image}
          resources:
            requests:
              cpu: "${(c.cpu as string) || "500m"}"
              memory: "${(c.memory as string) || "512Mi"}"
      restartPolicy: OnFailure
`;
}

function generateConfigMap(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);
  const isDb = node.type === "database-client";

  return `---
# ConfigMap com configurações de conexão para ${node.label}
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}-config
  labels:
    app: ${name}
    managed-by: arch-simulator
data:
  CONNECTION_POOL_SIZE: "${(c.connectionPoolSize as number) || 5}"
  TIMEOUT_MS: "${(c.timeoutMs as number) || 5000}"
  ${isDb ? `RETRY_ATTEMPTS: "${(c.retryAttempts as number) || 3}"` : `TTL_SECONDS: "${(c.ttlSeconds as number) || 300}"`}
  ${isDb ? `TARGET_DATABASE: "${(c.targetDatabase as string) || ""}"` : `TARGET_CACHE: "${(c.targetCache as string) || ""}"` }
`;
}

function generateSidecarAnnotation(node: AppComponentNode): string {
  const c = cfg(node);
  const name = safeLabel(node.label);

  return `---
# Sidecar container — adicionar ao Deployment do serviço principal
# Copie este bloco para a seção spec.containers[] do Deployment
#
# - name: ${name}
#   image: ${(c.image as string) || `${(c.type as string) || "envoy"}:latest`}
#   ports:
#     - containerPort: ${(c.port as number) || 15001}
#   resources:
#     requests:
#       cpu: "${(c.cpu as string) || "100m"}"
#       memory: "${(c.memory as string) || "128Mi"}"
#     limits:
#       cpu: "${scaleCPU((c.cpu as string) || "100m")}"
#       memory: "${scaleMem((c.memory as string) || "128Mi")}"
`;
}

// ── Resource scaling helpers ──────────────────────────────────────────────

function scaleCPU(cpu: string): string {
  if (cpu.endsWith("m")) {
    const millis = parseInt(cpu) * 2;
    return millis >= 1000 ? `${millis}m` : `${millis}m`;
  }
  return `${parseFloat(cpu) * 2}`;
}

function scaleMem(mem: string): string {
  if (mem.endsWith("Mi")) {
    const mi = parseInt(mem) * 2;
    return mi >= 1024 ? `${Math.round(mi / 1024)}Gi` : `${mi}Mi`;
  }
  if (mem.endsWith("Gi")) {
    return `${parseFloat(mem) * 2}Gi`;
  }
  return mem;
}
