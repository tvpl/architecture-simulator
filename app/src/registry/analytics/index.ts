import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const redshift: ServiceDefinition = {
  type: "redshift",
  label: "Redshift",
  description: "Data warehouse colunar em nuvem",
  category: "analytics",
  iconName: "Database",
  color: "text-purple-600",
  bgColor: "bg-purple-50 dark:bg-purple-950/30",
  borderColor: "border-purple-500",
  allowedIncomingProtocols: ["https", "internal"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Cluster",
      fields: [
        {
          kind: "select",
          key: "nodeType",
          label: "Tipo de Nó",
          options: [
            { value: "dc2.large", label: "dc2.large (2 vCPU, 15 GB)" },
            { value: "dc2.8xlarge", label: "dc2.8xlarge (32 vCPU, 244 GB)" },
            { value: "ra3.xlplus", label: "ra3.xlplus (4 vCPU, 32 GB)" },
            { value: "ra3.4xlarge", label: "ra3.4xlarge (12 vCPU, 96 GB)" },
          ],
        },
        { kind: "number", key: "nodeCount", label: "Nós", min: 1, max: 128, step: 1 },
        { kind: "number", key: "storageGB", label: "Storage", min: 160, max: 64000, step: 160, unit: "GB" },
        { kind: "switch", key: "multiAZ", label: "Multi-AZ" },
      ],
    },
  ],
};

const athena: ServiceDefinition = {
  type: "athena",
  label: "Athena",
  description: "Consultas SQL interativas sobre S3",
  category: "analytics",
  iconName: "Search",
  color: "text-teal-600",
  bgColor: "bg-teal-50 dark:bg-teal-950/30",
  borderColor: "border-teal-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Consultas",
      fields: [
        { kind: "number", key: "queriesPerMonth", label: "Consultas/mês", min: 0, max: 1_000_000, step: 100 },
        { kind: "number", key: "dataScanTB", label: "Dados Escaneados", min: 0, max: 1000, step: 0.1, unit: "TB/mês" },
      ],
    },
  ],
};

const opensearch: ServiceDefinition = {
  type: "opensearch",
  label: "OpenSearch",
  description: "Busca e análise distribuída de logs",
  category: "analytics",
  iconName: "Layers",
  color: "text-blue-600",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
  borderColor: "border-blue-500",
  allowedIncomingProtocols: ["https", "http"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Domínio",
      fields: [
        {
          kind: "select",
          key: "instanceType",
          label: "Instância",
          options: [
            { value: "t3.small.search", label: "t3.small (2 vCPU, 2 GB)" },
            { value: "t3.medium.search", label: "t3.medium (2 vCPU, 4 GB)" },
            { value: "m6g.large.search", label: "m6g.large (2 vCPU, 8 GB)" },
            { value: "r6g.xlarge.search", label: "r6g.xlarge (4 vCPU, 32 GB)" },
          ],
        },
        { kind: "number", key: "instanceCount", label: "Instâncias", min: 1, max: 80, step: 1 },
        { kind: "number", key: "storageGB", label: "Storage EBS", min: 10, max: 1000, step: 10, unit: "GB" },
        { kind: "switch", key: "dedicatedMaster", label: "Nó Master Dedicado" },
      ],
    },
  ],
};

const glue: ServiceDefinition = {
  type: "glue",
  label: "Glue",
  description: "ETL serverless para transformação de dados",
  category: "analytics",
  iconName: "Workflow",
  color: "text-amber-600",
  bgColor: "bg-amber-50 dark:bg-amber-950/30",
  borderColor: "border-amber-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Jobs ETL",
      fields: [
        { kind: "number", key: "jobsCount", label: "Jobs", min: 1, max: 1000, step: 1 },
        { kind: "number", key: "dpuHoursPerMonth", label: "DPU-horas/mês", min: 0, max: 100_000, step: 10 },
        { kind: "number", key: "crawlersCount", label: "Crawlers", min: 0, max: 100, step: 1 },
      ],
    },
  ],
};

const sagemaker: ServiceDefinition = {
  type: "sagemaker",
  label: "SageMaker",
  description: "Treinamento e deploy de modelos ML",
  category: "analytics",
  iconName: "BrainCircuit",
  color: "text-green-600",
  bgColor: "bg-green-50 dark:bg-green-950/30",
  borderColor: "border-green-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Instâncias ML",
      fields: [
        {
          kind: "select",
          key: "instanceType",
          label: "Instância",
          options: [
            { value: "ml.t3.medium", label: "ml.t3.medium (2 vCPU, 4 GB)" },
            { value: "ml.m5.large", label: "ml.m5.large (2 vCPU, 8 GB)" },
            { value: "ml.c5.xlarge", label: "ml.c5.xlarge (4 vCPU, 8 GB)" },
            { value: "ml.g4dn.xlarge", label: "ml.g4dn.xlarge (4 vCPU, 16 GB, GPU)" },
            { value: "ml.p3.2xlarge", label: "ml.p3.2xlarge (8 vCPU, 61 GB, V100 GPU)" },
          ],
        },
        { kind: "number", key: "instanceCount", label: "Instâncias", min: 1, max: 50, step: 1 },
        { kind: "number", key: "storageGB", label: "Storage", min: 10, max: 2000, step: 10, unit: "GB" },
        { kind: "switch", key: "endpointEnabled", label: "Endpoint de Inferência" },
      ],
    },
  ],
};

registry.register(redshift);
registry.register(athena);
registry.register(opensearch);
registry.register(glue);
registry.register(sagemaker);
