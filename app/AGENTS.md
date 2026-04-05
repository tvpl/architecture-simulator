# AGENTS.md — AWS Architecture Simulator

Guia para agentes autônomos trabalhando neste repositório.
**Next.js 16.2 com App Router** — APIs e convenções diferem do Next.js 13/14. Sempre verificar `node_modules/next/dist/docs/` em caso de dúvida.

---

## Setup obrigatório antes de qualquer mudança

```bash
cd app/
npm install          # garantir dependências
npm run build        # verificar estado atual — DEVE passar
npm test             # verificar testes — DEVEM passar
```

---

## Após cada mudança de código

```bash
npm run build        # TypeScript + Next.js — DEVE ter 0 erros
npm test             # Vitest — DEVE passar todos
```

**NUNCA** faça commit de código que quebra o build.

---

## Adicionando um novo serviço AWS

```
1. src/domain/entities/node.ts          → AWSServiceType + Config interface + ServiceConfigMap
2. src/domain/constants/defaults.ts     → SERVICE_DEFAULTS entry
3. src/registry/<categoria>/index.ts    → registry.register({ type, label, ... })
4. src/domain/services/cost.ts          → case "my-service": return calculateXCost(...)
5. src/domain/services/latency.ts       → BASE_LATENCY_MS["my-service"] = N
6. src/domain/services/throughput.ts    → case "my-service": return N
7. src/domain/services/availability.ts  → case "my-service": return N
```

---

## Pontos de integração críticos

| Componente | Integração |
|------------|-----------|
| `FlowCanvas.tsx` | Animated edges via `activeLayer` + `simStatus` |
| `Navbar.tsx` | `POST /api/simulation` + `toast` (sonner) |
| `SimulationPanel.tsx` | PieChart (custos) + BarChart (recursos) via recharts |
| `PropertiesPanel.tsx` | Fields dinâmicos do registry (`configSections`) |
| `layout.tsx` | `<ThemeProvider>` + `<Toaster>` obrigatórios |
| `editor/page.tsx` | `<ErrorBoundary>` em volta do `<FlowCanvas>` |

---

## Regras invioláveis

1. `src/domain/` — zero imports de `react`, `next`, `@xyflow/react`, stores
2. `npm run build` 0 erros antes de qualquer commit
3. Zod v4: `z.record(z.string(), z.unknown())` — dois argumentos
4. `[key: string]: unknown` em `ArchitectureNodeBase` e `ConnectionEdge` — não remover
5. Camadas são overlays visuais, não grafos separados

---

## Comandos

```bash
npm run dev                    # http://localhost:3000
npm run build                  # Build de produção
npm test                       # Testes (vitest run)
npm run test:watch             # Testes em modo watch
git push -u origin claude/system-architecture-design-N3U6r
```
