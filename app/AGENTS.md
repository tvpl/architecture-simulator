# AGENTS.md — AWS Architecture Simulator

Guia para agentes autônomos trabalhando neste repositório. Leia este arquivo inteiro antes de fazer qualquer mudança.

**Stack**: Next.js 16.2 App Router · React 19 · @xyflow/react v12 · Zustand v5 · zundo · Tailwind v4 · Recharts v3 · Framer Motion v12 · Zod v4 · Vitest

---

## Setup obrigatório antes de qualquer mudança

```bash
cd app/                      # SEMPRE trabalhar a partir daqui
npm install                  # garantir dependências
npm run build                # verificar estado atual — DEVE ter 0 erros
npm test                     # verificar testes — TODOS devem passar (95)
npm run lint                 # verificar lint — DEVE ter 0 errors
```

---

## Após cada mudança de código

```bash
npm run build        # TypeScript + Next.js — 0 erros obrigatório
npm test             # Vitest — todos passando obrigatório
npm run lint         # ESLint — 0 errors obrigatório
```

**NUNCA** faça commit de código que quebra o build, testes ou lint.

---

## Comandos disponíveis

```bash
npm run dev                    # Dev server → http://localhost:3000
npm run build                  # Build de produção (verificar antes do commit)
npm test                       # Vitest (modo run)
npm run test:watch             # Vitest em modo watch
npm run lint                   # ESLint
```

---

## Adicionando um novo serviço AWS

Seguir esta sequência **em ordem**. Pular qualquer passo causa erro de build.

```
1. src/domain/entities/node.ts
   - Adicionar ao array AWS_SERVICE_TYPES
   - Criar interface MyServiceConfig
   - Adicionar "my-service": MyServiceConfig à ServiceConfigMap
   - Adicionar "my-service": "categoria" ao SERVICE_CATEGORY_MAP

2. src/domain/constants/defaults.ts
   - Adicionar entry a SERVICE_DEFAULTS

3. src/registry/<categoria>/index.ts
   - registry.register({ type, label, category, iconName, ... })

4. src/domain/services/cost.ts
   - Adicionar case "my-service": ao switch

5. src/domain/services/latency.ts
   - Adicionar à BASE_LATENCY_MS record

6. src/domain/services/throughput.ts
   - Adicionar case "my-service": ao switch

7. src/domain/services/availability.ts
   - Adicionar à BASE_AVAILABILITY record

8. src/domain/services/cloudformation.ts
   - Adicionar case "my-service": ao switch
   - Se não gerar recurso CF, retornar {}
```

### Adicionando nova categoria

Além dos 8 passos acima:
- Adicionar à tuple `NODE_CATEGORIES` em `node.ts`
- Adicionar ao `CATEGORY_LABELS` e `CATEGORY_ORDER` em `registry/index-internal.ts`
- Criar `registry/<nova-categoria>/index.ts`
- Importar em `registry/index.ts`

---

## Regras invioláveis do domínio

1. Arquivos em `src/domain/` — **zero** imports de `react`, `next`, `@xyflow/react`, stores
2. Todos os domain services são funções puras — sem side effects, sem estado global
3. `npm run build` **0 erros** antes de qualquer commit
4. Zod v4: `z.record(z.string(), z.unknown())` — dois argumentos (não um)
5. `[key: string]: unknown` em `ArchitectureNodeBase` e `ConnectionEdge` — não remover (React Flow v12)
6. Sem `any` — usar unions discriminadas ou `unknown` com cast explícito
7. Em JSX, escapar aspas com `{'"'}` — **não usar** `&ldquo;`/`&rdquo;` (incompatível com algumas versões do ESLint)

---

## Pontos de integração críticos

| Componente | O que faz / regra |
|------------|-------------------|
| `FlowCanvas.tsx` | `CanvasEffects` DEVE ser filho de `<ReactFlow>` (usa `useReactFlow`) |
| `FlowCanvas.tsx` | `typedNodes` memo roteia `node.data.type === "note"` → `type: "note-node"` |
| `FlowCanvas.tsx` | Contexto menu: `onNodeContextMenu` + estado `ContextMenuState` |
| `FlowCanvas.tsx` | Rename inline: overlay input fora do ReactFlow |
| `FlowCanvas.tsx` | Multi-select: `onSelectionChange` → `selectedIds`; bulk toolbar aparece com ≥2 selecionados |
| `editor/page.tsx` | `GlobalDialogs` monta `<TemplatesDialog>` — não instanciar em outros componentes |
| `Navbar.tsx` | Usa `openTemplatesDialog()` do `useUIStore` (não gerencia estado local) |
| `NodeContextMenu.tsx` | `SERVICE_PRESETS` — mapa de presets por tipo de serviço |
| `ProtocolEdge.tsx` | Duplo clique no badge → inline editor → `updateEdgeData(id, { label })` |
| `WhatIfPanel.tsx` | Descobre campos via registry `configSections`, filtra por `skipKeys`, ordena por `priorityKeys` |
| `HistoryPanel.tsx` | Diff badge compara `snap.nodes.length` / `snap.edges.length` vs `useFlowStore` atual |
| `CostDashboard.tsx` | Budget state local; `budgetPct` calculado APÓS `totalMonthlyCost` ser declarado |
| `SimulationPanel.tsx` | PieChart (custo) + BarChart (recursos) via recharts |
| `PropertiesPanel.tsx` | Campos dinâmicos via `registry.get(type).configSections` |
| `ValidationPanel.tsx` | Lê `useValidationStore`, click → `selectNode` |
| `ContainerNode.tsx` | `CONTAINER_THEMES` por tipo (vpc=violet, subnet=blue, security-group=slate) |
| `layout.tsx` | `<ThemeProvider>` + `<Toaster>` obrigatórios no body |

---

## Sistema de stores (Zustand)

| Store | Arquivo | Persistência | Responsabilidade |
|-------|---------|-------------|-----------------|
| Nodes/Edges | `flow-store.ts` | `localStorage aws-arch-v2` | Canvas state + undo/redo (zundo) |
| Simulação | `simulation-store.ts` | — | Resultados e status da simulação |
| Camada ativa | `layer-store.ts` | — | architecture/services/cost/simulation |
| Painéis UI | `ui-store.ts` | — | Open/close de TODOS os painéis e diálogos |
| Tema | `theme-store.ts` | `localStorage aws-arch-theme` | light/dark |
| Validação | `validation-store.ts` | — | Erros/avisos reativos via subscribe |
| Histórico | `history-store.ts` | `localStorage aws-arch-history` | Snapshots nomeados (max 20) |

### Undo/redo (zundo)

```typescript
// Em componentes React:
import { useTemporalFlowStore } from "@/stores/flow-store";
const { undo, redo } = useTemporalFlowStore((s) => s);

// Fora de componentes (event handlers, callbacks):
(useFlowStore as any).temporal.getState().undo();
```

### ui-store — campos disponíveis

```typescript
const {
  // Painéis
  propertiesPanelOpen, openPropertiesPanel, closePropertiesPanel,
  simulationPanelOpen, openSimulationPanel, closeSimulationPanel,
  validationPanelOpen, toggleValidationPanel, openValidationPanel, closeValidationPanel,
  whatIfPanelOpen,    toggleWhatIfPanel,
  historyPanelOpen,   toggleHistoryPanel,
  // Diálogos
  templatesDialogOpen, openTemplatesDialog, closeTemplatesDialog,
  // Auto-layout
  requestAutoLayout, setAutoLayoutDone,
} = useUIStore();
```

---

## Tipos e sistema de tipos

```typescript
// React Flow wrappers (SEMPRE usar, não Node<> nu):
type FlowNode = Node<ArchitectureNode>
type FlowEdge = Edge<ConnectionEdge>

// Registry:
import { registry } from "@/registry";
const def = registry.get("lambda");  // ServiceDefinition | undefined

// Nodes especiais:
// "note"           → renderizado por NoteNode via type: "note-node"
// "vpc" / "subnet" → renderizado por ContainerNode via type: "container-node"
// todos os outros  → renderizado por ServiceNode via type: "service-node"

// Framer Motion — ease como tupla explícita:
transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
```

---

## Componentes de nó no React Flow

| type no store data | React Flow type | Renderer |
|--------------------|-----------------|----------|
| `"note"` | `"note-node"` | `NoteNode` |
| `"vpc"`, `"subnet"`, `"security-group"` | `"container-node"` | `ContainerNode` |
| todos os outros | `"service-node"` | `ServiceNode` |

A lógica de roteamento está em `FlowCanvas.tsx` no memo `typedNodes`.

---

## Funcionalidades implementadas

### Canvas vazio — onboarding
Quando `nodes.length === 0`, um painel animado (framer-motion) é exibido com botões para:
- Abrir a paleta de comandos (`openCommandPalette`)
- Abrir templates (`openTemplatesDialog`)
- Importar JSON (file input oculto)

### Multi-select e bulk actions
- `multiSelectionKeyCode="Shift"`, `selectionOnDrag={true}` no `<ReactFlow>`
- `onSelectionChange` atualiza `selectedIds` state
- Quando `selectedCount >= 2`: toolbar flutuante com botões Duplicar e Deletar

### Context menu — presets de configuração
- `SERVICE_PRESETS` em `NodeContextMenu.tsx` — mapa `Record<string, ServicePreset[]>`
- Seção "Configurações rápidas" aparece para nós L1 com presets definidos
- Preset ativo destacado com `bg-primary`
- Clicar chama `updateNodeConfig(nodeId, preset.config)`
- Serviços com presets: `lambda`, `ec2`, `ecs`, `rds`, `dynamodb`, `elasticache`, `eks`

### Edge label inline editor
- Duplo clique no badge de protocolo → `editing = true`
- `<input>` inline com `autoFocus`; `Enter`/`blur` → `commitEdit()`; `Escape` → cancelar
- Salvo via `updateEdgeData(id, { label: trimmed || undefined })`
- Label customizado exibido como chip abaixo do badge de protocolo

### WhatIfPanel — auto-discovery
- Descobre `NumberField` via `registry.get(node.type).configSections`
- Filtra `skipKeys` (campos sem impacto em custo)
- Ordena por `priorityKeys` (campos mais custo-impactantes primeiro)
- Máximo 2 campos por nó

### HistoryPanel — diff badges
- `computeDiff(snap, currentNodes, currentEdges)` → `{ nodeDiff, edgeDiff }`
- Badges coloridos: emerald (+nós), red (-nós), blue (+conexões), orange (-conexões)

### CostDashboard — alerta de orçamento
- `budgetInput` state local (string); convertido para número após declaração de `totalMonthlyCost`
- `budgetStatus`: `"none"` | `"ok"` | `"warn"` (≥80%) | `"over"` (≥100%)
- Barra de progresso + mensagem com valor excedido

### ContainerNode — temas
- `CONTAINER_THEMES` map: `{ vpc: violet, subnet: blue, "security-group": slate }`
- Cada tema tem: `border`, `bg`, `accentBg`, `badge` classes
- Barra de acento no topo (`h-1 rounded-t-xl`) + badge de contador de filhos

### Context menu (estrutura geral)
- Componente: `src/components/canvas/NodeContextMenu.tsx`
- Estado em `FlowCanvas.tsx`: `ContextMenuState { nodeId, x, y }`
- Seções: Ações (renomear/duplicar/propriedades) → Configurações rápidas (L1 com presets) → Mover para host (L2) → Escalar réplicas (L2) → Danger zone (remover)
- Fecha ao clicar fora ou pressionar Escape

### Rename inline
- Ativado por: double-click no nó, F2, ou context menu → Renomear
- Overlay `<input>` fora do ReactFlow em `FlowCanvas.tsx`

### Templates de arquitetura
- Definidos em: `src/lib/templates.ts`
- 6 templates: Serverless API, Web App com ALB, Microsserviços ECS, Data Pipeline, App Segura, Event-Driven
- Dialog: `src/components/dialogs/TemplatesDialog.tsx`
- Gerenciado globalmente via `GlobalDialogs` em `editor/page.tsx`

### Note nodes (anotações)
- Tipo: `"note"` em `AWSServiceType`
- Config: `NoteConfig { content: string; color: "yellow"|"blue"|"green"|"pink"|"purple" }`
- Renderer: `NoteNode` em `src/components/nodes/base/NoteNode.tsx`

### CloudFormation export
- Função pura: `src/domain/services/cloudformation.ts` → `generateCloudFormationTemplate()`
- API route: `POST /api/export/cloudformation`
- Botão na Navbar → download de arquivo `.yaml`

### Version history (snapshots)
- Store: `src/stores/history-store.ts` (persist localStorage)
- Max 20 snapshots, nomeados com timestamp
- Componente: `src/components/panels/HistoryPanel.tsx`
- Diff badges por snapshot (±nós/conexões vs canvas atual)

### Auto-layout (dagre)
- Hook: `src/hooks/use-auto-layout.ts`
- Trigger: `setRequestAutoLayout(true)` em `useUIStore`
- Executado em `CanvasEffects` (dentro do ReactFlow) via `useReactFlow().setNodes/setEdges`

---

## Estrutura de arquivos de testes

```
src/
├── domain/
│   ├── services/__tests__/
│   │   ├── simulation-engine.test.ts   (testes do motor de simulação)
│   │   ├── cost.test.ts                (testes de custo)
│   │   └── cloudformation.test.ts      (testes de geração CF)
│   └── validators/__tests__/
│       └── architecture.test.ts        (testes de validação)
```

Padrão de import nos testes:
```typescript
import { describe, it, expect } from "vitest";
import { runSimulation } from "@/domain/services/simulation-engine";
```

---

## Arquivos críticos — referência rápida

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/domain/entities/node.ts` | `AWSServiceType`, `ServiceConfigMap`, `ArchitectureNode`, `NODE_CATEGORIES` |
| `src/domain/entities/edge.ts` | `ConnectionProtocol`, `PROTOCOL_INFO`, `ConnectionEdge.label` |
| `src/domain/services/simulation-engine.ts` | `runSimulation()` — DFS + bottleneck detection |
| `src/domain/services/cost.ts` | `calculateServiceCost()`, `buildCostBreakdown()` |
| `src/domain/services/cloudformation.ts` | `generateCloudFormationTemplate()` |
| `src/domain/services/latency.ts` | `BASE_LATENCY_MS`, `calculateLatency()` |
| `src/domain/services/throughput.ts` | `calculateThroughput()` |
| `src/domain/services/availability.ts` | `BASE_AVAILABILITY`, `calculateAvailability()` |
| `src/registry/index.ts` | Entry point público com todos os imports |
| `src/registry/index-internal.ts` | Registry singleton + `CATEGORY_LABELS/ORDER` |
| `src/registry/analytics/index.ts` | Redshift, Athena, OpenSearch, Glue, SageMaker |
| `src/stores/flow-store.ts` | `useFlowStore` + `useTemporalFlowStore` |
| `src/stores/ui-store.ts` | Estado de TODOS os painéis + diálogos + autoLayout flag |
| `src/components/canvas/FlowCanvas.tsx` | Canvas + onboarding + multi-select + context menu + rename |
| `src/components/canvas/NodeContextMenu.tsx` | Menu de contexto + `SERVICE_PRESETS` |
| `src/components/edges/ProtocolEdge.tsx` | Edge renderer + inline label editor |
| `src/components/views/CostDashboard.tsx` | Dashboard L3 + alerta de orçamento |
| `src/components/nodes/base/ContainerNode.tsx` | VPC/Subnet + accent bar + children count |
| `src/components/panels/WhatIfPanel.tsx` | What-if com auto-discovery via registry |
| `src/components/panels/HistoryPanel.tsx` | Snapshots + diff badges |
| `src/lib/templates.ts` | 6 templates de arquitetura pré-prontos |
| `src/app/page.tsx` | Landing page (/) |
| `src/app/editor/page.tsx` | Rota principal — monta todos os painéis + GlobalDialogs |
| `src/app/layout.tsx` | `<ThemeProvider>` + `<Toaster>` |

---

## Rotas da API

| Rota | Método | Body | Retorno |
|------|--------|------|---------|
| `/api/simulation` | POST | `{ nodes, edges }` | `SimulationResult` |
| `/api/cost` | POST | `{ nodes }` | `CostBreakdown[]` |
| `/api/validate` | POST | `{ nodes, edges }` | `ValidationResult` |
| `/api/export/cloudformation` | POST | `{ nodes, edges, projectName }` | YAML string |

---

## Checklist de verificação após implementação

```bash
# 1. Build sem erros
cd app && npm run build

# 2. Todos os testes passando (95)
npm test

# 3. Lint sem erros
npm run lint

# 4. Verificar manualmente:
# - Abrir / → landing page renderiza
# - Abrir /editor → canvas vazio com onboarding
# - Arrastar Lambda + RDS + S3 para o canvas
# - Conectar os nós
# - Clicar Simular → SimulationPanel aparece
# - Clique direito no nó → context menu com presets
# - Duplo clique em aresta → inline label editor
# - Selecionar 2+ nós → toolbar flutuante de bulk actions
# - Aba Custos → definir orçamento e verificar alerta
# - Painel Histórico → salvar snapshot, verificar diff badge
# - Alternar dark mode
# - Recarregar página → diagrama persiste
# - Exportar CloudFormation → arquivo .yaml é baixado
```
