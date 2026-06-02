'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileText,
  ExternalLink,
  Lightbulb,
  Wrench,
  BookOpen,
  LayoutDashboard,
  Database,
  Brain,
  Users,
  Monitor,
  RefreshCw,
  Clock,
  Bug,
  UserCog,
  GitBranch,
  GitCommit,
  Send,
  Vote,
  Store,
  Variable,
  Flag,
  Gauge,
  Wifi,
  Trophy,
  Container,
  Zap,
  Radio,
  AlertTriangle,
  BarChart3,
  PoundSterling,
  Webhook,
  MessageSquare,
  Network,
  Terminal,
  FlaskConical,
  Puzzle,
  Activity,
  FolderOpen,
  Wrench as WrenchIcon,
  Megaphone,
  Cable,
  Lock,
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  Download,
  Shield,
  LayoutGrid,
  Settings,
  Rocket,
  HelpCircle,
  X,
} from 'lucide-react'
import { useAgentOSStore, SectionId } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────

interface HelpArticle {
  id: SectionId
  name: string
  icon: React.ElementType
  layer: string
  category: string
  description: string
  howToUse: string[]
  howToSetUp: string[]
  tips: string[]
}

// ─── Icon Map ────────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Database, Brain, Users, Monitor, RefreshCw, Clock,
  Bug, UserCog, GitBranch, GitCommit, Send, Vote, Store, Variable,
  Flag, Gauge, Wifi, Trophy, Container, Zap, Radio, AlertTriangle,
  BarChart3, PoundSterling, Webhook, MessageSquare, Network, Terminal,
  FlaskConical, Puzzle, Activity, FolderOpen, Wrench: WrenchIcon,
  Megaphone, Cable, Lock, ScrollText, ShieldCheck, ShieldAlert,
  Download, Shield, LayoutGrid, Settings, Rocket, HelpCircle,
  BookOpen,
}

// ─── Help Data ───────────────────────────────────────────────────

const helpData: HelpArticle[] = [
  // ── Core Layers ──
  {
    id: 'mission-control',
    name: 'Mission Control',
    icon: LayoutDashboard,
    layer: 'L5',
    category: 'Core Layers',
    description: 'The central dashboard that provides a real-time overview of your entire AgentOS platform. Monitor active agents, running workflows, system health, and key metrics all from a single pane of glass.',
    howToUse: [
      'Navigate to Mission Control from the sidebar — it\'s the default landing page when you open AgentOS.',
      'Review the top KPI cards showing active agents, running workflows, memory usage, and today\'s cost in GBP.',
      'Scroll down to the Activity Feed to see the latest agent actions, workflow completions, and system events.',
      'Click any KPI card to drill down into the corresponding section (e.g., click "Active Agents" to open the Agents grid).',
      'Use the Quick Actions panel on the right to create a new agent, start a workflow, or open the terminal.',
    ],
    howToSetUp: [
      'Mission Control is enabled by default — no additional setup required.',
      'Customise which widgets appear using the Dashboard Customizer (SYS layer) to add, remove, or rearrange KPI cards.',
      'Connect data sources via the Environment Manager to ensure metrics reflect your live infrastructure.',
      'Set up alert thresholds in Alert Channels so that critical KPI changes trigger notifications.',
      'Configure the refresh interval in Settings → Dashboard → Auto-refresh (default: 30 seconds).',
    ],
    tips: [
      'Pin Mission Control as your browser homepage for instant visibility every morning.',
      'Use keyboard shortcut ⌘K to search and jump to any section directly from Mission Control.',
      'Hover over any KPI card to see the 7-day trend sparkline.',
    ],
  },
  {
    id: 'memory',
    name: 'Memory Vault',
    icon: Database,
    layer: 'L2',
    category: 'Core Layers',
    description: 'A persistent key-value and vector store for agent memories. Agents can read and write contextual data, user preferences, conversation history, and task results so they remain stateful across sessions.',
    howToUse: [
      'Open Memory Vault from the Core Layers section of the sidebar.',
      'Use the search bar to filter memories by keyword, or apply the Type dropdown (conversation, fact, preference, task_result).',
      'Click any memory card to expand its full content, metadata, and associated agent.',
      'Use the Path filter to narrow memories by namespace (e.g., /agents/bot-01/context).',
      'Click the trash icon on a memory card to delete it, or the pin icon to mark it as persistent.',
    ],
    howToSetUp: [
      'Memory Vault is available at L2 — ensure your AgentOS tier includes the Memory layer.',
      'Configure the default memory TTL (time-to-live) in Settings → Memory → Default TTL.',
      'Set up memory namespaces by creating path hierarchies in the Environment Manager (e.g., /agents/{id}/context).',
      'Enable vector search in Settings → Memory → Vector Embeddings for semantic similarity queries.',
      'Configure backup frequency for memories in Backups → Memory Vault schedule.',
    ],
    tips: [
      'Use namespaces to organise memories by agent, project, or environment to avoid cross-contamination.',
      'Pin critical memories (user preferences, brand guidelines) so they are never auto-evicted.',
      'Regularly audit memory usage — stale task results can bloat the vault and slow lookups.',
    ],
  },
  {
    id: 'brain',
    name: 'Brain Router',
    icon: Brain,
    layer: 'L3',
    category: 'Core Layers',
    description: 'Multi-provider AI routing system. Configure providers (OpenRouter, Hugging Face, OpenAI, Anthropic, Ollama, Z-AI), browse and add models, set routing rules, and chat with any LLM. The Brain Router handles provider selection, API key management, token counting, and cost attribution per model.',
    howToUse: [
      'Open Brain Router from the sidebar — you\'ll see 5 tabs: Models, Providers, Browse, Rules, and Chat.',
      'Models tab: View all configured models, toggle them on/off, select one for chat, or delete models you no longer need.',
      'Providers tab: Configure API keys for each provider. Click the ⚙️ gear icon to enter your API key, then click "Test Connection" to verify it works.',
      'Browse tab: Fetch available models from OpenRouter (200+ models) or Hugging Face (100+ open-source models). Search by name, provider, or capability, then click + to add a model to your config.',
      'Chat tab: Select any active model from the dropdown and start chatting. The system automatically routes your message through the correct provider API.',
    ],
    howToSetUp: [
      'Step 1 — Get an OpenRouter API key from openrouter.ai/keys (recommended — one key gives access to 200+ models including GPT-4o, Claude, Gemini, Llama, and more).',
      'Step 2 — Go to Brain Router → Providers tab → Click ⚙️ on OpenRouter → Paste your API key → Click "Test Connection" → Click "Save".',
      'Step 3 — Go to Browse tab → Select "OpenRouter" → Click the refresh button → Browse the model list → Click + to add models you want to use.',
      'Step 4 — (Optional) Add a Hugging Face API key for free open-source model inference, or enable Ollama for local model support.',
      'Step 5 — Go to Chat tab → Select a model from the dropdown → Start chatting! The system routes through the correct provider automatically.',
    ],
    tips: [
      'OpenRouter is the best starting point — one API key gives you access to every major model, and you can switch between them instantly.',
      'Use Hugging Face for free open-source model inference — great for testing and low-volume tasks without any cost.',
      'Ollama lets you run models locally on your machine — perfect for privacy-sensitive work or when you don\'t want to rely on cloud APIs.',
      'The Browse tab shows pricing for each model — look for "Free" models on Hugging Face or compare costs across providers on OpenRouter.',
      'You can add the same model from different providers (e.g., GPT-4o via OpenRouter vs. direct OpenAI) and compare response quality and cost.',
    ],
  },
  {
    id: 'agents',
    name: 'Agents',
    icon: Users,
    layer: 'L4',
    category: 'Core Layers',
    description: 'Create, configure, and manage AI agents. Each agent has a system prompt, model assignment, skill set, memory scope, and runtime parameters. Agents are the core building blocks of the AgentOS platform.',
    howToUse: [
      'Open the Agents grid to see all agents displayed as cards with status, model, and last activity.',
      'Click "Create Agent" to open the agent builder — fill in the name, system prompt, select a model from Brain Router, and assign skills.',
      'Click any agent card to open its detail view: edit the prompt, view conversation history, check costs, and see associated workflows.',
      'Use the status toggle (Active/Paused) to control whether an agent can receive new tasks.',
      'Click the three-dot menu on an agent card for quick actions: duplicate, archive, delete, or open in Playground.',
    ],
    howToSetUp: [
      'Ensure Brain Router has at least one provider configured (OpenRouter recommended — one key for 200+ models).',
      'When creating an agent, write a clear and specific system prompt — include role definition, output format, constraints, and examples.',
      'Assign relevant skills from Agent Skills (e.g., web_search, code_execution, file_read) so the agent can take actions.',
      'Set the agent\'s memory scope in Memory Vault to determine what context it can access.',
      'Configure rate limits and max concurrent tasks per agent in the agent\'s Settings tab.',
    ],
    tips: [
      'Always version your agent prompts — use Agent Versioning to track changes and roll back if performance degrades.',
      'Give each agent a single, focused responsibility rather than a broad multi-purpose role for better reliability.',
      'Test new agents in the Playground before deploying them to Production Surfaces.',
    ],
  },
  {
    id: 'workflows',
    name: 'Workflows',
    icon: GitBranch,
    layer: 'L4+',
    category: 'Core Layers',
    description: 'Build multi-step agent workflows using a visual drag-and-drop builder. Chain agent calls, add conditional branching, parallel execution, and data transformation steps to automate complex business processes.',
    howToUse: [
      'Open Workflow Builder and click "New Workflow" to start with a blank canvas.',
      'Drag agent nodes from the left panel onto the canvas and connect them with edges to define execution order.',
      'Click a node to configure it: select the agent, set input mapping (previous step outputs → this step inputs), and add conditions.',
      'Add branch nodes for if/else logic, or parallel nodes to run multiple agents simultaneously.',
      'Click "Run" to execute the workflow manually, or save it and attach it to a Scheduler for recurring execution.',
    ],
    howToSetUp: [
      'Ensure the agents you want to use in workflows are already created and active in the Agents grid.',
      'Define input/output schemas for each agent so the workflow builder can validate data flow between nodes.',
      'Set up error handling: configure fallback nodes that activate if any step fails (retry, notify, or switch agent).',
      'Enable workflow logging in Settings → Workflows → Detailed Logging for debugging complex flows.',
      'Create workflow templates in the Template Library for reusable patterns (e.g., "Customer Support Escalation Flow").',
    ],
    tips: [
      'Start with simple linear workflows and add branching only when needed — complex flows are harder to debug.',
      'Use the "Test Step" button on each node to validate it in isolation before running the entire workflow.',
      'Always set a timeout on each node (default: 60s) to prevent one slow step from blocking the entire workflow.',
    ],
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    icon: Clock,
    layer: 'L5+',
    category: 'Core Layers',
    description: 'Schedule recurring tasks and workflows using cron expressions. The Scheduler runs jobs at specified intervals, tracks execution history, and handles missed runs with configurable retry policies.',
    howToUse: [
      'Open Scheduler to see all scheduled jobs in a table with their cron expression, next run time, and status.',
      'Click "Create Job" and select a workflow or agent to run on a schedule.',
      'Enter a cron expression (e.g., "0 9 * * 1-5" for 9 AM on weekdays) or use the visual cron builder.',
      'Set the timezone, retry policy (max retries, backoff strategy), and timeout for each job.',
      'Click the history icon on any job to view past executions, their duration, and success/failure status.',
    ],
    howToSetUp: [
      'Ensure the workflows or agents you want to schedule are already created and tested.',
      'Configure the Scheduler timezone in Settings → Scheduler → Timezone (default: UTC).',
      'Set up a dead-letter queue in Settings → Scheduler → Failed Jobs to capture outputs from failed executions.',
      'Enable Slack/email notifications for failed jobs via Alert Channels integration.',
      'For high-frequency jobs (< 1 minute interval), enable the "High Priority" flag to ensure timely execution.',
    ],
    tips: [
      'Use the visual cron builder if you\'re not comfortable writing cron expressions manually.',
      'Stagger heavy jobs to avoid resource contention — don\'t schedule all jobs at the top of the hour.',
      'Review the execution history weekly to identify jobs that are consistently failing or timing out.',
    ],
  },
  {
    id: 'production',
    name: 'Production Surfaces',
    icon: Monitor,
    layer: 'L6',
    category: 'Core Layers',
    description: 'Deploy agents to production workspaces with goals, constraints, and SLA tracking. Production Surfaces provide the interface between your agents and real-world tasks, monitoring performance against defined objectives.',
    howToUse: [
      'Open Production Surfaces and switch between the Studio (configuration) and Monitor (live metrics) tabs.',
      'In Studio, create a new surface: assign agents, define goals (e.g., "resolve 90% of support tickets within 4 hours"), and set constraints.',
      'Deploy the surface by clicking "Go Live" — agents will start receiving real tasks.',
      'Switch to Monitor to see live metrics: tasks completed, average response time, goal attainment percentage.',
      'Click "Pause" to temporarily stop the surface without deleting it, or "Rollback" to revert to a previous configuration.',
    ],
    howToSetUp: [
      'Ensure the agents assigned to the surface are fully tested in the Playground before going live.',
      'Define measurable goals with numeric thresholds so the Monitor can calculate attainment automatically.',
      'Set up alerting in Alert Channels for when goal attainment drops below a critical threshold.',
      'Configure the rollback strategy: automatic rollback on SLA breach, or manual approval via Approvals (HITL).',
      'Map input sources (webhooks, queues, API endpoints) to the surface in the Inputs tab.',
    ],
    tips: [
      'Always start with a "shadow mode" deployment where agents process tasks but don\'t send responses, to validate quality.',
      'Set conservative SLA targets initially and tighten them as you gather performance data.',
      'Use the Production Monitor dashboard to catch degradation early before it impacts users.',
    ],
  },
  {
    id: 'loop',
    name: 'Loop System',
    icon: RefreshCw,
    layer: 'L7',
    category: 'Core Layers',
    description: 'Configure output routing and writeback loops for agents. The Loop System defines where agent outputs go — write to a file, call an API, trigger another agent, or feed back into the agent for iterative refinement.',
    howToUse: [
      'Open Loop System to see all configured output routes for your agents.',
      'Click "New Route" and select the source agent, then define the output destination (file, API, agent, webhook).',
      'For feedback loops, set the loop condition (e.g., "continue until confidence > 0.9" or "max 5 iterations").',
      'Test the route by clicking "Dry Run" — it will simulate the output without actually writing to the destination.',
      'Monitor loop executions in the Activity tab to see how many iterations each loop is taking.',
    ],
    howToSetUp: [
      'Define output schemas for each agent so the Loop System can validate data before routing.',
      'For file writeback, configure the base path and file naming pattern in Settings → Loop → File Output.',
      'For API writeback, register the target endpoint in Webhooks first, then reference it in the loop route.',
      'Set a maximum iteration count for feedback loops to prevent infinite cycles (default: 10).',
      'Enable loop logging to track each iteration\'s input, output, and termination reason.',
    ],
    tips: [
      'Always set a max iteration count on feedback loops — even well-designed prompts can get stuck in loops.',
      'Use the Dry Run feature extensively before enabling writeback to production APIs or files.',
      'Monitor loop iteration counts; if a loop consistently hits the max, the agent\'s prompt needs refinement.',
    ],
  },
  {
    id: 'swarm',
    name: 'Agent Swarm',
    icon: Bug,
    layer: 'L4++',
    category: 'Core Layers',
    description: 'Orchestrate swarms of agents that work on a shared task in parallel. Swarms distribute sub-tasks across multiple agent instances, aggregate results, and apply consensus or voting to produce a final output.',
    howToUse: [
      'Open Agent Swarm and click "Create Swarm" — give it a name and select the base agent template.',
      'Configure the swarm size (number of agent instances) and the distribution strategy (round-robin, random, least-loaded).',
      'Define the aggregation method: majority vote, average, best-of-N, or custom function.',
      'Submit a task to the swarm via the "Run Task" button and watch the real-time progress of each agent instance.',
      'Review the aggregated result and the individual agent outputs in the Results tab.',
    ],
    howToSetUp: [
      'Create a well-defined agent template that can work independently on sub-tasks without inter-dependencies.',
      'Configure the Brain Router with sufficient rate limits to handle parallel requests from all swarm instances.',
      'Set up Memory Vault isolation so each swarm instance has its own scratch space to avoid data collisions.',
      'Define the aggregation function in the Swarm Settings — for complex logic, use a custom JavaScript function.',
      'Set resource quotas in Resource Quotas to prevent swarms from consuming all available compute.',
    ],
    tips: [
      'Start with small swarms (3-5 instances) and scale up — more instances don\'t always mean better results.',
      'Use majority-vote aggregation for classification tasks and best-of-N for generative tasks.',
      'Monitor the variance between swarm instance outputs — high variance indicates the prompt needs more constraints.',
    ],
  },
  {
    id: 'teams',
    name: 'Agent Teams',
    icon: UserCog,
    layer: 'L4++',
    category: 'Core Layers',
    description: 'Group agents into persistent teams with defined roles and communication channels. Unlike swarms (parallel, anonymous), teams have named roles (leader, researcher, writer) and communicate via structured messages.',
    howToUse: [
      'Open Agent Teams and click "Create Team" — name the team and add agents with assigned roles.',
      'Define the team\'s communication protocol: which roles can message which, and the message format.',
      'Assign a task to the team — the leader agent will decompose it and delegate sub-tasks to team members.',
      'Monitor the team\'s message board in real-time to see inter-agent communication and task progress.',
      'Review the team\'s final output, which the leader agent assembles from member contributions.',
    ],
    howToSetUp: [
      'Create the individual agents first in the Agents grid, each with a role-specific system prompt.',
      'Define role descriptions clearly: "You are the Researcher. Your job is to gather information and pass findings to the Writer."',
      'Configure the team\'s message routing in Agent Chat to ensure agents only see relevant messages.',
      'Set up memory sharing rules: which team members can read each other\'s context from Memory Vault.',
      'Create a team template in Templates for recurring team compositions.',
    ],
    tips: [
      'Always designate a leader/coordinator agent — teams without a leader tend to produce fragmented outputs.',
      'Limit team size to 3-5 agents; larger teams suffer from communication overhead and conflicting instructions.',
      'Use the message board to debug team dynamics — if agents are talking past each other, refine the role prompts.',
    ],
  },
  {
    id: 'chains',
    name: 'Agent Chains',
    icon: GitBranch,
    layer: 'L4++',
    category: 'Core Layers',
    description: 'Chain agents sequentially where each agent\'s output becomes the next agent\'s input. Chains are simpler than workflows but ideal for linear processing pipelines like research → draft → review → publish.',
    howToUse: [
      'Open Agent Chains and click "Create Chain" — give it a name and description.',
      'Add agents to the chain in order: the first agent processes the input, its output feeds into the second, and so on.',
      'Configure input/output transformation between steps if needed (e.g., extract only the summary from a research agent\'s output).',
      'Run the chain manually with "Execute" or attach it to a trigger (webhook, scheduler).',
      'View the chain execution log showing each step\'s input, output, and latency.',
    ],
    howToSetUp: [
      'Design the chain flow on paper first: identify each step, its input format, and expected output format.',
      'Create agents with prompts that expect the previous agent\'s output format as input.',
      'Add transformation functions between steps if output formats don\'t match (e.g., JSON extraction, summarisation).',
      'Set per-step timeouts to prevent a slow agent from stalling the entire chain.',
      'Configure error handling: stop on failure, skip and continue, or retry the step.',
    ],
    tips: [
      'Keep chains short (3-5 steps) — longer chains amplify errors and latency from early steps.',
      'Add a "validation" agent at the end of the chain to quality-check the final output before delivery.',
      'Log every step\'s output for debugging — it\'s the only way to identify where a chain goes wrong.',
    ],
  },
  {
    id: 'versioning',
    name: 'Agent Versioning',
    icon: GitCommit,
    layer: 'L4+',
    category: 'Core Layers',
    description: 'Track version history of agent configurations (prompts, model settings, skills). Roll back to any previous version, compare diffs between versions, and pin a version as the "production" baseline.',
    howToUse: [
      'Open Agent Versioning to see a timeline of all configuration changes across your agents.',
      'Click on an agent to see its version history — each entry shows what changed, who changed it, and when.',
      'Click "Diff" to compare two versions side-by-side with highlighted changes.',
      'Click "Rollback" on any version to restore that configuration as the current active version.',
      'Pin a version as "Production Baseline" — it will be highlighted and protected from accidental deletion.',
    ],
    howToSetUp: [
      'Enable versioning in Settings → Versioning → Auto-version (automatically creates a version on every save).',
      'Configure version retention policy: how many versions to keep per agent (default: 50).',
      'Set up notifications via Alert Channels for when an agent is rolled back to a previous version.',
      'Enable "Require Comment" so that every version save includes a description of what changed.',
      'Integrate with Audit Log so that version changes appear in the compliance trail.',
    ],
    tips: [
      'Always add a descriptive comment when saving a version — "updated prompt" is useless; "added rate-limiting instructions for API calls" is useful.',
      'Pin the current working version before making experimental changes so you can easily roll back.',
      'Review version diffs before rolling back — sometimes the issue isn\'t the prompt but the input data.',
    ],
  },
  {
    id: 'delegation',
    name: 'Delegation',
    icon: Send,
    layer: 'L4++',
    category: 'Core Layers',
    description: 'Enable agents to delegate sub-tasks to other agents dynamically at runtime. Unlike chains (static ordering), delegation is agent-initiated — an agent decides during execution that it needs help from another specialist agent.',
    howToUse: [
      'Open Delegation to see active and completed delegations across all agents.',
      'When creating or editing an agent, enable the "Can Delegate" flag and specify which agents it can delegate to.',
      'In the agent\'s system prompt, instruct it when to delegate: "If the user asks about legal topics, delegate to the Legal Agent."',
      'Monitor the Delegation dashboard to see real-time delegation chains: Agent A → Agent B → Agent C.',
      'Review completed delegations to audit whether agents are delegating appropriately or over-delegating.',
    ],
    howToSetUp: [
      'Define a delegation graph: which agents can delegate to which other agents, preventing circular delegation.',
      'Set delegation limits per agent: max depth (how many levels of delegation), max breadth (how many simultaneous delegations).',
      'Configure the delegation timeout — if a delegated agent doesn\'t respond within X seconds, the parent agent continues without it.',
      'Enable delegation logging in Settings → Delegation → Log All for full auditability.',
      'Set up Guardrails rules to prevent delegation of sensitive tasks (e.g., financial transactions) to unauthorised agents.',
    ],
    tips: [
      'Limit delegation depth to 2-3 levels to prevent infinite delegation chains.',
      'Monitor the delegation graph for "popular" agents that receive too many delegations — they become bottlenecks.',
      'Include a "fallback" instruction in agent prompts for when delegation fails or times out.',
    ],
  },
  {
    id: 'consensus',
    name: 'Consensus',
    icon: Vote,
    layer: 'L4++',
    category: 'Core Layers',
    description: 'Implement democratic voting and consensus protocols among agent groups. Agents vote on proposals, and the system applies configurable consensus rules (simple majority, supermajority, unanimous) to reach decisions.',
    howToUse: [
      'Open Consensus and click "Create Round" — define the question/proposal and select the voting agents.',
      'Choose the consensus mechanism: simple majority (>50%), supermajority (>66%), or unanimous (100%).',
      'Submit the round — each voting agent will independently evaluate and cast its vote.',
      'Watch the real-time vote tally as agents submit their decisions.',
      'Review the outcome: the winning decision, individual agent votes, and their reasoning.',
    ],
    howToSetUp: [
      'Select agents that have diverse perspectives for more robust consensus outcomes.',
      'Configure the voting prompt template: each agent should explain its reasoning alongside its vote.',
      'Set the quorum: minimum number of agents that must vote before a decision is finalised.',
      'Enable "Blind Voting" so agents can\'t see each other\'s votes before casting their own.',
      'Set up a tiebreaker agent or rule (e.g., the team leader casts the deciding vote).',
    ],
    tips: [
      'Use consensus for high-stakes decisions where a single agent\'s judgment is insufficient.',
      'Require agents to provide reasoning with their votes — this helps identify when agents are voting for wrong reasons.',
      'Avoid using consensus for time-sensitive tasks — voting adds latency.',
    ],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: Store,
    layer: 'L10',
    category: 'Core Layers',
    description: 'Browse and install pre-built agents, workflows, skills, and templates from the AgentOS marketplace. Publish your own creations to share with the community or within your organisation.',
    howToUse: [
      'Open Marketplace and browse listings by category (Agents, Workflows, Skills, Templates) or search by keyword.',
      'Click any listing to see its description, author, rating, version history, and compatibility requirements.',
      'Click "Install" to add the item to your workspace — it will appear in the relevant section (Agents grid, Workflow Builder, etc.).',
      'Rate and review installed items to help other users make informed decisions.',
      'Click "Publish" to submit your own agent or workflow to the marketplace.',
    ],
    howToSetUp: [
      'Ensure your AgentOS tier (L10) includes marketplace access.',
      'Configure your publisher profile in Settings → Marketplace → Publisher Profile (name, description, logo).',
      'Set up a review workflow for your published items: auto-approve or require admin approval.',
      'Configure marketplace sync frequency in Settings → Marketplace → Sync Interval.',
      'Enable notifications for new listings matching your interests via Alert Channels.',
    ],
    tips: [
      'Always check the compatibility section before installing — some items require specific model providers or skills.',
      'Test marketplace agents in the Playground before deploying to production.',
      'Read reviews and check the author\'s other listings to gauge quality before installing.',
    ],
  },
  {
    id: 'environment',
    name: 'Environment',
    icon: Variable,
    layer: 'L1+',
    category: 'Core Layers',
    description: 'Manage environment variables, API keys, and configuration secrets for your AgentOS instance. Centralises all configuration so agents and workflows can reference variables without hardcoding sensitive values.',
    howToUse: [
      'Open Environment Manager and switch between Variables, Secrets, and Configs tabs.',
      'In Variables, add key-value pairs that agents can reference (e.g., API_BASE_URL, DEFAULT_MODEL).',
      'In Secrets, store sensitive values (API keys, tokens) — these are encrypted and never shown in plain text after creation.',
      'Reference variables in agent prompts using the {{env.VARIABLE_NAME}} syntax.',
      'Import/export environment configurations using the Export/Import buttons for backup or migration.',
    ],
    howToSetUp: [
      'Set up environment variables for each deployment stage (development, staging, production) using the Environment selector.',
      'Store all API keys as Secrets (not Variables) so they are encrypted at rest.',
      'Configure variable inheritance: production can override specific variables while inheriting the rest from staging.',
      'Enable audit logging for secret access in Settings → Environment → Log Secret Access.',
      'Set up automatic secret rotation for supported providers (AWS, GCP) in the Secrets tab.',
    ],
    tips: [
      'Never hardcode API keys in agent prompts — always reference them as {{env.SECRET_NAME}}.',
      'Use different variable sets for dev/staging/prod to prevent accidental cross-environment access.',
      'Rotate secrets regularly and use the rotation feature to automate the process.',
    ],
  },
  // ── Tools & Integrations ──
  {
    id: 'feature-flags',
    name: 'Feature Flags',
    icon: Flag,
    layer: 'L5+',
    category: 'Tools & Integrations',
    description: 'Toggle features on and off without redeploying. Feature flags let you enable new agent capabilities, workflow steps, or UI elements for specific users, teams, or environments with instant effect.',
    howToUse: [
      'Open Feature Flags to see all flags and their current state (enabled/disabled) across environments.',
      'Click "Create Flag" — give it a name, description, default state, and target environment.',
      'Toggle a flag on/off using the switch — changes take effect immediately for all agents referencing the flag.',
      'Set up targeting rules: enable a flag only for specific agent IDs, user segments, or percentage rollouts.',
      'Monitor flag evaluation logs to see which agents are checking which flags and the results.',
    ],
    howToSetUp: [
      'Define a naming convention for flags (e.g., agent.capability.web_search, workflow.step.sentiment_analysis).',
      'Set default states carefully — new flags should default to "off" in production and "on" in development.',
      'Configure flag evaluation caching in Settings → Feature Flags → Cache TTL to reduce latency.',
      'Set up audit logging for flag changes so you can track who toggled what and when.',
      'Create flag groups for related features that should be toggled together.',
    ],
    tips: [
      'Use percentage rollouts to gradually enable features — start with 5%, monitor, then increase.',
      'Add a "kill switch" flag for every major feature so you can instantly disable it if something goes wrong.',
      'Clean up stale flags regularly — flags that have been fully rolled out and can be removed.',
    ],
  },
  {
    id: 'system-resources',
    name: 'System Resources',
    icon: Gauge,
    layer: 'L0',
    category: 'Tools & Integrations',
    description: 'Monitor CPU, RAM, disk, and GPU usage on your VPS in real-time. System Resources provides live gauges, historical charts, and process-level breakdowns to help you optimise infrastructure costs.',
    howToUse: [
      'Open System Resources and switch between Overview, Processes, and Network tabs.',
      'In Overview, review the live gauges for CPU, RAM, Disk, and GPU (if available) with colour-coded thresholds.',
      'Switch to Processes to see a sortable table of running processes by CPU/Memory consumption.',
      'Click on any process to see its details: command, PID, uptime, and resource history.',
      'Set threshold alerts by clicking the bell icon on any gauge — you\'ll be notified when usage exceeds the threshold.',
    ],
    howToSetUp: [
      'System Resources is available at L0 — no additional setup required for basic monitoring.',
      'Install the AgentOS monitoring agent on your VPS for detailed process-level metrics.',
      'Configure alert thresholds in Settings → Monitoring → Resource Thresholds (CPU > 80%, RAM > 90%, Disk > 85%).',
      'Set up Alert Channel integrations (Slack, email, PagerDuty) for threshold notifications.',
      'Enable historical data retention in Settings → Monitoring → Data Retention (default: 30 days).',
    ],
    tips: [
      'Check the Overview dashboard daily to catch resource trends before they become critical.',
      'Sort the Processes table by memory to identify the most resource-hungry services.',
      'Set conservative alert thresholds — you want early warning, not alert fatigue.',
    ],
  },
  {
    id: 'network-monitor',
    name: 'Network Monitor',
    icon: Wifi,
    layer: 'L0',
    category: 'Tools & Integrations',
    description: 'Monitor network connections, DNS resolution, bandwidth usage, and connectivity to external APIs. Essential for diagnosing latency issues and ensuring agent-to-service communication is healthy.',
    howToUse: [
      'Open Network Monitor to see the Overview tab with bandwidth usage, active connections, and DNS stats.',
      'Switch to Connections to see all active TCP/UDP connections sorted by bandwidth or latency.',
      'Use the DNS tab to check resolution times for your configured API endpoints.',
      'Click "Run Speed Test" to measure current bandwidth to the nearest test server.',
      'Set up connectivity checks for specific endpoints (e.g., api.openai.com) to get uptime metrics.',
    ],
    howToSetUp: [
      'Network Monitor is available at L0 — basic monitoring works out of the box.',
      'Add custom endpoint checks in Settings → Network → Endpoints to monitor your critical APIs.',
      'Configure DNS server preferences in Settings → Network → DNS (default: system resolver).',
      'Set up bandwidth alerts in Settings → Network → Bandwidth Thresholds.',
      'Enable packet capture logging for debugging connection issues (disable when not needed to save disk space).',
    ],
    tips: [
      'Monitor DNS resolution times — slow DNS is a common cause of agent latency that\'s easy to overlook.',
      'Add endpoint checks for every LLM provider you use in Brain Router to catch connectivity issues early.',
      'Use the Speed Test before deploying bandwidth-heavy workflows to ensure your VPS can handle the load.',
    ],
  },
  {
    id: 'benchmarking',
    name: 'Benchmarking',
    icon: Trophy,
    layer: 'L8+',
    category: 'Tools & Integrations',
    description: 'Benchmark agent performance against standard and custom test suites. Measure accuracy, latency, cost-efficiency, and task completion rates to compare agents or track improvements over time.',
    howToUse: [
      'Open Benchmarking and select a benchmark suite (e.g., "General QA", "Code Generation", "Customer Support").',
      'Select the agent(s) to benchmark and click "Run Benchmark".',
      'Watch real-time progress as the agent processes each test case.',
      'Review the results: accuracy score, average latency, cost per task, and per-category breakdown.',
      'Compare results across multiple runs or different agents using the Compare tab.',
    ],
    howToSetUp: [
      'Create custom benchmark suites that reflect your specific use cases and quality criteria.',
      'Define scoring rubrics: exact match, fuzzy match, LLM-as-judge, or human evaluation.',
      'Set up automated benchmarking in Scheduler to run weekly and track performance over time.',
      'Configure the benchmark environment: same model, temperature, and context for fair comparisons.',
      'Integrate with Evals for more sophisticated evaluation pipelines.',
    ],
    tips: [
      'Run benchmarks after every significant prompt change to catch regressions early.',
      'Use LLM-as-judge scoring for open-ended tasks where exact match is too strict.',
      'Benchmark in isolation — don\'t run benchmarks while other heavy tasks are running on the same VPS.',
    ],
  },
  {
    id: 'docker',
    name: 'Docker',
    icon: Container,
    layer: 'L1',
    category: 'Tools & Integrations',
    description: 'Manage Docker containers on your VPS directly from the AgentOS interface. Start, stop, restart containers, view logs, and monitor resource usage without leaving the platform.',
    howToUse: [
      'Open Docker Manager to see all containers on your VPS with their status, image, and resource usage.',
      'Click the play/stop buttons to start or stop individual containers.',
      'Click on a container name to view its logs, environment variables, and port mappings.',
      'Use the "Pull Image" button to download new Docker images from Docker Hub or private registries.',
      'Click "New Container" to create and start a container from an image with custom configuration.',
    ],
    howToSetUp: [
      'Ensure Docker is installed on your VPS and the AgentOS Docker socket is configured in Settings → Docker.',
      'Add your Docker Hub credentials in Settings → Docker → Registry Auth for private image access.',
      'Configure default resource limits for new containers (CPU shares, memory limit) in Settings → Docker → Defaults.',
      'Set up log rotation in Settings → Docker → Log Rotation to prevent container logs from filling disk space.',
      'Enable container health checks so AgentOS can auto-restart unhealthy containers.',
    ],
    tips: [
      'Use the logs viewer to debug container issues — you can filter by severity and search by keyword.',
      'Set memory limits on all containers to prevent a single container from consuming all VPS RAM.',
      'Regularly clean up unused images and stopped containers to free disk space.',
    ],
  },
  {
    id: 'prompt-library',
    name: 'Prompt Library',
    icon: BookOpen,
    layer: 'L4+',
    category: 'Tools & Integrations',
    description: 'Manage, version, and share prompt templates. The Prompt Library lets you create reusable prompt templates with variable slots, test them in the Playground, and assign them to agents.',
    howToUse: [
      'Open Prompt Library and browse existing prompts by category or search by keyword.',
      'Click "New Prompt" to create a template — use {{variable}} syntax for dynamic slots.',
      'Test the prompt in the built-in preview panel: fill in the variable values and see the rendered output.',
      'Assign a prompt to an agent by clicking "Use in Agent" — it will populate the agent\'s system prompt field.',
      'Fork an existing prompt to create a variant without modifying the original.',
    ],
    howToSetUp: [
      'Organise prompts into categories (System Prompts, Task Instructions, Formatting Rules) for easy discovery.',
      'Use variable slots for any value that changes between agents (e.g., {{role}}, {{output_format}}, {{constraints}}).',
      'Enable prompt versioning to track changes — every edit creates a new version with a diff.',
      'Set up prompt review workflows: require approval before a prompt can be assigned to production agents.',
      'Import community prompts from the Marketplace to jumpstart your library.',
    ],
    tips: [
      'Use the preview panel to test prompts with different variable values before assigning to agents.',
      'Write prompts with clear sections: Role, Task, Constraints, Output Format, Examples.',
      'Keep prompts in the library rather than editing them directly in agents — it makes version tracking easier.',
    ],
  },
  {
    id: 'automation-rules',
    name: 'Automation Rules',
    icon: Zap,
    layer: 'L5+',
    category: 'Tools & Integrations',
    description: 'Create event-triggered automation rules that respond to system events automatically. Define IF-THEN rules: when an incident is created, notify Slack; when a workflow fails, retry it; when cost exceeds threshold, pause agents.',
    howToUse: [
      'Open Automation Rules to see all active rules with their trigger conditions and actions.',
      'Click "Create Rule" — define the trigger event (e.g., "incident.created", "workflow.failed", "cost.threshold_exceeded").',
      'Configure the action: send notification, run workflow, pause agent, update feature flag, or call webhook.',
      'Add conditions to narrow the trigger (e.g., only for incidents with severity = "critical").',
      'Enable/disable rules with the toggle switch without deleting them.',
    ],
    howToSetUp: [
      'Review the available event types in Settings → Automation → Event Types to understand what you can trigger on.',
      'Start with notification rules (incident → Slack alert) before creating action rules (incident → auto-restart).',
      'Test rules in "dry run" mode first — the rule will log what it would do without actually doing it.',
      'Set up rate limiting on rules to prevent runaway automation (e.g., max 10 actions per minute per rule).',
      'Create an audit trail by enabling rule execution logging in Settings → Automation → Log Executions.',
    ],
    tips: [
      'Always test rules in dry-run mode before enabling them — automated actions can have unintended consequences.',
      'Set rate limits on every rule to prevent automation storms when multiple events fire simultaneously.',
      'Review rule execution logs weekly to catch rules that are firing too often or not at all.',
    ],
  },
  {
    id: 'event-bus',
    name: 'Event Bus',
    icon: Radio,
    layer: 'L5+',
    category: 'Tools & Integrations',
    description: 'A pub/sub event system for decoupled communication between agents, workflows, and external systems. Publish events to topics, subscribe agents to topics, and route events to Automation Rules or webhooks.',
    howToUse: [
      'Open Event Bus and switch between Topics, Subscriptions, and Messages tabs.',
      'In Topics, see all event topics with their message rates and subscriber counts.',
      'Click "Publish Message" to manually send a test event to a topic.',
      'In Subscriptions, see which agents and webhooks are listening to which topics.',
      'In Messages, browse recent events with their payload, timestamp, and delivery status.',
    ],
    howToSetUp: [
      'Define your event taxonomy: use hierarchical topic names (e.g., agent.task.completed, workflow.step.failed).',
      'Create subscriptions for agents that need to react to specific events (e.g., alert agent subscribes to incident.*).',
      'Configure message retention in Settings → Event Bus → Retention (default: 7 days).',
      'Set up dead-letter topics for messages that fail delivery after max retries.',
      'Enable message ordering for topics where event sequence matters.',
    ],
    tips: [
      'Use wildcard subscriptions (e.g., incident.*) to catch all incident-related events with a single subscription.',
      'Monitor message backlog — if a subscriber can\'t keep up, messages will queue up and delay processing.',
      'Design events to be idempotent: processing the same event twice should be safe.',
    ],
  },
  {
    id: 'incidents',
    name: 'Incidents',
    icon: AlertTriangle,
    layer: 'L0+',
    category: 'Tools & Integrations',
    description: 'Track and resolve operational incidents. Create incidents when agents fail, workflows error, or SLAs are breached. Assign severity, track resolution timeline, and maintain a post-mortem knowledge base.',
    howToUse: [
      'Open Incidents to see all active and recent incidents sorted by severity and creation time.',
      'Click "Create Incident" — fill in the title, severity (P1-P4), affected component, and initial description.',
      'Update the incident timeline as you investigate: add notes, attach logs, and change status (investigating → identified → resolving → resolved).',
      'Assign the incident to a team member or agent for resolution.',
      'After resolution, click "Post-Mortem" to document root cause, impact, and prevention measures.',
    ],
    howToSetUp: [
      'Configure severity level definitions in Settings → Incidents → Severity Levels so the team uses consistent criteria.',
      'Set up auto-incident creation via Automation Rules: when workflow.failed fires with retry exhausted, create a P2 incident.',
      'Configure notification escalation: P1 incidents page on-call immediately, P2 within 15 minutes, etc.',
      'Enable integration with Alert Channels so incident updates are pushed to Slack/Teams/PagerDuty.',
      'Set up incident templates for common failure modes (e.g., "API Provider Down", "Agent Timeout Loop").',
    ],
    tips: [
      'Create incidents early rather than later — you can always downgrade severity as you learn more.',
      'Always write a post-mortem for P1/P2 incidents — it\'s the best way to prevent recurrence.',
      'Use the incident timeline as a real-time status page during active incidents.',
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    layer: 'L8',
    category: 'Tools & Integrations',
    description: 'Usage analytics and visualisation dashboards for tracking agent performance, workflow throughput, cost trends, and user activity. Provides charts, tables, and exportable reports.',
    howToUse: [
      'Open Analytics and choose a dashboard: Agent Performance, Workflow Throughput, Cost Analysis, or User Activity.',
      'Use the date range picker at the top to filter data to the relevant period.',
      'Hover over chart elements to see detailed tooltips with exact values.',
      'Click "Export" on any chart to download the underlying data as CSV.',
      'Use the "Compare" feature to overlay two time periods and identify trends.',
    ],
    howToSetUp: [
      'Enable analytics data collection in Settings → Analytics → Enable Tracking.',
      'Configure data retention in Settings → Analytics → Retention (default: 90 days).',
      'Set up custom dashboards in Dashboard Customizer to track your specific KPIs.',
      'Configure scheduled report generation in Scheduler to email weekly analytics summaries.',
      'Integrate with Observability for correlated traces and metrics.',
    ],
    tips: [
      'Check the Cost Analysis dashboard weekly to identify agents or workflows that are trending upward in spend.',
      'Use the Compare feature month-over-month to spot gradual performance degradation.',
      'Export data to CSV for deeper analysis in Excel or Google Sheets.',
    ],
  },
  {
    id: 'costs',
    name: 'Cost Tracker',
    icon: PoundSterling,
    layer: 'L8+',
    category: 'Tools & Integrations',
    description: 'Track spending in GBP (£) across all agents, workflows, and model providers. Set budgets, monitor daily/monthly spend, and receive alerts when costs exceed configured thresholds.',
    howToUse: [
      'Open Cost Tracker to see the current month\'s spend broken down by agent, model, and workflow.',
      'Review the daily spend chart to identify cost spikes and trends.',
      'Click on any agent or model in the breakdown table to see detailed per-day costs.',
      'Set a monthly budget in the Budget tab — the tracker will show your burn rate and projected month-end total.',
      'Review cost allocation by team or project using the Tags filter.',
    ],
    howToSetUp: [
      'Configure your currency in Settings → Costs → Currency (default: GBP).',
      'Set monthly budgets per agent, per team, and globally in the Budget tab.',
      'Enable cost alerts in Alert Channels: notify when daily spend exceeds X% of budget.',
      'Configure auto-pause rules: automatically pause agents when their monthly budget is exhausted.',
      'Set up scheduled cost reports in Scheduler to receive weekly/monthly summaries via email.',
    ],
    tips: [
      'Review the Cost Tracker daily during the first week of a new agent deployment to catch unexpected spend early.',
      'Use per-agent budgets to prevent a single runaway agent from consuming your entire budget.',
      'Tag agents and workflows by project/team for accurate cost allocation and chargeback.',
    ],
  },
  {
    id: 'resource-quotas',
    name: 'Resource Quotas',
    icon: Gauge,
    layer: 'L8+',
    category: 'Tools & Integrations',
    description: 'Set resource limits for agents, workflows, and teams. Prevent any single agent from consuming excessive CPU, memory, tokens, or API calls by defining hard and soft quotas with enforcement actions.',
    howToUse: [
      'Open Resource Quotas to see all configured quotas grouped by scope (agent, team, global).',
      'Click "Create Quota" — select the resource type (tokens, API calls, CPU, memory), scope, and limit.',
      'Set a soft limit (warning) and a hard limit (enforcement) for each quota.',
      'Choose the enforcement action when the hard limit is hit: pause agent, throttle requests, or notify only.',
      'Monitor quota usage in real-time on the dashboard — bars turn yellow at soft limit and red at hard limit.',
    ],
    howToSetUp: [
      'Start with generous quotas and tighten them based on observed usage patterns from Analytics.',
      'Set soft limits at 80% of hard limits to give early warning before enforcement kicks in.',
      'Configure quota reset periods: daily, weekly, or monthly depending on the resource type.',
      'Set up Alert Channel notifications for quota warnings so teams can take action before enforcement.',
      'Create team-level quotas in addition to agent-level quotas for aggregate control.',
    ],
    tips: [
      'Start with "notify only" enforcement while you calibrate the right quota levels.',
      'Token quotas are the most important — they directly impact cost. Set them per-agent and per-day.',
      'Review and adjust quotas monthly as your usage patterns evolve.',
    ],
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    icon: Webhook,
    layer: 'L5+',
    category: 'Tools & Integrations',
    description: 'Configure incoming and outgoing webhooks for integrating AgentOS with external services. Receive events from third-party tools, and send event notifications to Slack, Zapier, custom APIs, and more.',
    howToUse: [
      'Open Webhook Integrations and switch between Incoming and Outgoing tabs.',
      'For incoming webhooks, click "Create Endpoint" — AgentOS will generate a unique URL. Configure this URL in the external service.',
      'For outgoing webhooks, click "Create Webhook" — enter the target URL, select the events to send, and configure the payload format.',
      'Test any webhook using the "Send Test" button to verify connectivity and payload format.',
      'View the delivery log to see all webhook attempts, response codes, and retry status.',
    ],
    howToSetUp: [
      'For incoming webhooks, create an endpoint and map it to an agent or workflow using the "Route To" field.',
      'For outgoing webhooks, add the target URL and configure authentication (API key, HMAC signature, OAuth).',
      'Set up retry policies: number of retries, backoff strategy, and max retry duration.',
      'Configure payload templates to transform AgentOS events into the format expected by the target service.',
      'Enable delivery logging in Settings → Webhooks → Log All for debugging.',
    ],
    tips: [
      'Always use HMAC signatures for incoming webhooks to verify the sender\'s identity.',
      'Set up a dead-letter queue for failed outgoing webhooks to prevent data loss.',
      'Test webhooks with the "Send Test" feature before relying on them in production.',
    ],
  },
  {
    id: 'messages',
    name: 'Agent Chat',
    icon: MessageSquare,
    layer: 'L4+',
    category: 'Tools & Integrations',
    description: 'Inter-agent messaging system for structured communication. Agents can send messages to each other, to teams, or to human operators. Supports text, structured data, and file attachments.',
    howToUse: [
      'Open Agent Chat to see all conversation channels and recent messages.',
      'Click on a channel to view the message thread between specific agents or team members.',
      'Type a message in the compose box to send it as a system instruction to the selected agent.',
      'Filter messages by agent, channel, or message type (text, data, file).',
      'Click the pin icon on important messages to bookmark them for quick reference.',
    ],
    howToSetUp: [
      'Create channels for each team or agent pair that needs to communicate regularly.',
      'Configure message routing: which agents can send to which channels.',
      'Set up message retention policies in Settings → Chat → Retention (default: 30 days).',
      'Enable message persistence so agents can reference previous conversations from Memory Vault.',
      'Configure notification rules: alert human operators when specific keywords appear in agent messages.',
    ],
    tips: [
      'Use structured message formats (JSON) for inter-agent data exchange — it\'s more reliable than free-text parsing.',
      'Monitor message volume to detect communication storms between agents (a sign of poorly designed delegation).',
      'Pin important context messages so agents can quickly find them in long conversation threads.',
    ],
  },
  {
    id: 'knowledge-graph',
    name: 'Knowledge Graph',
    icon: Network,
    layer: 'L2+',
    category: 'Tools & Integrations',
    description: 'Visual knowledge exploration tool that maps entities, relationships, and concepts from your data. Build and query knowledge graphs to give agents structured world knowledge beyond text search.',
    howToUse: [
      'Open Knowledge Graph and select a graph to explore (or create a new one).',
      'The visual canvas shows entities as nodes and relationships as edges — drag to rearrange, scroll to zoom.',
      'Click on any node to see its properties, connected entities, and source documents.',
      'Use the search bar to find specific entities or filter by type (person, organisation, concept, event).',
      'Click "Query" to run graph queries (e.g., "Find all entities connected to Project X with a \'depends_on\' relationship").',
    ],
    howToSetUp: [
      'Create a new graph and define the entity types and relationship types you want to capture.',
      'Ingest data sources (documents, databases, APIs) through the Knowledge Base pipeline.',
      'Configure entity extraction: use LLM-based extraction or rule-based patterns to populate the graph.',
      'Set up automated graph updates: when new documents are added to Knowledge Base, extract entities and update the graph.',
      'Configure graph access for agents: grant read/write permissions based on agent roles.',
    ],
    tips: [
      'Start with a small, well-defined domain (e.g., your team\'s project structure) before building large graphs.',
      'Use the visual explorer to verify entity relationships — automated extraction can make incorrect associations.',
      'Connect the Knowledge Graph to agents so they can query it for structured knowledge during task execution.',
    ],
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    icon: BookOpen,
    layer: 'L2+',
    category: 'Tools & Integrations',
    description: 'RAG (Retrieval-Augmented Generation) document search system. Upload documents, web pages, and data sources, then let agents query them for accurate, context-grounded responses.',
    howToUse: [
      'Open Knowledge Base and click "Create Base" — give it a name and description.',
      'Upload documents (PDF, TXT, MD, CSV) or connect web URLs to populate the base.',
      'Click "Index" to process and chunk the documents into searchable embeddings.',
      'Use the search bar to test queries and see which document chunks are retrieved.',
      'Connect the knowledge base to an agent in the agent\'s settings so it can query the base at runtime.',
    ],
    howToSetUp: [
      'Choose the embedding model in Settings → Knowledge Base → Embedding Model (default: text-embedding-3-small).',
      'Configure chunk size and overlap in Settings → Knowledge Base → Chunking (default: 512 tokens, 50 overlap).',
      'Set up automated ingestion: connect cloud storage (S3, GCS) or schedule web scraping jobs.',
      'Configure relevance thresholds: minimum similarity score for a chunk to be included in results.',
      'Enable hybrid search (vector + keyword) for better retrieval on technical content.',
    ],
    tips: [
      'Clean your documents before uploading — remove headers, footers, and boilerplate that add noise.',
      'Use smaller chunk sizes (256 tokens) for precise retrieval and larger sizes (1024) for broader context.',
      'Test retrieval quality with sample queries before connecting the base to production agents.',
    ],
  },
  {
    id: 'terminal',
    name: 'VPS Terminal',
    icon: Terminal,
    layer: 'L1',
    category: 'Tools & Integrations',
    description: 'Browser-based SSH terminal for direct access to your VPS. Execute commands, manage services, edit files, and debug issues without leaving the AgentOS interface.',
    howToUse: [
      'Open VPS Terminal — it will automatically connect to your configured VPS via SSH.',
      'Type commands in the terminal just like a local shell — cd, ls, cat, apt, systemctl, etc.',
      'Use the terminal tabs to open multiple simultaneous sessions.',
      'Click the copy button to copy output, or the paste button to paste from clipboard.',
      'Click the disconnect/reconnect button if the SSH session drops.',
    ],
    howToSetUp: [
      'Configure SSH connection details in Settings → Terminal → SSH Host, Port, User, and Key.',
      'Store the SSH private key in Security Vault and reference it in the terminal settings.',
      'Set the terminal theme (color scheme) in Settings → Terminal → Theme to match your preferences.',
      'Configure session timeout: how long an idle terminal stays connected before auto-disconnecting.',
      'Enable session recording in Settings → Terminal → Record Sessions for audit compliance.',
    ],
    tips: [
      'Use terminal tabs to run multiple commands simultaneously — e.g., tail logs in one tab while restarting a service in another.',
      'Enable session recording if you need an audit trail of who ran what commands on the VPS.',
      'Keep the terminal session alive by using the keepalive setting if you experience frequent disconnects.',
    ],
  },
  {
    id: 'playground',
    name: 'Playground',
    icon: FlaskConical,
    layer: 'L4+',
    category: 'Tools & Integrations',
    description: 'Test agents in a sandboxed environment before deploying to production. Send test messages, evaluate responses, tweak prompts, and iterate quickly without affecting live systems.',
    howToUse: [
      'Open Playground and select an agent from the dropdown.',
      'Type a test message in the chat input and press Enter — the agent will respond in real-time.',
      'Adjust the model, temperature, or max tokens for the session without modifying the agent\'s production config.',
      'Use the "Clear Context" button to reset the conversation and start fresh.',
      'Click "Save Session" to bookmark the conversation for later review or comparison.',
    ],
    howToSetUp: [
      'No special setup required — any agent can be tested in the Playground.',
      'Create test data sets in the Prompt Library to quickly load standard test scenarios.',
      'Configure the Playground to use a cheaper model (e.g., GPT-4o-mini) for rapid iteration, then switch to the production model for final testing.',
      'Enable playground logging in Settings → Playground → Log Sessions for retrospective analysis.',
      'Set up eval criteria in Evals to automatically score playground sessions.',
    ],
    tips: [
      'Always test new prompts in the Playground before updating production agents.',
      'Save successful playground sessions as examples in the Prompt Library for future reference.',
      'Use the temperature slider to explore creative vs. deterministic responses for your use case.',
    ],
  },
  {
    id: 'plugins',
    name: 'Plugins',
    icon: Puzzle,
    layer: 'L10',
    category: 'Tools & Integrations',
    description: 'Extend AgentOS functionality with plugins from the marketplace or custom-built plugins. Plugins can add new skills, UI panels, data connectors, and workflow steps to the platform.',
    howToUse: [
      'Open Plugin System to see all installed plugins with their status (active/inactive).',
      'Click "Browse Marketplace" to discover and install community plugins.',
      'Click "Install Local" to upload a custom plugin from a ZIP file or Git repository URL.',
      'Toggle plugins on/off using the switch — inactive plugins won\'t load or consume resources.',
      'Click on a plugin to see its configuration options, version, and changelog.',
    ],
    howToSetUp: [
      'Review plugin permissions before installing — plugins can request access to agents, memory, files, and network.',
      'Install plugins in a test environment first and verify they work correctly before enabling in production.',
      'Configure plugin settings: each plugin may have its own configuration panel accessible from the plugin detail view.',
      'Set up plugin update notifications in Alert Channels to stay informed about security patches.',
      'Create a plugin allowlist in Settings → Plugins → Allowed Sources to restrict installations to trusted authors.',
    ],
    tips: [
      'Only install plugins from trusted sources — review the code if possible before installing.',
      'Disable plugins you\'re not actively using to reduce attack surface and resource consumption.',
      'Keep plugins updated — outdated plugins may have security vulnerabilities.',
    ],
  },
  {
    id: 'health',
    name: 'System Health',
    icon: Activity,
    layer: 'L0',
    category: 'Tools & Integrations',
    description: 'Health monitoring dashboard showing the operational status of all AgentOS components. Track uptime, response times, error rates, and dependency health for the entire platform.',
    howToUse: [
      'Open System Health to see a grid of component status cards (green = healthy, yellow = degraded, red = down).',
      'Click on any component card to see detailed metrics: uptime percentage, average response time, error rate.',
      'Switch to the Dependencies tab to see a service graph showing how components depend on each other.',
      'Review the incident timeline at the bottom showing recent health events and their resolution.',
      'Click "Run Health Check" to manually trigger a full system diagnostic.',
    ],
    howToSetUp: [
      'System Health is available at L0 and monitors core components automatically.',
      'Add custom health checks for your specific services in Settings → Health → Custom Checks.',
      'Configure health check intervals in Settings → Health → Check Frequency (default: 60 seconds).',
      'Set up alert rules: notify via Alert Channels when any component status changes to degraded or down.',
      'Configure uptime SLA targets in Settings → Health → SLA Targets for compliance tracking.',
    ],
    tips: [
      'Check System Health first thing every morning to catch any overnight issues.',
      'Use the Dependencies tab to understand the blast radius of a component failure.',
      'Run a manual health check after any infrastructure change (VPS restart, Docker update, etc.).',
    ],
  },
  {
    id: 'files',
    name: 'File Manager',
    icon: FolderOpen,
    layer: 'L1+',
    category: 'Tools & Integrations',
    description: 'Browse and manage files on your VPS directly from the AgentOS interface. Upload, download, edit, and organise files without needing to open a terminal session.',
    howToUse: [
      'Open File Manager to see a directory tree of your VPS file system starting from the configured root path.',
      'Navigate folders by clicking — the right panel shows the contents of the selected directory.',
      'Click on a file to preview it (text files) or download it (binary files).',
      'Use the toolbar to upload files, create new folders, or create new files.',
      'Right-click on any file or folder for additional options: rename, move, copy, delete, change permissions.',
    ],
    howToSetUp: [
      'Configure the root path in Settings → Files → Root Directory (default: /home/agentos).',
      'Set file access permissions: which users and agents can read, write, or execute files.',
      'Enable file versioning in Settings → Files → Versioning to keep history of file changes.',
      'Configure upload size limits in Settings → Files → Max Upload Size (default: 100 MB).',
      'Set up automatic file indexing for Knowledge Base integration — new files are automatically ingested.',
    ],
    tips: [
      'Use File Manager for quick edits instead of opening a terminal — it\'s faster for small changes.',
      'Set up file versioning for critical configuration files so you can roll back mistakes.',
      'Restrict file access to only the directories agents need — don\'t expose the entire file system.',
    ],
  },
  {
    id: 'skills',
    name: 'Agent Skills',
    icon: WrenchIcon,
    layer: 'L4++',
    category: 'Tools & Integrations',
    description: 'Define tools and capabilities that agents can use to take actions. Skills are reusable function definitions (e.g., web_search, code_execute, file_read, api_call) that extend what agents can do beyond text generation.',
    howToUse: [
      'Open Agent Skills to see all available skills with their descriptions and parameter schemas.',
      'Click "Create Skill" — define the skill name, description, input parameters, and implementation (API call, script, or built-in).',
      'Assign skills to agents in the Agents grid — an agent can only use skills that are explicitly assigned to it.',
      'Test a skill using the "Try It" button to verify it works before assigning to agents.',
      'Monitor skill usage in the Usage tab to see which skills are called most frequently and their success rates.',
    ],
    howToSetUp: [
      'Start with built-in skills (web_search, code_execute, file_read, file_write) before creating custom ones.',
      'For custom skills, define clear input/output schemas using JSON Schema so agents know how to call them.',
      'Store API credentials needed by skills in Security Vault and reference them via environment variables.',
      'Set skill rate limits to prevent agents from overcalling external APIs.',
      'Enable skill execution logging in Settings → Skills → Log Executions for debugging and auditing.',
    ],
    tips: [
      'Keep skills focused — one skill should do one thing well rather than multiple things poorly.',
      'Add detailed descriptions and examples to each skill so the LLM knows when and how to use it.',
      'Monitor the Usage tab to identify skills that are rarely used — they may be poorly described or unnecessary.',
    ],
  },
  {
    id: 'channels',
    name: 'Alert Channels',
    icon: Megaphone,
    layer: 'L5++',
    category: 'Tools & Integrations',
    description: 'Configure notification delivery channels for alerts and events. Send notifications to Slack, Microsoft Teams, email, PagerDuty, webhooks, and custom channels with configurable routing and formatting.',
    howToUse: [
      'Open Alert Channels to see all configured channels with their type and status.',
      'Click "Add Channel" and select the channel type (Slack, Teams, Email, PagerDuty, Webhook).',
      'Configure the channel: enter the webhook URL or email address, set the message format, and select which events to forward.',
      'Test the channel using the "Send Test" button to verify delivery.',
      'Set up routing rules: map specific event types or severity levels to specific channels.',
    ],
    howToSetUp: [
      'Create a Slack incoming webhook in your Slack workspace and paste the URL when adding the Slack channel.',
      'For email, configure SMTP settings in Settings → Channels → Email (SMTP host, port, credentials).',
      'For PagerDuty, create an Events API V2 integration key and enter it when adding the PagerDuty channel.',
      'Set up escalation policies: P1 incidents go to PagerDuty, P2 to Slack, P3 to email.',
      'Configure quiet hours in Settings → Channels → Quiet Hours to suppress non-critical notifications outside business hours.',
    ],
    tips: [
      'Set up at least two channels (e.g., Slack + PagerDuty) for redundancy — if one fails, the other delivers.',
      'Use routing rules to avoid notification spam — not every event needs to go to every channel.',
      'Test channels after any infrastructure change to ensure delivery still works.',
    ],
  },
  {
    id: 'mcp',
    name: 'MCP',
    icon: Cable,
    layer: 'L4+',
    category: 'Tools & Integrations',
    description: 'Model Context Protocol integration for connecting AI models to external data sources and tools. MCP servers provide a standardised interface for agents to access databases, APIs, and services.',
    howToUse: [
      'Open MCP Protocol and switch between Servers and Tools tabs.',
      'In Servers, see all connected MCP servers with their status, available tools, and connection info.',
      'Click "Add Server" to connect a new MCP server — enter the server URL, authentication, and configuration.',
      'In Tools, browse all available tools exposed by connected MCP servers.',
      'Assign MCP tools to agents just like native skills — they appear in the agent\'s skill assignment panel.',
    ],
    howToSetUp: [
      'Install and configure the MCP server you want to connect (e.g., filesystem, postgres, github).',
      'Add the server URL and authentication details in the MCP → Add Server form.',
      'Configure tool permissions: which agents can access which MCP tools.',
      'Set up connection health monitoring so AgentOS can detect when an MCP server goes offline.',
      'Configure request timeouts and rate limits for MCP tool calls.',
    ],
    tips: [
      'Start with the official MCP servers (filesystem, fetch) before connecting custom servers.',
      'Test MCP server connectivity before assigning tools to production agents.',
      'Monitor MCP tool call latency — external servers can add significant overhead.',
    ],
  },
  {
    id: 'guardrails',
    name: 'Guardrails',
    icon: ShieldAlert,
    layer: 'L0+',
    category: 'Tools & Integrations',
    description: 'Safety and content filtering system that inspects agent inputs and outputs. Configure rules to block PII leaks, prevent harmful content, enforce brand guidelines, and ensure compliance with organisational policies.',
    howToUse: [
      'Open Guardrails to see all active filtering rules grouped by type (input, output, content).',
      'Click "Create Rule" — choose the rule type: PII detection, content filter, regex pattern, or custom classifier.',
      'Configure the action: block and return error, block and replace, or allow with warning.',
      'Assign guardrail rules to specific agents or apply globally.',
      'Review the Guardrails audit log to see all blocked or warned interactions.',
    ],
    howToSetUp: [
      'Start with PII detection rules (email addresses, phone numbers, credit card numbers) applied to all agent outputs.',
      'Add content safety rules to block harmful, offensive, or inappropriate outputs.',
      'Configure brand guidelines as output rules: enforce tone, disallowed phrases, and required disclaimers.',
      'Set up regex patterns for domain-specific constraints (e.g., "never include internal IP addresses").',
      'Enable Guardrails audit logging for compliance: log every input/output that triggers a rule.',
    ],
    tips: [
      'Apply guardrails to both inputs and outputs — harmful content can enter via user prompts too.',
      'Use "allow with warning" for borderline cases rather than blocking outright — you can tighten later.',
      'Review the audit log weekly to tune rules and reduce false positives.',
    ],
  },
  {
    id: 'evals',
    name: 'Evals',
    icon: FlaskConical,
    layer: 'L4+',
    category: 'Tools & Integrations',
    description: 'Agent evaluation suites for systematic quality assessment. Create eval datasets, define scoring criteria, run evaluations, and track agent quality over time with regression detection.',
    howToUse: [
      'Open Evals and switch between Suites, Runs, and Results tabs.',
      'In Suites, create an evaluation suite: define test cases with input, expected output, and scoring criteria.',
      'Click "Run Eval" on a suite — select the agent to evaluate and the scoring method.',
      'Watch the evaluation progress as each test case is processed.',
      'Review results: pass/fail rate, average score, per-case breakdown, and comparison with previous runs.',
    ],
    howToSetUp: [
      'Create eval suites that cover your agent\'s key capabilities and edge cases.',
      'Define scoring criteria: exact match, fuzzy match, LLM-as-judge, or custom Python functions.',
      'Set up automated eval runs in Scheduler to track quality over time (e.g., run evals nightly).',
      'Configure regression detection: if the pass rate drops below a threshold, create an incident automatically.',
      'Integrate with Benchmarking for cross-agent performance comparisons.',
    ],
    tips: [
      'Write eval test cases that cover both happy paths and edge cases — agents usually fail on the unexpected.',
      'Use LLM-as-judge scoring for open-ended responses where exact match is too strict.',
      'Run evals after every prompt change to catch regressions before they reach production.',
    ],
  },
  {
    id: 'observability',
    name: 'Observability',
    icon: Radio,
    layer: 'L8+',
    category: 'Tools & Integrations',
    description: 'Distributed tracing and service graph for understanding request flows across agents, workflows, and external services. Identify bottlenecks, debug failures, and optimise performance with end-to-end visibility.',
    howToUse: [
      'Open Observability and switch between Traces, Service Graph, and Metrics tabs.',
      'In Traces, search for specific requests by ID, agent, or time range. Click a trace to see the full request flow.',
      'In Service Graph, see a visual map of all services and their communication patterns with latency and error rates.',
      'In Metrics, view time-series charts for request rate, latency percentiles, and error rates.',
      'Click on any span in a trace to see its attributes, logs, and downstream calls.',
    ],
    howToSetUp: [
      'Enable tracing in Settings → Observability → Enable Tracing (adds minimal overhead).',
      'Configure trace sampling rate: 100% for development, 10-20% for production to manage storage costs.',
      'Set up trace retention: keep detailed traces for 7 days, aggregated metrics for 90 days.',
      'Configure service discovery so the Service Graph auto-populates with your agents and workflows.',
      'Set up alert rules on latency and error rate anomalies via Alert Channels.',
    ],
    tips: [
      'Use the Service Graph to identify the slowest components in your agent pipeline.',
      'Start with a low sampling rate in production and increase it when debugging specific issues.',
      'Correlate traces with incidents to quickly identify root causes during post-mortems.',
    ],
  },
  // ── System ──
  {
    id: 'security',
    name: 'Security Vault',
    icon: Lock,
    layer: 'L0',
    category: 'System',
    description: 'Encrypted storage for API keys, tokens, certificates, and other sensitive credentials. The Security Vault ensures secrets are never stored in plain text and provides access auditing and rotation capabilities.',
    howToUse: [
      'Open Security Vault to see all stored secrets listed by name (values are always masked).',
      'Click "Add Secret" — enter the name, value, and optional tags. The value is encrypted immediately and never stored in plain text.',
      'Reference secrets in agent configurations and workflows using the {{secret.NAME}} syntax.',
      'Click the eye icon on a secret to reveal its value (this action is logged in the audit trail).',
      'Click the rotate icon to update a secret\'s value while keeping the same reference name.',
    ],
    howToSetUp: [
      'Store all API keys (OpenAI, Anthropic, AWS, etc.) as secrets — never hardcode them in prompts or configs.',
      'Configure the encryption key in Settings → Security → Encryption Key (auto-generated on first setup).',
      'Enable access auditing in Settings → Security → Audit Access to log every secret read/reveal operation.',
      'Set up automatic rotation reminders for secrets that expire (e.g., OAuth tokens).',
      'Configure secret access policies: which agents and users can access which secrets.',
    ],
    tips: [
      'Never copy secret values into agent prompts — always use the {{secret.NAME}} reference syntax.',
      'Rotate API keys regularly and update them in the Security Vault immediately.',
      'Review the access audit log monthly to detect unauthorised secret access.',
    ],
  },
  {
    id: 'audit-log',
    name: 'Audit Log',
    icon: ScrollText,
    layer: 'L0+',
    category: 'System',
    description: 'Comprehensive action audit trail that records every significant operation in AgentOS. Track who did what, when, and from where for compliance, security investigation, and operational debugging.',
    howToUse: [
      'Open Audit Log to see a chronological list of all recorded actions.',
      'Filter by action type (create, update, delete, access), actor (user or agent), resource, or time range.',
      'Click on any audit entry to see the full details: before/after state, actor IP, user agent, and timestamp.',
      'Export filtered audit logs as CSV or JSON for compliance reporting.',
      'Search by keyword to find specific actions across the entire audit history.',
    ],
    howToSetUp: [
      'Audit logging is enabled by default for security-sensitive operations (secret access, user management, config changes).',
      'Configure what gets logged in Settings → Audit → Log Scope (you can enable verbose logging for all operations).',
      'Set up audit log retention: how long to keep detailed logs (default: 1 year).',
      'Configure immutable storage for audit logs to prevent tampering — enable write-once storage in Settings → Audit → Immutable.',
      'Set up alerts for suspicious activity: bulk deletions, off-hours access, or failed authentication attempts.',
    ],
    tips: [
      'Review audit logs weekly for suspicious activity — look for patterns like multiple failed access attempts.',
      'Export audit logs quarterly for long-term compliance archival.',
      'Use the audit log to debug "who changed what" questions during incident investigations.',
    ],
  },
  {
    id: 'hitl',
    name: 'Approvals',
    icon: ShieldCheck,
    layer: 'L0+',
    category: 'System',
    description: 'Human-in-the-loop approval system for agent actions that require human oversight. Configure approval gates for sensitive operations: financial transactions, data deletions, external communications, and more.',
    howToUse: [
      'Open Approvals to see all pending, approved, and rejected approval requests.',
      'Pending requests show the agent, the proposed action, and the reason for the approval gate.',
      'Click "Approve" to allow the action to proceed, or "Reject" to block it with an optional reason.',
      'Click "Delegate" to assign the approval to another team member.',
      'Configure auto-approval timeouts: if no one responds within X hours, auto-approve or auto-reject.',
    ],
    howToSetUp: [
      'Define approval policies: which agent actions require human approval (e.g., any action costing > £10, any data deletion).',
      'Configure approval policies in Settings → Approvals → Policies using the rule builder.',
      'Assign approvers: which users or teams are authorised to approve which types of actions.',
      'Set up escalation: if an approval isn\'t resolved within X minutes, escalate to a higher-level approver.',
      'Enable approval notifications via Alert Channels so approvers are alerted immediately.',
    ],
    tips: [
      'Start with a broad approval policy and narrow it down as you build confidence in your agents.',
      'Set auto-rejection (not auto-approval) as the timeout action for high-risk operations.',
      'Review approval patterns monthly — if certain approval types are always approved, consider removing the gate.',
    ],
  },
  {
    id: 'user-management',
    name: 'User Management',
    icon: UserCog,
    layer: 'L0',
    category: 'System',
    description: 'Manage users, roles, and permissions using RBAC (Role-Based Access Control). Create users, assign roles (Admin, Operator, Viewer), and control who can access which AgentOS features.',
    howToUse: [
      'Open User Management to see all users listed with their roles, last login, and status.',
      'Click "Add User" — enter email, name, and assign a role (Admin, Operator, Viewer, or custom).',
      'Click on a user to edit their profile, change their role, or manage their permissions.',
      'Use the Roles tab to create custom roles with fine-grained permissions (e.g., "Can manage agents but not workflows").',
      'Deactivate users instead of deleting them to preserve audit history.',
    ],
    howToSetUp: [
      'Define your role hierarchy before adding users: Admin (full access), Operator (manage agents/workflows), Viewer (read-only).',
      'Create custom roles for specific team structures (e.g., "Agent Developer", "Workflow Operator", "Auditor").',
      'Configure the default role for new users in Settings → Users → Default Role.',
      'Set up SSO/SAML integration in Settings → Users → SSO for enterprise authentication.',
      'Enable MFA (multi-factor authentication) in Settings → Users → MFA for enhanced security.',
    ],
    tips: [
      'Follow the principle of least privilege — give users the minimum access they need.',
      'Audit user access quarterly — remove inactive users and update role assignments.',
      'Use custom roles instead of giving everyone Admin access.',
    ],
  },
  {
    id: 'dashboard-customizer',
    name: 'Dashboard Customizer',
    icon: LayoutGrid,
    layer: 'SYS',
    category: 'System',
    description: 'Customise the Mission Control dashboard layout. Add, remove, rearrange, and resize widgets to create a personalised view that highlights the metrics most important to your workflow.',
    howToUse: [
      'Open Dashboard Customizer to see the current Mission Control layout in edit mode.',
      'Drag widgets from the Available Widgets panel on the left onto the dashboard grid.',
      'Rearrange widgets by dragging them to new positions — they snap to the grid automatically.',
      'Resize widgets by dragging the corner handle — choose from 1x1, 2x1, 2x2, or full-width sizes.',
      'Click "Save Layout" to apply your changes. Click "Reset to Default" to restore the original layout.',
    ],
    howToSetUp: [
      'No setup required — Dashboard Customizer is available to all users with SYS layer access.',
      'Create multiple dashboard layouts for different roles (e.g., "Admin View", "Operator View", "Exec Summary").',
      'Set a default dashboard layout per role in Settings → Dashboard → Default Layout.',
      'Enable widget-specific data sources in Settings → Dashboard → Widget Data to customise what each widget shows.',
      'Share dashboard layouts with team members via the "Share Layout" button.',
    ],
    tips: [
      'Put your most-checked metrics in the top-left — it\'s where the eye lands first.',
      'Use full-width widgets for time-series charts and 2x2 for KPI cards.',
      'Create separate layouts for different workflows (morning review, incident response, weekly reporting).',
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    layer: 'SYS',
    category: 'System',
    description: 'System-wide configuration for AgentOS. Manage general preferences, API defaults, security policies, notification preferences, and integration settings from a single location.',
    howToUse: [
      'Open Settings to see configuration tabs: General, Security, Notifications, Integrations, Advanced.',
      'In General, set platform name, timezone, currency, and default model preferences.',
      'In Security, configure session timeout, IP allowlist, and MFA requirements.',
      'In Notifications, set default channels and quiet hours.',
      'In Advanced, configure experimental features, debug logging, and system-level parameters.',
    ],
    howToSetUp: [
      'Review all settings on first deployment — defaults are sensible but may need adjustment for your environment.',
      'Set the platform timezone to match your team\'s working hours for accurate scheduler and analytics data.',
      'Configure security settings (session timeout, IP allowlist) before opening the platform to your team.',
      'Set up integration defaults (default model, default memory TTL, default workflow timeout) for consistency.',
      'Enable debug logging temporarily when troubleshooting, then disable it to reduce storage usage.',
    ],
    tips: [
      'Document any non-default settings changes so your team knows what\'s been customised.',
      'Use the "Export Settings" feature to back up your configuration before making changes.',
      'Review security settings monthly — update IP allowlists and session timeouts as your team evolves.',
    ],
  },
  {
    id: 'export',
    name: 'Export/Import',
    icon: Download,
    layer: 'L9',
    category: 'System',
    description: 'Export and import AgentOS data for backup, migration, or sharing. Export agents, workflows, prompts, and configurations as JSON files that can be imported into another AgentOS instance.',
    howToUse: [
      'Open Export/Import and switch between Export and Import tabs.',
      'In Export, select the data types to export (agents, workflows, prompts, settings) and the date range.',
      'Click "Export" to generate a JSON file — it will download automatically.',
      'In Import, upload a previously exported JSON file using the file picker.',
      'Review the import preview showing what will be created or updated, then click "Confirm Import".',
    ],
    howToSetUp: [
      'Configure export encryption in Settings → Export → Encrypt Exports to protect sensitive data in transit.',
      'Set up automated exports in Scheduler for regular backups (e.g., weekly full export).',
      'Configure import conflict resolution: skip existing, overwrite, or create duplicate.',
      'Enable import validation to check schema compatibility before importing.',
      'Set up export storage in Settings → Export → Storage to save exports to S3 or GCS.',
    ],
    tips: [
      'Always export before making major changes — it\'s your safety net for rollback.',
      'Encrypt exports that contain API keys or sensitive agent prompts.',
      'Test imports in a staging environment before importing into production.',
    ],
  },
  {
    id: 'backups',
    name: 'Backups',
    icon: Shield,
    layer: 'L9+',
    category: 'System',
    description: 'Automated and manual backup system for the entire AgentOS database. Schedule regular backups, restore from any point in time, and verify backup integrity.',
    howToUse: [
      'Open Backup & Recovery to see all backups listed with their timestamp, size, and type (manual/scheduled).',
      'Click "Create Backup" to take an immediate full backup of all data.',
      'Click the restore icon on any backup to initiate a restore — you\'ll see a preview of what will be restored.',
      'Confirm the restore — the system will create a pre-restore backup first, then apply the selected backup.',
      'Click the verify icon to check backup integrity and ensure it can be restored successfully.',
    ],
    howToSetUp: [
      'Configure automated backup schedule in Settings → Backups → Schedule (recommended: daily at 2 AM).',
      'Set backup retention: how many backups to keep (default: 30 daily, 12 weekly, 12 monthly).',
      'Configure backup storage location: local disk, S3, or GCS in Settings → Backups → Storage.',
      'Enable backup encryption in Settings → Backups → Encryption to protect data at rest.',
      'Set up backup failure alerts via Alert Channels so you\'re notified if a scheduled backup fails.',
    ],
    tips: [
      'Always verify a backup after creation — a corrupted backup is worse than no backup.',
      'Test restore procedures quarterly to ensure you can actually recover when needed.',
      'Keep at least one off-site backup (S3/GCS) in case of VPS failure.',
    ],
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: BookOpen,
    layer: 'L9+',
    category: 'System',
    description: 'Pre-built agent, workflow, and configuration templates for common use cases. Use templates to quickly set up new agents and workflows, or create your own templates from existing configurations.',
    howToUse: [
      'Open Template Library to browse templates by category: Agents, Workflows, Prompts, Configurations.',
      'Click on a template to see its description, requirements, and preview of the configuration.',
      'Click "Use Template" to create a new agent/workflow from the template — you can customise it before saving.',
      'Click "Create Template" to save an existing agent or workflow as a reusable template.',
      'Share templates with your team or publish them to the Marketplace.',
    ],
    howToSetUp: [
      'Review built-in templates for common use cases (customer support bot, data analysis pipeline, content generator).',
      'Create custom templates from your best-performing agents and workflows.',
      'Define template metadata: name, description, required model, required skills, and compatibility notes.',
      'Set up template versioning to track updates — users will be notified when a template they\'re using is updated.',
      'Configure template access: private (team only), shared (organisation), or public (marketplace).',
    ],
    tips: [
      'Create templates from production-proven agents — not experimental ones.',
      'Include detailed descriptions and prerequisites in templates to help users understand what they\'re getting.',
      'Update templates when you improve the underlying agents/workflows so everyone benefits.',
    ],
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    icon: Rocket,
    layer: 'SYS',
    category: 'System',
    description: 'First-run setup wizard that guides new users through initial AgentOS configuration. Connect AI providers (OpenRouter, Hugging Face, or direct API keys), select models, create your first agent, and choose preferences.',
    howToUse: [
      'Onboarding launches automatically on first login. You can also access it from the System section of the sidebar.',
      'Step 1 (Welcome) — Enter your system name, organisation name, and timezone.',
      'Step 2 (Provider Keys) — Add your OpenRouter API key (recommended) to access 200+ models, or add individual provider keys for OpenAI, Anthropic, or Hugging Face. You can also enable Ollama for local models.',
      'Step 3 (Models) — Select your preferred models from the available list. Models from OpenRouter and Z-AI (built-in) are shown. You can always add more later from Brain Router → Browse.',
      'Step 4 (Agents) — Create your first agent by giving it a name, type, and description. This is optional and can be done later from the Agents section.',
      'Step 5 (Preferences) — Choose a theme, notification settings, and default behaviors. Click "Go to Dashboard" to complete setup.',
    ],
    howToSetUp: [
      'Before starting onboarding, get an OpenRouter API key from openrouter.ai/keys — this is the fastest way to get started with 200+ models.',
      'If you prefer using a specific provider directly, get an API key from OpenAI (platform.openai.com), Anthropic (console.anthropic.com), or Hugging Face (huggingface.co/settings/tokens).',
      'Enable Ollama if you have it installed locally — it provides free, private model inference without any API keys.',
      'Select at least one model during the Models step — the Z-AI (Built-in) option is always available without any configuration.',
      'After completing onboarding, go to Brain Router → Providers tab to configure additional providers or update API keys at any time.',
    ],
    tips: [
      'Start with OpenRouter — one API key gives you access to every major model (GPT-4o, Claude, Gemini, Llama, Mistral, and 200+ more).',
      'You can always re-run onboarding from the sidebar if you skipped it initially or want to reconfigure.',
      'API keys entered during onboarding are saved to Brain Router → Providers and can be managed there at any time.',
      'After onboarding, explore the Help Center (this page!) for detailed guides on each feature.',
    ],
  },
]

// ─── Category definitions ────────────────────────────────────────

const categories = [
  { id: 'Core Layers', label: 'Core Layers', color: 'emerald' },
  { id: 'Tools & Integrations', label: 'Tools & Integrations', color: 'amber' },
  { id: 'System', label: 'System', color: 'violet' },
] as const

// ─── Category color mapping ──────────────────────────────────────

const categoryColorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  'Core Layers': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  'Tools & Integrations': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  'System': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  },
}

// ─── Main Component ──────────────────────────────────────────────

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Core Layers', 'Tools & Integrations', 'System']))
  const printRef = useRef<HTMLDivElement>(null)

  const toggleArticle = (id: string) => {
    setExpandedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSection = (cat: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const filteredArticles = useMemo(() => {
    let articles = helpData
    if (activeCategory) {
      articles = articles.filter((a) => a.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      articles = articles.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.howToUse.some((s) => s.toLowerCase().includes(q)) ||
          a.howToSetUp.some((s) => s.toLowerCase().includes(q)) ||
          a.tips.some((s) => s.toLowerCase().includes(q)) ||
          a.layer.toLowerCase().includes(q)
      )
    }
    return articles
  }, [searchQuery, activeCategory])

  const groupedArticles = useMemo(() => {
    const groups: Record<string, HelpArticle[]> = {}
    for (const cat of categories) {
      const items = filteredArticles.filter((a) => a.category === cat.id)
      if (items.length > 0) {
        groups[cat.id] = items
      }
    }
    return groups
  }, [filteredArticles])

  const articleCount = filteredArticles.length

  const navigateToFeature = useCallback((sectionId: SectionId) => {
    useAgentOSStore.getState().setActiveSection(sectionId)
  }, [])

  // ─── Export to Word (HTML Blob with .doc extension) ───
  const exportToWord = useCallback(() => {
    const colors = categoryColorMap
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>AgentOS Help & Documentation</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; line-height: 1.6; }
        h1 { font-size: 28pt; color: #0f1117; border-bottom: 3px solid #10b981; padding-bottom: 8px; }
        h2 { font-size: 20pt; color: #1e1f2b; margin-top: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        h3 { font-size: 14pt; color: #374151; margin-top: 20px; }
        .cover { text-align: center; padding: 80px 0; }
        .cover h1 { font-size: 36pt; border: none; }
        .cover p { font-size: 16pt; color: #6b7280; }
        .category { background: #f3f4f6; padding: 4px 12px; border-radius: 4px; font-size: 10pt; }
        .layer { font-family: Consolas, monospace; font-size: 10pt; color: #10b981; }
        .article { margin: 24px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .step { margin: 4px 0; padding-left: 20px; }
        .tip { background: #fef3c7; padding: 8px 12px; border-radius: 4px; margin: 4px 0; font-size: 10pt; }
        ol { margin: 4px 0; padding-left: 24px; }
        li { margin: 4px 0; }
      </style></head><body>
      <div class="cover">
        <h1>AgentOS Help &amp; Documentation</h1>
        <p>RJMLABS.CO.UK</p>
        <p style="font-size:12pt; color:#9ca3af;">Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <h1>Table of Contents</h1>
      <ol>`

    for (const cat of categories) {
      const items = helpData.filter((a) => a.category === cat.id)
      html += `<li><strong>${cat.label}</strong><ol>`
      for (const item of items) {
        html += `<li>${item.name} (${item.layer})</li>`
      }
      html += `</ol></li>`
    }

    html += `</ol>`

    for (const cat of categories) {
      const items = helpData.filter((a) => a.category === cat.id)
      html += `<h2>${cat.label}</h2>`
      for (const item of items) {
        html += `<div class="article">
          <h3>${item.name} <span class="layer">[${item.layer}]</span></h3>
          <p>${item.description}</p>
          <h4>How to Use</h4><ol>`
        for (const step of item.howToUse) {
          html += `<li class="step">${step}</li>`
        }
        html += `</ol><h4>How to Set Up</h4><ol>`
        for (const step of item.howToSetUp) {
          html += `<li class="step">${step}</li>`
        }
        html += `</ol><h4>Tips</h4>`
        for (const tip of item.tips) {
          html += `<p class="tip">💡 ${tip}</p>`
        }
        html += `</div>`
      }
    }

    html += `<br/><p style="text-align:center;color:#9ca3af;font-size:10pt;">© ${new Date().getFullYear()} RJMLABS.CO.UK — AgentOS Platform</p></body></html>`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'AgentOS-Help-Documentation.doc'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // ─── Export to PDF (window.print) ───
  const exportToPDF = useCallback(() => {
    window.print()
  }, [])

  return (
    <>
      {/* Print-only stylesheet */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #help-print-area, #help-print-area * { visibility: visible; }
          #help-print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: #1a1a2e !important; }
          #help-print-area .no-print { display: none !important; }
          #help-print-area .print-card { border: 1px solid #e5e7eb !important; background: white !important; color: #1a1a2e !important; margin-bottom: 16px !important; page-break-inside: avoid; border-radius: 8px; padding: 16px; }
          #help-print-area .print-card h3 { color: #1a1a2e !important; }
          #help-print-area .print-card p, #help-print-area .print-card li { color: #374151 !important; }
          #help-print-area .print-section-title { color: #1a1a2e !important; border-bottom: 2px solid #10b981 !important; padding-bottom: 4px; margin-top: 24px; }
          #help-print-area .print-cover { text-align: center; padding: 60px 0 40px; }
          #help-print-area .print-cover h1 { font-size: 32pt; color: #0f1117 !important; }
          #help-print-area .print-cover p { color: #6b7280 !important; }
          #help-print-area .print-toc { margin: 20px 0; }
          #help-print-area .print-toc li { color: #374151 !important; }
          #help-print-area .tip-box { background: #fef9c3 !important; color: #374151 !important; padding: 6px 10px; border-radius: 4px; margin: 2px 0; }
        }
      `}</style>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
                Help Center
              </h1>
              <p className="text-sm text-[#6b7280] mt-1">
                {articleCount} article{articleCount !== 1 ? 's' : ''} — How to use and set up every AgentOS feature
              </p>
            </div>
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-emerald-500/50 transition-all text-sm"
                title="Export as PDF (Print)"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={exportToWord}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-emerald-500/50 transition-all text-sm"
                title="Export as Word Document"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Word</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative no-print">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles... (e.g. 'memory', 'API key', 'workflow')"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-white placeholder-[#6b7280] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mt-3 no-print">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !activeCategory
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-[#1e1f2b] text-[#9ca3af] border-[#2d2e3d] hover:text-white hover:border-[#3d3e4d]'
              }`}
            >
              All ({helpData.length})
            </button>
            {categories.map((cat) => {
              const count = helpData.filter((a) => a.category === cat.id).length
              const colors = categoryColorMap[cat.id]
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === cat.id
                      ? `${colors.badge}`
                      : 'bg-[#1e1f2b] text-[#9ca3af] border-[#2d2e3d] hover:text-white hover:border-[#3d3e4d]'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Print Area */}
        <div id="help-print-area" ref={printRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Print cover page - only visible in print */}
          <div className="hidden print:block print-cover">
            <h1>AgentOS Help &amp; Documentation</h1>
            <p>RJMLABS.CO.UK</p>
            <p style={{ fontSize: '12pt', color: '#9ca3af' }}>Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {Object.entries(groupedArticles).map(([category, articles]) => {
              const colors = categoryColorMap[category]
              const isExpanded = expandedSections.has(category)

              return (
                <div key={category}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleSection(category)}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${colors.bg} border ${colors.border} transition-all hover:brightness-110 no-print`}
                  >
                    {isExpanded ? (
                      <ChevronDown className={`w-4 h-4 ${colors.text}`} />
                    ) : (
                      <ChevronRight className={`w-4 h-4 ${colors.text}`} />
                    )}
                    <span className={`font-semibold text-sm ${colors.text}`}>{category}</span>
                    <span className="text-xs text-[#6b7280] ml-auto">{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
                  </button>

                  {/* Print-only section title */}
                  <div className="hidden print:block print-section-title">
                    <h2 style={{ fontSize: '18pt', color: '#1a1a2e', borderBottom: '2px solid #10b981', paddingBottom: '4px', marginTop: '24px' }}>
                      {category}
                    </h2>
                  </div>

                  {/* Articles */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-2">
                          {articles.map((article, idx) => {
                            const isArticleExpanded = expandedArticles.has(article.id)
                            const IconComponent = article.icon

                            return (
                              <motion.div
                                key={article.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.2 }}
                                className={`print-card rounded-lg border ${
                                  isArticleExpanded ? 'bg-[#1e1f2b] border-[#2d2e3d]' : 'bg-[#1e1f2b]/60 border-[#2d2e3d]/60'
                                } transition-all`}
                              >
                                {/* Article Header */}
                                <button
                                  onClick={() => toggleArticle(article.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                >
                                  <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                                    <IconComponent className={`w-4 h-4 ${colors.text}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white truncate">{article.name}</span>
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${colors.badge} border flex-shrink-0`}>
                                        {article.layer}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#6b7280] truncate mt-0.5">{article.description}</p>
                                  </div>
                                  <ChevronDown
                                    className={`w-4 h-4 text-[#6b7280] flex-shrink-0 transition-transform ${
                                      isArticleExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {/* Article Body */}
                                <AnimatePresence>
                                  {isArticleExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 space-y-4">
                                        {/* Description */}
                                        <p className="text-sm text-[#9ca3af] leading-relaxed">{article.description}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* How to Use */}
                                          <div className="bg-[#0f1117] rounded-lg p-3 border border-[#2d2e3d]/50">
                                            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                              <BookOpen className="w-3.5 h-3.5" />
                                              How to Use
                                            </h4>
                                            <ol className="space-y-1.5">
                                              {article.howToUse.map((step, i) => (
                                                <li key={i} className="flex gap-2 text-xs text-[#9ca3af]">
                                                  <span className="text-emerald-400/60 font-mono text-[10px] mt-0.5 flex-shrink-0">{i + 1}.</span>
                                                  <span>{step}</span>
                                                </li>
                                              ))}
                                            </ol>
                                          </div>

                                          {/* How to Set Up */}
                                          <div className="bg-[#0f1117] rounded-lg p-3 border border-[#2d2e3d]/50">
                                            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                              <Wrench className="w-3.5 h-3.5" />
                                              How to Set Up
                                            </h4>
                                            <ol className="space-y-1.5">
                                              {article.howToSetUp.map((step, i) => (
                                                <li key={i} className="flex gap-2 text-xs text-[#9ca3af]">
                                                  <span className="text-amber-400/60 font-mono text-[10px] mt-0.5 flex-shrink-0">{i + 1}.</span>
                                                  <span>{step}</span>
                                                </li>
                                              ))}
                                            </ol>
                                          </div>
                                        </div>

                                        {/* Tips */}
                                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                                          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            Tips
                                          </h4>
                                          <ul className="space-y-1">
                                            {article.tips.map((tip, i) => (
                                              <li key={i} className="text-xs text-[#9ca3af] flex gap-2">
                                                <span className="text-emerald-400/60 mt-0.5 flex-shrink-0">•</span>
                                                <span>{tip}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        {/* Navigate to Feature */}
                                        <button
                                          onClick={() => navigateToFeature(article.id)}
                                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all no-print"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          Navigate to {article.name}
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {Object.keys(groupedArticles).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-12 h-12 text-[#2d2e3d] mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No articles found</h3>
                <p className="text-sm text-[#6b7280] max-w-md">
                  Try adjusting your search query or clearing the category filter to find what you&apos;re looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
