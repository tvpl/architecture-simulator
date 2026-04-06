# AWS Architecture Simulator

Interactive visual tool for designing, simulating, and analyzing AWS cloud architectures. Drag AWS services onto a canvas, connect them, run latency/cost/availability simulations, and export to CloudFormation — all in the browser.

---

## Features

- **29 AWS services** across 6 categories (Compute, Networking, Messaging, Storage, Security, Integration)
- **4-layer view system** — Architecture / Services / Cost / Simulation
- **Simulation engine** — DFS graph traversal, bottleneck detection, latency/throughput/availability per path
- **Cost calculator** — real AWS pricing formulas per service, with monthly USD breakdown
- **What-if analysis** — slider-based cost projection without modifying the canvas
- **CloudFormation export** — generate deployable YAML templates from the diagram
- **Architecture templates** — 6 pre-built templates (Serverless API, Web App, Microservices ECS, Data Pipeline, Secure App, Event-Driven)
- **Validation panel** — real-time architecture errors and warnings
- **Note/annotation nodes** — sticky notes in 5 colors, with inline editing
- **Context menu** — right-click any node to rename, duplicate, or delete
- **Inline label editing** — double-click any node or press F2
- **Version history** — named snapshots with restore, persisted to localStorage
- **Undo/redo** — full history via zundo temporal store
- **Auto-layout** — dagre-based automatic node arrangement
- **Dark/light mode** — persisted to localStorage
- **JSON export/import** — save and restore complete diagrams
- **PNG image export** — export canvas as image
- **Keyboard shortcuts** — Delete, Ctrl+Z/Y, Ctrl+D, Ctrl+Shift+E, F2, Escape

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2 (App Router) + React 19 |
| Canvas | @xyflow/react v12 (React Flow) |
| State | Zustand v5 + zundo (temporal/undo-redo) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion v12 |
| Charts | Recharts v3 |
| Validation | Zod v4 |
| Testing | Vitest |
| Layout algorithm | @dagrejs/dagre |
| Toasts | Sonner |

## Getting Started

```bash
cd app/
npm install
npm run dev        # http://localhost:3000
```

### Other commands

```bash
npm run build      # Production build (must pass with 0 errors)
npm test           # Run all Vitest unit tests
npm run lint       # ESLint check
```

### Docker

```bash
docker-compose up                    # Production build on port 3000
docker-compose --profile dev up      # Dev server with hot reload
```

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── editor/page.tsx           # Main editor route
│   │   └── api/
│   │       ├── simulation/route.ts   # POST — run simulation
│   │       ├── cost/route.ts         # POST — cost breakdown
│   │       ├── validate/route.ts     # POST — architecture validation
│   │       └── export/cloudformation/route.ts  # POST — CF template
│   ├── domain/                       # Zero React/Next.js imports
│   │   ├── entities/                 # node.ts, edge.ts
│   │   ├── services/                 # simulation-engine, cost, latency, throughput, availability, cloudformation
│   │   ├── validators/               # architecture.ts (Zod)
│   │   └── constants/               # defaults.ts
│   ├── registry/                     # AWS service definitions
│   │   ├── compute/, networking/, messaging/
│   │   ├── storage/, security/, integration/, annotations/
│   │   ├── index.ts                  # Public entry with all imports
│   │   ├── index-internal.ts         # Registry singleton
│   │   └── types.ts                  # ServiceDefinition, ConfigField
│   ├── stores/                       # Zustand stores
│   │   ├── flow-store.ts             # Canvas nodes/edges + undo/redo (zundo)
│   │   ├── simulation-store.ts       # Simulation results
│   │   ├── layer-store.ts            # Active layer
│   │   ├── ui-store.ts               # Panel open/close state
│   │   ├── theme-store.ts            # light/dark (persisted)
│   │   ├── validation-store.ts       # Real-time errors/warnings
│   │   └── history-store.ts          # Named snapshots (persisted)
│   ├── components/
│   │   ├── canvas/                   # FlowCanvas, NodeContextMenu
│   │   ├── nodes/base/               # ServiceNode, NoteNode, ContainerNode
│   │   ├── panels/                   # PropertiesPanel, SimulationPanel, ValidationPanel, WhatIfPanel, HistoryPanel
│   │   ├── dialogs/                  # TemplatesDialog
│   │   └── layout/                   # Navbar, Sidebar, LayerSwitcher
│   ├── hooks/                        # use-keyboard-shortcuts, use-auto-layout
│   └── lib/                          # utils, formatters, templates
├── CLAUDE.md                         # AI developer guide
└── AGENTS.md                         # Autonomous agent instructions
```

## Layer System

| Layer | What it shows |
|-------|--------------|
| **Architecture** | All AWS components with icons, VPC/subnet containers, security groups |
| **Services** | Service-to-service communication, protocol labels on edges |
| **Cost** | Monthly cost per node, color gradient (green → red by cost) |
| **Simulation** | Animated edges, bottleneck highlights, latency/throughput overlays |

## Adding a New AWS Service

1. Add the type to `AWS_SERVICE_TYPES` in `src/domain/entities/node.ts`
2. Create a `MyServiceConfig` interface in `node.ts`
3. Add `"my-service": MyServiceConfig` to `ServiceConfigMap` in `node.ts`
4. Add `"my-service": "category"` to `SERVICE_CATEGORY_MAP` in `node.ts`
5. Add defaults to `SERVICE_DEFAULTS` in `src/domain/constants/defaults.ts`
6. Create registry entry in `src/registry/<category>/index.ts`
7. Add `case "my-service":` to `src/domain/services/cost.ts`
8. Add entry to `BASE_LATENCY_MS` in `src/domain/services/latency.ts`
9. Add `case "my-service":` to `src/domain/services/throughput.ts`
10. Add entry to `BASE_AVAILABILITY` in `src/domain/services/availability.ts`
11. Add `case "my-service":` to `src/domain/services/cloudformation.ts`

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/simulation` | POST | Run simulation on diagram nodes/edges |
| `/api/cost` | POST | Get cost breakdown per service |
| `/api/validate` | POST | Validate architecture rules |
| `/api/export/cloudformation` | POST | Generate CloudFormation YAML |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:
- **build** — `npm run build` (TypeScript + Next.js)
- **test** — `npm test` (Vitest)
- **lint** — `npm run lint` (ESLint)

## License

MIT
