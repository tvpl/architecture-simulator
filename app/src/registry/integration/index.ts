import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const stepFunctions: ServiceDefinition = {
  type: "step-functions",
  label: "Step Functions",
  description: "Orquestração de workflows serverless",
  category: "integration",
  iconName: "GitBranch",
  color: "text-pink-500",
  bgColor: "bg-pink-50 dark:bg-pink-950/30",
  borderColor: "border-pink-400",
  allowedIncomingProtocols: ["https", "eventbridge"],
  allowedOutgoingProtocols: ["https", "sqs", "sns", "eventbridge"],
  configSections: [
    {
      title: "Workflow",
      fields: [
        {
          kind: "select",
          key: "type",
          label: "Tipo",
          options: [
            { value: "standard", label: "Standard (durável, $0.025/1K transições)" },
            { value: "express", label: "Express (alta velocidade, $1.00/1M transições)" },
          ],
        },
        {
          kind: "number",
          key: "transitionsPerMonth",
          label: "Transições/mês",
          min: 0,
          max: 1_000_000_000,
          step: 10_000,
        },
      ],
    },
  ],
};

const cloudwatch: ServiceDefinition = {
  type: "cloudwatch",
  label: "CloudWatch",
  description: "Monitoramento, logs e alarmes",
  category: "integration",
  iconName: "BarChart3",
  color: "text-green-500",
  bgColor: "bg-green-50 dark:bg-green-950/30",
  borderColor: "border-green-400",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: ["https", "sns"],
  configSections: [
    {
      title: "Observabilidade",
      fields: [
        { kind: "number", key: "metricsCount", label: "Métricas Customizadas", min: 0, max: 10000, step: 10, description: "Primeiras 10 gratuitas" },
        { kind: "number", key: "logsIngestGB", label: "Logs Ingeridos", min: 0, max: 10000, step: 1, unit: "GB/mês" },
        { kind: "number", key: "alarmsCount", label: "Alarmes", min: 0, max: 1000, step: 1, description: "Primeiros 10 gratuitos" },
      ],
    },
  ],
};

const codepipeline: ServiceDefinition = {
  type: "codepipeline",
  label: "CodePipeline",
  description: "CI/CD pipeline de entrega contínua",
  category: "integration",
  iconName: "GitMerge",
  color: "text-indigo-500",
  bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  borderColor: "border-indigo-400",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Pipelines",
      fields: [
        { kind: "number", key: "pipelinesCount", label: "Pipelines Ativos", min: 1, max: 1000, step: 1 },
        { kind: "number", key: "actionsPerMonth", label: "Execuções/mês", min: 0, max: 1_000_000, step: 100 },
      ],
    },
  ],
};

const xray: ServiceDefinition = {
  type: "xray",
  label: "X-Ray",
  description: "Rastreamento distribuído e debugging",
  category: "integration",
  iconName: "Crosshair",
  color: "text-cyan-500",
  bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
  borderColor: "border-cyan-400",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "Traces",
      fields: [
        { kind: "number", key: "tracesPerMonth", label: "Traces/mês", min: 0, max: 1_000_000_000, step: 10_000 },
        { kind: "number", key: "retentionDays", label: "Retenção", min: 1, max: 30, step: 1, unit: "dias" },
      ],
    },
  ],
};

const sfnExpress: ServiceDefinition = {
  type: "sfn-express",
  label: "SFN Express",
  description: "Orquestração de curta duração e alta frequência com Step Functions Express",
  category: "integration",
  iconName: "Workflow",
  color: "text-fuchsia-500",
  bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
  borderColor: "border-fuchsia-400",
  allowedIncomingProtocols: ["https", "eventbridge"],
  allowedOutgoingProtocols: ["https", "sqs", "sns", "eventbridge"],
  configSections: [
    {
      title: "Express Workflow",
      fields: [
        { kind: "number", key: "executionsPerMonth", label: "Execuções/mês", min: 0, max: 1_000_000_000, step: 10_000 },
        { kind: "number", key: "avgDurationSec", label: "Duração média", min: 0, max: 300, step: 1, unit: "s" },
        { kind: "number", key: "memoryMB", label: "Memória", min: 64, max: 3008, step: 64, unit: "MB" },
      ],
    },
  ],
};

registry.register(stepFunctions);
registry.register(cloudwatch);
registry.register(codepipeline);
registry.register(xray);
registry.register(sfnExpress);
