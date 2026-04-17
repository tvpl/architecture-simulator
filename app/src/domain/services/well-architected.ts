import type { ArchitectureNode } from "../entities/node";
import type { ConnectionEdge } from "../entities/edge";

export type WAPillar =
  | "operational-excellence"
  | "security"
  | "reliability"
  | "performance"
  | "cost"
  | "sustainability";

export interface WAFinding {
  pillar: WAPillar;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  recommendation: string;
  affectedNodeIds?: string[];
}

export interface WAPillarScore {
  pillar: WAPillar;
  displayName: string;
  score: number; // 0-100
  maxScore: number; // always 100
  findings: WAFinding[];
  color: string;
  icon: string; // lucide icon name
}

export interface WAReport {
  overallScore: number; // 0-100, weighted average
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  pillars: WAPillarScore[];
  generatedAt: number;
}

// ─── Pillar metadata ──────────────────────────────────────────────────────────

const PILLAR_META: Record<
  WAPillar,
  { displayName: string; color: string; icon: string }
> = {
  "operational-excellence": {
    displayName: "Excelência Operacional",
    color: "blue",
    icon: "Settings2",
  },
  security: {
    displayName: "Segurança",
    color: "red",
    icon: "Shield",
  },
  reliability: {
    displayName: "Confiabilidade",
    color: "violet",
    icon: "Activity",
  },
  performance: {
    displayName: "Eficiência de Performance",
    color: "orange",
    icon: "Zap",
  },
  cost: {
    displayName: "Otimização de Custos",
    color: "emerald",
    icon: "DollarSign",
  },
  sustainability: {
    displayName: "Sustentabilidade",
    color: "green",
    icon: "Leaf",
  },
};

// ─── Type-safe config accessors ───────────────────────────────────────────────

function hasType(nodes: ArchitectureNode[], type: string): boolean {
  return nodes.some((n) => n.type === type);
}

function getNodes(nodes: ArchitectureNode[], type: string): ArchitectureNode[] {
  return nodes.filter((n) => n.type === type);
}

// ─── Pillar analyzers ─────────────────────────────────────────────────────────

function analyzeOperationalExcellence(nodes: ArchitectureNode[]): {
  score: number;
  findings: WAFinding[];
} {
  let score = 0;
  const findings: WAFinding[] = [];

  const hasCloudWatch = hasType(nodes, "cloudwatch");
  const hasXRay = hasType(nodes, "xray");
  const hasCloudTrail = hasType(nodes, "cloudtrail");
  const hasCodePipeline = hasType(nodes, "codepipeline");
  const hasNotes = nodes.some((n) => n.type === "note");

  if (hasCloudWatch) score += 20;
  if (hasXRay) score += 20;
  if (hasCloudTrail) score += 20;
  if (hasCodePipeline) score += 20;
  if (hasNotes) score += 20;

  if (!hasCloudWatch) {
    findings.push({
      pillar: "operational-excellence",
      severity: "critical",
      title: "Sem monitoramento",
      description:
        "A arquitetura não possui nenhum serviço de monitoramento configurado.",
      recommendation: "Adicione CloudWatch para monitorar métricas e logs",
    });
  }

  if (!hasCloudTrail) {
    findings.push({
      pillar: "operational-excellence",
      severity: "high",
      title: "Sem auditoria",
      description:
        "Não há registro de auditoria das operações realizadas na conta AWS.",
      recommendation:
        "CloudTrail é essencial para rastrear operações na conta AWS",
    });
  }

  if (!hasCodePipeline) {
    findings.push({
      pillar: "operational-excellence",
      severity: "medium",
      title: "Sem CI/CD",
      description:
        "Não há pipeline de integração/entrega contínua configurado.",
      recommendation:
        "Automatize deploy com CodePipeline, CodeBuild e CodeDeploy",
    });
  }

  return { score: Math.min(score, 100), findings };
}

function analyzeSecurity(nodes: ArchitectureNode[]): {
  score: number;
  findings: WAFinding[];
} {
  let score = 0;
  const findings: WAFinding[] = [];

  const hasWAF = hasType(nodes, "waf");
  const hasSecurityGroup = hasType(nodes, "security-group");
  const hasCognito = hasType(nodes, "cognito");
  const hasIAM = hasType(nodes, "iam");
  const hasKMS = hasType(nodes, "kms");
  const hasSecretsManager = hasType(nodes, "secrets-manager");

  const publicServiceTypes = ["alb", "cloudfront", "api-gateway"];
  const hasPublicServices = nodes.some((n) =>
    publicServiceTypes.includes(n.type)
  );

  if (hasWAF) score += 25;
  if (hasSecurityGroup) score += 25;
  if (hasCognito || hasIAM) score += 25;
  if (hasKMS || hasSecretsManager) score += 25;

  if (!hasWAF && hasPublicServices) {
    const affectedNodeIds = nodes
      .filter((n) => publicServiceTypes.includes(n.type))
      .map((n) => n.id);
    findings.push({
      pillar: "security",
      severity: "critical",
      title: "Sem WAF",
      description:
        "Serviços públicos expostos sem proteção de Web Application Firewall.",
      recommendation:
        "Configure AWS WAF para proteger aplicações web",
      affectedNodeIds,
    });
  }

  if (!hasCognito && !hasIAM) {
    findings.push({
      pillar: "security",
      severity: "high",
      title: "Sem gerenciamento de identidade",
      description:
        "A arquitetura não possui controle de acesso e autenticação configurados.",
      recommendation:
        "Use Cognito para usuários ou IAM para controle de acesso",
    });
  }

  if (!hasKMS && !hasSecretsManager) {
    findings.push({
      pillar: "security",
      severity: "medium",
      title: "Sem gestão de segredos",
      description:
        "Credenciais e segredos podem estar expostos sem proteção adequada.",
      recommendation:
        "Use KMS/Secrets Manager para proteger credenciais",
    });
  }

  return { score: Math.min(score, 100), findings };
}

function analyzeReliability(nodes: ArchitectureNode[]): {
  score: number;
  findings: WAFinding[];
} {
  let score = 0;
  const findings: WAFinding[] = [];

  const rdsNodes = getNodes(nodes, "rds");
  const auroraNodes = nodes.filter((n) =>
    typeof n.config === "object" &&
    n.config !== null &&
    "engine" in n.config &&
    (n.config.engine === "aurora-mysql" || n.config.engine === "aurora-postgres")
  );

  const hasMultiAZ =
    rdsNodes.some(
      (n) =>
        typeof n.config === "object" &&
        n.config !== null &&
        "multiAZ" in n.config &&
        n.config.multiAZ === true
    ) || auroraNodes.length > 0;

  const hasElastiCache = hasType(nodes, "elasticache");
  const hasSQS = hasType(nodes, "sqs");
  const hasSNS = hasType(nodes, "sns");
  const hasALB = hasType(nodes, "alb");
  const hasNLB = hasType(nodes, "nlb");
  const hasLambda = hasType(nodes, "lambda");
  const hasEC2 = hasType(nodes, "ec2");
  const hasCloudFront = hasType(nodes, "cloudfront");

  if (hasMultiAZ) score += 25;
  if (hasElastiCache) score += 25;
  if (hasSQS || hasSNS) score += 25;
  if (hasALB || hasNLB) score += 25;

  const hasRDS = rdsNodes.length > 0;
  if (hasRDS && !hasMultiAZ) {
    const affectedNodeIds = rdsNodes.map((n) => n.id);
    findings.push({
      pillar: "reliability",
      severity: "high",
      title: "RDS sem Multi-AZ",
      description:
        "Banco de dados RDS configurado sem alta disponibilidade Multi-AZ.",
      recommendation:
        "Configure Multi-AZ para alta disponibilidade do banco de dados",
      affectedNodeIds,
    });
  }

  if (!hasSQS && !hasSNS && hasLambda) {
    findings.push({
      pillar: "reliability",
      severity: "medium",
      title: "Sem desacoplamento assíncrono",
      description:
        "Funções Lambda sem filas/tópicos para desacoplamento entre componentes.",
      recommendation:
        "Use SQS/SNS para desacoplar componentes e aumentar resiliência",
    });
  }

  if (!hasALB && !hasCloudFront && hasEC2) {
    const affectedNodeIds = getNodes(nodes, "ec2").map((n) => n.id);
    findings.push({
      pillar: "reliability",
      severity: "high",
      title: "Sem balanceamento de carga",
      description:
        "Instâncias EC2 sem balanceador de carga para distribuir tráfego.",
      recommendation:
        "Use ALB para distribuir tráfego entre instâncias EC2",
      affectedNodeIds,
    });
  }

  return { score: Math.min(score, 100), findings };
}

function analyzePerformance(nodes: ArchitectureNode[]): {
  score: number;
  findings: WAFinding[];
} {
  let score = 0;
  const findings: WAFinding[] = [];

  const hasCloudFront = hasType(nodes, "cloudfront");
  const hasElastiCache = hasType(nodes, "elasticache");
  const hasLambda = hasType(nodes, "lambda");
  const hasFargate = hasType(nodes, "fargate");
  const hasAPIGateway = hasType(nodes, "api-gateway");
  const hasS3 = hasType(nodes, "s3");
  const hasRDS = hasType(nodes, "rds");
  const hasEC2 = hasType(nodes, "ec2");

  if (hasCloudFront) score += 25;
  if (hasElastiCache) score += 25;
  if (hasLambda || hasFargate) score += 25;
  if (hasAPIGateway) score += 25;

  if (!hasCloudFront && hasS3) {
    const affectedNodeIds = getNodes(nodes, "s3").map((n) => n.id);
    findings.push({
      pillar: "performance",
      severity: "medium",
      title: "S3 sem CDN",
      description: "Buckets S3 servindo conteúdo sem distribuição via CDN.",
      recommendation:
        "Use CloudFront como CDN para melhorar latência global",
      affectedNodeIds,
    });
  }

  if (!hasElastiCache && hasRDS) {
    findings.push({
      pillar: "performance",
      severity: "medium",
      title: "Sem camada de cache",
      description:
        "Consultas ao banco de dados sem cache, aumentando latência.",
      recommendation: "ElastiCache pode reduzir latência de leitura em 10x",
    });
  }

  if (hasEC2) {
    const ec2Nodes = getNodes(nodes, "ec2");
    const singleInstanceEC2 = ec2Nodes.filter(
      (n) =>
        typeof n.config === "object" &&
        n.config !== null &&
        "count" in n.config &&
        (n.config.count as number) === 1
    );

    if (singleInstanceEC2.length > 0) {
      findings.push({
        pillar: "performance",
        severity: "high",
        title: "EC2 sem escalabilidade",
        description:
          "Instâncias EC2 com count=1 sem configuração de Auto Scaling.",
        recommendation:
          "Configure Auto Scaling para ajustar capacidade automaticamente",
        affectedNodeIds: singleInstanceEC2.map((n) => n.id),
      });
    }
  }

  return { score: Math.min(score, 100), findings };
}

function analyzeCost(nodes: ArchitectureNode[]): {
  score: number;
  findings: WAFinding[];
} {
  let score = 0;
  const findings: WAFinding[] = [];

  const hasLambda = hasType(nodes, "lambda");
  const hasFargate = hasType(nodes, "fargate");
  const hasEC2 = hasType(nodes, "ec2");

  const dynamoDBNodes = getNodes(nodes, "dynamodb");
  const hasOnDemandDynamo = dynamoDBNodes.some(
    (n) =>
      typeof n.config === "object" &&
      n.config !== null &&
      "capacityMode" in n.config &&
      n.config.capacityMode === "on-demand"
  );

  const s3Nodes = getNodes(nodes, "s3");
  const hasS3NonStandard = s3Nodes.some(
    (n) =>
      typeof n.config === "object" &&
      n.config !== null &&
      "storageClass" in n.config &&
      n.config.storageClass !== "STANDARD"
  );

  if (hasLambda) score += 30;
  if (hasFargate && !hasEC2) score += 30;
  if (dynamoDBNodes.length > 0 && hasOnDemandDynamo) score += 20;
  if (s3Nodes.length > 0 && hasS3NonStandard) score += 20;

  const ec2Nodes = getNodes(nodes, "ec2");
  const ec2Count = ec2Nodes.reduce((sum, n) => {
    if (
      typeof n.config === "object" &&
      n.config !== null &&
      "count" in n.config
    ) {
      return sum + (n.config.count as number);
    }
    return sum + 1;
  }, 0);

  if (ec2Count > 2 && !hasLambda) {
    findings.push({
      pillar: "cost",
      severity: "medium",
      title: "Potencial para serverless",
      description:
        "Múltiplas instâncias EC2 sem uso de computação serverless.",
      recommendation:
        "Migrar workloads para Lambda pode reduzir custos em até 70%",
      affectedNodeIds: ec2Nodes.map((n) => n.id),
    });
  }

  const rdsNodes = getNodes(nodes, "rds");
  const rdsWithoutReplicas = rdsNodes.filter(
    (n) =>
      typeof n.config === "object" &&
      n.config !== null &&
      "readReplicas" in n.config &&
      (n.config.readReplicas as number) === 0
  );

  if (rdsWithoutReplicas.length > 0) {
    findings.push({
      pillar: "cost",
      severity: "info",
      title: "RDS sem réplicas de leitura",
      description: "Bancos RDS sem réplicas de leitura para distribuir carga.",
      recommendation:
        "Read replicas podem distribuir carga de leitura e reduzir custos de instância",
      affectedNodeIds: rdsWithoutReplicas.map((n) => n.id),
    });
  }

  return { score: Math.min(score, 100), findings };
}

function analyzeSustainability(nodes: ArchitectureNode[]): {
  score: number;
  findings: WAFinding[];
} {
  let score = 0;
  const findings: WAFinding[] = [];

  const hasLambda = hasType(nodes, "lambda");
  const hasFargate = hasType(nodes, "fargate");
  const hasDynamoDB = hasType(nodes, "dynamodb");
  const hasEFS = hasType(nodes, "efs");

  const managedServices = hasLambda || hasFargate || hasDynamoDB;
  if (managedServices) score += 35;

  const ec2Nodes = getNodes(nodes, "ec2");
  const hasGraviton = ec2Nodes.some(
    (n) =>
      typeof n.config === "object" &&
      n.config !== null &&
      "instanceType" in n.config &&
      typeof n.config.instanceType === "string" &&
      /[tmc]\d+g/.test(n.config.instanceType)
  );

  const hasSpot = ec2Nodes.some(
    (n) =>
      typeof n.config === "object" &&
      n.config !== null &&
      "spotEnabled" in n.config &&
      n.config.spotEnabled === true
  );

  if (hasGraviton || hasSpot) score += 35;
  if (hasEFS) score += 30;

  const largeInstanceTypes = ["m5.xlarge", "m5.2xlarge", "r5", "r5.xlarge", "r5.2xlarge"];
  const overProvisionedEC2 = ec2Nodes.filter(
    (n) =>
      typeof n.config === "object" &&
      n.config !== null &&
      "instanceType" in n.config &&
      typeof n.config.instanceType === "string" &&
      largeInstanceTypes.some((t) =>
        (n.config as { instanceType: string }).instanceType.startsWith(t)
      )
  );

  if (overProvisionedEC2.length > 0) {
    findings.push({
      pillar: "sustainability",
      severity: "medium",
      title: "Instâncias over-provisioned",
      description:
        "Instâncias EC2 de grande porte podem estar super-dimensionadas.",
      recommendation:
        "Considere Graviton (ARM) que oferece 40% mais eficiência energética",
      affectedNodeIds: overProvisionedEC2.map((n) => n.id),
    });
  }

  if (!managedServices) {
    findings.push({
      pillar: "sustainability",
      severity: "info",
      title: "Adote serverless",
      description:
        "A arquitetura não utiliza computação gerenciada/serverless.",
      recommendation:
        "Lambda e Fargate eliminam servidores ociosos reduzindo consumo de energia",
    });
  }

  return { score: Math.min(score, 100), findings };
}

// ─── Main analyzer ────────────────────────────────────────────────────────────

export function analyzeArchitecture(
  nodes: ArchitectureNode[],
  edges: ConnectionEdge[]  // eslint-disable-line @typescript-eslint/no-unused-vars
): WAReport {
  const pillarOrder: WAPillar[] = [
    "operational-excellence",
    "security",
    "reliability",
    "performance",
    "cost",
    "sustainability",
  ];

  const pillarResults: Record<
    WAPillar,
    { score: number; findings: WAFinding[] }
  > = {
    "operational-excellence": analyzeOperationalExcellence(nodes),
    security: analyzeSecurity(nodes),
    reliability: analyzeReliability(nodes),
    performance: analyzePerformance(nodes),
    cost: analyzeCost(nodes),
    sustainability: analyzeSustainability(nodes),
  };

  const pillars: WAPillarScore[] = pillarOrder.map((pillar) => {
    const meta = PILLAR_META[pillar];
    const result = pillarResults[pillar];
    return {
      pillar,
      displayName: meta.displayName,
      score: result.score,
      maxScore: 100,
      findings: result.findings,
      color: meta.color,
      icon: meta.icon,
    };
  });

  const allFindings = pillars.flatMap((p) => p.findings);
  const overallScore = Math.round(
    pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length
  );

  return {
    overallScore,
    totalFindings: allFindings.length,
    criticalCount: allFindings.filter((f) => f.severity === "critical").length,
    highCount: allFindings.filter((f) => f.severity === "high").length,
    pillars,
    generatedAt: Date.now(),
  };
}
