# CLAUDE.md — AWS Architecture Simulator

Guia para desenvolvedores e agentes de IA trabalhando neste repositório.

## Comandos Essenciais

```bash
cd app/                      # SEMPRE trabalhar a partir daqui
npm run dev                  # Dev server → http://localhost:3000
npm run build                # DEVE passar com 0 erros antes de commit
npm test                     # Vitest — 144 testes
npm run lint                 # ESLint — deve terminar com 0 errors
```

## Padrão Crítico: Adicionar um Novo Serviço AWS

Seguir esta sequência **em ordem**:

1. **`src/domain/entities/node.ts`**
   - Adicionar ao array `AWS_SERVICE_TYPES`
   - Criar interface `MyServiceConfig`
   - Adicionar `"my-service": MyServiceConfig` à `ServiceConfigMap`
   - Adicionar `"my-service": "categoria"` ao `SERVICE_CATEGORY_MAP`

2. **`src/domain/constants/defaults.ts`** — adicionar defaults ao `SERVICE_DEFAULTS`

3. **`src/registry/<categoria>/index.ts`** — registrar `ServiceDefinition` com `registry.register({...})`

4. **`src/domain/services/cost.ts`** — adicionar `case "my-service":` ao switch

5. **`src/domain/services/latency.ts`** — adicionar à `BASE_LATENCY_MS` record

6. **`src/domain/services/throughput.ts`** — adicionar `case "my-service":` ao switch

7. **`src/domain/services/availability.ts`** — adicionar à `BASE_AVAILABILITY` record

8. **`src/domain/services/cloudformation.ts`** — adicionar `case "my-service":` ao switch (ou deixar no `default: {}`)

### Adicionar Nova Categoria de Serviço
Além dos 8 passos acima:
- Adicionar à tuple `NODE_CATEGORIES` em `node.ts`
- Adicionar ao `CATEGORY_LABELS` e `CATEGORY_ORDER` em `registry/index-internal.ts`
- Criar `registry/<nova-categoria>/index.ts`
- Importar em `registry/index.ts`

## Serviços AWS Disponíveis (60+)

### Por Categoria

| Categoria | Serviços |
|-----------|---------|
| compute | ec2, ecs, eks, lambda, fargate, ecr |
| networking | vpc, subnet, security-group, alb, cloudfront, route53, api-gateway, nat-gateway |
| storage | s3, rds, dynamodb, elasticache, efs, aurora |
| messaging | sqs, sns, kinesis, msk, eventbridge, ses, **eventbridge-pipes** |
| security | waf, shield, kms, secrets-manager, cognito, iam, cloudtrail |
| integration | step-functions, glue-workflow, app-sync, codepipeline, xray, **sfn-express** |
| analytics | redshift, athena, opensearch, glue, sagemaker, **bedrock** |
| annotations | note, vpc (container), subnet (container), **region** (container) |

**Negrito** = adicionados recentemente.

## Regras do Domínio

- Arquivos em `src/domain/` **NUNCA** devem importar React, Next.js ou stores
- Todos os serviços de domínio são funções puras — sem side effects, sem estado global
- Tipos discriminados (`ArchitectureNode`, `ConnectionProtocol`) — sem `any`

## State Management

| Store | Arquivo | Persistência | Função |
|-------|---------|-------------|--------|
| Nodes/Edges | `flow-store.ts` | localStorage `aws-arch-v2` | Canvas state + undo/redo (zundo) + `selectAllNodes()` |
| Simulação | `simulation-store.ts` | — | Resultados da simulação |
| Camada ativa | `layer-store.ts` | — | architecture/services/cost/simulation |
| Painéis UI | `ui-store.ts` | localStorage `aws-arch-ui` (parcial) | Todos os painéis, modais, sidebar, comparison mode |
| Templates do usuário | `user-templates-store.ts` | localStorage `aws-arch-user-templates` | Templates salvos pelo usuário |
| Tema | `theme-store.ts` | localStorage `aws-arch-theme` | light/dark |
| Validação | `validation-store.ts` | — | Erros/avisos reativos |
| Histórico | `history-store.ts` | localStorage `aws-arch-history` | Snapshots nomeados |

### ui-store — painéis e diálogos disponíveis

```typescript
const {
  // Sidebar
  sidebarCollapsed, toggleSidebar, setSidebarWidth,
  sidebarWidth,   // persisted (200–480px), controlled via drag handle

  // Properties Panel
  propertiesPanelOpen, openPropertiesPanel, closePropertiesPanel,
  propertiesPanelDocked, togglePropertiesPanelDocked, // split mode vs floating

  // Other panels
  simulationPanelOpen, openSimulationPanel, closeSimulationPanel,
  validationPanelOpen, toggleValidationPanel,
  whatIfPanelOpen,     toggleWhatIfPanel,
  wellArchitectedPanelOpen, toggleWellArchitectedPanel,
  comparisonModeActive, toggleComparisonMode,

  // Dialogs
  templatesDialogOpen, openTemplatesDialog, closeTemplatesDialog,
  shortcutsModalOpen,  openShortcutsModal, closeShortcutsModal,

  // Onboarding
  onboardingCompleted, completeOnboarding, resetOnboarding,

  // Category expansion (sidebar)
  expandedCategories, toggleExpandedCategory, setExpandedCategories,

  // Auto-layout
  autoLayoutPending, autoLayoutDirection, requestAutoLayout, clearAutoLayout,
} = useUIStore();
```

`TemplatesDialog`, `KeyboardShortcutsModal`, `SaveTemplateDialog` e `ComparisonPanel` são gerenciados globalmente via `GlobalDialogs`/`EditorMain` em `app/editor/page.tsx` — não instanciar diretamente em outros componentes.

## Undo/Redo (zundo)

```typescript
// Acessar o temporal store em componentes:
import { useTemporalFlowStore } from "@/stores/flow-store";
const { undo, redo, pastStates, futureStates } = useTemporalFlowStore((s) => s);

// Acessar fora de componentes (callbacks, event handlers):
(useFlowStore as any).temporal.getState().undo();
```

## Sistema de Tipos

```typescript
// React Flow wrappers
type FlowNode = Node<ArchitectureNode>   // Node de @xyflow/react
type FlowEdge = Edge<ConnectionEdge>

// Registry
import { registry } from "@/registry";
const def = registry.get("lambda");  // ServiceDefinition | undefined

// Temporal store access
import { useTemporalFlowStore } from "@/stores/flow-store";
```

## Arquivos Críticos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/domain/entities/node.ts` | `AWSServiceType`, `ServiceConfigMap`, `ArchitectureNode` |
| `src/domain/entities/edge.ts` | `ConnectionProtocol`, `PROTOCOL_INFO`, `ConnectionEdge.label` |
| `src/domain/services/simulation-engine.ts` | `runSimulation()` — DFS + bottleneck detection |
| `src/domain/services/cost.ts` | `calculateServiceCost()`, `buildCostBreakdown()` |
| `src/domain/services/cloudformation.ts` | `generateCloudFormationTemplate()` |
| `src/domain/services/terraform-export.ts` | `generateTerraformTemplate()` — HCL com provider, variables, locals, outputs |
| `src/domain/services/cdk-export.ts` | `generateCDKApp()` — TypeScript CDK Stack com app entrypoint |
| `src/domain/services/well-architected.ts` | `analyzeArchitecture()` — WAReport com 6 pilares, scores, findings |
| `src/registry/index.ts` | Entry point público com todos os imports |
| `src/registry/index-internal.ts` | Registry singleton + `CATEGORY_LABELS/ORDER` |
| `src/registry/analytics/index.ts` | Redshift, Athena, OpenSearch, Glue, SageMaker, **Bedrock** |
| `src/registry/integration/index.ts` | Step Functions, Glue Workflow, AppSync, CodePipeline, X-Ray, **SFN Express** |
| `src/registry/messaging/index.ts` | SQS, SNS, Kinesis, MSK, EventBridge, SES, **EventBridge Pipes** |
| `src/stores/flow-store.ts` | `useFlowStore` + `useTemporalFlowStore` + `selectAllNodes()` |
| `src/components/canvas/FlowCanvas.tsx` | Canvas + onboarding + multi-select toolbar + context menu |
| `src/components/canvas/NodeContextMenu.tsx` | Menu de contexto + `SERVICE_PRESETS` |
| `src/components/edges/ProtocolEdge.tsx` | Renderização de edges + inline label editor |
| `src/components/views/CostDashboard.tsx` | Dashboard de custos + alerta de orçamento |
| `src/components/panels/WellArchitectedPanel.tsx` | Análise Well-Architected com score circles e findings |
| `src/components/panels/ComparisonPanel.tsx` | Diff de snapshots — nós/edges adicionados/removidos |
| `src/components/onboarding/OnboardingTour.tsx` | Tour guiado de 5 passos para novos usuários |
| `src/lib/templates.ts` | 10 templates de arquitetura pré-prontos |

## Componentes de Nó

| Tipo no Store | Renderer | Quando usar |
|---------------|----------|-------------|
| `service-node` | `ServiceNode` | Todos os serviços AWS comuns |
| `container-node` | `ContainerNode` | VPC, Subnet — tem accent bar e badge de filhos |
| `note-node` | `NoteNode` | Nós do tipo "note" |

FlowCanvas mapeia `node.data.type === "note"` para `type: "note-node"` automaticamente.

### ContainerNode — temas por tipo

```typescript
// Cada tipo tem cores próprias: border, bg, accentBg, badge
// vpc      → violet
// subnet   → blue
// security-group → slate
// region   → indigo  (container de múltiplas AZs/regiões)
```

## Canvas — Funcionalidades

### Onboarding (canvas vazio)
Quando não há nós, um painel animado (framer-motion) é exibido com botões para:
- Abrir a paleta de comandos
- Abrir o diálogo de templates
- Importar JSON

Além disso, ao abrir o editor pela primeira vez, `OnboardingTour` exibe um tour guiado de 5 passos (800ms de delay inicial). Estado persistido em `ui-store.onboardingCompleted`.

### Multi-select e Bulk Actions
- `Shift+clique` ou arrastar seleção seleciona múltiplos nós
- Quando ≥2 nós estão selecionados, uma floating toolbar aparece com:
  - **Duplicar tudo** — `duplicateNode` para cada id selecionado
  - **Deletar tudo** — `removeNode` para cada id selecionado
- `multiSelectionKeyCode="Shift"`, `selectionOnDrag={true}` configurados no `<ReactFlow>`

### Atalhos de Teclado (use-keyboard-shortcuts.ts)

| Atalho | Ação |
|--------|------|
| `Ctrl/Cmd+Z` | Desfazer |
| `Ctrl/Cmd+Y` / `Ctrl+Shift+Z` | Refazer |
| `Ctrl/Cmd+D` | Duplicar nó selecionado |
| `Ctrl/Cmd+C` / `Ctrl/Cmd+V` | Copiar/colar nó |
| `Ctrl/Cmd+A` | Selecionar todos os nós (`selectAllNodes()`) |
| `Ctrl/Cmd+Shift+L` | Auto-layout (`requestAutoLayout()`) |
| `F2` | Renomear nó selecionado |
| `Escape` | Limpar seleção |
| `?` | Abrir modal de atalhos |

Todos os atalhos são inibidos quando o foco está em `INPUT`, `TEXTAREA` ou elemento `contentEditable`.

### Compartilhamento por URL
O Navbar tem botão `Share2` que serializa o projeto como `btoa(encodeURIComponent(JSON.stringify(data)))` e o coloca no hash da URL — copiado para o clipboard. `HashImporter` em `editor/page.tsx` lê o hash no carregamento e importa automaticamente.

### Background Grid
```typescript
<Background gap={snapToGrid ? 16 : 24} size={1.5} color="var(--color-muted-foreground)" className="opacity-25" />
```

## NodeContextMenu — Presets de Configuração

Serviços com presets rápidos (seção "Configurações rápidas" no menu de contexto):

| Serviço | Presets |
|---------|---------|
| lambda | Dev (128MB), Prod (1024MB), High-Mem (3008MB) |
| ec2 | t3.micro ×1, t3.medium ×2, m5.large ×2 |
| ecs | Small (256/512/1), Standard (512/1024/2), Large (1024/2048/5) |
| rds | Dev (t3.micro, no HA), Prod (m5.large, multiAZ), HA (r5.large, 2 replicas) |
| dynamodb | On-Demand, Low (5 RCU/WCU), High (100 RCU/WCU) |
| elasticache | t3.micro ×1, t3.medium ×2, r6g.large ×3 |
| eks | Dev (1 nó t3.medium), Prod (3 nós m5.large), HA (5 nós m5.xlarge) |

Preset ativo é destacado com `bg-primary`. Clicar chama `updateNodeConfig(nodeId, preset.config)`.

Para adicionar presets a um novo serviço: editar `SERVICE_PRESETS` em `NodeContextMenu.tsx`.

## ProtocolEdge — Inline Label Editor

`ConnectionEdge.label?: string` é um campo persistido no store.

- Duplo clique no badge de protocolo entra em modo de edição
- `Enter` ou `blur` salva via `updateEdgeData(id, { label })`
- `Escape` cancela sem salvar
- Rótulo customizado aparece como chip secundário abaixo do badge de protocolo
- Label vazio (`""`) remove o rótulo (salvo como `undefined`)

## WhatIfPanel — Auto-discovery de Parâmetros

O painel descobre automaticamente campos numéricos de custo via registry:

```typescript
// Campos ignorados (não afetam custo):
const skipKeys = new Set(["inboundRules", "outboundRules", "alarmsCount",
  "retentionDays", "idleTimeoutSec", "timeoutSec", "bounceRateTarget", "replicationFactor"]);

// Prioridade de campos custo-impactantes:
const priorityKeys = ["memoryMB", "count", "taskCount", "nodeCount", "storageGB",
  "storageSizeGB", "requestsPerMonth", "shardCount", "brokerCount",
  "messagesPerMonth", "dpuHoursPerMonth", "instanceCount", "queriesPerMonth", "dataScanTB"];

// Máximo de 2 campos por nó para não sobrecarregar o painel
```

## HistoryPanel — Diff Badge

Cada snapshot exibe badges coloridos comparando com o estado atual do canvas:

- `+N nós` → emerald | `-N nós` → red
- `+N conexões` → blue | `-N conexões` → orange
- "igual ao atual" quando não há diferença

## CostDashboard — Alerta de Orçamento

Campo de input para limite mensal em USD. Quando definido:

| Uso do orçamento | Cor | Ícone |
|-----------------|-----|-------|
| < 80% | emerald | CheckCircle2 |
| 80–99% | amber | AlertTriangle |
| ≥ 100% | red | BellRing (pulsante) |

Exibe barra de progresso + mensagem com valor excedido se aplicável.

## Landing Page (`/`)

`src/app/page.tsx` — página totalmente reimaginada com:
- **Hero**: badge animado, headline com gradiente `animate-gradient-x`, 3 CTAs
- **Terminal preview**: dark card com linhas aparecendo em stagger (stats de latência, custo, disponibilidade)
- **Stats bar**: 60+ Serviços, 10 Templates, 7 Formatos de Export, 100% no Browser
- **Layer showcase**: 4 cards gradiente para L1–L4 com hover scale
- **Feature grid**: 6 cards 2-col com `hover:scale-[1.01]`
- **Export formats**: 7 badges/pills (JSON, PNG, SVG, CloudFormation, Terraform, CDK, K8s YAML)
- **Keyboard shortcuts**: grid 2-col com 8 atalhos e link "Ver todos"
- **CTA** + footer com versão e tech stack

```typescript
// Tipagem correta para ease cubic-bezier no framer-motion v12:
ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
```

## Comparison Mode

`comparisonModeActive` no `ui-store` ativa o `ComparisonPanel` (slide-in direita):
- Lista snapshots do `history-store`
- Ao selecionar um snapshot, exibe diff: nós adicionados (verde) / removidos (vermelho), edges adicionados / removidos
- Botão "Sair do modo comparação" chama `toggleComparisonMode()`
- Botão `GitCompare` no Navbar ativa/desativa

## Well-Architected Panel

`WellArchitectedPanel` analisa o diagrama atual contra os 6 pilares AWS Well-Architected Framework:

| Pilar | O que verifica |
|-------|---------------|
| Operational Excellence | CloudWatch, X-Ray, CloudTrail, CodePipeline |
| Security | WAF, Security Groups, Cognito/IAM, KMS/Secrets Manager |
| Reliability | Multi-AZ RDS, ElastiCache, SQS/SNS, ALB/NLB |
| Performance | CloudFront, ElastiCache, Lambda/Fargate, API Gateway |
| Cost | Lambda serverless, Fargate vs EC2, DynamoDB on-demand |
| Sustainability | Managed services, Graviton, EFS |

Cada pilar tem `score` (0–100), lista de `WAFinding` com severity (`critical`/`high`/`medium`/`low`) e descrição. `"Gerar Relatório"` exporta o `WAReport` como JSON.

## Terraform Export

`generateTerraformTemplate(nodes, edges, projectName)` gera HCL completo:
- `terraform {}` com `required_version >= 1.5.0` e provider `hashicorp/aws ~> 5.0`
- `variable "aws_region"` e `variable "project_name"` com defaults
- `locals { project = var.project_name }` — usado como prefixo em resource names
- Recursos mapeados: Lambda → `aws_lambda_function`, EC2 → `aws_instance`, RDS → `aws_db_instance`, S3 → `aws_s3_bucket` + `aws_s3_bucket_versioning`, etc.
- `output` blocks para ARNs de Lambda, endpoint de RDS, bucket name de S3, DNS de ALB

## CDK Export

`generateCDKApp(nodes, edges, projectName)` gera TypeScript CDK completo:
- Comentário `cdk.json` no topo com instruções de instalação
- Imports dinâmicos baseados nos serviços presentes no diagrama
- Stack class com props completos (timeout, memorySize, removalPolicy, versioned, billingMode, etc.)
- App entrypoint no final com `CDK_DEFAULT_ACCOUNT`/`CDK_DEFAULT_REGION`
- `app.synth()` incluído

## Regras de Qualidade

- **DO**: Usar `cn()` de `@/lib/utils` para classes condicionais
- **DO**: Usar `formatUSD/formatLatency/formatThroughput` de `@/lib/formatters`
- **DO**: Rodar `npm run build` após cada mudança significativa
- **DO**: Manter `144 tests passing` — adicionar testes para nova lógica de domínio
- **DO**: Em JSX, escapar aspas com `{'"'}` (não usar `&ldquo;`/`&rdquo;` — incompatível com algumas versões do ESLint)
- **DON'T**: Importar React em `src/domain/`
- **DON'T**: Usar `any` — usar unions discriminadas ou `unknown` com cast
- **DON'T**: Adicionar `"use client"` em domain services ou API routes
- **DON'T**: Instanciar `TemplatesDialog` fora de `GlobalDialogs` em `editor/page.tsx`

## Zod v4

```typescript
// CORRETO:
z.record(z.string(), z.unknown())   // 2 argumentos

// ERRADO (Zod v3):
z.record(z.unknown())
```

## React Flow v12

- `ReactFlow<FlowNode, FlowEdge>` — genérico necessário
- `ArchitectureNode` tem `[key: string]: unknown` (index signature para compatibilidade)
- `NoteNode` usa `"note-node"` como type, mapeado em FlowCanvas
- `useReactFlow()` só disponível em componentes filhos de `<ReactFlow>`
- Por isso `CanvasEffects` é renderizado DENTRO do `<ReactFlow>`

## Framer Motion v12

```typescript
// ease como tupla explícita (evita erro de tipo):
transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }

// whileInView para animações de scroll:
<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} />
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                 # Landing page (/)
│   ├── editor/page.tsx          # Rota principal do editor + GlobalDialogs
│   └── api/
│       ├── simulation/route.ts
│       ├── cost/route.ts
│       ├── validate/route.ts
│       └── export/cloudformation/route.ts
├── components/
│   ├── canvas/
│   │   ├── FlowCanvas.tsx       # Canvas + onboarding + multi-select
│   │   └── NodeContextMenu.tsx  # Menu de contexto + presets de config
│   ├── dialogs/
│   │   ├── TemplatesDialog.tsx  # Templates pré-prontos + aba "Meus Templates"
│   │   ├── CommandPalette.tsx   # Paleta de comandos (Cmd+K) + recentes
│   │   ├── KeyboardShortcutsModal.tsx  # Modal de atalhos (tecla ?)
│   │   └── SaveTemplateDialog.tsx     # Salvar diagrama como template
│   ├── edges/
│   │   └── ProtocolEdge.tsx     # Edge renderer + inline label editor
│   ├── onboarding/
│   │   └── OnboardingTour.tsx   # Tour guiado 5 passos para novos usuários
│   ├── panels/
│   │   ├── PropertiesPanel.tsx  # Docked (split) ou floating, com DockButton
│   │   ├── SimulationPanel.tsx
│   │   ├── ValidationPanel.tsx  # Erros/avisos em tempo real
│   │   ├── WhatIfPanel.tsx      # Análise de custo what-if (auto-discovery)
│   │   ├── HistoryPanel.tsx     # Snapshots com diff badges
│   │   ├── WellArchitectedPanel.tsx  # 6 pilares WAF com score circles
│   │   └── ComparisonPanel.tsx  # Diff de snapshots (nós/edges +/-)
│   ├── views/
│   │   └── CostDashboard.tsx    # Dashboard L3 + alerta de orçamento
│   ├── nodes/base/
│   │   ├── ServiceNode.tsx      # Nó universal AWS + handles L/R + tooltip
│   │   ├── NoteNode.tsx         # Sticky note colorida
│   │   └── ContainerNode.tsx    # VPC/Subnet/Region — accent bar + badge
│   └── layout/
│       ├── Navbar.tsx           # Export (7 formatos), Share, WA, Comparison, Help
│       ├── Sidebar.tsx          # Paleta + click-to-add + resize + categorias persistidas
│       └── LayerSwitcher.tsx
├── domain/                      # ZERO imports de React/Next.js
│   ├── entities/
│   ├── services/
│   │   ├── cloudformation.ts
│   │   ├── terraform-export.ts  # HCL com provider, vars, locals, outputs
│   │   ├── cdk-export.ts        # TypeScript CDK Stack + app entrypoint
│   │   ├── well-architected.ts  # WAReport — 6 pilares, scores, findings
│   │   ├── k8s-export.ts
│   │   ├── cost.ts
│   │   ├── simulation-engine.ts
│   │   └── __tests__/           # 11 arquivos de teste, 144 testes
│   ├── validators/
│   └── constants/
├── hooks/
│   ├── use-keyboard-shortcuts.ts  # 9 atalhos implementados
│   └── use-auto-layout.ts
├── lib/
│   ├── utils.ts
│   ├── formatters.ts
│   └── templates.ts             # ArchitectureTemplate[]
├── registry/
│   ├── compute/                 # ec2, ecs, eks, lambda, fargate, ecr
│   ├── networking/
│   ├── messaging/               # sqs, sns, kinesis, msk, eventbridge, ses, eventbridge-pipes
│   ├── storage/
│   ├── security/                # waf, shield, kms, secrets-manager, cognito, iam, cloudtrail
│   ├── integration/             # step-functions, glue-workflow, app-sync, codepipeline, xray, sfn-express
│   ├── analytics/               # redshift, athena, opensearch, glue, sagemaker, bedrock
│   ├── annotations/             # note, region (container)
│   ├── index.ts                 # Entry point com todos os imports
│   ├── index-internal.ts        # Singleton + buildPalette() + CATEGORY_LABELS/ORDER
│   └── types.ts                 # ServiceDefinition, ConfigField, NumberField
└── stores/
    ├── flow-store.ts            # useFlowStore + useTemporalFlowStore + selectAllNodes()
    ├── ui-store.ts              # Todos os painéis, sidebar width, docked mode, comparison
    ├── user-templates-store.ts  # Templates salvos pelo usuário (persistido)
    ├── validation-store.ts      # Reativo via subscribe
    ├── history-store.ts         # Snapshots persistidos
    └── ...
```
