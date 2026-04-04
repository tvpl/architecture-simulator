import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const vpc: ServiceDefinition = {
  type: "vpc",
  label: "VPC",
  description: "Virtual Private Cloud — rede isolada",
  category: "networking",
  iconName: "Network",
  color: "text-violet-600",
  bgColor: "bg-violet-50 dark:bg-violet-950/30",
  borderColor: "border-violet-400 border-dashed",
  isContainer: true,
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "VPC",
      fields: [
        { kind: "text", key: "cidrBlock", label: "CIDR Block", placeholder: "10.0.0.0/16" },
        {
          kind: "select",
          key: "region",
          label: "Região",
          options: [
            { value: "us-east-1", label: "US East (N. Virginia)" },
            { value: "us-east-2", label: "US East (Ohio)" },
            { value: "us-west-2", label: "US West (Oregon)" },
            { value: "sa-east-1", label: "South America (São Paulo)" },
            { value: "eu-west-1", label: "Europe (Ireland)" },
            { value: "eu-central-1", label: "Europe (Frankfurt)" },
            { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
          ],
        },
        { kind: "switch", key: "enableDnsHostnames", label: "Enable DNS Hostnames" },
      ],
    },
  ],
};

const subnet: ServiceDefinition = {
  type: "subnet",
  label: "Subnet",
  description: "Sub-rede pública ou privada",
  category: "networking",
  iconName: "Layers2",
  color: "text-violet-500",
  bgColor: "bg-violet-50/50 dark:bg-violet-950/20",
  borderColor: "border-violet-300 border-dashed",
  isContainer: true,
  requiredParent: "vpc",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "Subnet",
      fields: [
        { kind: "text", key: "cidrBlock", label: "CIDR Block", placeholder: "10.0.1.0/24" },
        { kind: "text", key: "availabilityZone", label: "Availability Zone", placeholder: "us-east-1a" },
        { kind: "switch", key: "isPublic", label: "Subnet Pública", description: "Tem Internet Gateway associado" },
      ],
    },
  ],
};

const alb: ServiceDefinition = {
  type: "alb",
  label: "ALB",
  description: "Application Load Balancer (L7)",
  category: "networking",
  iconName: "ArrowLeftRight",
  color: "text-emerald-600",
  bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  borderColor: "border-emerald-500",
  allowedIncomingProtocols: ["https", "http", "websocket"],
  allowedOutgoingProtocols: ["https", "http", "grpc"],
  configSections: [
    {
      title: "Load Balancer",
      fields: [
        { kind: "switch", key: "crossZone", label: "Cross-Zone Load Balancing" },
        { kind: "number", key: "idleTimeoutSec", label: "Idle Timeout", min: 1, max: 4000, unit: "s" },
      ],
    },
  ],
};

const nlb: ServiceDefinition = {
  type: "nlb",
  label: "NLB",
  description: "Network Load Balancer (L4) — ultra baixa latência",
  category: "networking",
  iconName: "ArrowLeftRight",
  color: "text-green-600",
  bgColor: "bg-green-50 dark:bg-green-950/30",
  borderColor: "border-green-500",
  allowedIncomingProtocols: ["https", "http", "grpc", "websocket"],
  allowedOutgoingProtocols: ["https", "http", "grpc"],
  configSections: [
    {
      title: "Load Balancer",
      fields: [
        { kind: "switch", key: "crossZone", label: "Cross-Zone Load Balancing" },
      ],
    },
  ],
};

const apiGateway: ServiceDefinition = {
  type: "api-gateway",
  label: "API Gateway",
  description: "Gateway REST, HTTP ou WebSocket",
  category: "networking",
  iconName: "Globe",
  color: "text-pink-600",
  bgColor: "bg-pink-50 dark:bg-pink-950/30",
  borderColor: "border-pink-500",
  allowedIncomingProtocols: ["https", "http", "websocket"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "internal"],
  configSections: [
    {
      title: "Gateway",
      fields: [
        {
          kind: "select",
          key: "type",
          label: "Tipo",
          options: [
            { value: "rest", label: "REST API ($3.50/M req)" },
            { value: "http", label: "HTTP API ($1.00/M req)" },
            { value: "websocket", label: "WebSocket API" },
          ],
        },
        {
          kind: "number",
          key: "requestsPerMonth",
          label: "Requisições/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
        {
          kind: "number",
          key: "throttleRPS",
          label: "Throttle (RPS)",
          min: 100,
          max: 100_000,
          step: 100,
          unit: "req/s",
        },
        {
          kind: "number",
          key: "cacheSizeGB",
          label: "Cache",
          min: 0,
          max: 237,
          step: 0.5,
          unit: "GB",
          description: "0 = sem cache",
        },
      ],
    },
  ],
};

const cloudfront: ServiceDefinition = {
  type: "cloudfront",
  label: "CloudFront",
  description: "CDN global da AWS",
  category: "networking",
  iconName: "Globe2",
  color: "text-indigo-600",
  bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  borderColor: "border-indigo-500",
  allowedIncomingProtocols: ["https", "http"],
  allowedOutgoingProtocols: ["https", "http"],
  configSections: [
    {
      title: "Distribution",
      fields: [
        {
          kind: "select",
          key: "priceClass",
          label: "Price Class",
          options: [
            { value: "PriceClass_100", label: "100 (US/Europe)" },
            { value: "PriceClass_200", label: "200 (+ Asia/Africa)" },
            { value: "PriceClass_All", label: "All Regions" },
          ],
        },
        {
          kind: "number",
          key: "requestsPerMonth",
          label: "Requisições/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
        {
          kind: "number",
          key: "dataTransferGB",
          label: "Transferência",
          min: 0,
          max: 1_000_000,
          step: 100,
          unit: "GB/mês",
        },
      ],
    },
  ],
};

const route53: ServiceDefinition = {
  type: "route53",
  label: "Route 53",
  description: "DNS gerenciado com health checks",
  category: "networking",
  iconName: "MapPin",
  color: "text-rose-500",
  bgColor: "bg-rose-50 dark:bg-rose-950/30",
  borderColor: "border-rose-400",
  allowedIncomingProtocols: ["https", "http"],
  allowedOutgoingProtocols: ["https", "http"],
  configSections: [
    {
      title: "DNS",
      fields: [
        { kind: "number", key: "hostedZones", label: "Hosted Zones", min: 1, max: 100, step: 1 },
        {
          kind: "number",
          key: "queriesPerMonth",
          label: "Queries/mês",
          min: 0,
          max: 1_000_000_000,
          step: 100_000,
        },
      ],
    },
  ],
};

const securityGroup: ServiceDefinition = {
  type: "security-group",
  label: "Security Group",
  description: "Firewall stateful de nível de instância",
  category: "networking",
  iconName: "Shield",
  color: "text-slate-500",
  bgColor: "bg-slate-50 dark:bg-slate-950/30",
  borderColor: "border-slate-400 border-dashed",
  isContainer: true,
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "Regras",
      fields: [
        { kind: "number", key: "inboundRules", label: "Regras Inbound", min: 0, max: 60, step: 1 },
        { kind: "number", key: "outboundRules", label: "Regras Outbound", min: 0, max: 60, step: 1 },
      ],
    },
  ],
};

registry.register(vpc);
registry.register(subnet);
registry.register(alb);
registry.register(nlb);
registry.register(apiGateway);
registry.register(cloudfront);
registry.register(route53);
registry.register(securityGroup);
