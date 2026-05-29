import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Clear existing data
    await db.template.deleteMany()
    await db.backup.deleteMany()
    await db.agentMessage.deleteMany()
    await db.webhookEvent.deleteMany()
    await db.webhook.deleteMany()
    await db.budgetAlert.deleteMany()
    await db.costEntry.deleteMany()
    await db.notification.deleteMany()
    await db.scheduledTask.deleteMany()
    await db.workflow.deleteMany()
    await db.activityEvent.deleteMany()
    await db.commandLog.deleteMany()
    await db.agentOutput.deleteMany()
    await db.agentTask.deleteMany()
    await db.memoryEntry.deleteMany()
    await db.goal.deleteMany()
    await db.workspace.deleteMany()
    await db.routingRule.deleteMany()
    await db.modelConfig.deleteMany()
    await db.agent.deleteMany()
    await db.channelDelivery.deleteMany()
    await db.notificationChannel.deleteMany()
    await db.mcpExecution.deleteMany()
    await db.mcpPipeline.deleteMany()
    await db.mcpPrompt.deleteMany()
    await db.mcpResource.deleteMany()
    await db.mcpTool.deleteMany()
    await db.mcpServer.deleteMany()
    await db.systemConfig.deleteMany()

    // Create System Config
    await db.systemConfig.createMany({
      data: [
        { key: 'system.name', value: 'AgentOS', category: 'general' },
        { key: 'system.version', value: '1.0.0', category: 'general' },
        { key: 'system.theme', value: 'dark', category: 'ui' },
        { key: 'system.status', value: 'operational', category: 'general' },
      ],
    })

    // Create Model Configs
    const gpt4o = await db.modelConfig.create({
      data: {
        name: 'GPT-4o',
        provider: 'openai',
        modelId: 'gpt-4o',
        isActive: true,
        costPer1k: 0.005,
        maxTokens: 128000,
        capabilities: JSON.stringify(['chat', 'code', 'vision', 'reasoning']),
        priority: 3,
      },
    })

    const claudeSonnet = await db.modelConfig.create({
      data: {
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        modelId: 'claude-3.5-sonnet',
        isActive: true,
        costPer1k: 0.003,
        maxTokens: 200000,
        capabilities: JSON.stringify(['chat', 'code', 'analysis', 'writing']),
        priority: 2,
      },
    })

    await db.modelConfig.create({
      data: {
        name: 'Local Llama 3.1',
        provider: 'local',
        modelId: 'llama-3.1-70b',
        isActive: false,
        costPer1k: 0,
        maxTokens: 8192,
        capabilities: JSON.stringify(['chat', 'code']),
        priority: 1,
      },
    })

    // Create Routing Rules
    await db.routingRule.createMany({
      data: [
        { name: 'Code Tasks → Claude', condition: JSON.stringify({ task_type: 'code', priority: 'high' }), modelId: claudeSonnet.id, isActive: true, priority: 3 },
        { name: 'Research → GPT-4o', condition: JSON.stringify({ task_type: 'research' }), modelId: gpt4o.id, isActive: true, priority: 2 },
        { name: 'General Chat → Best Available', condition: JSON.stringify({ task_type: 'chat' }), modelId: gpt4o.id, isActive: true, priority: 1 },
      ],
    })

    // Create Agents
    const hermes = await db.agent.create({
      data: {
        name: 'Hermes',
        type: 'hermes',
        description: 'Research & intelligence gathering agent. Specializes in web search, data analysis, and information synthesis.',
        status: 'running',
        modelId: 'gpt-4o',
        avatar: '🔍',
        color: '#10b981',
        tasksCompleted: 47,
        tasksFailed: 2,
        lastActiveAt: new Date(),
        config: JSON.stringify({ maxConcurrentTasks: 5, timeout: 30000 }),
      },
    })

    const openclaw = await db.agent.create({
      data: {
        name: 'OpenClaw',
        type: 'openclaw',
        description: 'Code generation & review agent. Handles code writing, refactoring, and technical implementation.',
        status: 'idle',
        modelId: 'claude-3.5-sonnet',
        avatar: '🦀',
        color: '#f59e0b',
        tasksCompleted: 32,
        tasksFailed: 1,
        lastActiveAt: new Date(Date.now() - 3600000),
        config: JSON.stringify({ maxConcurrentTasks: 3, timeout: 60000 }),
      },
    })

    const claudeCode = await db.agent.create({
      data: {
        name: 'Claude Code',
        type: 'claude-code',
        description: 'Full-stack development agent. Specializes in architecture, debugging, and end-to-end feature implementation.',
        status: 'running',
        modelId: 'claude-3.5-sonnet',
        avatar: '⚡',
        color: '#8b5cf6',
        tasksCompleted: 63,
        tasksFailed: 3,
        lastActiveAt: new Date(),
        config: JSON.stringify({ maxConcurrentTasks: 4, timeout: 120000 }),
      },
    })

    const sentinel = await db.agent.create({
      data: {
        name: 'Sentinel',
        type: 'sentinel',
        description: 'Monitoring & alerting agent. Tracks system health, anomalies, and triggers automated responses.',
        status: 'paused',
        modelId: 'gpt-4o',
        avatar: '🛡️',
        color: '#ef4444',
        tasksCompleted: 156,
        tasksFailed: 8,
        lastActiveAt: new Date(Date.now() - 7200000),
        config: JSON.stringify({ maxConcurrentTasks: 10, timeout: 15000 }),
      },
    })

    // Create Agent Tasks
    await db.agentTask.createMany({
      data: [
        { agentId: hermes.id, title: 'Analyze competitor landscape', description: 'Research top 10 competitors and summarize findings', status: 'completed', priority: 'high', input: JSON.stringify({ scope: 'competitors' }), output: JSON.stringify({ found: 10 }), completedAt: new Date() },
        { agentId: hermes.id, title: 'Market trend analysis Q1', description: 'Compile Q1 market trends for SaaS sector', status: 'running', priority: 'medium', input: JSON.stringify({ quarter: 'Q1' }), startedAt: new Date() },
        { agentId: openclaw.id, title: 'Refactor auth module', description: 'Refactor the authentication module to use JWT', status: 'pending', priority: 'high', input: JSON.stringify({ module: 'auth' }) },
        { agentId: openclaw.id, title: 'Fix memory leak in worker', description: 'Identify and fix the memory leak in the background worker process', status: 'completed', priority: 'critical', input: JSON.stringify({ type: 'bug' }), output: JSON.stringify({ fixed: true }), completedAt: new Date() },
        { agentId: claudeCode.id, title: 'Build dashboard API', description: 'Implement REST API for the mission control dashboard', status: 'running', priority: 'high', input: JSON.stringify({ endpoints: 16 }), startedAt: new Date() },
        { agentId: claudeCode.id, title: 'Implement WebSocket handler', description: 'Add real-time WebSocket support for agent status updates', status: 'pending', priority: 'medium', input: JSON.stringify({ protocol: 'ws' }) },
        { agentId: sentinel.id, title: 'Health check sweep', description: 'Perform system-wide health check across all services', status: 'completed', priority: 'medium', input: JSON.stringify({ scope: 'all' }), output: JSON.stringify({ healthy: true }), completedAt: new Date() },
        { agentId: sentinel.id, title: 'Alert rule update', description: 'Update alerting thresholds based on new SLA requirements', status: 'failed', priority: 'high', input: JSON.stringify({ type: 'update' }), error: 'Permission denied: insufficient access level' },
      ],
    })

    // Create Memory Entries
    await db.memoryEntry.createMany({
      data: [
        { type: 'conversation', title: 'Product Strategy Discussion', content: 'Discussed pivot toward enterprise market. Key insights: SMB segment has lower LTV, enterprise deals take 3x longer but have 10x value. Need to adjust onboarding flow.', tags: JSON.stringify(['strategy', 'enterprise', 'product']), source: 'Hermes', agentId: hermes.id, path: 'vault/strategy/product', pinned: true },
        { type: 'insight', title: 'API Performance Bottleneck', content: 'The /api/dashboard endpoint is taking 2.3s on average. Root cause: N+1 query in agent status lookup. Suggested fix: batch agent status queries with a single JOIN.', tags: JSON.stringify(['performance', 'api', 'database']), source: 'Claude Code', agentId: claudeCode.id, path: 'vault/insights/performance', pinned: true },
        { type: 'output', title: 'Competitor Analysis Report', content: 'Generated comprehensive analysis of 10 competitors. Key findings: 3 competitors have AI agent features, none have memory vaults or production surfaces. Our unique differentiator is the 7-layer architecture.', tags: JSON.stringify(['competition', 'market', 'report']), source: 'Hermes', agentId: hermes.id, path: 'vault/outputs/research', pinned: false },
        { type: 'task', title: 'Sprint 14 Retrospective', content: 'Velocity: 42 points (target 45). Blockers: 2 dependency issues with external API. Wins: Shipped memory vault v2, agent status real-time updates. Actions: Add buffer for external deps, improve sprint planning.', tags: JSON.stringify(['sprint', 'retro', 'planning']), source: 'system', path: 'vault/tasks/sprints', pinned: false },
        { type: 'reference', title: 'System Architecture Decision', content: 'Chose monorepo with Next.js App Router for the dashboard. Reasons: Single deployment, shared types, faster iteration. Trade-off: Build times increase with scale. Mitigation: Turborepo for caching.', tags: JSON.stringify(['architecture', 'decision', 'nextjs']), source: 'system', path: 'vault/reference/architecture', pinned: true },
        { type: 'conversation', title: 'User Feedback Summary', content: 'Collected 47 user feedback entries. Top requests: 1) Dark mode (already planned), 2) Agent customization, 3) Mobile responsive, 4) Export functionality. NPS score: 72.', tags: JSON.stringify(['feedback', 'users', 'ux']), source: 'Hermes', agentId: hermes.id, path: 'vault/conversations/feedback', pinned: false },
        { type: 'insight', title: 'Memory Vault Usage Patterns', content: 'Users with pinned memories return 3x more often. Most searched terms: "api", "agent", "config". Tag "strategy" has highest engagement. Suggest auto-suggest for common tags.', tags: JSON.stringify(['analytics', 'memory', 'ux']), source: 'Sentinel', agentId: sentinel.id, path: 'vault/insights/analytics', pinned: false },
        { type: 'reference', title: 'API Rate Limiting Config', content: 'Current rate limits: 100 req/min for authenticated users, 20 req/min for anonymous. Burst allowance: 1.5x for 10 seconds. Implementation: Token bucket algorithm in middleware.', tags: JSON.stringify(['api', 'config', 'rate-limiting']), source: 'system', path: 'vault/reference/config', pinned: false },
        { type: 'output', title: 'Code Review: Auth Module', content: 'Reviewed PR #234. Found 3 issues: 1) JWT secret not rotated on deploy, 2) Missing CSRF protection on login, 3) Token expiry too long (30d). All marked as must-fix before merge.', tags: JSON.stringify(['code-review', 'security', 'auth']), source: 'OpenClaw', agentId: openclaw.id, path: 'vault/outputs/reviews', pinned: true },
        { type: 'task', title: 'Infrastructure Scaling Plan', content: 'Current: 2 app servers, 1 DB. Proposed: 4 app servers behind ALB, read replica for DB, Redis for session cache. Estimated cost increase: 40%. Expected capacity improvement: 3x.', tags: JSON.stringify(['infrastructure', 'scaling', 'devops']), source: 'Sentinel', agentId: sentinel.id, path: 'vault/tasks/infrastructure', pinned: false },
        { type: 'insight', title: 'Agent Performance Metrics', content: 'Hermes: 47 tasks completed, 96% success rate, avg 12s/task. OpenClaw: 32 tasks, 97% success, avg 45s/task. Claude Code: 63 tasks, 95% success, avg 30s/task. Sentinel: 156 tasks, 95% success, avg 5s/task.', tags: JSON.stringify(['metrics', 'agents', 'performance']), source: 'system', path: 'vault/insights/metrics', pinned: false },
        { type: 'conversation', title: 'Design System Principles', content: 'Established core principles: 1) Dark-first design, 2) Emerald accent for active states, 3) Terminal/hacker aesthetic, 4) Subtle animations, 5) Information-dense but scannable layouts.', tags: JSON.stringify(['design', 'ui', 'principles']), source: 'system', path: 'vault/conversations/design', pinned: false },
        { type: 'reference', title: 'WebSocket Event Types', content: 'Defined events: agent:status, task:update, memory:write, output:route, system:alert. All events follow {type, payload, timestamp} format. Authentication via JWT in handshake.', tags: JSON.stringify(['websocket', 'events', 'api']), source: 'Claude Code', agentId: claudeCode.id, path: 'vault/reference/websocket', pinned: false },
        { type: 'output', title: 'SEO Content Strategy Draft', content: 'Proposed 20-article content plan targeting: "AI agent dashboard", "agent operating system", "multi-agent management". Timeline: 2 articles/week for 10 weeks. Expected organic traffic: 5K/month by month 6.', tags: JSON.stringify(['seo', 'content', 'marketing']), source: 'Hermes', agentId: hermes.id, path: 'vault/outputs/seo', pinned: false },
        { type: 'task', title: 'Security Audit Findings', content: 'Penetration test completed. 2 high-severity: XSS in markdown renderer, SSRF in URL preview. 5 medium: Missing CSP headers, weak cookie flags, etc. All assigned to Sprint 15.', tags: JSON.stringify(['security', 'audit', 'bugs']), source: 'Sentinel', agentId: sentinel.id, path: 'vault/tasks/security', pinned: true },
      ],
    })

    // Create Goals
    await db.goal.createMany({
      data: [
        { title: 'Launch AgentOS v1.0', description: 'Complete the 7-layer architecture and launch to beta users', status: 'active', progress: 72, priority: 'critical', dueDate: new Date(Date.now() + 14 * 86400000) },
        { title: '100 Memory Entries', description: 'Populate the memory vault with 100 high-quality entries', status: 'active', progress: 45, priority: 'medium', dueDate: new Date(Date.now() + 30 * 86400000) },
        { title: 'Zero Critical Bugs', description: 'Resolve all critical and high-severity bugs from security audit', status: 'active', progress: 60, priority: 'high', dueDate: new Date(Date.now() + 7 * 86400000) },
        { title: 'Agent Autonomy Level 3', description: 'Enable agents to self-assign tasks and request resources', status: 'paused', progress: 25, priority: 'medium' },
        { title: 'API Documentation Complete', description: 'Document all 16 API endpoints with examples and schemas', status: 'completed', progress: 100, priority: 'medium' },
      ],
    })

    // Create Workspaces
    await db.workspace.createMany({
      data: [
        { name: 'Creative Studio', type: 'studio', description: 'AI-powered creative workspace for content generation and design', config: JSON.stringify({ agents: ['Hermes', 'Claude Code'], outputs: ['text', 'code', 'insight'] }), isActive: true },
        { name: 'SEO Command Center', type: 'seo', description: 'Content optimization and search performance tracking', config: JSON.stringify({ agents: ['Hermes'], outputs: ['seo-report', 'keywords'] }), isActive: true },
        { name: 'Goals & OKRs', type: 'goals', description: 'Track organizational goals, KPIs, and OKRs', config: JSON.stringify({ tracking: 'weekly', reviewCycle: 'quarterly' }), isActive: true },
      ],
    })

    // Create Agent Outputs
    await db.agentOutput.createMany({
      data: [
        { agentId: hermes.id, type: 'insight', title: 'Market Trend: AI Agent Adoption', content: 'Enterprise AI agent adoption grew 340% YoY. Key drivers: multi-agent orchestration, persistent memory, and production integration.', routedTo: JSON.stringify(['memory', 'dashboard']), isArchived: false },
        { agentId: openclaw.id, type: 'code', title: 'Auth Module Refactor', content: 'Refactored authentication to use JWT with RS256 signing. Added token rotation and CSRF protection. PR #234 updated.', routedTo: JSON.stringify(['memory', 'studio']), isArchived: false },
        { agentId: claudeCode.id, type: 'text', title: 'Dashboard API Specification', content: 'Defined 16 REST endpoints with OpenAPI spec. Includes agent CRUD, memory search, model routing, and command execution.', routedTo: JSON.stringify(['memory']), memoryId: null, isArchived: false },
        { agentId: sentinel.id, type: 'action', title: 'Auto-scaled worker pool', content: 'Automatically scaled worker pool from 2 to 4 instances based on queue depth threshold (>50 pending tasks).', routedTo: JSON.stringify(['dashboard', 'memory']), isArchived: false },
        { agentId: hermes.id, type: 'text', title: 'Weekly Research Digest', content: 'Compiled 15 research papers on multi-agent systems, 8 new tools, and 3 emerging patterns in agent orchestration.', routedTo: JSON.stringify(['memory', 'seo']), isArchived: true },
        { agentId: claudeCode.id, type: 'code', title: 'WebSocket Real-time Layer', content: 'Implemented Socket.io based real-time layer for agent status updates, task progress, and system events.', routedTo: JSON.stringify(['memory']), isArchived: false },
      ],
    })

    // Create Activity Events
    await db.activityEvent.createMany({
      data: [
        { type: 'agent_start', source: hermes.id, detail: JSON.stringify({ agent: 'Hermes', task: 'Market trend analysis Q1' }) },
        { type: 'agent_complete', source: openclaw.id, detail: JSON.stringify({ agent: 'OpenClaw', task: 'Fix memory leak in worker', result: 'success' }) },
        { type: 'memory_write', source: hermes.id, detail: JSON.stringify({ entry: 'Product Strategy Discussion', type: 'conversation' }) },
        { type: 'output_route', source: claudeCode.id, detail: JSON.stringify({ output: 'Dashboard API Specification', routedTo: ['memory'] }) },
        { type: 'agent_start', source: claudeCode.id, detail: JSON.stringify({ agent: 'Claude Code', task: 'Build dashboard API' }) },
        { type: 'agent_error', source: sentinel.id, detail: JSON.stringify({ agent: 'Sentinel', task: 'Alert rule update', error: 'Permission denied' }) },
        { type: 'memory_write', source: openclaw.id, detail: JSON.stringify({ entry: 'Code Review: Auth Module', type: 'output' }) },
        { type: 'system_alert', source: 'system', detail: JSON.stringify({ alert: 'Memory usage above 80%', severity: 'warning' }) },
        { type: 'agent_pause', source: sentinel.id, detail: JSON.stringify({ agent: 'Sentinel', reason: 'Awaiting permission update' }) },
        { type: 'output_route', source: hermes.id, detail: JSON.stringify({ output: 'Weekly Research Digest', routedTo: ['memory', 'seo'] }) },
        { type: 'command', source: 'user', detail: JSON.stringify({ command: 'status', result: 'System operational' }) },
        { type: 'memory_pin', source: 'user', detail: JSON.stringify({ entry: 'API Performance Bottleneck' }) },
      ],
    })

    // Create Workflows
    await db.workflow.createMany({
      data: [
        {
          name: 'Daily Research Pipeline',
          description: 'Automated research pipeline that gathers market intelligence, summarizes findings, and writes to memory vault.',
          status: 'active',
          steps: JSON.stringify([
            { agentId: 'hermes', action: 'research', inputMapping: { topic: 'market_trends' }, outputKey: 'research_output' },
            { agentId: 'claude-code', action: 'summarize', inputMapping: { data: 'research_output' }, outputKey: 'summary' },
            { agentId: 'sentinel', action: 'alert', inputMapping: { data: 'summary' }, outputKey: 'alerts' },
          ]),
          triggerType: 'schedule',
          triggerConfig: JSON.stringify({ cron: '0 9 * * 1-5' }),
          lastRunAt: new Date(Date.now() - 86400000),
          runCount: 24,
          successRate: 95.8,
        },
        {
          name: 'Code Review Workflow',
          description: 'Automated code review process that analyzes PRs, checks for security issues, and generates review comments.',
          status: 'active',
          steps: JSON.stringify([
            { agentId: 'openclaw', action: 'review', inputMapping: { pr_url: 'pr_url' }, outputKey: 'review_comments' },
            { agentId: 'sentinel', action: 'security_check', inputMapping: { code: 'review_comments' }, outputKey: 'security_report' },
          ]),
          triggerType: 'webhook',
          triggerConfig: JSON.stringify({ url: '/webhooks/pr-created', method: 'POST' }),
          lastRunAt: new Date(Date.now() - 3600000),
          runCount: 12,
          successRate: 91.7,
        },
        {
          name: 'Weekly Report Generator',
          description: 'Generates comprehensive weekly reports covering agent performance, cost analysis, and system health.',
          status: 'draft',
          steps: JSON.stringify([
            { agentId: 'hermes', action: 'collect_metrics', inputMapping: { period: 'weekly' }, outputKey: 'metrics' },
            { agentId: 'claude-code', action: 'generate_report', inputMapping: { data: 'metrics' }, outputKey: 'report' },
          ]),
          triggerType: 'schedule',
          triggerConfig: JSON.stringify({ cron: '0 17 * * 5' }),
          runCount: 0,
          successRate: 0,
        },
      ],
    })

    // Create Scheduled Tasks
    await db.scheduledTask.createMany({
      data: [
        {
          name: 'Health Check - All Agents',
          agentId: sentinel.id,
          cronExpr: '*/5 * * * *',
          status: 'active',
          lastRunAt: new Date(Date.now() - 300000),
          nextRunAt: new Date(Date.now() + 300000),
          runCount: 4320,
          failCount: 23,
          taskType: 'agent',
          taskConfig: JSON.stringify({ check: 'health', scope: 'all' }),
        },
        {
          name: 'Memory Vault Backup',
          cronExpr: '0 2 * * *',
          status: 'active',
          lastRunAt: new Date(Date.now() - 86400000),
          nextRunAt: new Date(Date.now() + 86400000),
          runCount: 90,
          failCount: 2,
          taskType: 'command',
          taskConfig: JSON.stringify({ command: 'backup', destination: 's3://vault-backups' }),
        },
        {
          name: 'Morning Briefing',
          agentId: hermes.id,
          cronExpr: '0 8 * * 1-5',
          status: 'active',
          lastRunAt: new Date(Date.now() - 86400000),
          nextRunAt: new Date(Date.now() + 86400000),
          runCount: 45,
          failCount: 1,
          taskType: 'agent',
          taskConfig: JSON.stringify({ type: 'briefing', channels: ['dashboard', 'email'] }),
        },
        {
          name: 'Cost Report Aggregation',
          cronExpr: '0 0 1 * *',
          status: 'paused',
          runCount: 6,
          failCount: 0,
          taskType: 'command',
          taskConfig: JSON.stringify({ type: 'cost_report', period: 'monthly' }),
        },
      ],
    })

    // Create Notifications
    await db.notification.createMany({
      data: [
        { type: 'warning', title: 'High Memory Usage', message: 'System memory usage has exceeded 85%. Consider scaling resources or optimizing queries.', source: 'system', isRead: false, actionUrl: '/settings/system' },
        { type: 'success', title: 'Workflow Completed', message: 'Daily Research Pipeline completed successfully. 47 findings indexed to memory vault.', source: hermes.id, isRead: false, actionUrl: '/workflows' },
        { type: 'error', title: 'Agent Task Failed', message: 'Sentinel failed to update alert rules: Permission denied. Manual intervention required.', source: sentinel.id, isRead: false, actionUrl: '/agents' },
        { type: 'info', title: 'New Model Available', message: 'GPT-4o-mini is now available for routing. Consider adding to your model configurations.', source: 'system', isRead: true, actionUrl: '/models' },
        { type: 'agent', title: 'Agent Status Change', message: 'OpenClaw transitioned from running to idle. Last task completed: "Refactor auth module".', source: openclaw.id, isRead: true, actionUrl: '/agents' },
        { type: 'warning', title: 'Budget Alert', message: 'Monthly API spending has reached 75% of the allocated budget ($750/$1000).', source: 'system', isRead: false, actionUrl: '/costs' },
        { type: 'info', title: 'Scheduled Maintenance', message: 'System maintenance scheduled for Saturday 2:00 AM UTC. Expected downtime: 15 minutes.', source: 'system', isRead: true },
        { type: 'success', title: 'Goal Milestone Reached', message: 'Goal "Launch AgentOS v1.0" has reached 70% progress. Only 3 critical tasks remaining.', source: 'system', isRead: false, actionUrl: '/goals' },
      ],
    })

    // Create Cost Entries (spread over last 30 days)
    const costEntries = []
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(i * 1.5)
      const agents = [hermes, openclaw, claudeCode, sentinel]
      const agent = agents[i % 4]
      const models = ['gpt-4o', 'claude-3.5-sonnet']
      const taskTypes = ['chat', 'code', 'research', 'analysis']
      const tokensIn = Math.floor(Math.random() * 8000) + 500
      const tokensOut = Math.floor(Math.random() * 3000) + 200
      const costPer1k = models[i % 2] === 'gpt-4o' ? 0.005 : 0.003
      const cost = Math.round(((tokensIn + tokensOut) / 1000 * costPer1k) * 10000) / 10000

      costEntries.push({
        agentId: agent.id,
        modelId: models[i % 2],
        tokensIn,
        tokensOut,
        cost,
        taskType: taskTypes[i % 4],
        metadata: JSON.stringify({ requestId: `req-${i + 1}`, duration: Math.floor(Math.random() * 30) + 1 }),
        createdAt: new Date(Date.now() - daysAgo * 86400000 + Math.floor(Math.random() * 86400000)),
      })
    }
    await db.costEntry.createMany({ data: costEntries })

    // Create Budget Alerts
    await db.budgetAlert.createMany({
      data: [
        { name: 'Monthly API Budget', limitAmount: 1000, currentSpend: 748.32, period: 'monthly', isActive: true, alertedAt: new Date(Date.now() - 86400000) },
        { name: 'Daily Cap', limitAmount: 50, currentSpend: 12.45, period: 'daily', isActive: true },
      ],
    })

    // Create Webhooks
    const githubWebhook = await db.webhook.create({
      data: {
        name: 'GitHub Push',
        url: 'https://api.agentos.dev/webhooks/github',
        secret: 'gh_wh_secret_abc123',
        triggerEvents: JSON.stringify(['push', 'pull_request']),
        sourceType: 'incoming',
        isActive: true,
        agentId: openclaw.id,
        headers: JSON.stringify({ 'X-GitHub-Event': 'push' }),
        lastTriggeredAt: new Date(Date.now() - 1800000),
        triggerCount: 47,
        failCount: 2,
      },
    })

    const slackWebhook = await db.webhook.create({
      data: {
        name: 'Slack Notification',
        url: 'https://hooks.slack.com/services/T00/B00/xxx',
        secret: 'slack_signing_secret_def456',
        triggerEvents: JSON.stringify(['task_complete', 'alert', 'agent_error']),
        sourceType: 'outgoing',
        isActive: true,
        agentId: sentinel.id,
        headers: JSON.stringify({ 'Content-Type': 'application/json', Authorization: 'Bearer xoxb-xxx' }),
        lastTriggeredAt: new Date(Date.now() - 3600000),
        triggerCount: 128,
        failCount: 5,
      },
    })

    const stripeWebhook = await db.webhook.create({
      data: {
        name: 'Stripe Payment',
        url: 'https://api.agentos.dev/webhooks/stripe',
        secret: 'whsec_stripe_ghi789',
        triggerEvents: JSON.stringify(['payment_intent.succeeded', 'invoice.paid']),
        sourceType: 'incoming',
        isActive: true,
        agentId: hermes.id,
        headers: JSON.stringify({ 'Stripe-Signature': 't=1234' }),
        lastTriggeredAt: new Date(Date.now() - 7200000),
        triggerCount: 23,
        failCount: 0,
      },
    })

    // Create Webhook Events
    await db.webhookEvent.createMany({
      data: [
        { webhookId: githubWebhook.id, direction: 'incoming', payload: JSON.stringify({ ref: 'refs/heads/main', commits: [{ id: 'abc123', message: 'Fix auth bug' }] }), status: 'success', response: JSON.stringify({ processed: true, taskId: 'task-1' }) },
        { webhookId: githubWebhook.id, direction: 'incoming', payload: JSON.stringify({ ref: 'refs/heads/feature/dashboard', commits: [{ id: 'def456', message: 'Add chart component' }] }), status: 'success', response: JSON.stringify({ processed: true, taskId: 'task-2' }) },
        { webhookId: slackWebhook.id, direction: 'outgoing', payload: JSON.stringify({ channel: '#alerts', text: 'Agent Hermes completed task: Market trend analysis' }), status: 'success', response: JSON.stringify({ ok: true }) },
        { webhookId: slackWebhook.id, direction: 'outgoing', payload: JSON.stringify({ channel: '#monitoring', text: 'System memory usage above 80%' }), status: 'failed', response: JSON.stringify({ error: 'channel_not_found' }) },
        { webhookId: stripeWebhook.id, direction: 'incoming', payload: JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { amount: 9900, currency: 'usd' } } }), status: 'success', response: JSON.stringify({ processed: true, recorded: true }) },
      ],
    })

    // Create Agent Messages
    await db.agentMessage.createMany({
      data: [
        { fromAgentId: hermes.id, toAgentId: openclaw.id, messageType: 'task_delegation', content: 'I found a potential security vulnerability in the auth module during research. Can you review and fix it?', threadId: 'thread-security-1', priority: 'high', isRead: true, metadata: JSON.stringify({ relatedTask: 'Fix memory leak in worker', source: 'research' }) },
        { fromAgentId: openclaw.id, toAgentId: hermes.id, messageType: 'response', content: 'On it! I\'ve identified the issue — JWT secret isn\'t being rotated on deploy. Also found missing CSRF protection. PR #234 is ready for review.', threadId: 'thread-security-1', priority: 'high', isRead: true, metadata: JSON.stringify({ prUrl: 'https://github.com/org/repo/pull/234' }) },
        { fromAgentId: sentinel.id, toAgentId: claudeCode.id, messageType: 'query', content: 'Dashboard API response time has increased to 2.3s. Can you investigate the N+1 query issue in the agent status endpoint?', threadId: 'thread-perf-1', priority: 'urgent', isRead: true, metadata: JSON.stringify({ metric: 'api_latency', threshold: '1s', current: '2.3s' }) },
        { fromAgentId: claudeCode.id, toAgentId: sentinel.id, messageType: 'response', content: 'Confirmed the N+1 query issue. I\'ll batch the agent status queries with a JOIN. Should bring it down to under 200ms.', threadId: 'thread-perf-1', priority: 'urgent', isRead: false, metadata: JSON.stringify({ estimatedFix: '2h', approach: 'batch_query' }) },
        { fromAgentId: hermes.id, toAgentId: claudeCode.id, messageType: 'context_share', content: 'Sharing the latest market research on AI agent adoption. Enterprise demand grew 340% YoY — we should prioritize the enterprise dashboard features.', threadId: 'thread-strategy-1', priority: 'normal', isRead: true, metadata: JSON.stringify({ reportId: 'rpt-market-q1', insights: 47 }) },
        { fromAgentId: sentinel.id, toAgentId: hermes.id, messageType: 'task_delegation', content: 'Daily health check complete. All agents operational. One alert: OpenClaw memory usage is high. Please include in morning briefing.', threadId: 'thread-health-1', priority: 'normal', isRead: false, metadata: JSON.stringify({ healthyAgents: 4, alerts: 1 }) },
        { fromAgentId: openclaw.id, toAgentId: claudeCode.id, messageType: 'message', content: 'Hey, the WebSocket handler you built is working great. Real-time agent status updates are smooth. Mind adding a reconnection fallback?', threadId: 'thread-websocket-1', priority: 'low', isRead: false, metadata: JSON.stringify({ component: 'websocket', feature: 'reconnection' }) },
        { fromAgentId: claudeCode.id, toAgentId: openclaw.id, messageType: 'response', content: 'Thanks! Yeah, I\'ll add exponential backoff reconnection with a max of 5 retries. Should be ready by EOD.', threadId: 'thread-websocket-1', priority: 'low', isRead: false, metadata: JSON.stringify({ component: 'websocket', strategy: 'exponential_backoff' }) },
      ],
    })

    // Create Backups
    const allAgents = await db.agent.findMany()
    const allMemories = await db.memoryEntry.findMany()
    const allWorkflows = await db.workflow.findMany()
    const allOutputs = await db.agentOutput.findMany()
    const allGoals = await db.goal.findMany()
    const allTasks = await db.agentTask.findMany()
    const allConfigs = await db.systemConfig.findMany()

    const fullBackupData = JSON.stringify({ agents: allAgents, memories: allMemories, workflows: allWorkflows, outputs: allOutputs, goals: allGoals, tasks: allTasks, configs: allConfigs })
    const memoryBackupData = JSON.stringify({ memories: allMemories })

    await db.backup.createMany({
      data: [
        {
          name: 'Full System Backup',
          description: 'Complete system backup including all agents, memory entries, workflows, and configuration.',
          type: 'full',
          size: Buffer.byteLength(fullBackupData, 'utf-8'),
          data: fullBackupData,
          version: '1.0',
          isAuto: true,
        },
        {
          name: 'Memory Vault Snapshot',
          description: 'Snapshot of all memory entries in the vault.',
          type: 'memory',
          size: Buffer.byteLength(memoryBackupData, 'utf-8'),
          data: memoryBackupData,
          version: '1.0',
          isAuto: false,
        },
      ],
    })

    // Create Templates
    await db.template.createMany({
      data: [
        {
          name: 'Research Agent',
          description: 'A versatile research agent that gathers information, analyzes data, and synthesizes findings into actionable insights.',
          category: 'agent',
          icon: '🔍',
          config: JSON.stringify({ type: 'hermes', modelId: 'gpt-4o', maxConcurrentTasks: 5, timeout: 30000, capabilities: ['web_search', 'data_analysis', 'summarization'] }),
          tags: JSON.stringify(['research', 'analysis', 'hermes']),
          isBuiltIn: true,
          useCount: 34,
        },
        {
          name: 'Code Review Agent',
          description: 'An agent specialized in code review, refactoring, and security analysis with automated PR feedback.',
          category: 'agent',
          icon: '🦀',
          config: JSON.stringify({ type: 'openclaw', modelId: 'claude-3.5-sonnet', maxConcurrentTasks: 3, timeout: 60000, capabilities: ['code_review', 'refactoring', 'security'] }),
          tags: JSON.stringify(['code', 'review', 'openclaw']),
          isBuiltIn: true,
          useCount: 28,
        },
        {
          name: 'Daily Research Pipeline',
          description: 'Automated daily research pipeline that gathers market intelligence and writes summaries to the memory vault.',
          category: 'workflow',
          icon: '🔄',
          config: JSON.stringify({ triggerType: 'schedule', triggerConfig: { cron: '0 9 * * 1-5' }, steps: [{ agentId: 'hermes', action: 'research' }, { agentId: 'claude-code', action: 'summarize' }] }),
          tags: JSON.stringify(['research', 'pipeline', 'daily', 'automation']),
          isBuiltIn: true,
          useCount: 19,
        },
        {
          name: 'Code Review Workflow',
          description: 'Automated code review triggered by pull requests with security scanning and review comments.',
          category: 'workflow',
          icon: '📋',
          config: JSON.stringify({ triggerType: 'webhook', triggerConfig: { event: 'pr_created' }, steps: [{ agentId: 'openclaw', action: 'review' }, { agentId: 'sentinel', action: 'security_check' }] }),
          tags: JSON.stringify(['code-review', 'security', 'webhook', 'automation']),
          isBuiltIn: true,
          useCount: 15,
        },
        {
          name: 'Production Configuration',
          description: 'Production-ready system configuration with optimized model routing, rate limiting, and cost controls.',
          category: 'config',
          icon: '⚙️',
          config: JSON.stringify({ models: ['gpt-4o', 'claude-3.5-sonnet'], routing: { code: 'claude-3.5-sonnet', research: 'gpt-4o' }, rateLimit: { authenticated: 100, anonymous: 20 }, budget: { monthly: 1000, daily: 50 } }),
          tags: JSON.stringify(['production', 'config', 'routing', 'cost']),
          isBuiltIn: true,
          useCount: 42,
        },
        {
          name: 'Development Configuration',
          description: 'Development configuration with local model support, relaxed rate limits, and verbose logging.',
          category: 'config',
          icon: '🛠️',
          config: JSON.stringify({ models: ['llama-3.1-70b', 'gpt-4o'], routing: { default: 'llama-3.1-70b', fallback: 'gpt-4o' }, rateLimit: { authenticated: 1000, anonymous: 100 }, logging: 'verbose' }),
          tags: JSON.stringify(['development', 'config', 'local', 'debug']),
          isBuiltIn: false,
          useCount: 7,
        },
      ],
    })

    // Create MCP Servers
    const existingMCPServers = await db.mCPServer.count()
    if (existingMCPServers === 0) {
      const filesystemServer = await db.mCPServer.create({
        data: {
          name: 'Filesystem',
          description: 'File system operations server providing read, write, search, and directory management capabilities.',
          version: '1.0.0',
          transportType: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', '@modelcontextprotocol/server-filesystem']),
          envVars: JSON.stringify({}),
          status: 'connected',
          lastConnectedAt: new Date(),
          toolCount: 5,
          resourceCount: 2,
          promptCount: 1,
          requestCount: 234,
          errorCount: 1,
          isActive: true,
          autoConnect: true,
          tags: JSON.stringify(['filesystem', 'files', 'io']),
          icon: '📁',
        },
      })

      const githubServer = await db.mCPServer.create({
        data: {
          name: 'GitHub',
          description: 'GitHub integration server for repository management, issues, pull requests, and code search.',
          version: '1.0.0',
          transportType: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', '@modelcontextprotocol/server-github']),
          envVars: JSON.stringify({ GITHUB_PERSONAL_ACCESS_TOKEN: '***' }),
          status: 'connected',
          lastConnectedAt: new Date(Date.now() - 1800000),
          toolCount: 5,
          resourceCount: 3,
          promptCount: 2,
          requestCount: 189,
          errorCount: 3,
          isActive: true,
          autoConnect: true,
          tags: JSON.stringify(['github', 'vcs', 'repository']),
          icon: '🐙',
        },
      })

      const postgresServer = await db.mCPServer.create({
        data: {
          name: 'PostgreSQL',
          description: 'PostgreSQL database server providing query execution, schema inspection, and data management capabilities.',
          version: '1.0.0',
          transportType: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', '@modelcontextprotocol/server-postgres']),
          envVars: JSON.stringify({ POSTGRES_CONNECTION_STRING: '***' }),
          status: 'disconnected',
          toolCount: 3,
          resourceCount: 1,
          promptCount: 1,
          requestCount: 56,
          errorCount: 2,
          isActive: true,
          autoConnect: false,
          tags: JSON.stringify(['postgresql', 'database', 'sql']),
          icon: '🐘',
        },
      })

      // Create MCP Tools for Filesystem server
      await db.mCPTool.createMany({
        data: [
          {
            serverId: filesystemServer.id,
            name: 'read_file',
            description: 'Read the complete contents of a file from the file system.',
            inputSchema: JSON.stringify({ type: 'object', properties: { path: { type: 'string', description: 'Path to the file to read' } }, required: ['path'] }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 87,
            lastUsedAt: new Date(Date.now() - 3600000),
            avgDuration: 45,
            errorRate: 0.01,
          },
          {
            serverId: filesystemServer.id,
            name: 'write_file',
            description: 'Create a new file or completely overwrite an existing file with new content.',
            inputSchema: JSON.stringify({ type: 'object', properties: { path: { type: 'string', description: 'Path to the file to write' }, content: { type: 'string', description: 'Content to write to the file' } }, required: ['path', 'content'] }),
            annotations: JSON.stringify({ readOnlyHint: false, destructiveHint: true }),
            isActive: true,
            useCount: 42,
            lastUsedAt: new Date(Date.now() - 7200000),
            avgDuration: 120,
            errorRate: 0.02,
          },
          {
            serverId: filesystemServer.id,
            name: 'list_directory',
            description: 'Get a detailed listing of all files and directories in a specified path.',
            inputSchema: JSON.stringify({ type: 'object', properties: { path: { type: 'string', description: 'Path to the directory to list' } }, required: ['path'] }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 63,
            lastUsedAt: new Date(Date.now() - 1800000),
            avgDuration: 30,
            errorRate: 0.0,
          },
          {
            serverId: filesystemServer.id,
            name: 'search_files',
            description: 'Recursively search for files and directories matching a pattern.',
            inputSchema: JSON.stringify({ type: 'object', properties: { path: { type: 'string', description: 'Starting path for the search' }, pattern: { type: 'string', description: 'Glob pattern to match' } }, required: ['path', 'pattern'] }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 28,
            lastUsedAt: new Date(Date.now() - 86400000),
            avgDuration: 200,
            errorRate: 0.04,
          },
          {
            serverId: filesystemServer.id,
            name: 'move_file',
            description: 'Move or rename a file or directory from one location to another.',
            inputSchema: JSON.stringify({ type: 'object', properties: { source: { type: 'string', description: 'Source path' }, destination: { type: 'string', description: 'Destination path' } }, required: ['source', 'destination'] }),
            annotations: JSON.stringify({ readOnlyHint: false, destructiveHint: true }),
            isActive: true,
            useCount: 14,
            lastUsedAt: new Date(Date.now() - 172800000),
            avgDuration: 80,
            errorRate: 0.07,
          },
        ],
      })

      // Create MCP Tools for GitHub server
      await db.mCPTool.createMany({
        data: [
          {
            serverId: githubServer.id,
            name: 'create_or_update_file',
            description: 'Create or update a file in a GitHub repository.',
            inputSchema: JSON.stringify({ type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, content: { type: 'string' }, message: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path', 'content', 'message'] }),
            annotations: JSON.stringify({ readOnlyHint: false, destructiveHint: true }),
            isActive: true,
            useCount: 35,
            lastUsedAt: new Date(Date.now() - 3600000),
            avgDuration: 850,
            errorRate: 0.03,
          },
          {
            serverId: githubServer.id,
            name: 'search_repositories',
            description: 'Search for GitHub repositories matching a query.',
            inputSchema: JSON.stringify({ type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 52,
            lastUsedAt: new Date(Date.now() - 7200000),
            avgDuration: 420,
            errorRate: 0.02,
          },
          {
            serverId: githubServer.id,
            name: 'create_issue',
            description: 'Create a new issue in a GitHub repository.',
            inputSchema: JSON.stringify({ type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'title'] }),
            annotations: JSON.stringify({ readOnlyHint: false }),
            isActive: true,
            useCount: 41,
            lastUsedAt: new Date(Date.now() - 86400000),
            avgDuration: 650,
            errorRate: 0.05,
          },
          {
            serverId: githubServer.id,
            name: 'create_pull_request',
            description: 'Create a new pull request in a GitHub repository.',
            inputSchema: JSON.stringify({ type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, head: { type: 'string' }, base: { type: 'string' } }, required: ['owner', 'repo', 'title', 'head', 'base'] }),
            annotations: JSON.stringify({ readOnlyHint: false }),
            isActive: true,
            useCount: 29,
            lastUsedAt: new Date(Date.now() - 172800000),
            avgDuration: 900,
            errorRate: 0.03,
          },
          {
            serverId: githubServer.id,
            name: 'get_file_contents',
            description: 'Get the contents of a file or directory from a GitHub repository.',
            inputSchema: JSON.stringify({ type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path'] }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 32,
            lastUsedAt: new Date(Date.now() - 43200000),
            avgDuration: 380,
            errorRate: 0.01,
          },
        ],
      })

      // Create MCP Tools for PostgreSQL server
      await db.mCPTool.createMany({
        data: [
          {
            serverId: postgresServer.id,
            name: 'query',
            description: 'Execute a SQL query on the PostgreSQL database.',
            inputSchema: JSON.stringify({ type: 'object', properties: { sql: { type: 'string', description: 'SQL query to execute' } }, required: ['sql'] }),
            annotations: JSON.stringify({ readOnlyHint: false, destructiveHint: true }),
            isActive: true,
            useCount: 38,
            lastUsedAt: new Date(Date.now() - 86400000),
            avgDuration: 150,
            errorRate: 0.05,
          },
          {
            serverId: postgresServer.id,
            name: 'list_tables',
            description: 'List all tables in the PostgreSQL database.',
            inputSchema: JSON.stringify({ type: 'object', properties: {} }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 12,
            lastUsedAt: new Date(Date.now() - 259200000),
            avgDuration: 80,
            errorRate: 0.0,
          },
          {
            serverId: postgresServer.id,
            name: 'describe_table',
            description: 'Get the schema and column information for a specific table.',
            inputSchema: JSON.stringify({ type: 'object', properties: { table_name: { type: 'string', description: 'Name of the table to describe' } }, required: ['table_name'] }),
            annotations: JSON.stringify({ readOnlyHint: true }),
            isActive: true,
            useCount: 6,
            lastUsedAt: new Date(Date.now() - 345600000),
            avgDuration: 65,
            errorRate: 0.0,
          },
        ],
      })

      // Create MCP Resources
      await db.mCPResource.createMany({
        data: [
          { serverId: filesystemServer.id, uri: 'file:///home/user/documents', name: 'User Documents', description: 'Access to the user documents directory', mimeType: 'text/directory', isActive: true, accessCount: 45, lastAccessedAt: new Date(Date.now() - 3600000) },
          { serverId: filesystemServer.id, uri: 'file:///home/user/projects', name: 'User Projects', description: 'Access to the user projects directory', mimeType: 'text/directory', isActive: true, accessCount: 78, lastAccessedAt: new Date(Date.now() - 1800000) },
          { serverId: githubServer.id, uri: 'github://repos/agentos', name: 'AgentOS Repository', description: 'Main AgentOS repository resources', mimeType: 'application/json', isActive: true, accessCount: 32, lastAccessedAt: new Date(Date.now() - 7200000) },
          { serverId: githubServer.id, uri: 'github://repos/agentos/issues', name: 'AgentOS Issues', description: 'Open issues in the AgentOS repository', mimeType: 'application/json', isActive: true, accessCount: 18, lastAccessedAt: new Date(Date.now() - 86400000) },
          { serverId: githubServer.id, uri: 'github://repos/agentos/pulls', name: 'AgentOS Pull Requests', description: 'Open pull requests in the AgentOS repository', mimeType: 'application/json', isActive: true, accessCount: 12, lastAccessedAt: new Date(Date.now() - 172800000) },
          { serverId: postgresServer.id, uri: 'postgres://tables', name: 'Database Tables', description: 'List of all tables in the PostgreSQL database', mimeType: 'application/json', isActive: true, accessCount: 8, lastAccessedAt: new Date(Date.now() - 345600000) },
        ],
      })

      // Create MCP Prompts
      await db.mCPPrompt.createMany({
        data: [
          { serverId: filesystemServer.id, name: 'summarize_directory', description: 'Generate a summary of a directory structure and its contents', arguments: JSON.stringify([{ name: 'path', description: 'Directory path to summarize', required: true }]), isActive: true, useCount: 15, lastUsedAt: new Date(Date.now() - 86400000) },
          { serverId: githubServer.id, name: 'review_pull_request', description: 'Review a pull request and provide feedback on code quality and potential issues', arguments: JSON.stringify([{ name: 'owner', description: 'Repository owner', required: true }, { name: 'repo', description: 'Repository name', required: true }, { name: 'pr_number', description: 'Pull request number', required: true }]), isActive: true, useCount: 22, lastUsedAt: new Date(Date.now() - 43200000) },
          { serverId: githubServer.id, name: 'analyze_issue', description: 'Analyze a GitHub issue and suggest a resolution approach', arguments: JSON.stringify([{ name: 'owner', description: 'Repository owner', required: true }, { name: 'repo', description: 'Repository name', required: true }, { name: 'issue_number', description: 'Issue number', required: true }]), isActive: true, useCount: 9, lastUsedAt: new Date(Date.now() - 172800000) },
          { serverId: postgresServer.id, name: 'explain_query', description: 'Explain a SQL query execution plan and suggest optimizations', arguments: JSON.stringify([{ name: 'sql', description: 'SQL query to explain', required: true }]), isActive: true, useCount: 4, lastUsedAt: new Date(Date.now() - 432000000) },
        ],
      })
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
