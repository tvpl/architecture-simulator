# AWS Architecture Simulator

Interactive visual tool for designing, simulating, and analyzing AWS cloud architectures. Drag AWS services onto a canvas, connect them, run latency/cost/availability simulations, and export to CloudFormation — all in the browser.

---

## Features

- **55+ AWS services** across 7 categories (Compute, Networking, Messaging, Storage, Security, Integration, Analytics & ML)
- **Landing page** at `/` — animated hero, feature showcase, and keyboard shortcuts reference
- **4-layer view system** — Architecture / Services / Cost / Simulation
- **Simulation engine** — DFS graph traversal, bottleneck detection, latency/throughput/availability per path
- **Cost calculator** — real AWS pricing formulas per service, with monthly USD breakdown
- **Budget alerts** — set a monthly USD limit; visual progress bar with green/amber/red thresholds
- **What-if analysis** — auto-discovered slider parameters per service (via registry), cost projection without modifying the canvas
- **CloudFormation export** — generate deployable YAML templates from the diagram
- **Architecture templates** — 6 pre-built templates (Serverless API, Web App, Microservices ECS, Data Pipeline, Secure App, Event-Driven)
- **Validation panel** — real-time architecture errors and warnings
- **Config presets** — right-click context menu quick-apply presets per service (Lambda Dev/Prod/High-Mem, EC2 sizes, RDS tiers, etc.)
- **Multi-select & bulk actions** — Shift+click or drag to select multiple nodes; floating toolbar to duplicate or delete all at once
- **Empty canvas onboarding** — animated panel with shortcuts to templates, command palette, and JSON import
- **Edge label inline editor** — double-click a protocol badge to set a custom label on any connection
- **Note/annotation nodes** — sticky notes in 5 colors, with inline editing
- **Context menu** — right-click any node to rename, duplicate, open properties, or apply config presets
- **Version history** — named snapshots with diff badges (±nodes/edges vs current), restore, persisted to localStorage
- **Undo/redo** — full history via zundo temporal store
- **Auto-layout** — dagre-based automatic node arrangement
- **Dark/light mode** — persisted to localStorage
- **JSON export/import** — save and restore complete diagrams
- **PNG image export** — export canvas as image
- **Keyboard shortcuts** — Delete, Ctrl+Z/Y, Ctrl+D, Ctrl+Shift+E, F2, Escape, Cmd+K

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
npm test           # Run all Vitest unit tests (95 tests)
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
│   │   ├── page.tsx                  # Landing page (/)
│   │   ├── editor/page.tsx           # Main editor route + GlobalDialogs
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
│   │   ├── compute/                  # ec2, ecs, eks, lambda, fargate, ecr
│   │   ├── networking/
│   │   ├── messaging/                # sqs, sns, kinesis, msk, eventbridge, ses
│   │   ├── storage/
│   │   ├── security/                 # waf, shield, kms, secrets-manager, cognito, iam, cloudtrail
│   │   ├── integration/              # step-functions, glue-workflow, app-sync, codepipeline, xray
│   │   ├── analytics/                # redshift, athena, opensearch, glue, sagemaker
│   │   ├── annotations/
│   │   ├── index.ts                  # Public entry with all imports
│   │   ├── index-internal.ts         # Registry singleton + CATEGORY_LABELS/ORDER
│   │   └── types.ts                  # ServiceDefinition, ConfigField, NumberField
│   ├── stores/                       # Zustand stores
│   │   ├── flow-store.ts             # Canvas nodes/edges + undo/redo (zundo)
│   │   ├── simulation-store.ts       # Simulation results
│   │   ├── layer-store.ts            # Active layer
│   │   ├── ui-store.ts               # Panel/dialog open-close state
│   │   ├── theme-store.ts            # light/dark (persisted)
│   │   ├── validation-store.ts       # Real-time errors/warnings
│   │   └── history-store.ts          # Named snapshots (persisted)
│   ├── components/
│   │   ├── canvas/                   # FlowCanvas (onboarding + multi-select), NodeContextMenu (presets)
│   │   ├── edges/                    # ProtocolEdge (inline label editor)
│   │   ├── nodes/base/               # ServiceNode, NoteNode, ContainerNode (accent bar + children count)
│   │   ├── panels/                   # PropertiesPanel, SimulationPanel, ValidationPanel, WhatIfPanel, HistoryPanel
│   │   ├── views/                    # CostDashboard (budget alerts)
│   │   ├── dialogs/                  # TemplatesDialog, CommandPalette
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

## AWS Services

| Category | Services |
|----------|---------|
| Compute | EC2, ECS, EKS, Lambda, Fargate, ECR |
| Networking | VPC, Subnet, Security Group, ALB, CloudFront, Route53, API Gateway, NAT Gateway |
| Storage | S3, RDS, DynamoDB, ElastiCache, EFS, Aurora |
| Messaging | SQS, SNS, Kinesis, MSK, EventBridge, SES |
| Security | WAF, Shield, KMS, Secrets Manager, Cognito, IAM, CloudTrail |
| Integration | Step Functions, Glue Workflow, AppSync, CodePipeline, X-Ray |
| Analytics & ML | Redshift, Athena, OpenSearch, Glue, SageMaker |

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
