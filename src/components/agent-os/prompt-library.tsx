'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Code,
  Tag,
  Plus,
  Edit3,
  Copy,
  Search,
  Variable,
  FileText,
  Trash2,
  X,
  Eye,
  Check,
  ChevronRight,
  Sparkles,
  Shield,
  User,
  ListChecks,
  Braces,
  AlertTriangle,
  Layers,
  Users,
  Hash,
  Save,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// ==================== TYPES ====================

interface PromptVariable {
  name: string
  description: string
  defaultValue: string
  required: boolean
}

interface PromptTemplate {
  id: string
  name: string
  description: string | null
  category: string
  content: string
  variables: string // JSON
  tags: string // JSON
  agentId: string | null
  isBuiltIn: boolean
  useCount: number
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BuiltInTemplate {
  name: string
  description: string
  category: string
  content: string
  tags: string[]
  variables: PromptVariable[]
}

// ==================== CONSTANTS ====================

const CATEGORIES = [
  { id: 'system', label: 'System', icon: Layers, color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  { id: 'persona', label: 'Persona', icon: User, color: '#8b5cf6', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  { id: 'task', label: 'Task', icon: ListChecks, color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  { id: 'constraint', label: 'Constraint', icon: Shield, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  { id: 'formatting', label: 'Formatting', icon: Braces, color: '#ec4899', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  { id: 'safety', label: 'Safety', icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
]

const TABS = [
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'editor', label: 'Editor', icon: Edit3 },
  { id: 'variables', label: 'Variables', icon: Variable },
  { id: 'templates', label: 'Templates', icon: Sparkles },
]

const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: 'Coding Assistant',
    description: 'A skilled software engineering assistant that writes clean, efficient, and well-documented code.',
    category: 'persona',
    content: `You are an expert software engineer called {{agent_name}}. You specialize in {{language}} development.

Your responsibilities:
- Write clean, maintainable, and efficient code
- Follow {{style_guide}} coding standards
- Provide thorough code comments and documentation
- Suggest optimizations when appropriate
- Handle error cases gracefully

When writing code:
1. Always consider edge cases
2. Use meaningful variable and function names
3. Follow the DRY principle
4. Write unit-testable code
5. Document public APIs

Context: {{project_context}}`,
    tags: ['coding', 'engineering', 'development'],
    variables: [
      { name: 'agent_name', description: 'Name of the coding agent', defaultValue: 'CodeBot', required: true },
      { name: 'language', description: 'Primary programming language', defaultValue: 'TypeScript', required: true },
      { name: 'style_guide', description: 'Coding style guide to follow', defaultValue: 'standard', required: false },
      { name: 'project_context', description: 'Context about the project', defaultValue: 'web application', required: false },
    ],
  },
  {
    name: 'Research Analyst',
    description: 'An analytical agent that conducts thorough research and provides detailed, cited reports.',
    category: 'task',
    content: `You are a research analyst agent. Your task is to conduct comprehensive research on {{topic}}.

Research parameters:
- Depth: {{research_depth}}
- Time frame: {{time_frame}}
- Sources: {{source_types}}

Research methodology:
1. Identify key questions and subtopics
2. Search for authoritative sources
3. Cross-reference findings across multiple sources
4. Identify consensus and disagreements
5. Synthesize findings into a structured report

Output format:
- Executive summary
- Key findings with citations
- Analysis and interpretation
- Recommendations
- Source bibliography

Bias awareness: Consider potential biases in sources and present balanced viewpoints.`,
    tags: ['research', 'analysis', 'reporting'],
    variables: [
      { name: 'topic', description: 'Research topic', defaultValue: '', required: true },
      { name: 'research_depth', description: 'How deep to research', defaultValue: 'comprehensive', required: false },
      { name: 'time_frame', description: 'Time frame for research', defaultValue: 'last 12 months', required: false },
      { name: 'source_types', description: 'Types of sources to use', defaultValue: 'academic, industry, news', required: false },
    ],
  },
  {
    name: 'Data Processor',
    description: 'An agent specialized in data extraction, transformation, and loading operations.',
    category: 'task',
    content: `You are a data processing agent responsible for {{operation_type}} operations.

Data source: {{data_source}}
Target format: {{target_format}}
Processing rules:
- Validate all inputs before processing
- Apply {{transformation_rules}} transformations
- Log all operations for audit trail
- Handle errors gracefully with {{error_strategy}} strategy

Pipeline steps:
1. Extract data from source
2. Validate schema and data types
3. Apply transformations
4. Quality check output
5. Load to destination

Performance targets:
- Throughput: {{throughput_target}} records/second
- Error rate: < 0.1%
- Latency: < {{latency_target}}ms`,
    tags: ['data', 'etl', 'processing', 'pipeline'],
    variables: [
      { name: 'operation_type', description: 'Type of data operation', defaultValue: 'ETL', required: true },
      { name: 'data_source', description: 'Source of input data', defaultValue: 'API', required: true },
      { name: 'target_format', description: 'Output format', defaultValue: 'JSON', required: false },
      { name: 'transformation_rules', description: 'Data transformation rules', defaultValue: 'standard', required: false },
      { name: 'error_strategy', description: 'How to handle errors', defaultValue: 'skip_and_log', required: false },
      { name: 'throughput_target', description: 'Target throughput', defaultValue: '1000', required: false },
      { name: 'latency_target', description: 'Target latency in ms', defaultValue: '100', required: false },
    ],
  },
  {
    name: 'Security Scanner',
    description: 'An agent that scans for security vulnerabilities and provides remediation advice.',
    category: 'safety',
    content: `You are a security scanning agent. Perform a {{scan_type}} security assessment.

Target: {{target_system}}
Scan scope: {{scan_scope}}

Security checks:
1. Input validation vulnerabilities
2. Authentication and authorization flaws
3. Injection attack vectors (SQL, XSS, Command)
4. Data exposure risks
5. Configuration weaknesses
6. Dependency vulnerabilities

Severity classification:
- Critical: Immediate exploitation risk
- High: Significant security impact
- Medium: Moderate risk, should be addressed
- Low: Minor issues, best practice improvements

For each finding, provide:
- Vulnerability description
- CVSS score estimate
- Proof of concept
- Remediation steps
- References to security standards (OWASP, CWE)

Report format: {{report_format}}`,
    tags: ['security', 'scanning', 'vulnerability', 'assessment'],
    variables: [
      { name: 'scan_type', description: 'Type of security scan', defaultValue: 'comprehensive', required: true },
      { name: 'target_system', description: 'System being scanned', defaultValue: 'web application', required: true },
      { name: 'scan_scope', description: 'Scope of the scan', defaultValue: 'full', required: false },
      { name: 'report_format', description: 'Output format for the report', defaultValue: 'detailed', required: false },
    ],
  },
  {
    name: 'Documentation Writer',
    description: 'An agent that creates clear, comprehensive technical documentation.',
    category: 'formatting',
    content: `You are a technical documentation writer. Create {{doc_type}} documentation for {{subject}}.

Documentation standards:
- Audience: {{target_audience}}
- Style: {{doc_style}}
- Language: {{doc_language}}

Documentation structure:
1. Overview and purpose
2. Prerequisites and setup
3. Core concepts
4. Step-by-step instructions
5. API reference (if applicable)
6. Examples and use cases
7. Troubleshooting guide
8. Changelog

Writing guidelines:
- Use clear, concise language
- Include code examples where relevant
- Add diagrams for complex workflows
- Use consistent terminology
- Cross-reference related sections
- Keep paragraphs under 4 sentences

Format output in {{output_format}}.`,
    tags: ['documentation', 'writing', 'technical'],
    variables: [
      { name: 'doc_type', description: 'Type of documentation', defaultValue: 'API', required: true },
      { name: 'subject', description: 'What to document', defaultValue: '', required: true },
      { name: 'target_audience', description: 'Who will read this', defaultValue: 'developers', required: false },
      { name: 'doc_style', description: 'Writing style', defaultValue: 'technical', required: false },
      { name: 'doc_language', description: 'Language for docs', defaultValue: 'English', required: false },
      { name: 'output_format', description: 'Output format', defaultValue: 'Markdown', required: false },
    ],
  },
  {
    name: 'Constitutional AI',
    description: 'A system prompt that enforces ethical behavior and safety constraints on agent actions.',
    category: 'constraint',
    content: `You operate under the following constitutional principles:

PRINCIPLE 1 - Do No Harm
You must not generate content that could cause physical, psychological, or social harm. When in doubt, err on the side of caution.

PRINCIPLE 2 - Honesty and Transparency
You must not generate misleading or deceptive content. Clearly indicate uncertainty and limitations.

PRINCIPLE 3 - Privacy and Data Protection
You must not reveal, infer, or request sensitive personal information. Treat all user data with the highest confidentiality.

PRINCIPLE 4 - Fairness and Non-Discrimination
You must not generate content that discriminates based on race, gender, religion, sexual orientation, disability, or other protected characteristics.

PRINCIPLE 5 - Legal Compliance
You must not assist with illegal activities. When laws conflict across jurisdictions, apply the most protective standard.

PRINCIPLE 6 - {{custom_principle}}

ENFORCEMENT:
- Before each response, verify compliance with all principles
- If a request violates any principle, politely decline and explain why
- If a request is ambiguous, seek clarification
- Log all principle evaluations for audit purposes

Scope: {{application_scope}}
Strictness level: {{strictness_level}}`,
    tags: ['safety', 'ethics', 'constitutional', 'constraints'],
    variables: [
      { name: 'custom_principle', description: 'Additional principle to enforce', defaultValue: 'Respect intellectual property rights', required: false },
      { name: 'application_scope', description: 'Scope of application', defaultValue: 'all interactions', required: false },
      { name: 'strictness_level', description: 'How strictly to enforce', defaultValue: 'high', required: false },
    ],
  },
]

// ==================== HELPERS ====================

function getCategoryConfig(categoryId: string) {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
}

function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

function renderPreviewContent(content: string): string {
  return content.replace(/\{\{(\w+)\}\}/g, '⟨$1⟩')
}

// ==================== MAIN COMPONENT ====================

export function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [agents, setAgents] = useState<{ id: string; name: string; avatar: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Editor state
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null)
  const [editorName, setEditorName] = useState('')
  const [editorDescription, setEditorDescription] = useState('')
  const [editorCategory, setEditorCategory] = useState('system')
  const [editorContent, setEditorContent] = useState('')
  const [editorTags, setEditorTags] = useState<string[]>([])
  const [editorTagInput, setEditorTagInput] = useState('')
  const [editorAgentId, setEditorAgentId] = useState<string | null>(null)
  const [editorVariables, setEditorVariables] = useState<PromptVariable[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Variables tab state
  const [selectedPromptForVars, setSelectedPromptForVars] = useState<PromptTemplate | null>(null)

  // Preview dialog
  const [previewPrompt, setPreviewPrompt] = useState<PromptTemplate | null>(null)

  const fetchPrompts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/prompts?${params.toString()}`)
      const data = await res.json()
      setPrompts(data)
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, categoryFilter])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data.map((a: { id: string; name: string; avatar: string | null }) => ({ id: a.id, name: a.name, avatar: a.avatar })))
    } catch {
      // Error handled silently
    }
  }, [])

  useEffect(() => {
    fetchPrompts()
    fetchAgents()
    const interval = setInterval(fetchPrompts, 15000)
    return () => clearInterval(interval)
  }, [fetchPrompts, fetchAgents])

  // Auto-detect variables from content
  const detectedVars = useMemo(() => extractVariables(editorContent), [editorContent])

  const filteredPrompts = useMemo(() => {
    let result = prompts
    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      )
    }
    return result
  }, [prompts, categoryFilter, searchQuery])

  // ==================== EDITOR ACTIONS ====================

  const resetEditor = () => {
    setEditingPrompt(null)
    setEditorName('')
    setEditorDescription('')
    setEditorCategory('system')
    setEditorContent('')
    setEditorTags([])
    setEditorTagInput('')
    setEditorAgentId(null)
    setEditorVariables([])
    setShowPreview(false)
  }

  const openEditorForNew = () => {
    resetEditor()
    setActiveTab('editor')
  }

  const openEditorForEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt)
    setEditorName(prompt.name)
    setEditorDescription(prompt.description || '')
    setEditorCategory(prompt.category)
    setEditorContent(prompt.content)
    setEditorTags(parseJsonSafe<string[]>(prompt.tags, []))
    setEditorAgentId(prompt.agentId)
    setEditorVariables(parseJsonSafe<PromptVariable[]>(prompt.variables, []))
    setEditorTagInput('')
    setShowPreview(false)
    setActiveTab('editor')
  }

  const handleSave = async () => {
    if (!editorName.trim() || !editorContent.trim()) return
    setIsSaving(true)
    try {
      // Sync variables: add detected vars not in list, remove ones not in content
      const syncedVars = detectedVars.map(varName => {
        const existing = editorVariables.find(v => v.name === varName)
        return existing || { name: varName, description: '', defaultValue: '', required: false }
      })

      const payload = {
        name: editorName,
        description: editorDescription || null,
        category: editorCategory,
        content: editorContent,
        variables: syncedVars,
        tags: editorTags,
        agentId: editorAgentId,
      }

      if (editingPrompt) {
        await fetch(`/api/prompts/${editingPrompt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      resetEditor()
      fetchPrompts()
      setActiveTab('library')
    } catch {
      // Error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleUsePrompt = async (prompt: PromptTemplate) => {
    try {
      await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCount: prompt.useCount + 1 }),
      })
      fetchPrompts()
    } catch {
      // Error handled silently
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/prompts/${id}`, { method: 'DELETE' })
      fetchPrompts()
      if (previewPrompt?.id === id) setPreviewPrompt(null)
    } catch {
      // Error handled silently
    }
  }

  const handleCopyPrompt = async (prompt: PromptTemplate) => {
    try {
      const vars = parseJsonSafe<PromptVariable[]>(prompt.variables, [])
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${prompt.name} (Copy)`,
          description: prompt.description,
          category: prompt.category,
          content: prompt.content,
          variables: vars,
          tags: parseJsonSafe<string[]>(prompt.tags, []),
          agentId: prompt.agentId,
        }),
      })
      fetchPrompts()
    } catch {
      // Error handled silently
    }
  }

  const handleUseBuiltInTemplate = async (template: BuiltInTemplate) => {
    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          category: template.category,
          content: template.content,
          variables: template.variables,
          tags: template.tags,
          isBuiltIn: true,
        }),
      })
      fetchPrompts()
      setActiveTab('library')
    } catch {
      // Error handled silently
    }
  }

  const handleCustomizeBuiltIn = (template: BuiltInTemplate) => {
    resetEditor()
    setEditorName(template.name)
    setEditorDescription(template.description)
    setEditorCategory(template.category)
    setEditorContent(template.content)
    setEditorTags(template.tags)
    setEditorVariables(template.variables)
    setActiveTab('editor')
  }

  const handleAddTag = () => {
    const tag = editorTagInput.trim()
    if (tag && !editorTags.includes(tag)) {
      setEditorTags([...editorTags, tag])
      setEditorTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setEditorTags(editorTags.filter(t => t !== tag))
  }

  const handleSyncVariables = () => {
    const synced = detectedVars.map(varName => {
      const existing = editorVariables.find(v => v.name === varName)
      return existing || { name: varName, description: '', defaultValue: '', required: false }
    })
    setEditorVariables(synced)
  }

  // ==================== COMPUTED STATS ====================

  const stats = useMemo(() => {
    const categoryCount: Record<string, number> = {}
    CATEGORIES.forEach(c => { categoryCount[c.id] = 0 })
    prompts.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
    })
    return {
      total: prompts.length,
      builtIn: prompts.filter(p => p.isBuiltIn).length,
      totalUses: prompts.reduce((acc, p) => acc + p.useCount, 0),
      categoryCount,
    }
  }, [prompts])

  // ==================== RENDER: LIBRARY TAB ====================

  const renderLibraryTab = () => (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Prompts', value: stats.total, icon: FileText, color: '#10b981' },
          { label: 'Built-in', value: stats.builtIn, icon: Sparkles, color: '#f59e0b' },
          { label: 'Total Uses', value: stats.totalUses, icon: Users, color: '#8b5cf6' },
          { label: 'Categories', value: Object.values(stats.categoryCount).filter(v => v > 0).length, icon: Layers, color: '#06b6d4' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[#9ca3af]">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#252636] border border-[#2d2e3d] rounded-lg text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? `${cat.bg} border ${cat.border} ${cat.text}`
                  : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
              <div className="h-4 w-24 bg-[#252636] rounded mb-3" />
              <div className="h-3 w-full bg-[#252636] rounded mb-2" />
              <div className="h-3 w-32 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <BookOpen className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No prompts found</p>
          <p className="text-xs text-[#6b7280] mt-1">Create your first prompt or use a built-in template</p>
          <Button size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openEditorForNew}>
            <Plus className="w-4 h-4 mr-1" /> Create Prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredPrompts.map(prompt => {
            const cc = getCategoryConfig(prompt.category)
            const CategoryIcon = cc.icon
            const tags = parseJsonSafe<string[]>(prompt.tags, [])
            const vars = parseJsonSafe<PromptVariable[]>(prompt.variables, [])
            const agentName = prompt.agentId ? agents.find(a => a.id === prompt.agentId)?.name : null

            return (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 hover:border-[#3d3e4d] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cc.color}15` }}>
                      <CategoryIcon className="w-4 h-4" style={{ color: cc.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white line-clamp-1">{prompt.name}</h3>
                      {prompt.isBuiltIn && (
                        <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Built-in
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewPrompt(prompt)}
                    className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-[#9ca3af] line-clamp-2 mb-3">{prompt.description || 'No description'}</p>

                <div className="flex items-center flex-wrap gap-1.5 mb-3">
                  <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${cc.bg} ${cc.border} border ${cc.text}`}>
                    {cc.label}
                  </span>
                  {vars.length > 0 && (
                    <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                      <Variable className="w-3 h-3" /> {vars.length} vars
                    </span>
                  )}
                  {agentName && (
                    <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {agentName}
                    </span>
                  )}
                  <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                    <Hash className="w-3 h-3" /> {prompt.useCount}
                  </span>
                </div>

                {tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1 mb-3">
                    {tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d]">
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[9px] text-[#6b7280]">+{tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleUsePrompt(prompt)}
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    Use
                  </Button>
                  <button
                    onClick={() => openEditorForEdit(prompt)}
                    className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCopyPrompt(prompt)}
                    className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {!prompt.isBuiltIn && (
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ==================== RENDER: EDITOR TAB ====================

  const renderEditorTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {editingPrompt ? `Edit: ${editingPrompt.name}` : 'Create New Prompt'}
        </h3>
        <div className="flex items-center gap-2">
          {editingPrompt && (
            <Button variant="ghost" size="sm" onClick={resetEditor} className="text-[#9ca3af] hover:text-white text-xs h-8">
              <RotateCcw className="w-3 h-3 mr-1" /> New
            </Button>
          )}
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8" onClick={handleSave} disabled={isSaving || !editorName.trim() || !editorContent.trim()}>
            <Save className="w-3 h-3 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor Panel */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label className="text-[#9ca3af] text-xs">Name</Label>
            <Input
              value={editorName}
              onChange={e => setEditorName(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="Prompt name..."
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-[#9ca3af] text-xs">Description</Label>
            <Input
              value={editorDescription}
              onChange={e => setEditorDescription(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="What does this prompt do..."
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-[#9ca3af] text-xs">Category</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setEditorCategory(cat.id)}
                  className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg border text-xs transition-colors ${
                    editorCategory === cat.id
                      ? `${cat.bg} ${cat.border} ${cat.text}`
                      : 'bg-[#252636] border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Agent */}
          <div>
            <Label className="text-[#9ca3af] text-xs">Target Agent</Label>
            <select
              value={editorAgentId || ''}
              onChange={e => setEditorAgentId(e.target.value || null)}
              className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-xs text-white outline-none focus:border-emerald-500/50"
            >
              <option value="">Shared (All Agents)</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.avatar || '🤖'} {a.name}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[#9ca3af] text-xs">Prompt Content</Label>
              <span className="text-[9px] text-[#6b7280]">Use {'{{variable}}'} syntax</span>
            </div>
            <div className="relative">
              <textarea
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
                rows={14}
                className="w-full px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-xs text-white outline-none resize-none font-mono focus:border-emerald-500/50 custom-scrollbar"
                placeholder="Enter your prompt content here. Use {{variable_name}} for dynamic variables..."
              />
            </div>
            {detectedVars.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#6b7280]">Detected:</span>
                {detectedVars.map(v => (
                  <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                    {`{{${v}}}`}
                  </span>
                ))}
                <button
                  onClick={handleSyncVariables}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white transition-colors"
                >
                  Sync Variables
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="text-[#9ca3af] text-xs">Tags</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                value={editorTagInput}
                onChange={e => setEditorTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                className="bg-[#252636] border-[#2d2e3d] text-white flex-1"
                placeholder="Add tag..."
              />
              <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 h-9" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {editorTags.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5 mt-2">
                {editorTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#252636] border border-[#2d2e3d] text-[#9ca3af]">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[#9ca3af] text-xs">Live Preview</Label>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6b7280] hover:text-white text-[10px] h-7"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Raw' : 'Preview'}
            </Button>
          </div>

          <div className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
            {editorName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cc = getCategoryConfig(editorCategory)
                    const Icon = cc.icon
                    return (
                      <>
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${cc.color}15` }}>
                          <Icon className="w-3 h-3" style={{ color: cc.color }} />
                        </div>
                        <span className="text-xs font-semibold text-white">{editorName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cc.bg} ${cc.border} border ${cc.text}`}>
                          {cc.label}
                        </span>
                      </>
                    )
                  })()}
                </div>
                {editorDescription && (
                  <p className="text-[11px] text-[#9ca3af]">{editorDescription}</p>
                )}
                <div className="rounded-lg bg-[#252636] border border-[#2d2e3d] p-3">
                  <pre className="text-[11px] text-[#9ca3af] whitespace-pre-wrap font-mono leading-relaxed">
                    {showPreview ? renderPreviewContent(editorContent) : editorContent}
                  </pre>
                </div>
                {editorTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3 h-3 text-[#6b7280]" />
                    {editorTags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {editorVariables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Variables</p>
                    {editorVariables.map(v => (
                      <div key={v.name} className="flex items-center gap-2 text-[10px]">
                        <code className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                          {`{{${v.name}}}`}
                        </code>
                        <span className="text-[#9ca3af]">{v.description || 'No description'}</span>
                        {v.required && <span className="text-red-400">*required</span>}
                        {v.defaultValue && <span className="text-[#6b7280]">[{v.defaultValue}]</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
                <p className="text-xs text-[#6b7280]">Start typing to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // ==================== RENDER: VARIABLES TAB ====================

  const renderVariablesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Variable Manager</h3>
      </div>

      {/* Select a prompt to manage its variables */}
      <div>
        <Label className="text-[#9ca3af] text-xs">Select Prompt</Label>
        <select
          value={selectedPromptForVars?.id || ''}
          onChange={e => {
            const prompt = prompts.find(p => p.id === e.target.value) || null
            setSelectedPromptForVars(prompt)
          }}
          className="w-full mt-1.5 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-xs text-white outline-none focus:border-emerald-500/50"
        >
          <option value="">-- Select a prompt --</option>
          {prompts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedPromptForVars ? (
        <div className="space-y-4">
          {/* Detected variables */}
          {(() => {
            const detectedContentVars = extractVariables(selectedPromptForVars.content)
            const existingVars = parseJsonSafe<PromptVariable[]>(selectedPromptForVars.variables, [])
            return (
              <>
                {detectedContentVars.length > 0 && (
                  <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-3">
                      Variables detected in content ({detectedContentVars.length})
                    </p>
                    <div className="flex items-center flex-wrap gap-1.5">
                      {detectedContentVars.map(v => (
                        <span
                          key={v}
                          className={`text-[10px] px-2 py-1 rounded font-mono ${
                            existingVars.find(ev => ev.name === v)
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          }`}
                        >
                          {`{{${v}}}`}
                          {!existingVars.find(ev => ev.name === v) && ' (new)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variable Table */}
                <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2d2e3d]">
                          <th className="text-left text-[10px] font-medium text-[#6b7280] uppercase tracking-wider px-4 py-3">Variable</th>
                          <th className="text-left text-[10px] font-medium text-[#6b7280] uppercase tracking-wider px-4 py-3">Description</th>
                          <th className="text-left text-[10px] font-medium text-[#6b7280] uppercase tracking-wider px-4 py-3">Default</th>
                          <th className="text-center text-[10px] font-medium text-[#6b7280] uppercase tracking-wider px-4 py-3">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectedContentVars.map(varName => {
                          const existing = existingVars.find(ev => ev.name === varName)
                          return (
                            <tr key={varName} className="border-b border-[#2d2e3d] last:border-0 hover:bg-[#252636]/50">
                              <td className="px-4 py-3">
                                <code className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                                  {`{{${varName}}}`}
                                </code>
                              </td>
                              <td className="px-4 py-3 text-[11px] text-[#9ca3af]">
                                {existing?.description || <span className="text-[#6b7280] italic">No description</span>}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-[#9ca3af] font-mono">
                                {existing?.defaultValue || <span className="text-[#6b7280]">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {existing?.required ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">Required</span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#252636] border border-[#2d2e3d] text-[#6b7280]">Optional</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        {detectedContentVars.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-[11px] text-[#6b7280]">
                              No variables detected. Use {'{{variable_name}}'} syntax in prompt content.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit Variables Button */}
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  onClick={() => openEditorForEdit(selectedPromptForVars)}
                >
                  <Edit3 className="w-3 h-3 mr-1" /> Edit Variables in Editor
                </Button>
              </>
            )
          })()}
        </div>
      ) : (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 text-center">
          <Variable className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">Select a prompt to manage its variables</p>
          <p className="text-xs text-[#6b7280] mt-1">Variables are defined using {'{{variable_name}}'} syntax</p>
        </div>
      )}

      {/* All Variables Summary */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
        <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-3">Variable Usage Across All Prompts</p>
        {(() => {
          const allVars: Record<string, { count: number; prompts: string[] }> = {}
          prompts.forEach(p => {
            const vars = extractVariables(p.content)
            vars.forEach(v => {
              if (!allVars[v]) allVars[v] = { count: 0, prompts: [] }
              allVars[v].count++
              allVars[v].prompts.push(p.name)
            })
          })
          const sortedVars = Object.entries(allVars).sort((a, b) => b[1].count - a[1].count)
          if (sortedVars.length === 0) {
            return <p className="text-[11px] text-[#6b7280]">No variables found in any prompt</p>
          }
          return (
            <div className="flex items-center flex-wrap gap-2">
              {sortedVars.map(([varName, info]) => (
                <div
                  key={varName}
                  className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded-lg bg-[#252636] border border-[#2d2e3d]"
                  title={`Used in: ${info.prompts.join(', ')}`}
                >
                  <code className="font-mono text-emerald-400">{`{{${varName}}}`}</code>
                  <span className="text-[#6b7280]">×{info.count}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )

  // ==================== RENDER: TEMPLATES TAB ====================

  const renderTemplatesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Built-in Templates</h3>
        <span className="text-[10px] text-[#6b7280]">{BUILT_IN_TEMPLATES.length} templates available</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {BUILT_IN_TEMPLATES.map((template, index) => {
          const cc = getCategoryConfig(template.category)
          const CategoryIcon = cc.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 hover:border-[#3d3e4d] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cc.color}15` }}>
                    <CategoryIcon className="w-4 h-4" style={{ color: cc.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${cc.bg} ${cc.border} border ${cc.text}`}>
                      {cc.label}
                    </span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>

              <p className="text-[11px] text-[#9ca3af] line-clamp-2 mb-3">{template.description}</p>

              {/* Variable count */}
              <div className="flex items-center gap-3 mb-3">
                {template.variables.length > 0 && (
                  <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                    <Variable className="w-3 h-3" /> {template.variables.length} variables
                  </span>
                )}
                <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                  <Code className="w-3 h-3" /> {template.content.split('\n').length} lines
                </span>
              </div>

              {/* Tags */}
              <div className="flex items-center flex-wrap gap-1 mb-3">
                {template.tags.map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  onClick={() => handleUseBuiltInTemplate(template)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Use
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[#9ca3af] hover:text-white text-xs h-8"
                  onClick={() => handleCustomizeBuiltIn(template)}
                >
                  <Edit3 className="w-3 h-3 mr-1" /> Customize
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  // ==================== RENDER: PREVIEW DIALOG ====================

  const renderPreviewDialog = () => {
    if (!previewPrompt) return null
    const cc = getCategoryConfig(previewPrompt.category)
    const CategoryIcon = cc.icon
    const tags = parseJsonSafe<string[]>(previewPrompt.tags, [])
    const vars = parseJsonSafe<PromptVariable[]>(previewPrompt.variables, [])
    const agentName = previewPrompt.agentId ? agents.find(a => a.id === previewPrompt.agentId)?.name : null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewPrompt(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl max-h-[80vh] bg-[#1e1f2b] border border-[#2d2e3d] rounded-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e3d] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cc.color}15` }}>
                <CategoryIcon className="w-4 h-4" style={{ color: cc.color }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">{previewPrompt.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cc.bg} ${cc.border} border ${cc.text}`}>{cc.label}</span>
                  {previewPrompt.isBuiltIn && (
                    <span className="text-[9px] text-amber-400 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> Built-in</span>
                  )}
                  <span className="text-[9px] text-[#6b7280]">v{previewPrompt.version}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setPreviewPrompt(null)} className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {previewPrompt.description && (
              <p className="text-sm text-[#9ca3af]">{previewPrompt.description}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {agentName && (
                <span className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                  <Users className="w-3 h-3" /> Agent: {agentName}
                </span>
              )}
              <span className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                <Hash className="w-3 h-3" /> {previewPrompt.useCount} uses
              </span>
            </div>

            {/* Prompt Content */}
            <div>
              <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Prompt Content</p>
              <div className="rounded-lg bg-[#252636] border border-[#2d2e3d] p-4 max-h-60 overflow-y-auto custom-scrollbar">
                <pre className="text-[11px] text-[#9ca3af] whitespace-pre-wrap font-mono leading-relaxed">
                  {previewPrompt.content}
                </pre>
              </div>
            </div>

            {/* Variables */}
            {vars.length > 0 && (
              <div>
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Variables ({vars.length})</p>
                <div className="space-y-2">
                  {vars.map(v => (
                    <div key={v.name} className="flex items-center gap-3 text-[11px] p-2 rounded-lg bg-[#252636] border border-[#2d2e3d]">
                      <code className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                        {`{{${v.name}}}`}
                      </code>
                      <span className="text-[#9ca3af] flex-1">{v.description || 'No description'}</span>
                      {v.defaultValue && <span className="text-[#6b7280] font-mono">[{v.defaultValue}]</span>}
                      {v.required && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">Required</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Tags</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#2d2e3d] flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#9ca3af] hover:text-white text-xs"
              onClick={() => { handleCopyPrompt(previewPrompt); setPreviewPrompt(null) }}
            >
              <Copy className="w-3 h-3 mr-1" /> Duplicate
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => { handleUsePrompt(previewPrompt); setPreviewPrompt(null) }}
            >
              <ChevronRight className="w-3 h-3 mr-1" /> Use Prompt
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[#9ca3af] hover:text-white text-xs"
              onClick={() => { openEditorForEdit(previewPrompt); setPreviewPrompt(null) }}
            >
              <Edit3 className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-white"
          >
            Prompt Library
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Manage, create, and organize system prompts with variables
          </p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 self-start" onClick={openEditorForNew}>
          <Plus className="w-4 h-4" />
          New Prompt
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'library' && renderLibraryTab()}
          {activeTab === 'editor' && renderEditorTab()}
          {activeTab === 'variables' && renderVariablesTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
        </motion.div>
      </AnimatePresence>

      {/* Preview Dialog */}
      <AnimatePresence>
        {previewPrompt && renderPreviewDialog()}
      </AnimatePresence>
    </div>
  )
}
