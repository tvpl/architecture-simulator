# AWS Architecture Simulator

Ferramenta profissional para desenhar, simular e analisar arquiteturas AWS com métricas de performance, custo e disponibilidade em tempo real.

---

## Funcionalidades

- **29 serviços AWS** em 6 categorias (Compute, Networking, Messaging, Storage, Security, Integration)
- **4 camadas de visualização** — Arquitetura, Serviços, Custos, Simulação
- **Engine de simulação server-side** — travessia de grafo, detecção de gargalos, análise de caminhos críticos
- **Calculadora de custos AWS** — preços on-demand us-east-1 em USD
- **VPC/Subnet containers** — grupos visuais redimensionáveis com NodeResizer
- **Conexões com protocolo** — HTTPS, HTTP, gRPC, WebSocket, Kafka, SQS, SNS, EventBridge, Kinesis, Internal
- **Animação de bordas** — fluxo animado nas camadas Simulação e Serviços
- **Modo escuro** — toggle persistido em localStorage
- **Persistência automática** — diagrama salvo em localStorage, restaurado ao recarregar
- **Exportar/Importar JSON** — save/load completo do projeto
- **Exportar imagem PNG** — captura do canvas via html-to-image
- **Testes unitários** — domínio puro coberto com Vitest

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 (App Router) |
| UI Runtime | React 19 |
| Canvas | @xyflow/react v12 |
| Estado | Zustand v5 |
| Estilo | Tailwind CSS v4 |
| Componentes | Radix UI Primitives |
| Gráficos | Recharts v3 |
| Animações | Framer Motion v12 |
| Toasts | Sonner v2 |
| Validação | Zod v4 |
| Testes | Vitest v4 |
| TypeScript | v5 (strict mode) |

---

## Estrutura do Projeto

```
app/src/
├── app/                        # Next.js App Router
│   ├── editor/                 # Rota principal do editor
│   ├── api/
│   │   ├── simulation/         # POST — engine de simulação
│   │   ├── cost/               # POST — calculadora de custos
│   │   └── validate/           # POST — validação de arquitetura
│   ├── layout.tsx              # Root layout (Toaster, ThemeProvider)
│   └── page.tsx                # Redirect → /editor
│
├── domain/                     # Lógica pura de domínio (zero React/Next)
│   ├── entities/               # Tipos: node, edge, simulation, layer, pricing
│   ├── services/               # Fórmulas: simulation-engine, cost, latency,
│   │                           #           throughput, availability
│   ├── validators/             # validateArchitecture()
│   └── constants/              # SERVICE_DEFAULTS
│
├── registry/                   # Catálogo AWS auto-registrável
│   ├── compute/                # Lambda, EC2, ECS, EKS, Fargate
│   ├── networking/             # VPC, Subnet, ALB, NLB, API GW, CloudFront, Route53, SG
│   ├── messaging/              # SQS, SNS, EventBridge, MSK, Kinesis
│   ├── storage/                # S3, RDS, DynamoDB, ElastiCache, EFS
│   ├── security/               # IAM, WAF, Secrets Manager, Cognito
│   └── integration/            # Step Functions, CloudWatch
│
├── stores/                     # Zustand stores
│   ├── flow-store.ts           # Nodes/edges (persist → localStorage "aws-arch-v2")
│   ├── simulation-store.ts     # Status e resultados da simulação
│   ├── layer-store.ts          # Camada ativa
│   ├── ui-store.ts             # Painéis abertos/fechados
│   └── theme-store.ts          # Tema (persist → localStorage "aws-arch-theme")
│
└── components/
    ├── canvas/FlowCanvas.tsx   # Canvas principal (@xyflow/react)
    ├── nodes/base/             # ServiceNode, ContainerNode, ServiceIcon
    ├── edges/ProtocolEdge.tsx  # Aresta colorida por protocolo
    ├── layout/                 # Navbar, Sidebar, LayerSwitcher
    ├── panels/PropertiesPanel  # Painel de config (slide-in animado)
    ├── simulation/             # SimulationPanel (recharts + framer-motion)
    ├── error-boundary.tsx      # Error Boundary para o canvas
    └── theme-provider.tsx      # Sincroniza classe `dark` no <html>
```

---

## Primeiros Passos

```bash
npm install       # Instalar dependências
npm run dev       # Servidor de desenvolvimento → http://localhost:3000
npm run build     # Build de produção
npm test          # Testes unitários (Vitest)
npm run lint      # ESLint
```

---

## Sistema de Camadas

| Camada | O que exibe | Arestas |
|--------|-------------|---------|
| **Arquitetura** | Componentes AWS, VPC/Subnet containers | Estáticas, cor por protocolo |
| **Serviços** | Grafo de comunicação entre serviços | Animadas, badges de protocolo |
| **Custos** | Badges de custo USD em cada nó | Estáticas |
| **Simulação** | Utilização, gargalos, latência | Animadas após simulação concluída |

---

## Adicionando um Novo Serviço AWS

1. Adicionar o type ao `AWSServiceType` em `src/domain/entities/node.ts`
2. Criar interface de config (ex: `MyServiceConfig`) no mesmo arquivo
3. Adicionar à `ServiceConfigMap`
4. Adicionar defaults em `src/domain/constants/defaults.ts`
5. Criar entrada no `src/registry/<categoria>/index.ts` com `ServiceDefinition`
6. Adicionar fórmula de custo em `src/domain/services/cost.ts`
7. Adicionar latência em `src/domain/services/latency.ts`
8. Adicionar throughput em `src/domain/services/throughput.ts`
9. Adicionar disponibilidade em `src/domain/services/availability.ts`

---

## API Routes

| Rota | Método | Saída |
|------|--------|-------|
| `/api/simulation` | POST | `SimulationResult` |
| `/api/cost` | POST | `{ totalMonthlyCostUSD, breakdown }` |
| `/api/validate` | POST | `ValidationResult` |

---

## Testes

```bash
npm test
```

Cobertos: `simulation-engine`, `cost`, `validateArchitecture` (domínio puro, sem UI).
