# CLAUDE.md — AWS Architecture Simulator

## Visão geral do projeto

Editor interativo para design, análise e simulação de arquiteturas AWS.
- **Editor**: `/editor` (rota estática, "use client")
- **API**: `/api/simulation`, `/api/cost`, `/api/validate` (server-side)
- **Domínio puro**: `src/domain/` — zero dependências de React/Next.js

---

## Comandos essenciais

```bash
cd app/
npm run dev          # Dev server → http://localhost:3000
npm run build        # Produção (DEVE passar com 0 erros antes de commit)
npm test             # Vitest — testes de domínio
npm run lint         # ESLint
```

---

## Padrão crítico: adicionar um novo serviço AWS

Seguir esta sequência em ordem:

1. **`src/domain/entities/node.ts`**
   - Adicionar type à union `AWSServiceType`
   - Criar interface `MyServiceConfig`
   - Adicionar `"my-service": MyServiceConfig` à `ServiceConfigMap`

2. **`src/domain/constants/defaults.ts`**
   - Adicionar defaults do serviço ao `SERVICE_DEFAULTS`

3. **`src/registry/<categoria>/index.ts`**
   - Registrar `ServiceDefinition` completo com `registry.register({...})`

4. **`src/domain/services/cost.ts`** — adicionar case ao switch de `calculateServiceCost`
5. **`src/domain/services/latency.ts`** — adicionar à `BASE_LATENCY_MS`
6. **`src/domain/services/throughput.ts`** — adicionar ao switch de `calculateMaxThroughput`
7. **`src/domain/services/availability.ts`** — adicionar ao switch de `calculateAvailability`

---

## Regras do domínio

- Arquivos em `src/domain/` **NUNCA** devem importar React, Next.js ou stores
- Todos os serviços de domínio são funções puras — sem side effects, sem estado global
- Tipos discriminados (`ArchitectureNode`, `ConnectionProtocol`) — sem `any`

---

## State management

| Store | Arquivo | Persistência |
|-------|---------|-------------|
| Nodes/Edges | `flow-store.ts` | localStorage `aws-arch-v2` |
| Simulação | `simulation-store.ts` | — |
| Camada ativa | `layer-store.ts` | — |
| Painéis UI | `ui-store.ts` | — |
| Tema | `theme-store.ts` | localStorage `aws-arch-theme` |

---

## Sistema de tipos

```typescript
// React Flow wrappers
type FlowNode = Node<ArchitectureNode>  // Node é do @xyflow/react
type FlowEdge = Edge<ConnectionEdge>

// Registry (auto-registra via side-effect imports em src/registry/index.ts)
import { registry } from "@/registry";
const def = registry.get("lambda");  // ServiceDefinition | undefined
```

---

## Arquivos críticos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/domain/entities/node.ts` | `AWSServiceType`, `ServiceConfigMap`, `ArchitectureNode` |
| `src/domain/entities/edge.ts` | `ConnectionProtocol`, `PROTOCOL_INFO` |
| `src/domain/services/simulation-engine.ts` | `runSimulation()` — DFS + bottleneck detection |
| `src/domain/services/cost.ts` | `calculateServiceCost()`, `buildCostBreakdown()` |
| `src/registry/index.ts` | Entry point público do registry |
| `src/stores/flow-store.ts` | `useFlowStore` — persisted nodes/edges |
| `src/components/canvas/FlowCanvas.tsx` | Canvas principal com animated edges |
| `src/components/simulation/SimulationPanel.tsx` | Resultados com recharts + framer-motion |

---

## Regras de qualidade

- **DO**: Usar `cn()` de `@/lib/utils` para classes condicionais
- **DO**: Usar `formatUSD/formatLatency/formatThroughput` de `@/lib/formatters`
- **DO**: Adicionar serviços via registry pattern (nunca hardcoded em componentes)
- **DO**: Rodar `npm run build` após cada mudança significativa
- **DON'T**: Importar React em `src/domain/`
- **DON'T**: Usar `any` — usar unions discriminadas
- **DON'T**: Modificar `NodeResizer` props no ContainerNode sem testar resize
- **DON'T**: Remover `"use client"` de componentes que usam hooks

---

## Zod v4 notas

```typescript
// CORRETO em Zod v4:
z.record(z.string(), z.unknown())   // 2 argumentos obrigatórios

// ERRADO:
z.record(z.unknown())               // Zod v3 — não funciona em v4
```

---

## React Flow v12 notas

- Tipagem genérica: `ReactFlow<FlowNode, FlowEdge>` necessária para evitar erro de `Record<string, unknown>`
- `ArchitectureNode` precisa ter `[key: string]: unknown` para satisfazer a constraint
- `OnDrop` e `OnDragOver` não são exportados — usar `React.DragEvent<HTMLDivElement>`
- Edges animadas: definir `animated: true` no objeto edge (não via prop do ReactFlow)
