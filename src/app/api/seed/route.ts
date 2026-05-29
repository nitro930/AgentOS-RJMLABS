import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Clear existing data
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

    return NextResponse.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
