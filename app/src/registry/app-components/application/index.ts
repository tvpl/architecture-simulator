import { appComponentRegistry } from "../index-internal";
import type { AppComponentDefinition } from "../types";

const microservice: AppComponentDefinition = {
  type: "microservice",
  label: "Microsserviço",
  description: "Serviço independente com responsabilidade única",
  helpText: "Um microsserviço é uma aplicação pequena e independente que faz uma coisa bem. Roda como um container (Pod no Kubernetes) com suas próprias configurações de CPU, memória e escalabilidade automática.",
  category: "application",
  iconName: "Box",
  color: "text-blue-500",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
  borderColor: "border-blue-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate"],
  allowedIncomingProtocols: ["https", "http", "grpc", "internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "kafka", "eventbridge", "internal"],
  configSections: [
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/meu-servico:latest", description: "URL da imagem Docker do serviço" },
        { kind: "number", key: "port", label: "Porta", min: 1, max: 65535, step: 1, description: "Porta onde o serviço escuta requisições" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default", description: "Namespace do Kubernetes onde o serviço será implantado" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "select", key: "cpu", label: "CPU (Request)", options: [{ value: "100m", label: "100m (0.1 vCPU)" }, { value: "250m", label: "250m (0.25 vCPU)" }, { value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }], description: "Quantidade mínima de CPU garantida para o container" },
        { kind: "select", key: "memory", label: "Memória (Request)", options: [{ value: "128Mi", label: "128 MB" }, { value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }], description: "Quantidade mínima de memória garantida para o container" },
      ],
    },
    {
      title: "Escalabilidade",
      fields: [
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 100, step: 1, description: "Número de cópias rodando simultaneamente (mais réplicas = mais disponibilidade)" },
        { kind: "number", key: "minReplicas", label: "Mín. Réplicas (HPA)", min: 1, max: 50, step: 1, description: "Número mínimo de réplicas que o auto-scaler mantém" },
        { kind: "number", key: "maxReplicas", label: "Máx. Réplicas (HPA)", min: 1, max: 100, step: 1, description: "Número máximo de réplicas que o auto-scaler pode criar" },
        { kind: "slider", key: "targetCPUPercent", label: "Target CPU %", min: 10, max: 95, step: 5, unit: "%", description: "Quando a CPU média ultrapassa esse valor, novas réplicas são criadas automaticamente" },
      ],
    },
    {
      title: "Health Checks",
      fields: [
        { kind: "text", key: "healthCheckPath", label: "Liveness Probe", placeholder: "/health", description: "Endpoint que o Kubernetes verifica para saber se o serviço está vivo. Se falhar, o container é reiniciado." },
        { kind: "text", key: "readinessPath", label: "Readiness Probe", placeholder: "/ready", description: "Endpoint que indica se o serviço está pronto para receber tráfego. Se falhar, o tráfego é desviado temporariamente." },
      ],
    },
    {
      title: "Rede",
      fields: [
        { kind: "select", key: "serviceType", label: "Tipo de Service", options: [{ value: "ClusterIP", label: "ClusterIP (interno)" }, { value: "NodePort", label: "NodePort (porta fixa)" }, { value: "LoadBalancer", label: "LoadBalancer (externo)" }], description: "Como o serviço é exposto na rede. ClusterIP = somente dentro do cluster, LoadBalancer = acessível externamente." },
        { kind: "select", key: "restartPolicy", label: "Restart Policy", options: [{ value: "Always", label: "Always (recomendado)" }, { value: "OnFailure", label: "OnFailure" }, { value: "Never", label: "Never" }], description: "Quando o container deve ser reiniciado automaticamente" },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "250m", label: "250m (0.25 vCPU)" }, { value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }, { value: "4000m", label: "4000m (4 vCPU)" }], description: "Limite máximo de CPU que o container pode usar. Se ultrapassar, o Kubernetes limita (throttle) o uso de CPU. Deve ser maior ou igual ao CPU Request." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }, { value: "8Gi", label: "8 GB" }], description: "Limite máximo de memória que o container pode usar. Se ultrapassar, o container é encerrado (OOMKilled). Deve ser maior ou igual ao Memory Request." },
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
    {
      title: "Volumes",
      fields: [
        { kind: "number", key: "volumeCount", label: "Quantidade de Volumes", min: 0, max: 5, step: 1, description: "Número de volumes persistentes (PersistentVolumeClaim) anexados ao Pod. Volumes mantêm dados mesmo quando o container reinicia, útil para armazenar arquivos temporários ou dados locais." },
        { kind: "number", key: "volumeSizeGB", label: "Tamanho do Volume (GB)", min: 1, max: 100, step: 1, unit: "GB", description: "Tamanho de cada volume em gigabytes. Volumes maiores custam mais mas permitem armazenar mais dados persistentes." },
      ],
    },
  ],
};

const worker: AppComponentDefinition = {
  type: "worker",
  label: "Worker",
  description: "Processador assíncrono de tarefas em background",
  helpText: "Um worker é um processo que roda em background processando tarefas de uma fila. Ideal para trabalhos demorados que não precisam de resposta imediata, como envio de emails, processamento de imagens, etc.",
  category: "application",
  iconName: "Cog",
  color: "text-amber-500",
  bgColor: "bg-amber-50 dark:bg-amber-950/30",
  borderColor: "border-amber-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate"],
  allowedIncomingProtocols: ["sqs", "sns", "kafka", "eventbridge", "kinesis", "internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "kafka", "internal"],
  configSections: [
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/meu-worker:latest" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default" },
        { kind: "text", key: "queueBinding", label: "Fila/Tópico", placeholder: "nome-da-fila", description: "Nome da fila ou tópico que este worker consome" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "100m", label: "100m" }, { value: "250m", label: "250m" }, { value: "500m", label: "500m" }, { value: "1000m", label: "1000m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "128Mi", label: "128 MB" }, { value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }] },
      ],
    },
    {
      title: "Escalabilidade",
      fields: [
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 50, step: 1 },
        { kind: "number", key: "concurrency", label: "Concorrência", min: 1, max: 100, step: 1, description: "Quantas tarefas cada réplica processa simultaneamente" },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "250m", label: "250m (0.25 vCPU)" }, { value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }, { value: "4000m", label: "4000m (4 vCPU)" }], description: "Limite máximo de CPU que o container pode usar. Se ultrapassar, o Kubernetes limita (throttle) o uso de CPU. Deve ser maior ou igual ao CPU Request." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }, { value: "8Gi", label: "8 GB" }], description: "Limite máximo de memória que o container pode usar. Se ultrapassar, o container é encerrado (OOMKilled). Deve ser maior ou igual ao Memory Request." },
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

const api: AppComponentDefinition = {
  type: "api",
  label: "API",
  description: "Endpoint REST, gRPC ou GraphQL",
  helpText: "Uma API expõe endpoints para que outros serviços ou clientes externos possam se comunicar. Suporta REST (HTTP/JSON), gRPC (alta performance) ou GraphQL (consultas flexíveis).",
  category: "application",
  iconName: "Globe",
  color: "text-green-500",
  bgColor: "bg-green-50 dark:bg-green-950/30",
  borderColor: "border-green-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate", "lambda"],
  allowedIncomingProtocols: ["https", "http", "grpc"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "kafka", "eventbridge", "internal"],
  configSections: [
    {
      title: "API",
      fields: [
        { kind: "select", key: "type", label: "Tipo", options: [{ value: "rest", label: "REST (HTTP/JSON)" }, { value: "grpc", label: "gRPC (Protobuf)" }, { value: "graphql", label: "GraphQL" }], description: "Protocolo da API" },
        { kind: "number", key: "port", label: "Porta", min: 1, max: 65535, step: 1 },
        { kind: "number", key: "rateLimit", label: "Rate Limit (req/s)", min: 0, max: 100000, step: 100, description: "Limite máximo de requisições por segundo" },
      ],
    },
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/minha-api:latest" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default" },
      ],
    },
    {
      title: "Recursos & Escala",
      fields: [
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "250m", label: "250m" }, { value: "500m", label: "500m" }, { value: "1000m", label: "1000m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }] },
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 50, step: 1 },
      ],
    },
    {
      title: "Segurança",
      fields: [
        { kind: "select", key: "authType", label: "Autenticação", options: [{ value: "none", label: "Nenhuma" }, { value: "jwt", label: "JWT" }, { value: "oauth2", label: "OAuth2" }, { value: "api-key", label: "API Key" }], description: "Tipo de autenticação para proteger os endpoints" },
        { kind: "switch", key: "corsEnabled", label: "CORS Habilitado", description: "Permite requisições de origens diferentes (necessário para frontends web)" },
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
    {
      title: "Volumes",
      fields: [
        { kind: "number", key: "volumeCount", label: "Quantidade de Volumes", min: 0, max: 5, step: 1, description: "Número de volumes persistentes (PersistentVolumeClaim) anexados ao Pod. Volumes mantêm dados mesmo quando o container reinicia, útil para armazenar arquivos temporários ou dados locais." },
        { kind: "number", key: "volumeSizeGB", label: "Tamanho do Volume (GB)", min: 1, max: 100, step: 1, unit: "GB", description: "Tamanho de cada volume em gigabytes. Volumes maiores custam mais mas permitem armazenar mais dados persistentes." },
      ],
    },
  ],
};

const batchProcessor: AppComponentDefinition = {
  type: "batch-processor",
  label: "Batch Processor",
  description: "Processamento em lote de grandes volumes de dados",
  helpText: "Processa grandes volumes de dados em lotes. Ideal para ETL, geração de relatórios, migração de dados e tarefas que operam sobre conjuntos grandes de dados.",
  category: "application",
  iconName: "Layers",
  color: "text-purple-500",
  bgColor: "bg-purple-50 dark:bg-purple-950/30",
  borderColor: "border-purple-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate"],
  allowedIncomingProtocols: ["sqs", "sns", "internal"],
  allowedOutgoingProtocols: ["https", "http", "sqs", "sns", "internal"],
  configSections: [
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/batch:latest" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default" },
      ],
    },
    {
      title: "Processamento",
      fields: [
        { kind: "number", key: "batchSize", label: "Tamanho do Lote", min: 1, max: 100000, step: 100, description: "Quantidade de itens processados por lote" },
        { kind: "number", key: "parallelism", label: "Paralelismo", min: 1, max: 64, step: 1, description: "Número de threads/processos paralelos" },
        { kind: "number", key: "retryAttempts", label: "Tentativas de Retry", min: 0, max: 10, step: 1 },
        { kind: "number", key: "timeoutMs", label: "Timeout (ms)", min: 1000, max: 3600000, step: 1000, unit: "ms" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "500m", label: "500m" }, { value: "1000m", label: "1000m" }, { value: "2000m", label: "2000m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }] },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }, { value: "4000m", label: "4000m (4 vCPU)" }, { value: "8000m", label: "8000m (8 vCPU)" }], description: "Limite máximo de CPU que o container pode usar. Se ultrapassar, o Kubernetes limita (throttle) o uso de CPU. Deve ser maior ou igual ao CPU Request." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }, { value: "8Gi", label: "8 GB" }, { value: "16Gi", label: "16 GB" }], description: "Limite máximo de memória que o container pode usar. Se ultrapassar, o container é encerrado (OOMKilled). Deve ser maior ou igual ao Memory Request." },
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

appComponentRegistry.register(microservice);
appComponentRegistry.register(worker);
appComponentRegistry.register(api);
appComponentRegistry.register(batchProcessor);
