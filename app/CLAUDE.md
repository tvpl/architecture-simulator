# CLAUDE.md — AWS Architecture Simulator

Guia para desenvolvedores e agentes de IA trabalhando neste repositório.

## Comandos Essenciais

```bash
cd app/                      # SEMPRE trabalhar a partir daqui
npm run dev                  # Dev server → http://localhost:3000
npm run build                # DEVE passar com 0 erros antes de commit
npm test                     # Vitest — 95 testes
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

## Serviços AWS Disponíveis (55+)

### Por Categoria

| Categoria | Serviços |
|-----------|---------|
| compute | ec2, ecs, eks, lambda, fargate, **ecr** |
| networking | vpc, subnet, security-group, alb, cloudfront, route53, api-gateway, nat-gateway |
| storage | s3, rds, dynamodb, elasticache, efs, aurora |
| messaging | sqs, sns, kinesis, msk, eventbridge, **ses** |
| security | waf, shield, kms, secrets-manager, cognito, iam, **cloudtrail** |
| integration | step-functions, glue-workflow, app-sync, **codepipeline**, **xray** |
| analytics | **redshift**, **athena**, **opensearch**, **glue**, **sagemaker** |
| annotations | note, vpc (container), subnet (container) |

**Negrito** = adicionado recentemente. A categoria `analytics` é nova.

## Regras do Domínio

- Arquivos em `src/domain/` **NUNCA** devem importar React, Next.js ou stores
- Todos os serviços de domínio são funções puras — sem side effects, sem estado global
- Tipos discriminados (`ArchitectureNode`, `ConnectionProtocol`) — sem `any`

## State Management

| Store | Arquivo | Persistência | Função |
|-------|---------|-------------|--------|
| Nodes/Edges | `flow-store.ts` | localStorage `aws-arch-v2` | Canvas state + undo/redo (zundo) |
| Simulação | `simulation-store.ts` | — | Resultados da simulação |
| Camada ativa | `layer-store.ts` | — | architecture/services/cost/simulation |
| Painéis UI | `ui-store.ts` | — | Open/close de todos os painéis + `templatesDialogOpen` |
| Tema | `theme-store.ts` | localStorage `aws-arch-theme` | light/dark |
| Validação | `validation-store.ts` | — | Erros/avisos reativos |
| Histórico | `history-store.ts` | localStorage `aws-arch-history` | Snapshots nomeados |

### ui-store — painéis e diálogos disponíveis

```typescript
const {
  propertiesPanelOpen, openPropertiesPanel, closePropertiesPanel,
  simulationPanelOpen, openSimulationPanel, closeSimulationPanel,
  validationPanelOpen, toggleValidationPanel,
  historyPanelOpen,   toggleHistoryPanel,
  whatIfPanelOpen,    toggleWhatIfPanel,
  templatesDialogOpen, openTemplatesDialog, closeTemplatesDialog,
} = useUIStore();
```

`TemplatesDialog` é gerenciado globalmente via `GlobalDialogs` em `app/editor/page.tsx` — não instanciar diretamente em outros componentes.

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
| `src/registry/index.ts` | Entry point público com todos os imports |
| `src/registry/index-internal.ts` | Registry singleton + `CATEGORY_LABELS/ORDER` |
| `src/registry/analytics/index.ts` | Redshift, Athena, OpenSearch, Glue, SageMaker |
| `src/stores/flow-store.ts` | `useFlowStore` + `useTemporalFlowStore` |
| `src/components/canvas/FlowCanvas.tsx` | Canvas + onboarding + multi-select toolbar + context menu |
| `src/components/canvas/NodeContextMenu.tsx` | Menu de contexto + `SERVICE_PRESETS` |
| `src/components/edges/ProtocolEdge.tsx` | Renderização de edges + inline label editor |
| `src/components/views/CostDashboard.tsx` | Dashboard de custos + alerta de orçamento |
| `src/lib/templates.ts` | 6 templates de arquitetura pré-prontos |

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
```

## Canvas — Funcionalidades

### Onboarding (canvas vazio)
Quando não há nós, um painel animado (framer-motion) é exibido com botões para:
- Abrir a paleta de comandos
- Abrir o diálogo de templates
- Importar JSON

### Multi-select e Bulk Actions
- `Shift+clique` ou arrastar seleção seleciona múltiplos nós
- Quando ≥2 nós estão selecionados, uma floating toolbar aparece com:
  - **Duplicar tudo** — `duplicateNode` para cada id selecionado
  - **Deletar tudo** — `removeNode` para cada id selecionado
- `multiSelectionKeyCode="Shift"`, `selectionOnDrag={true}` configurados no `<ReactFlow>`

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

`src/app/page.tsx` — página estática com:
- Hero animado (framer-motion `fadeUp` com `custom` delay)
- Pills de serviços AWS
- Grid de 6 feature cards (whileInView)
- Seção de atalhos de teclado
- CTA + footer

```typescript
// Tipagem correta para ease cubic-bezier no framer-motion v12:
ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
```

## Regras de Qualidade

- **DO**: Usar `cn()` de `@/lib/utils` para classes condicionais
- **DO**: Usar `formatUSD/formatLatency/formatThroughput` de `@/lib/formatters`
- **DO**: Rodar `npm run build` após cada mudança significativa
- **DO**: Manter `95 tests passing` — adicionar testes para nova lógica de domínio
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
│   │   ├── TemplatesDialog.tsx  # 6 templates pré-prontos
│   │   └── CommandPalette.tsx   # Paleta de comandos (Cmd+K)
│   ├── edges/
│   │   └── ProtocolEdge.tsx     # Edge renderer + inline label editor
│   ├── panels/
│   │   ├── PropertiesPanel.tsx
│   │   ├── SimulationPanel.tsx
│   │   ├── ValidationPanel.tsx  # Erros/avisos em tempo real
│   │   ├── WhatIfPanel.tsx      # Análise de custo what-if (auto-discovery)
│   │   └── HistoryPanel.tsx     # Snapshots com diff badges
│   ├── views/
│   │   └── CostDashboard.tsx    # Dashboard L3 + alerta de orçamento
│   ├── nodes/base/
│   │   ├── ServiceNode.tsx      # Nó universal AWS
│   │   ├── NoteNode.tsx         # Sticky note colorida
│   │   └── ContainerNode.tsx    # VPC/Subnet — accent bar + children count
│   └── layout/
│       ├── Navbar.tsx           # Todos os botões de ação
│       ├── Sidebar.tsx          # Paleta de serviços
│       └── LayerSwitcher.tsx
├── domain/                      # ZERO imports de React/Next.js
│   ├── entities/
│   ├── services/
│   ├── validators/
│   └── constants/
├── hooks/
│   ├── use-keyboard-shortcuts.ts
│   └── use-auto-layout.ts
├── lib/
│   ├── utils.ts
│   ├── formatters.ts
│   └── templates.ts             # ArchitectureTemplate[]
├── registry/
│   ├── compute/                 # ec2, ecs, eks, lambda, fargate, ecr
│   ├── networking/
│   ├── messaging/               # sqs, sns, kinesis, msk, eventbridge, ses
│   ├── storage/
│   ├── security/                # waf, shield, kms, secrets-manager, cognito, iam, cloudtrail
│   ├── integration/             # step-functions, glue-workflow, app-sync, codepipeline, xray
│   ├── analytics/               # redshift, athena, opensearch, glue, sagemaker  ← NOVO
│   ├── annotations/
│   ├── index.ts                 # Entry point com todos os imports
│   ├── index-internal.ts        # Singleton + buildPalette() + CATEGORY_LABELS/ORDER
│   └── types.ts                 # ServiceDefinition, ConfigField, NumberField
└── stores/
    ├── flow-store.ts            # useFlowStore + useTemporalFlowStore
    ├── ui-store.ts              # Todos os painéis UI + templatesDialogOpen
    ├── validation-store.ts      # Reativo via subscribe
    ├── history-store.ts         # Snapshots persistidos
    └── ...
```
