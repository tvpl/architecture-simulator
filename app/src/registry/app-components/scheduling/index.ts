import { appComponentRegistry } from "../index-internal";
import type { AppComponentDefinition } from "../types";

const cronjob: AppComponentDefinition = {
  type: "cronjob",
  label: "CronJob",
  description: "Tarefa agendada por expressão cron",
  helpText: "Um CronJob executa uma tarefa em horários programados (como um cron do Linux). Ideal para backups, limpeza de dados, geração de relatórios, envio de emails recorrentes, etc. A expressão cron define quando executar.",
  category: "scheduling",
  iconName: "Clock",
  color: "text-violet-500",
  bgColor: "bg-violet-50 dark:bg-violet-950/30",
  borderColor: "border-violet-400",
  allowedHostTypes: ["ec2", "ecs", "eks", "fargate"],
  allowedIncomingProtocols: ["internal"],
  allowedOutgoingProtocols: ["https", "http", "grpc", "sqs", "sns", "kafka", "internal"],
  configSections: [
    {
      title: "Agendamento",
      fields: [
        { kind: "text", key: "schedule", label: "Expressão Cron", placeholder: "0 * * * *", description: "Formato: minuto hora dia-mês mês dia-semana. Ex: '0 * * * *' = a cada hora, '*/5 * * * *' = a cada 5 min, '0 3 * * *' = todo dia às 3h" },
        { kind: "text", key: "command", label: "Comando", placeholder: "/app/run-task.sh", description: "Comando executado quando o job inicia" },
        { kind: "select", key: "concurrencyPolicy", label: "Política de Concorrência", options: [{ value: "Forbid", label: "Forbid (não sobrepor)" }, { value: "Allow", label: "Allow (permitir paralelo)" }, { value: "Replace", label: "Replace (substituir anterior)" }], description: "O que fazer se o job anterior ainda estiver rodando quando o próximo deveria iniciar" },
        { kind: "number", key: "activeDeadlineSeconds", label: "Timeout (segundos)", min: 10, max: 86400, step: 10, unit: "s", description: "Tempo máximo de execução antes de ser cancelado" },
      ],
    },
    {
      title: "Histórico",
      fields: [
        { kind: "number", key: "successfulJobsHistoryLimit", label: "Histórico de Sucesso", min: 0, max: 10, step: 1, description: "Quantos jobs bem-sucedidos manter no histórico" },
        { kind: "number", key: "failedJobsHistoryLimit", label: "Histórico de Falha", min: 0, max: 10, step: 1, description: "Quantos jobs que falharam manter no histórico" },
      ],
    },
    {
      title: "Container",
      fields: [
        { kind: "text", key: "image", label: "Imagem Docker", placeholder: "meu-registro/meu-job:latest" },
        { kind: "text", key: "namespace", label: "Namespace", placeholder: "default" },
      ],
    },
    {
      title: "Recursos",
      fields: [
        { kind: "select", key: "cpu", label: "CPU", options: [{ value: "250m", label: "250m" }, { value: "500m", label: "500m" }, { value: "1000m", label: "1000m" }] },
        { kind: "select", key: "memory", label: "Memória", options: [{ value: "256Mi", label: "256 MB" }, { value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }] },
      ],
    },
    {
      title: "Limites de Recursos",
      fields: [
        { kind: "select", key: "cpuLimit", label: "CPU (Limit)", options: [{ value: "500m", label: "500m (0.5 vCPU)" }, { value: "1000m", label: "1000m (1 vCPU)" }, { value: "2000m", label: "2000m (2 vCPU)" }], description: "Limite máximo de CPU. Se ultrapassar, o Kubernetes aplica throttle. Deve ser >= CPU Request." },
        { kind: "select", key: "memoryLimit", label: "Memória (Limit)", options: [{ value: "512Mi", label: "512 MB" }, { value: "1Gi", label: "1 GB" }, { value: "2Gi", label: "2 GB" }, { value: "4Gi", label: "4 GB" }], description: "Limite máximo de memória. Se ultrapassar, o container é encerrado (OOMKilled)." },
      ],
    },
    {
      title: "Observabilidade",
      fields: [
        { kind: "select", key: "logLevel", label: "Nível de Log", options: [{ value: "debug", label: "Debug" }, { value: "info", label: "Info" }, { value: "warn", label: "Warn" }, { value: "error", label: "Error" }], description: "Controla a verbosidade dos logs do CronJob." },
        { kind: "switch", key: "metricsEnabled", label: "Métricas Habilitadas", description: "Exporta métricas de execução (duração, sucesso/falha) para Prometheus/Grafana." },
      ],
    },
  ],
};

appComponentRegistry.register(cronjob);
