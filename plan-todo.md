# Plan-Todo — Refatoração Multi-Layer do Architecture Simulator

> **Spec-Driven Development Plan** — rastreamento do trabalho pedido pelo usuário, o que foi implementado, o que resta, e a audição contra os requisitos originais.
>
> **Branch:** `claude/scalable-system-architecture-WbByz`
> **Última atualização:** 2026-04-09

---

## 0. Especificação (Pedido Original do Usuário)

O sistema atual mistura infraestrutura, aplicação, custos e simulação em uma única camada de canvas. O usuário pediu uma refatoração profunda organizada em **4 camadas com propósitos distintos**:

### SPEC-L1 — Camada "Arquitetura" (Macro Infraestrutura)
- **Propósito:** Visão macro de infraestrutura (AWS, Azure, On-Premise).
- **Responsabilidade:** Provisionar componentes que depois serão consumidos pela Layer 2.
- **Restrições:**
  - SEM detalhes de latência/throughput na edição (isso é da L4).
  - Deve exibir um painel de resumo dos componentes provisionados.
  - Nodes são containers lógicos (EC2, EKS, ECS, Lambda, Fargate, RDS, SQS, etc.).

### SPEC-L2 — Camada "Design de Solução" (Aplicação Interna)
- **Propósito:** Mostrar o que roda **DENTRO** da infraestrutura provisionada em L1.
- **Componentes suportados:** Microservice, Worker, Consumer, Producer, API, Sidecar, Ingress Controller, CronJob, Gateway, Database Client, Cache Client, Batch Processor.
- **Restrições:**
  - Só pode usar infraestrutura já provisionada na L1 (host obrigatório).
  - Propriedades ricas de Kubernetes (réplicas, HPA, probes, limits, volumes, etc.).
  - Visualização "o que está dentro de cada EC2/EKS/ECS".

### SPEC-L3 — Camada "Custos" (Dashboard)
- **Propósito:** NÃO é um canvas — é um dashboard de análise financeira.
- **Conteúdo:** Breakdown de custos por categoria, gráficos, projeções, comparativos.

### SPEC-L4 — Camada "Simulação" (Multi-layered)
- **Propósito:** Executar simulação com latência, throughput, gargalos.
- **Requisito:** Visualização **totalmente inovadora e profissional**.

### SPEC-META — Requisitos Transversais
- Qualidade de código (TypeScript estrito, lint limpo, build verde).
- Testes como última etapa.
- Auditoria final garantindo que cada requisito foi atendido "com riqueza e qualidade em detalhes, de forma totalmente inovadora e profissional".
- Pendências ou esquecimentos identificados devem ser planejados e ajustados.

---

## 1. Arquitetura de Solução (Visão Geral)

```
┌──────────────────────────────────────────────────────────────────┐
│                      ProjectData V3                              │
│                                                                  │
│  infrastructure  (L1)    solutionDesign  (L2)                    │
│  ├─ nodes[]              ├─ appNodes[]                           │
│  └─ edges[]              └─ appEdges[]                           │
└──────────────────────────────────────────────────────────────────┘
         ▲                         ▲
         │                         │
┌────────┴─────────┐   ┌──────────┴──────────┐
│ ServiceRegistry  │   │ AppComponentRegistry│
│ (AWS primitives) │   │ (K8s-style units)   │
└──────────────────┘   └─────────────────────┘
         │                         │
         └─────────┬───────────────┘
                   ▼
        ┌───────────────────┐
        │   FlowCanvas      │ ← layer-aware
        └───────────────────┘
         │     │     │     │
        L1    L2    L3    L4
      canvas canvas dash  sim
```

---

## 2. Macroblocos & Tasks

### MB-0 — Fundação (Layer System Foundation)

> Estabelecer o contrato multi-layer antes de mover qualquer UI.

- [x] **T-0.1** Modelar `LayerViewType` e `LAYER_CONFIGS` com `viewType` (`canvas` | `dashboard` | `simulation`) — `domain/entities/layer.ts`
- [x] **T-0.2** Criar `AppComponentType` + `AppComponentConfigMap` com os 12 tipos — `domain/entities/app-component.ts`
- [x] **T-0.3** Definir `HOSTABLE_INFRA_TYPES` e `canHostAppComponent()` — guard de hosting
- [x] **T-0.4** Defaults K8s-style para cada tipo — `domain/constants/app-defaults.ts`
- [x] **T-0.5** `AppComponentRegistry` singleton espelhando `ServiceRegistry` — `registry/app-components/`
- [x] **T-0.6** Módulos de categoria (application, messaging-app, networking-app, scheduling, data-access)

**Status:** Commit `6b9511a` ✅

---

### MB-1 — Partição do Store Multi-Layer

> Separar L1 e L2 no store para que cada camada tenha seus próprios nodes/edges.

- [x] **T-1.1** Partitionar `flow-store` em `nodes/edges` (L1) + `solutionNodes/solutionEdges` (L2)
- [x] **T-1.2** Mutações dedicadas: `addAppComponent`, `updateAppComponentConfig`, `removeAppComponent`, `moveAppComponentToHost`
- [x] **T-1.3** `ProjectData` V3 format + migração backward-compatible V2→V3
- [x] **T-1.4** Persist, undo/redo (zundo), URL hash e import/export contemplam V3
- [x] **T-1.5** History snapshots funcionam nas duas camadas

**Status:** Commit `b311b20` ✅

---

### MB-2 — Canvas Layer-Aware & View Routing

> FlowCanvas renderiza L1 OU L2 conforme layer ativa. L3 e L4 têm suas próprias views.

- [x] **T-2.1** `FlowCanvas` lê `activeLayer.viewType` e roteia para L1 ou L2
- [x] **T-2.2** `AppServiceNode` — renderer de node L2 com overlays
- [x] **T-2.3** `CostDashboard` — view não-canvas para L3
- [x] **T-2.4** `SimulationView` — view dedicada para L4
- [x] **T-2.5** `InfrastructureSummaryPanel` — painel flutuante de L1 com resumo de componentes provisionados
- [x] **T-2.6** `editor/page.tsx` renderiza condicional por `viewType`

**Status:** Commit `92f00d8` ✅

---

### MB-3 — Propriedades, Validação, Templates & Custos (Fase 4-7)

> Tornar L2 editável com propriedades ricas, validação cross-layer, templates e custos.

- [x] **T-3.1** `PropertiesPanel` layer-aware com `AppComponentPropertiesContent`
- [x] **T-3.2** Host selector que lista apenas nodes `canHostAppComponent()`
- [x] **T-3.3** `validateSolutionDesign()` — validação isolada de L2
- [x] **T-3.4** `validateCrossLayer()` — valida referências L1↔L2
- [x] **T-3.5** `validation-store` reativa aos dois layers + cross-layer
- [x] **T-3.6** `templates.ts` com `toV3()`, helper `appNode()`, templates "Full-Stack EKS" e "Microservices"
- [x] **T-3.7** Categoria "full-stack" no `TemplatesDialog` + contagem de componentes L2
- [x] **T-3.8** `estimateAppComponentCost()` — custo de vCPU, memória, logs via pricing Fargate

**Status:** Commit `1f3ff5f` ✅

---

### MB-4 — Riqueza Visual L2 (HostGroupNode & Overlays)

> Representação "o que está dentro" — requisito explícito do usuário.

- [x] **T-4.1** `HostGroupNode` — container visual dashed-border colorido por tipo de host (amber/teal/blue/orange/cyan)
- [x] **T-4.2** FlowCanvas cria `hostGroupNodes` via `useMemo` e os coloca atrás dos AppNodes (zIndex: -1)
- [x] **T-4.3** `AppServiceNode` rewrite: health check, metrics indicator, HPA scaling bar color-coded, range de réplicas

**Status:** Implementado, pendente commit ⚠️

---

### MB-5 — K8s Export & Context Menu L2

> Export profissional + interações ricas.

- [x] **T-5.1** `k8s-export.ts` — gera YAML multi-doc (Deployment, Service, HPA, CronJob, Ingress, Job, ConfigMap, Sidecar Annotation)
- [x] **T-5.2** Includes de resource requests + limits, health probes, labels
- [x] **T-5.3** `NodeContextMenu` layer-aware — "Mover para host", "Escalar réplicas" (1/2/3/5/10)
- [x] **T-5.4** Botão "Exportar K8s" na `Navbar` com dynamic import

**Status:** Implementado, pendente commit ⚠️

---

### MB-6 — L3 Dashboard Enriquecido

> Dashboard de custos com visualizações inovadoras.

- [x] **T-6.1** SVG `MiniPieChart` (donut) sem dependências externas
- [x] **T-6.2** `PIE_COLORS` para categorias consistentes
- [x] **T-6.3** Color swatches no breakdown
- [x] **T-6.4** Refactor para pre-compute slice geometry (react-hooks/immutability)
- [ ] **T-6.5** Projeções mensais/anuais com toggle de moeda (USD/BRL)
- [ ] **T-6.6** Comparativo entre ambientes (dev/staging/prod)

**Status:** Parcial — core visual pronto, projeções avançadas pendentes ⚠️

---

### MB-7 — L4 Simulação Inovadora

> Visualização "totalmente inovadora e profissional" de gargalos, critical path, utilização.

- [x] **T-7.1** Sidebar de gargalos clicável (256px) que seleciona node no canvas
- [x] **T-7.2** Critical path section com latência calculada
- [x] **T-7.3** Heatmap de utilização de recursos ordenado e color-coded
- [x] **T-7.4** Recomendações tipadas por severity
- [ ] **T-7.5** Timeline playback (play/pause/step) — "inovador"
- [ ] **T-7.6** Animação de partículas nas edges durante simulação

**Status:** Parcial — insights panel pronto, animação avançada pendente ⚠️

---

### MB-8 — Registries Enriquecidos (Limites, Observabilidade, Volumes)

> Cobertura completa de propriedades K8s em todas as categorias.

- [x] **T-8.1** `application/` — Limites + Observabilidade + Volumes em microservice, worker, api, batch-processor
- [x] **T-8.2** `messaging-app/` — Limites em consumer, producer
- [x] **T-8.3** `networking-app/gateway` — Limites + Observabilidade
- [x] **T-8.4** `networking-app/sidecar` — Limites + Observabilidade
- [x] **T-8.5** `networking-app/ingress-controller` — Limites + Observabilidade
- [x] **T-8.6** `scheduling/cronjob` — Limites + Observabilidade
- [x] **T-8.7** `data-access/database-client` — Observabilidade
- [x] **T-8.8** `data-access/cache-client` — Observabilidade

**Status:** Completo, pendente commit ⚠️

---

### MB-9 — Qualidade de Código (Type-check, Lint, Build)

> SPEC-META: build verde antes de commitar.

- [x] **T-9.1** Fix `NodeContextMenu.tsx` — casts `as unknown as Record<string, unknown>`
- [x] **T-9.2** Fix `SimulationView.tsx` — `rec.severity` em vez de `rec.type` (checado em `entities/simulation.ts`)
- [x] **T-9.3** Fix `CostDashboard.tsx` — refactor mutação `cumulativeAngle` → `reduce` imutável
- [x] **T-9.4** Fix `HostGroupNode.tsx` — remover `hostId` unused
- [x] **T-9.5** `npx tsc --noEmit` — 0 erros fora do pre-existente `cost.test.ts`
- [x] **T-9.6** `npm run lint` — clean
- [x] **T-9.7** `npm run build` — Next.js 16.2.2 build OK

**Status:** Completo ✅

---

### MB-10 — Testes (Por Último, conforme pedido)

> Cobertura de testes para as novas áreas.

- [x] **T-10.1** `solution-design.test.ts` — validateSolutionDesign + validateCrossLayer (criado)
- [ ] **T-10.2** `app-component-cost.test.ts` — estimateAppComponentCost com diferentes CPU/mem/replicas
- [ ] **T-10.3** `k8s-export.test.ts` — snapshot de YAML gerado para cada tipo L2
- [ ] **T-10.4** `flow-store.test.ts` — addAppComponent, moveAppComponentToHost, V2→V3 migration
- [ ] **T-10.5** Executar suite completa — garantir 38 testes anteriores + novos passam

**Status:** Parcial — solution-design test criado, restantes pendentes ⚠️

---

### MB-11 — Commit, Push & Deploy

- [ ] **T-11.1** `git add` dos arquivos modificados/criados em MB-4, MB-5, MB-6, MB-7, MB-8, MB-9, MB-10
- [ ] **T-11.2** Commit Phase 8 com mensagem descritiva
- [ ] **T-11.3** Push para `origin/claude/scalable-system-architecture-WbByz`

**Status:** Pendente ⏳

---

### MB-12 — Auditoria Final contra SPEC

> SPEC-META: "valide se todos os requisitos pedidos inicialmente foram atendidos com riqueza e qualidade".

- [ ] **T-12.1** SPEC-L1: painel de resumo presente ✅ / sem latência na edição ✅ / macro infraestrutura ✅
- [ ] **T-12.2** SPEC-L2: 12 tipos de componentes ✅ / só usa infra L1 ✅ / propriedades K8s ricas ✅ / "dentro de EC2/EKS" visível (HostGroupNode) ✅
- [ ] **T-12.3** SPEC-L3: é dashboard, não canvas ✅ / breakdown ✅ / pie chart ✅ / projeções (parcial)
- [ ] **T-12.4** SPEC-L4: gargalos ✅ / critical path ✅ / heatmap ✅ / recomendações ✅ / inovador (parcial — falta timeline/animação)
- [ ] **T-12.5** Gerar relatório final com checklist por SPEC-Lx

**Status:** Pendente — será feito após MB-11 ⏳

---

## 3. Matriz de Rastreabilidade SPEC ↔ MB

| SPEC        | Macrobloco(s)              | Status |
|-------------|----------------------------|--------|
| SPEC-L1     | MB-0, MB-1, MB-2, MB-3     | ✅     |
| SPEC-L2     | MB-0, MB-3, MB-4, MB-5, MB-8 | ✅   |
| SPEC-L3     | MB-2, MB-6                 | ⚠️ parcial |
| SPEC-L4     | MB-2, MB-7                 | ⚠️ parcial |
| SPEC-META   | MB-9, MB-10, MB-11, MB-12  | 🚧 em andamento |

---

## 4. Estado Atual (Snapshot)

### Commits já no branch
1. `6b9511a` — Phase 0: Layer system foundation + L2 domain
2. `b311b20` — Phase 1: Multi-layer store partition
3. `92f00d8` — Phase 2-3: Layer-aware canvas + views
4. `1f3ff5f` — Phase 4-7: Properties, validation, templates, costs

### Trabalho uncommitted (pronto para Phase 8 commit)
- HostGroupNode + FlowCanvas integration
- k8s-export service + Navbar export button
- NodeContextMenu layer-aware rewrite
- AppServiceNode overlays rewrite
- SimulationView insights panel rewrite
- CostDashboard pie chart enhancement
- Registry enrichment (Limites + Observabilidade + Volumes) em 5 categorias
- Fixes de lint/type-check
- `solution-design.test.ts` (criado)

### Build status
- `tsc --noEmit`: ✅ clean (exceto `cost.test.ts` pre-existente)
- `npm run lint`: ✅ clean
- `npm run build`: ✅ Next.js 16.2.2 OK
- `npm test`: ✅ 38/38 passando (ainda não incluindo o novo solution-design.test)

---

## 5. Próximos Passos Imediatos

1. **MB-10 continuação:** Rodar `npm test` com o novo `solution-design.test.ts`, garantir que passa.
2. **MB-10 T-10.2/T-10.3/T-10.4:** Escrever testes restantes.
3. **MB-11:** Commit + push da Phase 8.
4. **MB-12:** Auditoria final escrita contra SPEC.
5. **MB-6 T-6.5/T-6.6 + MB-7 T-7.5/T-7.6:** Decidir se fazemos como Phase 9 ou deixamos como roadmap.

---

## 6. Convenções de Status

- [x] ✅ Completo e commitado
- [x] (sem commit) ⚠️ Implementado localmente, aguardando commit
- [ ] 🚧 Em andamento
- [ ] ⏳ Pendente
- [ ] ❌ Bloqueado

---

_Este documento é a fonte-verdade de progresso. Atualize-o a cada checkpoint._
