# AGENTS.md — AWS Architecture Simulator

Guia para agentes autônomos trabalhando neste repositório. Leia este arquivo inteiro antes de fazer qualquer mudança.

**Stack**: Next.js 16.2 App Router · React 19 · @xyflow/react v12 · Zustand v5 · zundo · Tailwind v4 · Recharts v3 · Framer Motion v12 · Zod v4 · Vitest

---

## Setup obrigatório antes de qualquer mudança

```bash
cd app/                      # SEMPRE trabalhar a partir daqui
npm install                  # garantir dependências
npm run build                # verificar estado atual — DEVE ter 0 erros
npm test                     # verificar testes — TODOS devem passar
```

---

## Após cada mudança de código

```bash
npm run build        # TypeScript + Next.js — 0 erros obrigatório
npm test             # Vitest — todos passando obrigatório
```

**NUNCA** faça commit de código que quebra o build ou testes.

---

## Comandos disponíveis

```bash
npm run dev                    # Dev server → http://localhost:3000
npm run build                  # Build de produção (verificar antes do commit)
npm test                       # Vitest (modo run)
npm run test:watch             # Vitest em modo watch
npm run lint                   # ESLint
git push -u origin claude/system-architecture-design-N3U6r
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

---

## Pontos de integração críticos

| Componente | O que faz / regra |
|------------|-------------------|
| `FlowCanvas.tsx` | `CanvasEffects` DEVE ser filho de `<ReactFlow>` (usa `useReactFlow`) |
| `FlowCanvas.tsx` | `typedNodes` memo roteia `node.data.type === "note"` → `type: "note-node"` |
| `FlowCanvas.tsx` | Contexto menu: `onNodeContextMenu` + estado `ContextMenuState` |
| `FlowCanvas.tsx` | Rename inline: overlay input fora do ReactFlow |
| `Navbar.tsx` | Todos os botões de ação (simulate, export, templates, validation, what-if) |
| `SimulationPanel.tsx` | PieChart (custo) + BarChart (recursos) via recharts |
| `PropertiesPanel.tsx` | Campos dinâmicos via `registry.get(type).configSections` |
| `WhatIfPanel.tsx` | Override local + recompute com `calculateServiceCost` |
| `ValidationPanel.tsx` | Lê `useValidationStore`, click → `selectNode` |
| `HistoryPanel.tsx` | Snapshots de `history-store`, restaura via `importProject` |
| `layout.tsx` | `<ThemeProvider>` + `<Toaster>` obrigatórios no body |
| `editor/page.tsx` | `<ErrorBoundary>` em volta do `<FlowCanvas>` |

---

## Sistema de stores (Zustand)

| Store | Arquivo | Persistência | Responsabilidade |
|-------|---------|-------------|-----------------|
| Nodes/Edges | `flow-store.ts` | `localStorage aws-arch-v2` | Canvas state + undo/redo (zundo) |
| Simulação | `simulation-store.ts` | — | Resultados e status da simulação |
| Camada ativa | `layer-store.ts` | — | architecture/services/cost/simulation |
| Painéis UI | `ui-store.ts` | — | Open/close de TODOS os painéis |
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

### ui-store — campos obrigatórios

```typescript
// Painéis disponíveis em useUIStore:
simulationPanelOpen, toggleSimulationPanel
propertiesPanelOpen, togglePropertiesPanel
validationPanelOpen, toggleValidationPanel, openValidationPanel, closeValidationPanel
whatIfPanelOpen, toggleWhatIfPanel
historyPanelOpen, toggleHistoryPanel
requestAutoLayout       // flag booleano, setAutoLayoutDone() para resetar
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
// "note" → renderizado por NoteNode via type: "note-node"
// "vpc" / "subnet" → renderizado por ContainerNode via type: "container-node"
// Todos os outros → renderizado por ServiceNode via type: "service-node"
```

---

## Componentes de nó no React Flow

| type no store data | React Flow type | Renderer |
|--------------------|-----------------|----------|
| `"note"` | `"note-node"` | `NoteNode` |
| `"vpc"`, `"subnet"` | `"container-node"` | `ContainerNode` |
| todos os outros | `"service-node"` | `ServiceNode` |

A lógica de roteamento está em `FlowCanvas.tsx` no memo `typedNodes`.

---

## Funcionalidades implementadas

### Context menu (clique direito em nó)
- Componente: `src/components/canvas/NodeContextMenu.tsx`
- Estado em `FlowCanvas.tsx`: `ContextMenuState { nodeId, x, y }`
- Ações: Renomear (abre rename overlay), Duplicar, Propriedades, Remover
- Fecha ao clicar fora ou pressionar Escape

### Rename inline
- Ativado por: double-click no nó, F2, ou context menu → Renomear
- Implementado em `FlowCanvas.tsx`: overlay `<input>` fora do ReactFlow
- Posicionado via `reactFlowInstance.getNode(id).position` + `reactFlowInstance.project()`
- Note nodes têm edição própria via textarea (não usa este mecanismo)

### Validation panel
- Componente: `src/components/panels/ValidationPanel.tsx`
- Slide-up animation (bottom) com framer-motion
- Lê erros/avisos de `useValidationStore`
- Click em item com `nodeId` → chama `selectNode`
- Toggle via `validationPanelOpen` no `useUIStore`

### Templates de arquitetura
- Definidos em: `src/lib/templates.ts`
- 6 templates: Serverless API, Web App com ALB, Microsserviços ECS, Data Pipeline, App Segura, Event-Driven
- Dialog: `src/components/dialogs/TemplatesDialog.tsx`
- Carrega via `importProject(template.data)`

### What-if analysis
- Componente: `src/components/panels/WhatIfPanel.tsx`
- Slide-in da direita
- Parâmetros ajustáveis: Lambda memória, EC2 count, RDS storage, S3 size, DynamoDB RCU, ECS tasks, ElastiCache nodes
- Custo projetado recalculado via `calculateServiceCost` com config patched

### Note nodes (anotações)
- Tipo: `"note"` em `AWSServiceType`
- Config: `NoteConfig { content: string; color: "yellow"|"blue"|"green"|"pink"|"purple" }`
- Renderer: `NoteNode` em `src/components/nodes/base/NoteNode.tsx`
- Edição inline por double-click na nota (textarea com `useFlowStore.updateNodeConfig`)
- Categoria: `"annotations"`, custo: $0, latência: 0

### CloudFormation export
- Função pura: `src/domain/services/cloudformation.ts` → `generateCloudFormationTemplate()`
- API route: `POST /api/export/cloudformation`
- Botão na Navbar → download de arquivo `.yaml`
- Note nodes e tipos não suportados retornam `{}`

### Version history (snapshots)
- Store: `src/stores/history-store.ts` (persist localStorage)
- Max 20 snapshots, nomeados com timestamp
- Componente: `src/components/panels/HistoryPanel.tsx`
- Restaurar → `importProject(snapshot.data)`

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
| `src/domain/entities/node.ts` | `AWSServiceType`, `ServiceConfigMap`, `ArchitectureNode` |
| `src/domain/entities/edge.ts` | `ConnectionProtocol`, `PROTOCOL_INFO` |
| `src/domain/services/simulation-engine.ts` | `runSimulation()` — DFS + bottleneck detection |
| `src/domain/services/cost.ts` | `calculateServiceCost()`, `buildCostBreakdown()` |
| `src/domain/services/cloudformation.ts` | `generateCloudFormationTemplate()` |
| `src/domain/services/latency.ts` | `BASE_LATENCY_MS`, `calculateLatency()` |
| `src/domain/services/throughput.ts` | `calculateThroughput()` |
| `src/domain/services/availability.ts` | `BASE_AVAILABILITY`, `calculateAvailability()` |
| `src/registry/index.ts` | Entry point público com todos os imports |
| `src/registry/index-internal.ts` | Registry singleton + `CATEGORY_LABELS/ORDER` |
| `src/stores/flow-store.ts` | `useFlowStore` + `useTemporalFlowStore` |
| `src/stores/ui-store.ts` | Estado de TODOS os painéis + autoLayout flag |
| `src/components/canvas/FlowCanvas.tsx` | Canvas + CanvasEffects + context menu + rename |
| `src/components/canvas/NodeContextMenu.tsx` | Menu de contexto do nó |
| `src/components/nodes/base/NoteNode.tsx` | Nó de anotação com edição inline |
| `src/lib/templates.ts` | 6 templates de arquitetura pré-prontos |
| `src/app/editor/page.tsx` | Rota principal — monta todos os painéis |
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

# 2. Todos os testes passando
npm test

# 3. Lint sem erros críticos
npm run lint

# 4. Verificar manualmente:
# - Abrir /editor
# - Arrastar Lambda + RDS + S3 para o canvas
# - Conectar os nós
# - Clicar Simular → SimulationPanel aparece
# - Verificar aba Custos (PieChart) e Recursos (BarChart)
# - Alternar dark mode
# - Recarregar página → diagrama persiste
# - Clique direito no nó → context menu aparece
# - Exportar CloudFormation → arquivo .yaml é baixado
```
