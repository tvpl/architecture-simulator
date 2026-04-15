# AWS Architecture Simulator

Ferramenta profissional para desenhar, simular e analisar arquiteturas AWS com métricas de performance, custo e disponibilidade em tempo real.

---

## Funcionalidades

- **55+ serviços AWS** em 7 categorias (Compute, Networking, Messaging, Storage, Security, Integration, Analytics & ML)
- **Landing page** em `/` — hero animado, cards de features, atalhos de teclado, CTA
- **4 camadas de visualização** — Arquitetura, Serviços, Custos, Simulação
- **Engine de simulação server-side** — travessia de grafo, detecção de gargalos, análise de caminhos críticos
- **Calculadora de custos AWS** — preços on-demand us-east-1 em USD
- **Alerta de orçamento** — limite mensal configurável com barra de progresso (verde/âmbar/vermelho)
- **Análise what-if** — parâmetros descobertos automaticamente via registry, projeção de custo sem alterar o canvas
- **Presets de configuração** — menu de contexto com configurações rápidas por serviço (Lambda Dev/Prod/High-Mem, EC2 sizes, RDS tiers, etc.)
- **Multi-select e bulk actions** — Shift+clique ou arrasto para selecionar múltiplos nós; toolbar flutuante para duplicar/deletar
- **Onboarding do canvas vazio** — painel animado com atalhos para templates, paleta de comandos e importação JSON
- **Editor inline de labels de aresta** — duplo clique no badge de protocolo para adicionar rótulo customizado
- **VPC/Subnet containers** — grupos visuais com barra de cor por tipo e contador de filhos
- **Conexões com protocolo** — HTTPS, HTTP, gRPC, WebSocket, Kafka, SQS, SNS, EventBridge, Kinesis, Internal
- **Histórico de versões** — snapshots nomeados com diff badges (±nós/conexões vs atual), restauração
- **Animação de bordas** — partículas SVG animadas nas camadas Simulação e Serviços
- **Modo escuro** — toggle persistido em localStorage
- **Persistência automática** — diagrama salvo em localStorage, restaurado ao recarregar
- **Exportar/Importar JSON** — save/load completo do projeto
- **Exportar imagem PNG** — captura do canvas via html-to-image
- **Exportar CloudFormation** — templates YAML válidos gerados do diagrama
- **Testes unitários** — domínio puro coberto com Vitest (95 testes)

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 (App Router) |
| UI Runtime | React 19 |
| Canvas | @xyflow/react v12 |
| Estado | Zustand v5 + zundo (undo/redo temporal) |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Componentes | Radix UI Primitives |
| Gráficos | Recharts v3 |
| Animações | Framer Motion v12 |
| Toasts | Sonner v2 |
| Validação | Zod v4 |
| Testes | Vitest v4 |
| TypeScript | v5 (strict mode) |

---

## Estrutura do Projeto

```
app/src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing page (/)
│   ├── editor/                 # Rota principal do editor + GlobalDialogs
│   ├── api/
│   │   ├── simulation/         # POST — engine de simulação
│   │   ├── cost/               # POST — calculadora de custos
│   │   ├── validate/           # POST — validação de arquitetura
│   │   └── export/cloudformation/  # POST — CloudFormation YAML
│   ├── layout.tsx              # Root layout (Toaster, ThemeProvider)
│
├── domain/                     # Lógica pura de domínio (zero React/Next)
│   ├── entities/               # Tipos: node, edge, simulation, layer, pricing
│   ├── services/               # Fórmulas: simulation-engine, cost, latency,
│   │                           #           throughput, availability, cloudformation
│   ├── validators/             # validateArchitecture()
│   └── constants/              # SERVICE_DEFAULTS
│
├── registry/                   # Catálogo AWS auto-registrável
│   ├── compute/                # EC2, ECS, EKS, Lambda, Fargate, ECR
│   ├── networking/             # VPC, Subnet, ALB, API GW, CloudFront, Route53, SG, NAT
│   ├── messaging/              # SQS, SNS, EventBridge, MSK, Kinesis, SES
│   ├── storage/                # S3, RDS, DynamoDB, ElastiCache, EFS, Aurora
│   ├── security/               # IAM, WAF, Secrets Manager, Cognito, KMS, Shield, CloudTrail
│   ├── integration/            # Step Functions, AppSync, CodePipeline, X-Ray
│   └── analytics/              # Redshift, Athena, OpenSearch, Glue, SageMaker  ← NOVO
│
├── stores/                     # Zustand stores
│   ├── flow-store.ts           # Nodes/edges (persist → localStorage "aws-arch-v2")
│   ├── simulation-store.ts     # Status e resultados da simulação
│   ├── layer-store.ts          # Camada ativa
│   ├── ui-store.ts             # Painéis e diálogos abertos/fechados
│   ├── theme-store.ts          # Tema (persist → localStorage "aws-arch-theme")
│   ├── validation-store.ts     # Erros/avisos reativos
│   └── history-store.ts        # Snapshots (persist → localStorage "aws-arch-history")
│
└── components/
    ├── canvas/
    │   ├── FlowCanvas.tsx      # Canvas principal + onboarding + multi-select
    │   └── NodeContextMenu.tsx # Menu de contexto + presets de configuração
    ├── edges/
    │   └── ProtocolEdge.tsx    # Aresta colorida por protocolo + inline label editor
    ├── nodes/base/             # ServiceNode, NoteNode, ContainerNode (accent bar)
    ├── views/
    │   └── CostDashboard.tsx   # Dashboard L3 + alerta de orçamento
    ├── panels/
    │   ├── PropertiesPanel.tsx
    │   ├── SimulationPanel.tsx
    │   ├── ValidationPanel.tsx
    │   ├── WhatIfPanel.tsx     # Auto-discovery via registry
    │   └── HistoryPanel.tsx    # Diff badges por snapshot
    ├── dialogs/
    │   ├── TemplatesDialog.tsx
    │   └── CommandPalette.tsx
    ├── layout/                 # Navbar, Sidebar, LayerSwitcher
    └── theme-provider.tsx
```

---

## Primeiros Passos

```bash
npm install       # Instalar dependências
npm run dev       # Servidor de desenvolvimento → http://localhost:3000
npm run build     # Build de produção (0 erros obrigatório)
npm test          # Testes unitários (Vitest — 95 testes)
npm run lint      # ESLint (0 errors obrigatório)
```

---

## Sistema de Camadas

| Camada | O que exibe | Arestas |
|--------|-------------|---------|
| **Arquitetura** | Componentes AWS, VPC/Subnet containers | Estáticas, cor por protocolo |
| **Serviços** | Grafo de comunicação entre serviços | Animadas, badges de protocolo |
| **Custos** | Badges de custo USD em cada nó | Estáticas |
| **Simulação** | Utilização, gargalos, latência | Partículas animadas após simulação |

---

## Serviços AWS Disponíveis

| Categoria | Serviços |
|-----------|---------|
| Compute | EC2, ECS, EKS, Lambda, Fargate, ECR |
| Networking | VPC, Subnet, Security Group, ALB, CloudFront, Route53, API Gateway, NAT Gateway |
| Storage | S3, RDS, DynamoDB, ElastiCache, EFS, Aurora |
| Messaging | SQS, SNS, Kinesis, MSK, EventBridge, SES |
| Security | WAF, Shield, KMS, Secrets Manager, Cognito, IAM, CloudTrail |
| Integration | Step Functions, Glue Workflow, AppSync, CodePipeline, X-Ray |
| Analytics & ML | Redshift, Athena, OpenSearch, Glue, SageMaker |

---

## Adicionando um Novo Serviço AWS

1. Adicionar o type ao `AWSServiceType` em `src/domain/entities/node.ts`
2. Criar interface de config (ex: `MyServiceConfig`) no mesmo arquivo
3. Adicionar à `ServiceConfigMap` e ao `SERVICE_CATEGORY_MAP`
4. Adicionar defaults em `src/domain/constants/defaults.ts`
5. Criar entrada no `src/registry/<categoria>/index.ts` com `ServiceDefinition`
6. Adicionar fórmula de custo em `src/domain/services/cost.ts`
7. Adicionar latência em `src/domain/services/latency.ts`
8. Adicionar throughput em `src/domain/services/throughput.ts`
9. Adicionar disponibilidade em `src/domain/services/availability.ts`
10. Adicionar `case` em `src/domain/services/cloudformation.ts`

Para uma nova **categoria**, adicionar também à tuple `NODE_CATEGORIES` em `node.ts`, ao `CATEGORY_LABELS`/`CATEGORY_ORDER` em `registry/index-internal.ts`, criar `registry/<categoria>/index.ts` e importar em `registry/index.ts`.

---

## API Routes

| Rota | Método | Saída |
|------|--------|-------|
| `/api/simulation` | POST | `SimulationResult` |
| `/api/cost` | POST | `{ totalMonthlyCostUSD, breakdown }` |
| `/api/validate` | POST | `ValidationResult` |
| `/api/export/cloudformation` | POST | YAML string |

---

## Testes

```bash
npm test
```

95 testes cobrindo: `simulation-engine`, `cost`, `cloudformation`, `validateArchitecture` (domínio puro, sem UI).
