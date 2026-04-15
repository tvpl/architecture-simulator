import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const iam: ServiceDefinition = {
  type: "iam",
  label: "IAM",
  description: "Controle de acesso e identidade",
  category: "security",
  iconName: "KeyRound",
  color: "text-red-700",
  bgColor: "bg-red-50 dark:bg-red-950/30",
  borderColor: "border-red-600",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "Role",
      fields: [
        { kind: "text", key: "roleName", label: "Nome da Role", placeholder: "MyLambdaRole" },
      ],
    },
  ],
};

const waf: ServiceDefinition = {
  type: "waf",
  label: "WAF",
  description: "Firewall de aplicação web (OWASP, DDoS L7)",
  category: "security",
  iconName: "ShieldCheck",
  color: "text-orange-600",
  bgColor: "bg-orange-50 dark:bg-orange-950/30",
  borderColor: "border-orange-500",
  allowedIncomingProtocols: ["https", "http"],
  allowedOutgoingProtocols: ["https", "http"],
  configSections: [
    {
      title: "Web ACL",
      fields: [
        { kind: "number", key: "rulesCount", label: "Regras", min: 1, max: 100, step: 1, description: "$1.00/regra/mês" },
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

const secretsManager: ServiceDefinition = {
  type: "secrets-manager",
  label: "Secrets Manager",
  description: "Gerenciamento e rotação de secrets",
  category: "security",
  iconName: "Lock",
  color: "text-slate-600",
  bgColor: "bg-slate-50 dark:bg-slate-950/30",
  borderColor: "border-slate-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Secrets",
      fields: [
        { kind: "number", key: "secretsCount", label: "Secrets", min: 1, max: 1000, step: 1, description: "$0.40/secret/mês" },
        { kind: "switch", key: "rotationEnabled", label: "Rotação Automática" },
      ],
    },
  ],
};

const cognito: ServiceDefinition = {
  type: "cognito",
  label: "Cognito",
  description: "Autenticação e autorização de usuários",
  category: "security",
  iconName: "Users",
  color: "text-purple-600",
  bgColor: "bg-purple-50 dark:bg-purple-950/30",
  borderColor: "border-purple-500",
  allowedIncomingProtocols: ["https"],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "User Pool",
      fields: [
        {
          kind: "number",
          key: "userPoolSize",
          label: "MAUs (Monthly Active Users)",
          min: 0,
          max: 100_000_000,
          step: 1000,
          description: "Primeiros 50K MAUs gratuitos",
        },
        { kind: "switch", key: "mfaEnabled", label: "MFA (Multi-Factor Auth)" },
      ],
    },
  ],
};

const cloudtrail: ServiceDefinition = {
  type: "cloudtrail",
  label: "CloudTrail",
  description: "Auditoria e rastreamento de API calls",
  category: "security",
  iconName: "Activity",
  color: "text-blue-600",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
  borderColor: "border-blue-500",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: ["https"],
  configSections: [
    {
      title: "Trilhas",
      fields: [
        { kind: "number", key: "trailsCount", label: "Trilhas", min: 1, max: 10, step: 1 },
        { kind: "number", key: "eventsPerMonth", label: "Eventos/mês", min: 0, max: 1_000_000_000, step: 100_000 },
        { kind: "switch", key: "s3BucketEnabled", label: "Salvar no S3" },
      ],
    },
  ],
};

registry.register(iam);
registry.register(waf);
registry.register(secretsManager);
registry.register(cognito);
registry.register(cloudtrail);
