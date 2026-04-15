import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const lambda: ServiceDefinition = {
  type: "lambda",
  label: "Lambda",
  description: "Função serverless gerenciada",
  category: "compute",
  iconName: "Zap",
  color: "text-orange-500",
  bgColor: "bg-orange-50 dark:bg-orange-950/30",
  borderColor: "border-orange-400",
  allowedIncomingProtocols: ["https", "http", "sqs", "sns", "eventbridge", "kinesis"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "eventbridge"],
  configSections: [
    {
      title: "Runtime",
      fields: [
        {
          kind: "number",
          key: "memoryMB",
          label: "Memória",
          min: 128,
          max: 10240,
          step: 64,
          unit: "MB",
        },
        {
          kind: "number",
          key: "timeoutSec",
          label: "Timeout",
          min: 1,
          max: 900,
          step: 1,
          unit: "s",
        },
        {
          kind: "number",
          key: "concurrency",
          label: "Provisioned Concurrency",
          min: 0,
          max: 3000,
          step: 10,
          description: "0 = sem provisioned (cold start possível)",
        },
      ],
    },
    {
      title: "Volume",
      fields: [
        {
          kind: "number",
          key: "requestsPerMonth",
          label: "Invocações/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
        {
          kind: "number",
          key: "avgDurationMs",
          label: "Duração média",
          min: 1,
          max: 900_000,
          step: 10,
          unit: "ms",
        },
      ],
    },
  ],
};

const ec2: ServiceDefinition = {
  type: "ec2",
  label: "EC2",
  description: "Instância de computação virtual",
  category: "compute",
  iconName: "Server",
  color: "text-amber-600",
  bgColor: "bg-amber-50 dark:bg-amber-950/30",
  borderColor: "border-amber-500",
  allowedIncomingProtocols: ["https", "http", "grpc", "internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "internal"],
  configSections: [
    {
      title: "Instância",
      fields: [
        {
          kind: "select",
          key: "instanceType",
          label: "Tipo de Instância",
          options: [
            { value: "t3.micro", label: "t3.micro (2 vCPU, 1GB)" },
            { value: "t3.small", label: "t3.small (2 vCPU, 2GB)" },
            { value: "t3.medium", label: "t3.medium (2 vCPU, 4GB)" },
            { value: "t3.large", label: "t3.large (2 vCPU, 8GB)" },
            { value: "t3.xlarge", label: "t3.xlarge (4 vCPU, 16GB)" },
            { value: "m5.large", label: "m5.large (2 vCPU, 8GB)" },
            { value: "m5.xlarge", label: "m5.xlarge (4 vCPU, 16GB)" },
            { value: "m5.2xlarge", label: "m5.2xlarge (8 vCPU, 32GB)" },
            { value: "c5.large", label: "c5.large (2 vCPU, 4GB)" },
            { value: "c5.xlarge", label: "c5.xlarge (4 vCPU, 8GB)" },
            { value: "c5.2xlarge", label: "c5.2xlarge (8 vCPU, 16GB)" },
            { value: "r5.large", label: "r5.large (2 vCPU, 16GB)" },
            { value: "r5.xlarge", label: "r5.xlarge (4 vCPU, 32GB)" },
          ],
        },
        {
          kind: "number",
          key: "count",
          label: "Quantidade",
          min: 1,
          max: 100,
          step: 1,
        },
        {
          kind: "switch",
          key: "spotEnabled",
          label: "Spot Instances",
          description: "Reduz custo ~70%, mas pode ser interrompido",
        },
        {
          kind: "number",
          key: "ebsVolumeGB",
          label: "Volume EBS",
          min: 8,
          max: 16384,
          step: 10,
          unit: "GB",
        },
      ],
    },
  ],
};

const ecs: ServiceDefinition = {
  type: "ecs",
  label: "ECS",
  description: "Container orquestrado (Fargate ou EC2)",
  category: "compute",
  iconName: "Box",
  color: "text-teal-600",
  bgColor: "bg-teal-50 dark:bg-teal-950/30",
  borderColor: "border-teal-500",
  allowedIncomingProtocols: ["https", "http", "grpc", "internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "internal"],
  configSections: [
    {
      title: "Tasks",
      fields: [
        {
          kind: "select",
          key: "launchType",
          label: "Launch Type",
          options: [
            { value: "fargate", label: "Fargate (serverless)" },
            { value: "ec2", label: "EC2 (instâncias gerenciadas)" },
          ],
        },
        {
          kind: "number",
          key: "taskCount",
          label: "Tasks",
          min: 1,
          max: 500,
          step: 1,
        },
        {
          kind: "select",
          key: "cpu",
          label: "CPU",
          options: [
            { value: "256", label: "0.25 vCPU" },
            { value: "512", label: "0.5 vCPU" },
            { value: "1024", label: "1 vCPU" },
            { value: "2048", label: "2 vCPU" },
            { value: "4096", label: "4 vCPU" },
          ],
        },
        {
          kind: "select",
          key: "memoryMB",
          label: "Memória",
          options: [
            { value: "512", label: "512 MB" },
            { value: "1024", label: "1 GB" },
            { value: "2048", label: "2 GB" },
            { value: "4096", label: "4 GB" },
            { value: "8192", label: "8 GB" },
          ],
        },
      ],
    },
  ],
};

const eks: ServiceDefinition = {
  type: "eks",
  label: "EKS",
  description: "Kubernetes gerenciado na AWS",
  category: "compute",
  iconName: "Layers",
  color: "text-blue-600",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
  borderColor: "border-blue-500",
  allowedIncomingProtocols: ["https", "http", "grpc", "internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "internal"],
  configSections: [
    {
      title: "Cluster",
      fields: [
        {
          kind: "number",
          key: "nodeCount",
          label: "Nós (worker nodes)",
          min: 1,
          max: 100,
          step: 1,
        },
        {
          kind: "select",
          key: "instanceType",
          label: "Tipo de Nó",
          options: [
            { value: "t3.medium", label: "t3.medium" },
            { value: "t3.large", label: "t3.large" },
            { value: "m5.large", label: "m5.large" },
            { value: "m5.xlarge", label: "m5.xlarge" },
            { value: "c5.large", label: "c5.large" },
            { value: "c5.xlarge", label: "c5.xlarge" },
          ],
        },
        {
          kind: "number",
          key: "minNodes",
          label: "Mín. Nós (Auto Scaling)",
          min: 1,
          max: 10,
          step: 1,
        },
        {
          kind: "number",
          key: "maxNodes",
          label: "Máx. Nós (Auto Scaling)",
          min: 1,
          max: 500,
          step: 1,
        },
      ],
    },
  ],
};

const fargate: ServiceDefinition = {
  type: "fargate",
  label: "Fargate",
  description: "Compute serverless para containers",
  category: "compute",
  iconName: "Container",
  color: "text-cyan-600",
  bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
  borderColor: "border-cyan-500",
  allowedIncomingProtocols: ["https", "http", "grpc", "internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "internal"],
  configSections: [
    {
      title: "Task",
      fields: [
        {
          kind: "number",
          key: "taskCount",
          label: "Tasks",
          min: 1,
          max: 100,
          step: 1,
        },
        {
          kind: "select",
          key: "cpu",
          label: "CPU",
          options: [
            { value: "256", label: "0.25 vCPU" },
            { value: "512", label: "0.5 vCPU" },
            { value: "1024", label: "1 vCPU" },
            { value: "2048", label: "2 vCPU" },
          ],
        },
        {
          kind: "number",
          key: "memoryGB",
          label: "Memória",
          min: 0.5,
          max: 30,
          step: 0.5,
          unit: "GB",
        },
      ],
    },
  ],
};

const ecr: ServiceDefinition = {
  type: "ecr",
  label: "ECR",
  description: "Registro de imagens Docker gerenciado",
  category: "compute",
  iconName: "Container",
  color: "text-orange-600",
  bgColor: "bg-orange-50 dark:bg-orange-950/30",
  borderColor: "border-orange-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Repositórios",
      fields: [
        { kind: "number", key: "repositoryCount", label: "Repositórios", min: 1, max: 1000, step: 1 },
        { kind: "number", key: "imagesCount", label: "Imagens", min: 1, max: 10000, step: 10 },
        { kind: "number", key: "storageGB", label: "Armazenamento", min: 1, max: 10000, step: 10, unit: "GB" },
      ],
    },
  ],
};

registry.register(lambda);
registry.register(ec2);
registry.register(ecs);
registry.register(eks);
registry.register(fargate);
registry.register(ecr);
