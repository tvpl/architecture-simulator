import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const s3: ServiceDefinition = {
  type: "s3",
  label: "S3",
  description: "Object storage durável e escalável",
  category: "storage",
  iconName: "HardDrive",
  color: "text-green-600",
  bgColor: "bg-green-50 dark:bg-green-950/30",
  borderColor: "border-green-500",
  allowedIncomingProtocols: ["https", "http"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Bucket",
      fields: [
        {
          kind: "select",
          key: "storageClass",
          label: "Storage Class",
          options: [
            { value: "STANDARD", label: "Standard ($0.023/GB)" },
            { value: "IA", label: "Standard-IA ($0.0125/GB)" },
            { value: "GLACIER", label: "Glacier Instant ($0.004/GB)" },
            { value: "DEEP_ARCHIVE", label: "Glacier Deep Archive ($0.00099/GB)" },
          ],
        },
        { kind: "number", key: "storageSizeGB", label: "Armazenamento", min: 1, max: 10_000_000, step: 10, unit: "GB" },
        {
          kind: "number",
          key: "requestsPerMonth",
          label: "Requisições/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
      ],
    },
  ],
};

const rds: ServiceDefinition = {
  type: "rds",
  label: "RDS",
  description: "Banco de dados relacional gerenciado",
  category: "storage",
  iconName: "Database",
  color: "text-blue-700",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
  borderColor: "border-blue-600",
  allowedIncomingProtocols: ["internal", "https"],
  allowedOutgoingProtocols: ["internal"],
  configSections: [
    {
      title: "Banco de Dados",
      fields: [
        {
          kind: "select",
          key: "engine",
          label: "Engine",
          options: [
            { value: "postgres", label: "PostgreSQL" },
            { value: "mysql", label: "MySQL" },
            { value: "aurora-postgres", label: "Aurora PostgreSQL" },
            { value: "aurora-mysql", label: "Aurora MySQL" },
          ],
        },
        {
          kind: "select",
          key: "instanceClass",
          label: "Classe de Instância",
          options: [
            { value: "db.t3.micro", label: "db.t3.micro" },
            { value: "db.t3.small", label: "db.t3.small" },
            { value: "db.t3.medium", label: "db.t3.medium" },
            { value: "db.t3.large", label: "db.t3.large" },
            { value: "db.m5.large", label: "db.m5.large" },
            { value: "db.m5.xlarge", label: "db.m5.xlarge" },
            { value: "db.r5.large", label: "db.r5.large" },
            { value: "db.r5.xlarge", label: "db.r5.xlarge" },
          ],
        },
        { kind: "switch", key: "multiAZ", label: "Multi-AZ", description: "Failover automático entre AZs" },
        { kind: "number", key: "storageGB", label: "Storage", min: 20, max: 65536, unit: "GB" },
        {
          kind: "number",
          key: "readReplicas",
          label: "Read Replicas",
          min: 0,
          max: 5,
          step: 1,
          description: "Distribui leitura e melhora performance",
        },
      ],
    },
  ],
};

const dynamodb: ServiceDefinition = {
  type: "dynamodb",
  label: "DynamoDB",
  description: "NoSQL de alta performance e escala infinita",
  category: "storage",
  iconName: "Database",
  color: "text-indigo-600",
  bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  borderColor: "border-indigo-500",
  allowedIncomingProtocols: ["https", "internal"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Capacidade",
      fields: [
        {
          kind: "select",
          key: "capacityMode",
          label: "Modo",
          options: [
            { value: "provisioned", label: "Provisioned (previsível)" },
            { value: "on-demand", label: "On-Demand (escala automática)" },
          ],
        },
        {
          kind: "number",
          key: "readCapacityUnits",
          label: "RCU (Read Capacity)",
          min: 1,
          max: 100000,
          step: 10,
          description: "Ignorado em On-Demand",
        },
        {
          kind: "number",
          key: "writeCapacityUnits",
          label: "WCU (Write Capacity)",
          min: 1,
          max: 100000,
          step: 10,
          description: "Ignorado em On-Demand",
        },
        { kind: "number", key: "storageGB", label: "Storage estimado", min: 1, max: 1000000, unit: "GB" },
      ],
    },
  ],
};

const elasticache: ServiceDefinition = {
  type: "elasticache",
  label: "ElastiCache",
  description: "Cache em memória (Redis ou Memcached)",
  category: "storage",
  iconName: "Zap",
  color: "text-red-600",
  bgColor: "bg-red-50 dark:bg-red-950/30",
  borderColor: "border-red-500",
  allowedIncomingProtocols: ["internal"],
  allowedOutgoingProtocols: ["internal"],
  configSections: [
    {
      title: "Cache",
      fields: [
        {
          kind: "select",
          key: "engine",
          label: "Engine",
          options: [
            { value: "redis", label: "Redis" },
            { value: "memcached", label: "Memcached" },
          ],
        },
        {
          kind: "select",
          key: "nodeType",
          label: "Tipo de Nó",
          options: [
            { value: "cache.t3.micro", label: "cache.t3.micro" },
            { value: "cache.t3.small", label: "cache.t3.small" },
            { value: "cache.t3.medium", label: "cache.t3.medium" },
            { value: "cache.m5.large", label: "cache.m5.large" },
            { value: "cache.m5.xlarge", label: "cache.m5.xlarge" },
            { value: "cache.r6g.large", label: "cache.r6g.large" },
          ],
        },
        { kind: "number", key: "nodeCount", label: "Nós", min: 1, max: 20, step: 1 },
        {
          kind: "switch",
          key: "replicationEnabled",
          label: "Replicação",
          description: "Habilita Multi-AZ e failover automático",
        },
      ],
    },
  ],
};

const efs: ServiceDefinition = {
  type: "efs",
  label: "EFS",
  description: "Sistema de arquivos NFS gerenciado",
  category: "storage",
  iconName: "FolderOpen",
  color: "text-yellow-600",
  bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  borderColor: "border-yellow-500",
  allowedIncomingProtocols: ["internal"],
  allowedOutgoingProtocols: ["internal"],
  configSections: [
    {
      title: "File System",
      fields: [
        {
          kind: "select",
          key: "storageClass",
          label: "Storage Class",
          options: [
            { value: "standard", label: "Standard ($0.30/GB)" },
            { value: "infrequent-access", label: "Infrequent Access ($0.025/GB)" },
          ],
        },
        {
          kind: "select",
          key: "throughputMode",
          label: "Throughput Mode",
          options: [
            { value: "bursting", label: "Bursting (escala com tamanho)" },
            { value: "provisioned", label: "Provisioned (fixo)" },
          ],
        },
        { kind: "number", key: "storageSizeGB", label: "Tamanho", min: 1, max: 10_000_000, step: 10, unit: "GB" },
      ],
    },
  ],
};

registry.register(s3);
registry.register(rds);
registry.register(dynamodb);
registry.register(elasticache);
registry.register(efs);
