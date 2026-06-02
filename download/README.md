<div align="center">

# 🧠 AgentOS

### AI Agent Operating System for VPS

**Built by [RJMLABS.CO.UK](https://rjmlabs.co.uk)**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](./LICENSE)

A comprehensive, self-hosted AI Agent Operating System with a cyberpunk dark UI — manage agents, memory vaults, model routing, workflows, MCP integrations, agent swarms, RAG knowledge bases, human-in-the-loop approval gates, guardrails, cost tracking, and much more. All running on your own VPS with full data sovereignty.

[🚀 Quick Start](#-quick-start) · [🏗️ Architecture](#-7-layer-architecture) · [📋 Features](#-features) · [🐳 Deployment](#-deployment) · [📖 Docs](#-documentation)

</div>

---

## 📸 Screenshots

> _A cyberpunk-themed dark dashboard for managing your AI agent fleet on your own infrastructure._

---

## ✨ What is AgentOS?

AgentOS is a **self-hosted AI agent management platform** designed for VPS deployment. It provides a unified interface to orchestrate multiple AI agents, manage their memory and knowledge, route tasks to the right models, build complex workflows, and maintain full control over your data and costs — all in **£/GBP**.

### Why AgentOS?

| Problem | Solution |
|---|---|
| Multiple AI agents, no unified control | Single dashboard to manage all agents |
| API costs spiralling out of control | Real-time cost tracking with £/GBP budgets & alerts |
| No visibility into what agents are doing | Full observability, tracing, and audit logs |
| Vendor lock-in with cloud platforms | Self-hosted on your VPS — your data, your rules |
| Agents can't work together | Agent swarms, chains, delegation, and consensus |
| Safety concerns with autonomous agents | Guardrails, human-in-the-loop, approval gates |

---

## 🏗️ 7-Layer Architecture

AgentOS is built on a 7-layer blueprint, each layer adding capabilities:

```
┌─────────────────────────────────────────────┐
│  L8+  ENTERPRISE                            │
│  Analytics · Cost Tracker (£/GBP)           │
│  Guardrails · RBAC · Observability          │
│  Docker Manager · Marketplace               │
├─────────────────────────────────────────────┤
│  L7   LOOP (Output Writeback)               │
│  Agent Outputs · Export/Import              │
│  Backup & Recovery                          │
├─────────────────────────────────────────────┤
│  L6   PRODUCTION SURFACES                   │
│  Workspaces · Goals · Playground            │
│  File Manager · Prompt Library              │
├─────────────────────────────────────────────┤
│  L5   COMMAND CENTER                        │
│  Mission Control · Terminal · Scheduler     │
│  Event Bus · Automation Rules               │
├─────────────────────────────────────────────┤
│  L4   AGENTS                                │
│  Agent CRUD · Tasks · Skills · Chains       │
│  Delegation · Consensus · Teams             │
├─────────────────────────────────────────────┤
│  L3   BRAIN (Routed Models)                 │
│  Model Configs · Routing Rules              │
│  Brain Router · Chat Completions            │
├─────────────────────────────────────────────┤
│  L2   MEMORY (Omi + Obsidian)               │
│  Memory Vault · Knowledge Base (RAG)        │
│  Knowledge Graph · Document Chunks           │
├─────────────────────────────────────────────┤
│  L1   FOUNDATION                            │
│  System Config · Settings · Onboarding      │
└─────────────────────────────────────────────┘
```

---

## 📋 Features

### 🤖 Agent Management
- **Agent CRUD** — Create, configure, and manage AI agents with custom models
- **Agent Skills** — Define custom tools and capabilities per agent
- **Agent Chains** — Chain agents together in sequential pipelines
- **Agent Delegation** — Delegate tasks between agents automatically
- **Agent Consensus** — Democratic voting and consensus protocols
- **Agent Teams** — Group agents into teams with shared channels
- **Agent Swarm** — Orchestrate agent swarms with queen, democratic, or specialized strategies
- **Agent Playground** — Test agents in an isolated sandbox
- **Agent Versioning** — Track agent config versions with rollback
- **Agent Marketplace** — Browse and install community agents

### 🧠 Brain & Model Routing
- **Model Configs** — Configure OpenAI, Anthropic, local, and z-ai models
- **Routing Rules** — Condition-based model routing (task type, priority, etc.)
- **Brain Router** — Interactive model selection and routing UI
- **Chat Completions** — Direct chat with any configured model

### 💾 Memory & Knowledge
- **Memory Vault** — Obsidian-style vault with pinned entries, tags, and paths
- **Knowledge Base (RAG)** — Full RAG pipeline with document upload, chunking, embeddings, and semantic search
- **Knowledge Graph** — Visual knowledge graph exploration
- **Retrieval Queries** — Hybrid, semantic, and keyword search strategies

### 🔄 Workflows & Automation
- **Workflow Builder** — Visual workflow builder with step-by-step agent orchestration
- **Scheduler** — Cron-based task scheduling with human-readable expressions
- **Automation Rules** — Event-triggered automation with conditions and actions
- **Event Bus** — Pub/sub event system with topics, subscriptions, and delivery tracking

### 🔌 MCP (Model Context Protocol)
- **MCP Servers** — Connect to external MCP servers (stdio, SSE, HTTP)
- **MCP Tools** — Discover and execute MCP tools
- **MCP Pipelines** — Chain MCP tool executions into pipelines
- **MCP Executions** — Full execution history with timing and error tracking

### ✋ Human-in-the-Loop
- **Approval Requests** — Require human approval for agent actions
- **Review Gates** — Configurable triggers (risk-based, cost-based, action-type)
- **Escalation Policies** — Multi-level escalation with auto-actions
- **Cost Thresholds** — All thresholds displayed in £/GBP

### 🛡️ Guardrails & Safety
- **Input/Output Filters** — PII redaction, toxicity detection, content filtering
- **Rate Limiting** — Per-agent RPM/RPS limits
- **Cost Limits** — Daily spend limits in £/GBP with auto-block
- **Scope Restrictions** — Resource access control per agent
- **Content Policies** — Blocklists, allowlists, PII filters, toxicity scoring

### 💰 Cost Tracking (£/GBP)
- **Real-time Cost Tracking** — Per-agent, per-model cost breakdown in £
- **Budget Alerts** — Monthly/weekly/daily budget limits with notifications
- **Cost by Agent** — Visual breakdown of spending per agent
- **Token Usage** — Track input/output tokens per request
- **PoundSterling Icons** — All currency displays use £ throughout the UI

### 🔍 Observability
- **Traces & Spans** — Full distributed tracing for agent operations
- **Service Graph** — Visual map of agent dependencies and interactions
- **Audit Log** — Complete audit trail of all actions
- **System Health** — CPU, memory, disk, and network monitoring

### 👥 Users & RBAC
- **User Management** — Multi-user support with authentication
- **Role-Based Access** — Custom roles with granular permissions
- **Security Vault** — AES-256-CBC encrypted API key storage
- **Access Rules** — Per-resource, per-agent access control

### 🐳 Infrastructure
- **Docker Manager** — Manage containers, images, networks, and volumes
- **VPS Terminal** — Browser-based SSH terminal
- **File Manager** — Browse and manage VPS files
- **Environment Manager** — Environment variable profiles with activation
- **Feature Flags** — Toggle features on/off with history tracking

### 📊 Dashboards & Customization
- **Mission Control** — Central dashboard with key metrics
- **Dashboard Customizer** — Drag-and-drop widget layout
- **Analytics Dashboard** — Charts and graphs for tasks, costs, and memory
- **Onboarding Wizard** — First-run setup experience
- **Keyboard Shortcuts** — Full keyboard navigation (Cmd+K search)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** or **Bun**
- **npm** or **bun**
- **SQLite** (included with Prisma)

### 1. Clone the Repository

```bash
git clone https://github.com/nitro930/NEXTJS-RJMLABS.git
cd NEXTJS-RJMLABS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=file:./data/agentos.db
ENCRYPTION_KEY=generate-with-openssl-rand-hex-16
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

Generate secure keys:

```bash
openssl rand -hex 16     # For ENCRYPTION_KEY
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

### 4. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 5. Build & Run

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

### 6. Seed Demo Data

```bash
curl -X POST http://localhost:3000/api/seed
```

### 7. Open in Browser

Navigate to **http://localhost:3000** — the onboarding wizard will guide you through initial setup.

---

## 🐳 Deployment

### Docker Compose (Recommended for Production)

```bash
# Build and start all services
docker compose up -d --build

# Seed the database
curl -X POST http://localhost:3000/api/seed
```

This starts:
- **AgentOS** on port 3000 (internal)
- **Caddy** on ports 80/443 (reverse proxy with auto-HTTPS)

### PM2 (Bare Metal)

```bash
npm install -g pm2
npm run build

pm2 start .next/standalone/server.js --name agentos --node-args="--env-file=.env"
pm2 save
pm2 startup
```

### Production with Custom Domain

Edit the `Caddyfile` to replace `:80` with your domain:

```
agentos.rjmlabs.co.uk {
    encode gzip zstd
    handle {
        reverse_proxy localhost:3000
    }
}
```

Caddy will automatically provision Let's Encrypt SSL certificates.

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16 |
| **Language** | TypeScript | 5 |
| **Database** | SQLite via Prisma | 6 |
| **State** | Zustand | 5 |
| **UI** | shadcn/ui + Radix | Latest |
| **CSS** | Tailwind CSS | 4 |
| **Charts** | Recharts | 2.15 |
| **Animation** | Framer Motion | 12 |
| **Auth** | NextAuth | 4 |
| **Encryption** | AES-256-CBC | — |
| **AI SDK** | z-ai-web-dev-sdk | 0.0.17 |
| **Tables** | @tanstack/react-table | 8 |
| **Forms** | react-hook-form + zod | 7 / 4 |
| **Runtime** | Node.js 20 Alpine / Bun | — |
| **Proxy** | Caddy | 2 |

---

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma          # 102 database models
├── src/
│   ├── app/
│   │   ├── api/               # 160+ REST API routes
│   │   │   ├── agents/        # Agent CRUD
│   │   │   ├── memory/        # Memory vault
│   │   │   ├── models/        # Model configs
│   │   │   ├── workflows/     # Workflow builder
│   │   │   ├── mcp/           # MCP integration
│   │   │   ├── swarm/         # Agent swarms
│   │   │   ├── knowledge/     # RAG knowledge base
│   │   │   ├── guardrails/    # Safety guardrails
│   │   │   ├── costs/         # Cost tracking (£/GBP)
│   │   │   ├── traces/        # Observability
│   │   │   ├── users/         # User management
│   │   │   ├── docker/        # Docker management
│   │   │   └── ...            # Many more
│   │   ├── page.tsx           # Main application page
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── agent-os/          # 71 UI components
│   │   └── ui/                # shadcn/ui primitives
│   └── lib/
│       ├── store.ts           # Zustand store
│       └── types.ts           # TypeScript interfaces
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose with Caddy
├── Caddyfile                  # Reverse proxy configuration
├── next.config.ts             # Next.js config (standalone output)
└── package.json               # Dependencies & scripts
```

---

## 📊 By the Numbers

| Metric | Count |
|---|---|
| **Prisma Models** | 102 |
| **UI Components** | 71 |
| **API Routes** | 160+ |
| **Architecture Layers** | 7 (+ Enterprise) |
| **Agent Strategies** | 5 (Queen, Democratic, Consensus, Round-Robin, Specialized) |
| **MCP Transport Types** | 3 (stdio, SSE, Streamable HTTP) |
| **Guardrail Types** | 6 (Input Filter, Output Filter, Rate Limit, Content Policy, Scope Restriction, Cost Limit) |
| **Notification Channels** | 5 (Email, Slack, Discord, Webhook, Telegram) |

---

## 🔐 Security

- **AES-256-CBC encryption** for stored API keys
- **NextAuth authentication** with session management
- **Role-Based Access Control** with granular permissions
- **Guardrails** — PII filtering, toxicity detection, rate limiting, cost caps
- **Audit logging** — Complete trail of all system actions
- **Security headers** — Set via Caddy (HSTS, X-Frame-Options, CSP)
- **Self-hosted** — Your data never leaves your VPS

---

## 💷 Currency & Branding

All financial displays use **£ (UK Pounds / GBP)**:

- `PoundSterling` lucide icon used across all cost-related components
- Budget alerts, cost entries, and guardrail messages display in £
- Seed data uses `currency: 'gbp'` / `currency: 'GBP'`
- No dollar signs anywhere in the UI

Branded by **RJMLABS.CO.UK** with the "RJM" logo.

---

## 📖 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production (standalone output) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema to database (create/update tables) |
| `npx prisma studio` | Open database browser UI |
| `npx prisma migrate dev` | Create and apply migrations |

---

## 🗄️ Database Models (102)

<details>
<summary>Click to expand full list</summary>

### L1 — Foundation
`SystemConfig`

### L2 — Memory
`MemoryEntry`

### L3 — Brain
`ModelConfig` · `RoutingRule`

### L4 — Agents
`Agent` · `AgentTask`

### L5 — Command Center
`CommandLog`

### L6 — Production Surfaces
`Workspace` · `Goal`

### L7 — Loop
`AgentOutput`

### Analytics
`ActivityEvent`

### Workflows & Scheduling
`Workflow` · `ScheduledTask`

### Notifications
`Notification` · `NotificationChannel` · `ChannelDelivery`

### Cost & Usage
`CostEntry` · `BudgetAlert`

### Webhooks
`Webhook` · `WebhookEvent`

### Agent Communication
`AgentMessage`

### Backup & Recovery
`Backup`

### Templates
`Template`

### Terminal
`TerminalSession` · `TerminalCommand`

### Security
`ApiKey` · `AccessRule`

### Audit
`AuditLog`

### Playground
`PlaygroundSession`

### Plugins
`Plugin`

### Health
`HealthMetric` · `HealthAlert`

### Files
`FileEntry`

### Skills
`AgentSkill`

### MCP
`MCPServer` · `MCPTool` · `MCPResource` · `MCPPrompt` · `MCPExecution` · `MCPPipeline`

### Swarm
`Swarm` · `SwarmMember` · `SwarmTask` · `SwarmDecision`

### Knowledge Base (RAG)
`KnowledgeBase` · `KnowledgeDocument` · `KnowledgeChunk` · `RetrievalQuery`

### Human-in-the-Loop
`ApprovalRequest` · `ReviewGate` · `EscalationPolicy`

### Guardrails
`Guardrail` · `GuardrailViolation` · `ContentPolicy`

### Evals
`EvalSuite` · `EvalCase` · `EvalRun` · `EvalResult`

### Observability
`Trace` · `TraceSpan` · `ServiceGraph` · `ServiceEdge`

### Users & RBAC
`User` · `UserSession` · `Role` · `RolePermission`

### Teams
`AgentTeam` · `TeamMember` · `TeamChannel`

### Chains
`AgentChain` · `ChainRun`

### Delegation & Consensus
`Delegation` · `DelegationHistory` · `ConsensusRound` · `ConsensusVote`

### Benchmarking
`BenchmarkSuite` · `BenchmarkRun`

### Versioning
`AgentVersion`

### Environment
`EnvVar` · `EnvProfile`

### Marketplace
`MarketplaceAgent` · `MarketplaceReview`

### Dashboard
`DashboardWidget` · `DashboardPreference`

### Prompts
`PromptTemplate`

### Feature Flags
`FeatureFlag` · `FeatureFlagHistory`

### Docker
`DockerContainer`

### Onboarding
`OnboardingState` · `OnboardingStep`

### Automation
`AutomationRule` · `AutomationExecution`

### Event Bus
`EventTopic` · `EventSubscription` · `EventRecord` · `EventDelivery`

### Quotas
`ResourceQuota` · `QuotaUsageRecord`

### Incidents
`Incident` · `IncidentTimeline` · `IncidentAction` · `PostMortem`

</details>

---

## 🤝 Contributing

This is a proprietary project by RJMLABS.CO.UK. For inquiries, contact us through [rjmlabs.co.uk](https://rjmlabs.co.uk).

---

## 📄 License

Proprietary — All rights reserved by RJMLABS.CO.UK.

---

<div align="center">

**Built with 🧠 by [RJMLABS.CO.UK](https://rjmlabs.co.uk)**

</div>
