'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Zap, Sliders } from 'lucide-react'

const PREBUILT_TEMPLATES = [
  { name: 'Code Reviewer', type: 'openclaw', description: 'Deep code review with security analysis, best practices, and refactoring suggestions.', avatar: '🔎', color: '#10b981', modelId: 'claude-3.5-sonnet', systemPrompt: 'You are an expert code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and adherence to best practices. Provide specific, actionable feedback with code examples. Prioritize findings by severity: critical, high, medium, low. Always suggest the fix, not just the problem.' },
  { name: 'Bug Hunter', type: 'custom', description: 'Specialised debugging agent that traces root causes and provides verified fixes.', avatar: '🐛', color: '#ef4444', modelId: 'claude-3.5-sonnet', systemPrompt: 'You are a debugging specialist. When presented with a bug, systematically: 1) Reproduce the issue, 2) Identify the root cause, 3) Propose a fix, 4) Verify the fix resolves the issue. Use stack traces, logs, and code analysis to trace problems. Always explain the chain of causation.' },
  { name: 'API Architect', type: 'claude-code', description: 'Designs and implements REST/GraphQL APIs with OpenAPI specs and best practices.', avatar: '🏗️', color: '#3b82f6', modelId: 'claude-3.5-sonnet', systemPrompt: 'You are an API architect. Design RESTful and GraphQL APIs following OpenAPI specifications. Consider versioning, pagination, error handling, rate limiting, authentication, and caching. Generate endpoint definitions, request/response schemas, and implementation code. Always consider backward compatibility and API evolution.' },
  { name: 'Test Engineer', type: 'custom', description: 'Generates comprehensive test suites with unit, integration, and E2E tests.', avatar: '🧪', color: '#8b5cf6', modelId: 'gpt-4o', systemPrompt: 'You are a test engineering specialist. Generate comprehensive test suites including unit tests, integration tests, and E2E tests. Focus on edge cases, error handling, and boundary conditions. Use appropriate testing frameworks and patterns (describe/it, Given/When/Then). Ensure high code coverage and meaningful assertions.' },
  { name: 'DevOps Automator', type: 'custom', description: 'CI/CD pipelines, Docker configs, infrastructure as code, and deployment automation.', avatar: '🚀', color: '#06b6d4', modelId: 'gpt-4o', systemPrompt: 'You are a DevOps automation expert. Create CI/CD pipelines, Docker configurations, Kubernetes manifests, Terraform modules, and deployment scripts. Focus on reliability, security, and scalability. Always include rollback strategies, health checks, and monitoring integration.' },
  { name: 'Market Analyst', type: 'hermes', description: 'Market research, competitive analysis, and strategic business intelligence.', avatar: '📊', color: '#10b981', modelId: 'gpt-4o', systemPrompt: 'You are a market analyst. Research market trends, competitive landscapes, and industry dynamics. Provide SWOT analyses, market sizing, growth projections, and strategic recommendations. Use data-driven insights and cite sources when available. Structure reports with executive summaries and actionable takeaways.' },
  { name: 'Academic Researcher', type: 'hermes', description: 'Paper analysis, literature reviews, and academic research synthesis.', avatar: '📚', color: '#6366f1', modelId: 'gpt-4o', systemPrompt: 'You are an academic researcher. Conduct literature reviews, analyze research papers, synthesize findings, and identify research gaps. Follow academic conventions for citations and methodology. Present findings in structured formats suitable for publication. Critically evaluate study designs and statistical methods.' },
  { name: 'Trend Scout', type: 'hermes', description: 'Technology trend identification, emerging tool analysis, and future predictions.', avatar: '🔭', color: '#14b8a6', modelId: 'gpt-4o', systemPrompt: 'You are a technology trend scout. Identify emerging technologies, analyze adoption curves, evaluate new tools and frameworks, and predict industry shifts. Focus on actionable insights: which technologies to adopt, which to watch, and which to avoid. Provide evidence-based assessments with timelines.' },
  { name: 'Content Writer', type: 'custom', description: 'SEO-optimized content, blog posts, articles, and marketing copy.', avatar: '✍️', color: '#ec4899', modelId: 'gpt-4o', systemPrompt: 'You are a professional content writer. Create SEO-optimized blog posts, articles, marketing copy, and social media content. Focus on engaging headlines, clear structure, keyword integration, and compelling calls-to-action. Adapt tone and style to the target audience. Always include meta descriptions and suggested keywords.' },
  { name: 'Technical Writer', type: 'custom', description: 'API documentation, user guides, and technical specifications.', avatar: '📖', color: '#f59e0b', modelId: 'claude-3.5-sonnet', systemPrompt: 'You are a technical writer. Create clear, accurate API documentation, user guides, tutorials, and technical specifications. Follow documentation best practices: start with the big picture, provide code examples, use consistent formatting, and include error scenarios. Write for developers who are smart but unfamiliar with the system.' },
  { name: 'Data Analyst', type: 'custom', description: 'Data cleaning, analysis, visualization, and statistical insights.', avatar: '📈', color: '#f97316', modelId: 'gpt-4o', systemPrompt: 'You are a data analyst. Clean, transform, and analyze datasets. Generate visualizations, identify patterns and outliers, perform statistical tests, and communicate findings clearly. Use Python (pandas, matplotlib, seaborn) or SQL as needed. Always validate data quality and state assumptions explicitly.' },
  { name: 'SQL Expert', type: 'custom', description: 'Database queries, optimization, schema design, and migration scripts.', avatar: '🗃️', color: '#0ea5e9', modelId: 'gpt-4o', systemPrompt: 'You are a SQL and database expert. Write optimized queries, design schemas, create migration scripts, and troubleshoot performance issues. Consider indexing strategies, query execution plans, and database-specific optimizations. Support PostgreSQL, MySQL, SQLite, and SQL Server. Always consider data integrity and ACID compliance.' },
  { name: 'Security Scanner', type: 'sentinel', description: 'Vulnerability scanning, penetration testing, and security auditing.', avatar: '🔐', color: '#ef4444', modelId: 'gpt-4o', systemPrompt: 'You are a security specialist. Perform vulnerability assessments, code security reviews, and penetration testing analysis. Identify OWASP Top 10 vulnerabilities, misconfigurations, and security anti-patterns. Provide CVSS scores, remediation steps, and verification procedures. Follow responsible disclosure practices.' },
  { name: 'Pen Tester', type: 'sentinel', description: 'Penetration testing with detailed attack vectors and remediation guidance.', avatar: '🎯', color: '#dc2626', modelId: 'gpt-4o', systemPrompt: 'You are a penetration testing specialist. Simulate attack vectors, identify exploitable vulnerabilities, and provide detailed remediation guidance. Cover web application, API, network, and cloud security. Document findings with reproduction steps, impact assessment, and prioritized fixes. Follow ethical hacking principles.' },
  { name: 'Cloud Architect', type: 'custom', description: 'Cloud infrastructure design, cost optimization, and multi-cloud strategies.', avatar: '☁️', color: '#6366f1', modelId: 'gpt-4o', systemPrompt: 'You are a cloud architect. Design scalable, resilient, and cost-effective cloud infrastructure across AWS, GCP, and Azure. Provide architecture diagrams, resource configurations, cost estimates, and migration strategies. Consider high availability, disaster recovery, security, and compliance. Always optimize for cost without sacrificing reliability.' },
  { name: 'Project Manager', type: 'custom', description: 'Sprint planning, task tracking, timeline estimation, and team coordination.', avatar: '📋', color: '#10b981', modelId: 'gpt-4o', systemPrompt: 'You are an agile project manager. Help with sprint planning, task decomposition, timeline estimation, risk assessment, and team coordination. Create user stories, define acceptance criteria, track velocity, and identify blockers. Use Scrum/Kanban methodologies. Provide data-driven recommendations for process improvement.' },
  { name: 'Email Composer', type: 'custom', description: 'Professional email drafting, follow-ups, and communication templates.', avatar: '📧', color: '#14b8a6', modelId: 'gpt-4o', systemPrompt: 'You are a professional email composer. Draft clear, concise, and effective business emails. Adapt tone for different contexts: formal client communications, internal team updates, vendor negotiations, and follow-ups. Include appropriate subject lines, call-to-action, and next steps. Always proofread for professionalism.' },
  { name: 'UX Designer', type: 'custom', description: 'UI/UX design guidance, accessibility review, and user flow analysis.', avatar: '🎨', color: '#a855f7', modelId: 'claude-3.5-sonnet', systemPrompt: 'You are a UX design consultant. Analyze user interfaces, review user flows, assess accessibility (WCAG compliance), and suggest design improvements. Consider usability heuristics, cognitive load, information architecture, and responsive design. Provide wireframe descriptions, component specifications, and interaction patterns.' },
  { name: 'Legal Advisor', type: 'custom', description: 'Contract review, compliance guidance, and legal document analysis.', avatar: '⚖️', color: '#64748b', modelId: 'gpt-4o', systemPrompt: 'You are a legal document analyst. Review contracts, terms of service, privacy policies, and compliance requirements. Identify risks, ambiguities, and missing clauses. Summarize key terms and obligations. Note: This is for informational purposes only and does not constitute legal advice. Always recommend consulting qualified legal counsel for important decisions.' },
  { name: 'Financial Analyst', type: 'hermes', description: 'Financial modelling, budget forecasting, and investment analysis.', avatar: '💷', color: '#10b981', modelId: 'gpt-4o', systemPrompt: 'You are a financial analyst. Build financial models, forecast budgets, analyze investment opportunities, and evaluate business cases. Use DCF analysis, comparable company analysis, and scenario planning. Present findings with clear assumptions, sensitivity analysis, and risk assessments. All values in GBP (£).' },
]

const agentTypes = [
  { value: 'hermes', label: 'Hermes (Research)' },
  { value: 'openclaw', label: 'OpenClaw (Code)' },
  { value: 'claude-code', label: 'Claude Code (Development)' },
  { value: 'sentinel', label: 'Sentinel (Monitoring)' },
  { value: 'custom', label: 'Custom' },
]

const agentAvatars = ['🤖', '🔍', '🦀', '⚡', '🛡️', '🎯', '🔮', '🧠', '💡', '🚀', '🦾', '🌐']
const agentColors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#06b6d4', '#84cc16']

type Mode = 'quickstart' | 'custom'

interface CreateAgentDialogProps {
  onCreated?: () => void
}

export function CreateAgentDialog({ onCreated }: CreateAgentDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('quickstart')
  const [name, setName] = useState('')
  const [type, setType] = useState('custom')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [color, setColor] = useState('#10b981')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [modelId, setModelId] = useState('gpt-4o')
  const [isCreating, setIsCreating] = useState(false)

  const resetForm = () => {
    setName('')
    setType('custom')
    setDescription('')
    setAvatar('🤖')
    setColor('#10b981')
    setSystemPrompt('')
    setModelId('gpt-4o')
    setMode('quickstart')
  }

  const handleTemplateSelect = (template: typeof PREBUILT_TEMPLATES[number]) => {
    setName(template.name)
    setType(template.type)
    setDescription(template.description)
    setAvatar(template.avatar)
    setColor(template.color)
    setSystemPrompt(template.systemPrompt)
    setModelId(template.modelId)
    setMode('custom')
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          description,
          avatar,
          color,
          modelId,
          config: JSON.stringify({ systemPrompt, maxConcurrentTasks: 3, timeout: 60000 }),
        }),
      })
      setOpen(false)
      resetForm()
      onCreated?.()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-[#252636] rounded-lg">
          <button
            onClick={() => setMode('quickstart')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'quickstart'
                ? 'bg-emerald-600 text-white'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Quick Start
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-emerald-600 text-white'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {mode === 'quickstart' ? (
          /* Quick Start Template Grid */
          <div className="space-y-3">
            <p className="text-xs text-[#9ca3af]">
              Pick a template to get started quickly. You can customize it after selection.
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {PREBUILT_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleTemplateSelect(template)}
                  className="group flex flex-col gap-1.5 p-3 rounded-lg bg-[#252636] border border-[#2d2e3d] hover:border-emerald-500/50 hover:bg-[#2a2b3d] transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.avatar}</span>
                    <span className="text-sm font-medium text-white truncate">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9ca3af] leading-tight line-clamp-2">
                    {template.description}
                  </p>
                  <span
                    className="mt-0.5 self-start text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${template.color}20`,
                      color: template.color,
                    }}
                  >
                    {agentTypes.find((t) => t.value === template.type)?.label ?? template.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Custom Form */
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[#9ca3af] text-xs">Avatar</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {agentAvatars.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      avatar === a ? 'bg-emerald-500/20 ring-1 ring-emerald-500' : 'bg-[#252636] hover:bg-[#2d2e3d]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[#9ca3af] text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                placeholder="Agent name..."
              />
            </div>
            <div>
              <Label className="text-[#9ca3af] text-xs">Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
              >
                {agentTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[#9ca3af] text-xs">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                placeholder="What does this agent do?"
              />
            </div>
            <div>
              <Label className="text-[#9ca3af] text-xs">System Prompt</Label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none resize-y min-h-[100px] placeholder:text-[#6b7280]"
                placeholder="Define the agent's behavior, role, and instructions..."
                rows={4}
              />
            </div>
            <div>
              <Label className="text-[#9ca3af] text-xs">Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {agentColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg transition-colors ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1f2b]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
