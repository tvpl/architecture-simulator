import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const sqs: ServiceDefinition = {
  type: "sqs",
  label: "SQS",
  description: "Fila de mensagens gerenciada",
  category: "messaging",
  iconName: "MessageSquare",
  color: "text-amber-500",
  bgColor: "bg-amber-50 dark:bg-amber-950/30",
  borderColor: "border-amber-400",
  allowedIncomingProtocols: ["sqs", "https"],
  allowedOutgoingProtocols: ["sqs", "https"],
  configSections: [
    {
      title: "Fila",
      fields: [
        {
          kind: "select",
          key: "type",
          label: "Tipo",
          options: [
            { value: "standard", label: "Standard (at-least-once)" },
            { value: "fifo", label: "FIFO (exactly-once)" },
          ],
        },
        {
          kind: "number",
          key: "messagesPerMonth",
          label: "Mensagens/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
        {
          kind: "number",
          key: "visibilityTimeoutSec",
          label: "Visibility Timeout",
          min: 0,
          max: 43200,
          unit: "s",
        },
        {
          kind: "number",
          key: "retentionDays",
          label: "Retenção",
          min: 1,
          max: 14,
          unit: "dias",
        },
      ],
    },
  ],
};

const sns: ServiceDefinition = {
  type: "sns",
  label: "SNS",
  description: "Pub/Sub e notificações push",
  category: "messaging",
  iconName: "Bell",
  color: "text-rose-500",
  bgColor: "bg-rose-50 dark:bg-rose-950/30",
  borderColor: "border-rose-400",
  allowedIncomingProtocols: ["sns", "https"],
  allowedOutgoingProtocols: ["sns", "https", "sqs"],
  configSections: [
    {
      title: "Topic",
      fields: [
        {
          kind: "select",
          key: "type",
          label: "Tipo",
          options: [
            { value: "standard", label: "Standard" },
            { value: "fifo", label: "FIFO" },
          ],
        },
        { kind: "number", key: "subscriptions", label: "Subscriptions", min: 1, max: 100, step: 1 },
        {
          kind: "number",
          key: "messagesPerMonth",
          label: "Mensagens/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
      ],
    },
  ],
};

const eventbridge: ServiceDefinition = {
  type: "eventbridge",
  label: "EventBridge",
  description: "Barramento de eventos serverless",
  category: "messaging",
  iconName: "Workflow",
  color: "text-teal-500",
  bgColor: "bg-teal-50 dark:bg-teal-950/30",
  borderColor: "border-teal-400",
  allowedIncomingProtocols: ["eventbridge", "https"],
  allowedOutgoingProtocols: ["eventbridge", "https", "sqs", "sns"],
  configSections: [
    {
      title: "Event Bus",
      fields: [
        { kind: "number", key: "rulesCount", label: "Regras", min: 1, max: 300, step: 1 },
        {
          kind: "number",
          key: "eventsPerMonth",
          label: "Eventos/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
      ],
    },
  ],
};

const msk: ServiceDefinition = {
  type: "msk",
  label: "MSK (Kafka)",
  description: "Apache Kafka gerenciado na AWS",
  category: "messaging",
  iconName: "Activity",
  color: "text-red-500",
  bgColor: "bg-red-50 dark:bg-red-950/30",
  borderColor: "border-red-400",
  allowedIncomingProtocols: ["kafka"],
  allowedOutgoingProtocols: ["kafka"],
  configSections: [
    {
      title: "Cluster",
      fields: [
        { kind: "number", key: "brokerCount", label: "Brokers", min: 2, max: 30, step: 1 },
        {
          kind: "select",
          key: "instanceType",
          label: "Tipo de Broker",
          options: [
            { value: "kafka.t3.small", label: "kafka.t3.small" },
            { value: "kafka.m5.large", label: "kafka.m5.large" },
            { value: "kafka.m5.xlarge", label: "kafka.m5.xlarge" },
            { value: "kafka.m5.2xlarge", label: "kafka.m5.2xlarge" },
          ],
        },
        {
          kind: "number",
          key: "storagePerBrokerGB",
          label: "Storage por Broker",
          min: 1,
          max: 16384,
          unit: "GB",
        },
        { kind: "number", key: "partitions", label: "Partições (total)", min: 1, max: 10000, step: 1 },
        {
          kind: "select",
          key: "replicationFactor",
          label: "Replication Factor",
          options: [
            { value: "1", label: "1 (sem redundância)" },
            { value: "2", label: "2" },
            { value: "3", label: "3 (recomendado)" },
          ],
        },
      ],
    },
  ],
};

const kinesis: ServiceDefinition = {
  type: "kinesis",
  label: "Kinesis",
  description: "Streaming de dados em tempo real",
  category: "messaging",
  iconName: "Waves",
  color: "text-blue-500",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
  borderColor: "border-blue-400",
  allowedIncomingProtocols: ["kinesis", "https"],
  allowedOutgoingProtocols: ["kinesis", "https"],
  configSections: [
    {
      title: "Stream",
      fields: [
        {
          kind: "number",
          key: "shardCount",
          label: "Shards",
          min: 1,
          max: 500,
          step: 1,
          description: "1 shard = 1 MB/s ou 1000 reg/s",
        },
        {
          kind: "select",
          key: "retentionHours",
          label: "Retenção",
          options: [
            { value: "24", label: "24 horas (padrão)" },
            { value: "168", label: "7 dias" },
            { value: "8760", label: "365 dias" },
          ],
        },
        { kind: "number", key: "dataInGB", label: "Dados Ingeridos", min: 0, max: 100000, step: 1, unit: "GB/mês" },
      ],
    },
  ],
};

const ses: ServiceDefinition = {
  type: "ses",
  label: "SES",
  description: "Serviço de envio de e-mails transacionais",
  category: "messaging",
  iconName: "Mail",
  color: "text-yellow-600",
  bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  borderColor: "border-yellow-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Envio",
      fields: [
        { kind: "number", key: "emailsPerMonth", label: "E-mails/mês", min: 0, max: 1_000_000_000, step: 10_000 },
        { kind: "number", key: "dedicatedIPs", label: "IPs Dedicados", min: 0, max: 100, step: 1 },
      ],
    },
  ],
};

registry.register(sqs);
registry.register(sns);
registry.register(eventbridge);
registry.register(msk);
registry.register(kinesis);
registry.register(ses);
