import { appComponentRegistry } from "../index-internal";
import type { AppComponentDefinition } from "../types";

const consumer: AppComponentDefinition = {
  type: "consumer",
  label: "Consumer",
  description: "Consumidor de mensagens de filas ou tópicos",
  helpText: "Um consumer lê mensagens de um tópico Kafka, fila SQS ou outro broker de mensagens. Processa cada mensagem e pode confirmar (commit) o processamento. Ideal para processamento assíncrono desacoplado.",
  category: "messaging-app",
  iconName: "ArrowDownToLine",
  color: "text-rose-500",
  bgColor: "bg-rose-50 dark:bg-rose-950/30",
  borderColor: "border-rose-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate"],
  allowedIncomingProtocols: ["kafka", "sqs", "sns", "eventbridge", "kinesis"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "kafka", "internal"],
  configSections: [
    {
      title: "Consumer",
      fields: [
        { kind: "text", key: "groupId", label: "Consumer Group ID", placeholder: "meu-consumer-group", description: "Identifica o grupo de consumers. Mensagens são distribuídas entre consumers do mesmo grupo." },
        { kind: "select", key: "offsetReset", label: "Offset Reset", options: [{ value: "earliest", label: "Earliest (do início)" }, { value: "latest", label: "Latest (mais recente)" }], description: "De onde começar a ler quando não há offset salvo" },
        { kind: "number", key: "batchSize", label: "Batch Size", min: 1, max: 10000, step: 10, description: "Quantidade de mensagens lidas por vez" },
        { kind: "number", key: "maxPollRecords", label: "Max Poll Records", min: 1, max: 10000, step: 50 },
        { kind: "switch", key: "autoCommit", label: "Auto Commit", description: "Confirma automaticamente o processamento das mensagens" },
      ],
    },
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/consumer:latest" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default" },
      ],
    },
    {
      title: "Recursos & Escala",
      fields: [
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 50, step: 1, description: "Cada réplica processa partições diferentes do tópico" },
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
  ],
};

const producer: AppComponentDefinition = {
  type: "producer",
  label: "Producer",
  description: "Produtor de mensagens para filas ou tópicos",
  helpText: "Um producer envia mensagens para um tópico Kafka, fila SQS ou outro broker. É embutido em serviços que precisam publicar eventos ou comandos de forma assíncrona.",
  category: "messaging-app",
  iconName: "ArrowUpFromLine",
  color: "text-orange-500",
  bgColor: "bg-orange-50 dark:bg-orange-950/30",
  borderColor: "border-orange-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate", "lambda"],
  allowedIncomingProtocols: ["https", "http", "grpc", "internal"],
  allowedOutgoingProtocols: ["kafka", "sqs", "sns", "eventbridge", "kinesis"],
  configSections: [
    {
      title: "Producer",
      fields: [
        { kind: "select", key: "serializationFormat", label: "Formato de Serialização", options: [{ value: "json", label: "JSON" }, { value: "avro", label: "Avro" }, { value: "protobuf", label: "Protobuf" }], description: "Formato dos dados na mensagem" },
        { kind: "number", key: "batchSize", label: "Batch Size (bytes)", min: 1024, max: 1048576, step: 1024, unit: "bytes", description: "Tamanho máximo do lote antes de enviar" },
        { kind: "number", key: "lingerMs", label: "Linger (ms)", min: 0, max: 1000, step: 5, unit: "ms", description: "Tempo de espera antes de enviar um lote incompleto" },
        { kind: "select", key: "acks", label: "Acknowledgment", options: [{ value: "0", label: "Nenhum (0)" }, { value: "1", label: "Líder (1)" }, { value: "all", label: "Todos (all)" }], description: "Quantos brokers precisam confirmar a mensagem. 'all' é o mais seguro." },
      ],
    },
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/producer:latest" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "number", key: "replicas", label: "Réplicas", min: 1, max: 20, step: 1 },
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "250m", label: "250m" }, { value: "500m", label: "500m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }] },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }, { value: "4000m", label: "4000m (4 vCPU)" }], description: "Limite máximo de CPU que o container pode usar. Se ultrapassar, o Kubernetes limita (throttle) o uso de CPU. Deve ser maior ou igual ao CPU Request." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }, { value: "8Gi", label: "8 GB" }], description: "Limite máximo de memória que o container pode usar. Se ultrapassar, o container é encerrado (OOMKilled). Deve ser maior ou igual ao Memory Request." },
      ],
    },
  ],
};

appComponentRegistry.register(consumer);
appComponentRegistry.register(producer);
