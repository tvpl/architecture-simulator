import { appComponentRegistry } from "../index-internal";
import type { AppComponentDefinition } from "../types";

const databaseClient: AppComponentDefinition = {
  type: "database-client",
  label: "Database Client",
  description: "Conexão com banco de dados (pool, retries)",
  helpText: "Representa a configuração de conexão com um banco de dados (RDS, DynamoDB, etc.). Define pool de conexões, timeouts e estratégia de retry. Não é um container separado, mas uma configuração de como o serviço se conecta ao banco.",
  category: "data-access",
  iconName: "Database",
  color: "text-sky-500",
  bgColor: "bg-sky-50 dark:bg-sky-950/30",
  borderColor: "border-sky-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate", "lambda"],
  allowedIncomingProtocols: ["internal"],
  allowedOutgoingProtocols: ["internal"],
  configSections: [
    {
      title: "Conexão",
      fields: [
        { kind: "text", key: "targetDatabase", label: "Banco de Dados Alvo", placeholder: "nome-do-rds-ou-dynamodb", description: "Nome ou ARN do banco de dados da Layer de Arquitetura" },
        { kind: "number", key: "connectionPoolSize", label: "Pool de Conexões", min: 1, max: 200, step: 1, description: "Quantas conexões simultâneas manter abertas. Mais conexões = mais throughput, mas consome mais recursos do banco." },
        { kind: "number", key: "timeoutMs", label: "Timeout (ms)", min: 100, max: 60000, step: 100, unit: "ms", description: "Tempo máximo para aguardar uma resposta do banco" },
        { kind: "number", key: "retryAttempts", label: "Tentativas de Retry", min: 0, max: 10, step: 1, description: "Quantas vezes retentar em caso de falha temporária" },
      ],
    },
    {
      title: "Observabilidade",
      fields: [
        { kind: "switch", key: "metricsEnabled", label: "Métricas de Conexão", description: "Exporta métricas do pool de conexões (ativas, idle, erros) para monitoramento." },
        { kind: "switch", key: "slowQueryLog", label: "Log de Queries Lentas", description: "Registra queries que excedem o threshold de tempo para análise de performance." },
      ],
    },
  ],
};

const cacheClient: AppComponentDefinition = {
  type: "cache-client",
  label: "Cache Client",
  description: "Conexão com cache (Redis, Memcached)",
  helpText: "Representa a configuração de conexão com um cache (ElastiCache Redis/Memcached). Define pool, TTL (tempo de expiração) e timeouts. Cache reduz drasticamente a latência e carga no banco de dados.",
  category: "data-access",
  iconName: "Zap",
  color: "text-red-500",
  bgColor: "bg-red-50 dark:bg-red-950/30",
  borderColor: "border-red-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate", "lambda"],
  allowedIncomingProtocols: ["internal"],
  allowedOutgoingProtocols: ["internal"],
  configSections: [
    {
      title: "Conexão",
      fields: [
        { kind: "text", key: "targetCache", label: "Cache Alvo", placeholder: "nome-do-elasticache", description: "Nome ou ARN do cache da Layer de Arquitetura" },
        { kind: "number", key: "connectionPoolSize", label: "Pool de Conexões", min: 1, max: 100, step: 1 },
        { kind: "number", key: "timeoutMs", label: "Timeout (ms)", min: 10, max: 10000, step: 10, unit: "ms" },
        { kind: "number", key: "ttlSeconds", label: "TTL Padrão (s)", min: 1, max: 86400, step: 1, unit: "s", description: "Tempo padrão que um dado fica no cache antes de expirar" },
      ],
    },
    {
      title: "Observabilidade",
      fields: [
        { kind: "switch", key: "metricsEnabled", label: "Métricas de Cache", description: "Exporta métricas de hit/miss ratio, latência e pool de conexões." },
      ],
    },
  ],
};

appComponentRegistry.register(databaseClient);
appComponentRegistry.register(cacheClient);
