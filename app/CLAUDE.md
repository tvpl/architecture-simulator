# CLAUDE.md — AWS Architecture Simulator

Guia para desenvolvedores e agentes de IA trabalhando neste repositório.

## Comandos Essenciais

```bash
cd app/                      # SEMPRE trabalhar a partir daqui
npm run dev                  # Dev server → http://localhost:3000
npm run build                # DEVE passar com 0 erros antes de commit
npm test                     # Vitest — 38 testes
npm run lint                 # ESLint
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
| Painéis UI | `ui-store.ts` | — | Open/close de todos os painéis |
| Tema | `theme-store.ts` | localStorage `aws-arch-theme` | light/dark |
| Validação | `validation-store.ts` | — | Erros/avisos reativos |
| Histórico | `history-store.ts` | localStorage `aws-arch-history` | Snapshots nomeados |

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
| `src/domain/entities/edge.ts` | `ConnectionProtocol`, `PROTOCOL_INFO` |
| `src/domain/services/simulation-engine.ts` | `runSimulation()` — DFS + bottleneck detection |
| `src/domain/services/cost.ts` | `calculateServiceCost()`, `buildCostBreakdown()` |
| `src/domain/services/cloudformation.ts` | `generateCloudFormationTemplate()` |
| `src/registry/index.ts` | Entry point público com todos os imports |
| `src/registry/index-internal.ts` | Registry singleton + `CATEGORY_LABELS/ORDER` |
| `src/stores/flow-store.ts` | `useFlowStore` + `useTemporalFlowStore` |
| `src/components/canvas/FlowCanvas.tsx` | Canvas + CanvasEffects + context menu |
| `src/lib/templates.ts` | 6 templates de arquitetura pré-prontos |

## Componentes de Nó

| Tipo no Store | Renderer | Quando usar |
|---------------|----------|-------------|
| `service-node` | `ServiceNode` | Todos os serviços AWS comuns |
| `container-node` | `ContainerNode` | VPC, Subnet |
| `note-node` | `NoteNode` | Nós do tipo "note" |

FlowCanvas mapeia `node.data.type === "note"` para `type: "note-node"` automaticamente.

## Regras de Qualidade

- **DO**: Usar `cn()` de `@/lib/utils` para classes condicionais
- **DO**: Usar `formatUSD/formatLatency/formatThroughput` de `@/lib/formatters`
- **DO**: Rodar `npm run build` após cada mudança significativa
- **DO**: Manter `38 tests passing` — adicionar testes para nova lógica de domínio
- **DON'T**: Importar React em `src/domain/`
- **DON'T**: Usar `any` — usar unions discriminadas ou `unknown` com cast
- **DON'T**: Adicionar `"use client"` em domain services ou API routes

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

## Estrutura do Projeto

```
src/
├── app/
│   ├── editor/page.tsx          # Rota principal do editor
│   └── api/
│       ├── simulation/route.ts
│       ├── cost/route.ts
│       ├── validate/route.ts
│       └── export/cloudformation/route.ts
├── components/
│   ├── canvas/
│   │   ├── FlowCanvas.tsx       # Canvas principal
│   │   └── NodeContextMenu.tsx  # Menu de contexto
│   ├── dialogs/
│   │   └── TemplatesDialog.tsx  # 6 templates pré-prontos
│   ├── panels/
│   │   ├── PropertiesPanel.tsx
│   │   ├── SimulationPanel.tsx
│   │   ├── ValidationPanel.tsx  # Erros/avisos em tempo real
│   │   ├── WhatIfPanel.tsx      # Análise de custo what-if
│   │   └── HistoryPanel.tsx     # Snapshots com restauração
│   ├── nodes/base/
│   │   ├── ServiceNode.tsx      # Nó universal AWS
│   │   ├── NoteNode.tsx         # Sticky note colorida
│   │   └── ContainerNode.tsx    # VPC/Subnet
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
│   ├── compute/, networking/, messaging/
│   ├── storage/, security/, integration/, annotations/
│   ├── index.ts                 # Entry point com imports
│   ├── index-internal.ts        # Singleton + buildPalette()
│   └── types.ts                 # ServiceDefinition, ConfigField
└── stores/
    ├── flow-store.ts            # useFlowStore + useTemporalFlowStore
    ├── ui-store.ts              # Todos os painéis UI
    ├── validation-store.ts      # Reativo via subscribe
    ├── history-store.ts         # Snapshots persistidos
    └── ...
```
