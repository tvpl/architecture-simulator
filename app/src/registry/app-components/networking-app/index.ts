import { appComponentRegistry } from "../index-internal";
import type { AppComponentDefinition } from "../types";

const sidecar: AppComponentDefinition = {
  type: "sidecar",
  label: "Sidecar",
  description: "Container auxiliar (proxy, logs, monitoramento)",
  helpText: "Um sidecar é um container que roda junto ao container principal no mesmo Pod. Usado para proxy (Envoy/Istio), coleta de logs (Fluentd), monitoramento (Datadog) sem modificar o código da aplicação.",
  category: "networking-app",
  iconName: "Puzzle",
  color: "text-teal-500",
  bgColor: "bg-teal-50 dark:bg-teal-950/30",
  borderColor: "border-teal-400",
  allowedHostTypes: ["eks", "ecs", "fargate"],
  allowedIncomingProtocols: ["http", "grpc", "internal"],
  allowedOutgoingProtocols: ["http", "grpc", "https", "internal"],
  configSections: [
    {
      title: "Sidecar",
      fields: [
        { kind: "select", key: "type", label: "Tipo", options: [{ value: "envoy", label: "Envoy Proxy" }, { value: "istio", label: "Istio Sidecar" }, { value: "fluentd", label: "Fluentd (Logs)" }, { value: "datadog", label: "Datadog Agent" }, { value: "custom", label: "Custom" }], description: "Tipo de sidecar. Envoy/Istio = service mesh proxy, Fluentd = coleta de logs." },
        { kind: "number", key: "port", label: "Porta Admin", min: 1, max: 65535, step: 1 },
        { kind: "select", key: "protocol", label: "Protocolo", options: [{ value: "http", label: "HTTP" }, { value: "grpc", label: "gRPC" }, { value: "tcp", label: "TCP" }] },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "envoyproxy/envoy:v1.28" },
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "50m", label: "50m" }, { value: "100m", label: "100m" }, { value: "250m", label: "250m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "64Mi", label: "64 MB" }, { value: "128Mi", label: "128 MB" }, { value: "256Mi", label: "256 MB" }] },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "100m", label: "100m" }, { value: "250m", label: "250m" }, { value: "500m", label: "500m" }], description: "Limite máximo de CPU para o sidecar. Sidecars devem consumir poucos recursos para não impactar o container principal." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "128Mi", label: "128 MB" }, { value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }], description: "Limite máximo de memória para o sidecar." },
      ],
    },
    {
      title: "Observabilidade",
      fields: [
        { kind: "switch", key: "metricsEnabled", label: "Métricas Habilitadas", description: "Exporta métricas do sidecar (throughput, latência, erros) para Prometheus." },
        { kind: "switch", key: "accessLog", label: "Access Log", description: "Registra todas as requisições que passam pelo sidecar proxy." },
      ],
    },
  ],
};

const ingressController: AppComponentDefinition = {
  type: "ingress-controller",
  label: "Ingress Controller",
  description: "Controle de tráfego de entrada no cluster",
  helpText: "O Ingress Controller gerencia o tráfego HTTP/HTTPS que entra no cluster Kubernetes. Roteia requisições para diferentes serviços baseado em hosts e paths. Funciona como um 'load balancer inteligente' dentro do cluster.",
  category: "networking-app",
  iconName: "ArrowRightLeft",
  color: "text-indigo-500",
  bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  borderColor: "border-indigo-400",
  allowedHostTypes: ["eks", "ecs"],
  allowedIncomingProtocols: ["https", "http"],
  allowedOutgoingProtocols: ["http", "grpc", "internal"],
  configSections: [
    {
      title: "Ingress",
      fields: [
        { kind: "select", key: "type", label: "Tipo", options: [{ value: "nginx", label: "NGINX Ingress" }, { value: "traefik", label: "Traefik" }, { value: "istio", label: "Istio Gateway" }, { value: "aws-alb", label: "AWS ALB Ingress" }], description: "Implementação do ingress controller" },
        { kind: "switch", key: "tls", label: "TLS/HTTPS", description: "Habilitar terminação TLS (certificados SSL)" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 10, step: 1 },
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "100m", label: "100m" }, { value: "250m", label: "250m" }, { value: "500m", label: "500m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "128Mi", label: "128 MB" }, { value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }] },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "250m", label: "250m" }, { value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }], description: "Limite máximo de CPU para o ingress controller." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }], description: "Limite máximo de memória para o ingress controller." },
      ],
    },
    {
      title: "Observabilidade",
      fields: [
        { kind: "select", key: "logLevel", label: "Nível de Log", options: [{ value: "debug", label: "Debug" }, { value: "info", label: "Info" }, { value: "warn", label: "Warn" }, { value: "error", label: "Error" }], description: "Verbosidade dos logs do ingress controller." },
        { kind: "switch", key: "metricsEnabled", label: "Métricas Habilitadas", description: "Exporta métricas de tráfego (requests/s, latência, códigos de status) para monitoramento." },
        { kind: "switch", key: "accessLog", label: "Access Log", description: "Registra todas as requisições HTTP que passam pelo ingress." },
      ],
    },
  ],
};

const gateway: AppComponentDefinition = {
  type: "gateway",
  label: "API Gateway (App)",
  description: "Gateway de aplicação com circuit breaker e retry",
  helpText: "Gateway de nível de aplicação que gerencia roteamento, rate limiting, circuit breaker e retry. Diferente do AWS API Gateway (infra), este roda dentro do cluster como um serviço.",
  category: "networking-app",
  iconName: "Network",
  color: "text-cyan-500",
  bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
  borderColor: "border-cyan-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate"],
  allowedIncomingProtocols: ["https", "http", "grpc"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "internal"],
  configSections: [
    {
      title: "Gateway",
      fields: [
        { kind: "select", key: "type", label: "Tipo", options: [{ value: "api-gateway", label: "API Gateway" }, { value: "mesh-gateway", label: "Mesh Gateway" }, { value: "ingress-gateway", label: "Ingress Gateway" }] },
        { kind: "number", key: "port", label: "Porta", min: 1, max: 65535, step: 1 },
        { kind: "number", key: "rateLimit", label: "Rate Limit (req/s)", min: 0, max: 100000, step: 100 },
        { kind: "number", key: "timeoutMs", label: "Timeout (ms)", min: 100, max: 120000, step: 100, unit: "ms" },
      ],
    },
    {
      title: "Resiliência",
      fields: [
        { kind: "switch", key: "circuitBreakerEnabled", label: "Circuit Breaker", description: "Interrompe chamadas a serviços falhos para evitar cascata de falhas" },
        { kind: "switch", key: "retryPolicy", label: "Retry Automático", description: "Retenta chamadas que falharam por erros temporários" },
        { kind: "switch", key: "corsEnabled", label: "CORS Habilitado" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 20, step: 1 },
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "250m", label: "250m" }, { value: "500m", label: "500m" }, { value: "1000m", label: "1000m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }] },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }, { value: "4000m", label: "4000m (4 vCPU)" }], description: "Limite máximo de CPU que o container pode usar. Se ultrapassar, o Kubernetes limita (throttle) o uso de CPU. Deve ser maior ou igual ao CPU Request." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }, { value: "8Gi", label: "8 GB" }], description: "Limite máximo de memória que o container pode usar. Se ultrapassar, o container é encerrado (OOMKilled). Deve ser maior ou igual ao Memory Request." },
      ],
    },
    {
      title: "Observabilidade",
      fields: [
        { kind: "select", key: "logLevel", label: "Nível de Log", options: [{ value: "debug", label: "Debug" }, { value: "info", label: "Info" }, { value: "warn", label: "Warn" }, { value: "error", label: "Error" }], description: "Controla a verbosidade dos logs. Debug mostra tudo (útil para investigar problemas), Info é o padrão para produção, Error mostra apenas erros críticos." },
        { kind: "switch", key: "metricsEnabled", label: "Métricas Habilitadas", description: "Ativa a exportação de métricas (CPU, memória, requisições) para ferramentas como Prometheus/Grafana. Essencial para monitorar a saúde do serviço em produção." },
        { kind: "switch", key: "tracingEnabled", label: "Tracing Habilitado", description: "Ativa o rastreamento distribuído (distributed tracing) para acompanhar requisições entre múltiplos serviços. Permite visualizar o caminho completo de uma requisição no sistema." },
      ],
    },
  ],
};

appComponentRegistry.register(sidecar);
appComponentRegistry.register(ingressController);
appComponentRegistry.register(gateway);
