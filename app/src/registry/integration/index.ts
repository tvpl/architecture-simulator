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

registry.register(stepFunctions);
registry.register(cloudwatch);
