'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Workflow,
  Search,
  Filter,
  Plus,
  Star,
  Download,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Play,
  Settings,
  ArrowRight,
  GitBranch,
  Clock,
  Users,
  Zap,
  Shield,
  BarChart3,
  Database,
  Globe,
  Mail,
  X,
  ChevronRight,
  ChevronDown,
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  Webhook,
  Timer,
  Code,
  Send,
  LayoutTemplate,
  Package,
  Bot,
  Layers,
  Sparkles,
  FileCode,
  TestTube,
  Rocket,
  HeartPulse,
  Server,
  MessageSquare,
  Activity,
  HardDrive,
  RefreshCw,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

// ===================== TYPES =====================

type StepType = 'agent_call' | 'condition' | 'transform' | 'delay' | 'webhook'
type Category = 'Automation' | 'Data Pipeline' | 'Agent Chain' | 'Monitoring' | 'Deployment' | 'Custom'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type TriggerType = 'manual' | 'webhook' | 'cron' | 'event'
type TabType = 'browse' | 'my-templates' | 'builder'

interface TemplateStep {
  id: string
  name: string
  type: StepType
  config: Record<string, string>
  inputMapping: string
  outputMapping: string
}

interface TemplateVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'json'
  default: string
  required: boolean
  description: string
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  longDescription: string
  category: Category
  icon: React.ElementType
  author: string
  version: string
  difficulty: Difficulty
  requiredAgents: number
  estimatedSetupTime: string
  useCount: number
  rating: number
  tags: string[]
  steps: TemplateStep[]
  variables: TemplateVariable[]
  triggerType: TriggerType
  triggerConfig: Record<string, string>
  isBuiltIn: boolean
  isOwner?: boolean
  createdAt: string
}

// ===================== CONFIGS =====================

const categoryConfig: Record<Category, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Automation': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Zap },
  'Data Pipeline': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Database },
  'Agent Chain': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Bot },
  'Monitoring': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Activity },
  'Deployment': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Rocket },
  'Custom': { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: Sparkles },
}

const difficultyConfig: Record<Difficulty, { label: string; color: string; bg: string; dots: number }> = {
  beginner: { label: 'Beginner', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dots: 1 },
  intermediate: { label: 'Intermediate', color: 'text-amber-400', bg: 'bg-amber-500/10', dots: 2 },
  advanced: { label: 'Advanced', color: 'text-red-400', bg: 'bg-red-500/10', dots: 3 },
}

const stepTypeConfig: Record<StepType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  agent_call: { label: 'Agent Call', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: Bot },
  condition: { label: 'Condition', color: 'text-purple-400', bg: 'bg-purple-500/15', icon: GitBranch },
  transform: { label: 'Transform', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: Code },
  delay: { label: 'Delay', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Timer },
  webhook: { label: 'Webhook', color: 'text-pink-400', bg: 'bg-pink-500/15', icon: Webhook },
}

const triggerConfig: Record<TriggerType, { label: string; icon: string; color: string }> = {
  manual: { label: 'Manual', icon: '👆', color: 'text-[#9ca3af]' },
  webhook: { label: 'Webhook', icon: '🔗', color: 'text-pink-400' },
  cron: { label: 'Scheduled', icon: '⏰', color: 'text-amber-400' },
  event: { label: 'Event', icon: '📡', color: 'text-blue-400' },
}

// ===================== PRE-BUILT TEMPLATES =====================

const builtInTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-code-review',
    name: 'Code Review Pipeline',
    description: 'Automated code review with AI agent, test runner, and human approval gate.',
    longDescription: 'A comprehensive code review pipeline that leverages an AI agent to analyze code quality, run automated tests, and require human approval before merging. Configurable review criteria, test thresholds, and notification settings.',
    category: 'Automation',
    icon: FileCode,
    author: 'AgentOS Team',
    version: '2.1.0',
    difficulty: 'intermediate',
    requiredAgents: 3,
    estimatedSetupTime: '15 min',
    useCount: 2847,
    rating: 4.8,
    tags: ['code-review', 'testing', 'ci-cd', 'approval'],
    steps: [
      { id: 's1', name: 'Code Analysis', type: 'agent_call', config: { agent: 'code-reviewer', model: 'gpt-4' }, inputMapping: '$.pullRequest.diff', outputMapping: '$.review.comments' },
      { id: 's2', name: 'Run Tests', type: 'agent_call', config: { agent: 'test-runner', framework: 'jest' }, inputMapping: '$.review.comments', outputMapping: '$.testResults' },
      { id: 's3', name: 'Quality Gate', type: 'condition', config: { field: '$.testResults.passRate', operator: '>=', value: '80' }, inputMapping: '$.testResults', outputMapping: '$.gateResult' },
      { id: 's4', name: 'Human Approval', type: 'webhook', config: { url: '/api/approval/request', method: 'POST' }, inputMapping: '$.gateResult', outputMapping: '$.approval' },
      { id: 's5', name: 'Merge', type: 'transform', config: { action: 'merge', branch: 'main' }, inputMapping: '$.approval', outputMapping: '$.mergeResult' },
    ],
    variables: [
      { id: 'v1', name: 'repo_url', type: 'string', default: '', required: true, description: 'Repository URL' },
      { id: 'v2', name: 'min_pass_rate', type: 'number', default: '80', required: false, description: 'Minimum test pass rate' },
      { id: 'v3', name: 'auto_merge', type: 'boolean', default: 'false', required: false, description: 'Auto merge after approval' },
    ],
    triggerType: 'webhook',
    triggerConfig: { path: '/webhook/code-review', secret: '' },
    isBuiltIn: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'tpl-content-gen',
    name: 'Content Generation',
    description: 'Research agent feeds writer agent, then editor agent polishes the output.',
    longDescription: 'A multi-stage content generation pipeline that researches topics with a research agent, drafts content with a writer agent, and polishes with an editor agent. Supports various content types including blog posts, articles, and social media content.',
    category: 'Agent Chain',
    icon: Edit3,
    author: 'AgentOS Team',
    version: '1.8.0',
    difficulty: 'beginner',
    requiredAgents: 3,
    estimatedSetupTime: '10 min',
    useCount: 4231,
    rating: 4.9,
    tags: ['content', 'writing', 'research', 'editing'],
    steps: [
      { id: 's1', name: 'Research', type: 'agent_call', config: { agent: 'researcher', depth: 'deep' }, inputMapping: '$.topic', outputMapping: '$.researchData' },
      { id: 's2', name: 'Draft Content', type: 'agent_call', config: { agent: 'writer', style: 'professional' }, inputMapping: '$.researchData', outputMapping: '$.draft' },
      { id: 's3', name: 'Edit & Polish', type: 'agent_call', config: { agent: 'editor', checks: 'grammar,style,seo' }, inputMapping: '$.draft', outputMapping: '$.finalContent' },
    ],
    variables: [
      { id: 'v1', name: 'topic', type: 'string', default: '', required: true, description: 'Content topic' },
      { id: 'v2', name: 'content_type', type: 'string', default: 'blog_post', required: false, description: 'Type of content' },
      { id: 'v3', name: 'target_length', type: 'number', default: '1500', required: false, description: 'Target word count' },
    ],
    triggerType: 'manual',
    triggerConfig: {},
    isBuiltIn: true,
    createdAt: '2024-02-01',
  },
  {
    id: 'tpl-daily-report',
    name: 'Daily Report',
    description: 'Scheduled data collection, AI summary generation, and email delivery.',
    longDescription: 'Automates the daily reporting workflow by collecting data from configured sources at scheduled times, generating an AI-powered summary with key insights and trends, and delivering the report via email to specified recipients.',
    category: 'Automation',
    icon: Mail,
    author: 'AgentOS Team',
    version: '1.5.0',
    difficulty: 'beginner',
    requiredAgents: 2,
    estimatedSetupTime: '8 min',
    useCount: 3156,
    rating: 4.6,
    tags: ['reports', 'email', 'scheduled', 'analytics'],
    steps: [
      { id: 's1', name: 'Collect Data', type: 'agent_call', config: { agent: 'data-collector', sources: 'api,database,logs' }, inputMapping: '$.config.sources', outputMapping: '$.rawData' },
      { id: 's2', name: 'Generate Summary', type: 'agent_call', config: { agent: 'summarizer', format: 'markdown' }, inputMapping: '$.rawData', outputMapping: '$.summary' },
      { id: 's3', name: 'Send Email', type: 'webhook', config: { service: 'smtp', template: 'daily-report' }, inputMapping: '$.summary', outputMapping: '$.deliveryStatus' },
    ],
    variables: [
      { id: 'v1', name: 'email_to', type: 'string', default: '', required: true, description: 'Recipient email' },
      { id: 'v2', name: 'schedule', type: 'string', default: '0 9 * * *', required: true, description: 'Cron schedule' },
      { id: 'v3', name: 'data_sources', type: 'json', default: '[]', required: false, description: 'Data source configs' },
    ],
    triggerType: 'cron',
    triggerConfig: { schedule: '0 9 * * *', timezone: 'UTC' },
    isBuiltIn: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'tpl-deploy-gate',
    name: 'Deployment Gate',
    description: 'Test → Security scan → Staging → Production with approval gates.',
    longDescription: 'A robust deployment pipeline that ensures code quality through automated testing, security scanning, staged deployment to a staging environment for validation, and controlled production deployment with approval gates at each critical stage.',
    category: 'Deployment',
    icon: Rocket,
    author: 'AgentOS Team',
    version: '3.0.0',
    difficulty: 'advanced',
    requiredAgents: 4,
    estimatedSetupTime: '25 min',
    useCount: 1892,
    rating: 4.7,
    tags: ['deployment', 'security', 'staging', 'production'],
    steps: [
      { id: 's1', name: 'Run Tests', type: 'agent_call', config: { agent: 'test-runner', coverage: '80%' }, inputMapping: '$.build.artifacts', outputMapping: '$.testResults' },
      { id: 's2', name: 'Security Scan', type: 'agent_call', config: { agent: 'security-scanner', type: 'sast+dast' }, inputMapping: '$.build.artifacts', outputMapping: '$.securityReport' },
      { id: 's3', name: 'Deploy Staging', type: 'transform', config: { action: 'deploy', target: 'staging' }, inputMapping: '$.testResults', outputMapping: '$.stagingResult' },
      { id: 's4', name: 'Approval Gate', type: 'condition', config: { field: '$.stagingResult.healthy', operator: '==', value: 'true' }, inputMapping: '$.stagingResult', outputMapping: '$.approved' },
      { id: 's5', name: 'Deploy Production', type: 'transform', config: { action: 'deploy', target: 'production', strategy: 'blue-green' }, inputMapping: '$.approved', outputMapping: '$.productionResult' },
    ],
    variables: [
      { id: 'v1', name: 'app_name', type: 'string', default: '', required: true, description: 'Application name' },
      { id: 'v2', name: 'min_coverage', type: 'number', default: '80', required: false, description: 'Min test coverage %' },
      { id: 'v3', name: 'deploy_strategy', type: 'string', default: 'blue-green', required: false, description: 'Deployment strategy' },
    ],
    triggerType: 'webhook',
    triggerConfig: { path: '/webhook/deploy', secret: '' },
    isBuiltIn: true,
    createdAt: '2024-02-10',
  },
  {
    id: 'tpl-incident-response',
    name: 'Incident Response',
    description: 'Detect → Triage → Assign → Resolve → Post-mortem workflow.',
    longDescription: 'An incident response automation that detects anomalies, triages severity, assigns to on-call personnel, tracks resolution, and generates post-mortem reports. Integrates with alerting systems and on-call schedules.',
    category: 'Monitoring',
    icon: Shield,
    author: 'AgentOS Team',
    version: '2.3.0',
    difficulty: 'advanced',
    requiredAgents: 4,
    estimatedSetupTime: '20 min',
    useCount: 1567,
    rating: 4.5,
    tags: ['incident', 'oncall', 'alerting', 'postmortem'],
    steps: [
      { id: 's1', name: 'Detect Incident', type: 'webhook', config: { path: '/webhook/alert', method: 'POST' }, inputMapping: '$.alert', outputMapping: '$.incident' },
      { id: 's2', name: 'Triage', type: 'agent_call', config: { agent: 'triage-agent', model: 'gpt-4' }, inputMapping: '$.incident', outputMapping: '$.triageResult' },
      { id: 's3', name: 'Assign Responder', type: 'transform', config: { action: 'lookup-oncall' }, inputMapping: '$.triageResult', outputMapping: '$.assignment' },
      { id: 's4', name: 'Track Resolution', type: 'condition', config: { field: '$.assignment.resolved', operator: '==', value: 'true' }, inputMapping: '$.assignment', outputMapping: '$.resolution' },
      { id: 's5', name: 'Post-mortem', type: 'agent_call', config: { agent: 'writer', template: 'postmortem' }, inputMapping: '$.resolution', outputMapping: '$.postmortem' },
    ],
    variables: [
      { id: 'v1', name: 'alert_source', type: 'string', default: 'datadog', required: true, description: 'Alert source' },
      { id: 'v2', name: 'oncall_schedule', type: 'string', default: '', required: true, description: 'Oncall schedule ID' },
      { id: 'v3', name: 'auto_acknowledge', type: 'boolean', default: 'true', required: false, description: 'Auto-acknowledge alerts' },
    ],
    triggerType: 'event',
    triggerConfig: { event_type: 'alert', source: 'monitoring' },
    isBuiltIn: true,
    createdAt: '2024-03-01',
  },
  {
    id: 'tpl-data-etl',
    name: 'Data ETL',
    description: 'Extract → Transform → Validate → Load pipeline for data processing.',
    longDescription: 'A complete Extract, Transform, Load pipeline that pulls data from multiple sources, applies configurable transformations, validates data quality and schema compliance, then loads into the target data store with error handling and retry logic.',
    category: 'Data Pipeline',
    icon: Database,
    author: 'AgentOS Team',
    version: '2.0.0',
    difficulty: 'intermediate',
    requiredAgents: 2,
    estimatedSetupTime: '15 min',
    useCount: 2340,
    rating: 4.4,
    tags: ['etl', 'data', 'transform', 'validation'],
    steps: [
      { id: 's1', name: 'Extract', type: 'agent_call', config: { agent: 'data-extractor', format: 'json' }, inputMapping: '$.source.config', outputMapping: '$.rawData' },
      { id: 's2', name: 'Transform', type: 'transform', config: { mappings: 'field_map.json', functions: 'clean,normalize' }, inputMapping: '$.rawData', outputMapping: '$.transformedData' },
      { id: 's3', name: 'Validate', type: 'condition', config: { schema: 'output_schema.json', max_errors: '10' }, inputMapping: '$.transformedData', outputMapping: '$.validationResult' },
      { id: 's4', name: 'Load', type: 'agent_call', config: { agent: 'data-loader', target: 'postgresql' }, inputMapping: '$.transformedData', outputMapping: '$.loadResult' },
    ],
    variables: [
      { id: 'v1', name: 'source_type', type: 'string', default: 'api', required: true, description: 'Data source type' },
      { id: 'v2', name: 'target_db', type: 'string', default: '', required: true, description: 'Target database URL' },
      { id: 'v3', name: 'batch_size', type: 'number', default: '1000', required: false, description: 'Batch size for loading' },
    ],
    triggerType: 'cron',
    triggerConfig: { schedule: '0 2 * * *', timezone: 'UTC' },
    isBuiltIn: true,
    createdAt: '2024-02-15',
  },
  {
    id: 'tpl-customer-support',
    name: 'Customer Support',
    description: 'Classify → Route → Respond → Escalate support workflow.',
    longDescription: 'An intelligent customer support automation that classifies incoming tickets by category and urgency, routes to the appropriate team or agent, generates AI-powered responses, and handles escalation for complex issues.',
    category: 'Automation',
    icon: MessageSquare,
    author: 'AgentOS Team',
    version: '1.9.0',
    difficulty: 'intermediate',
    requiredAgents: 3,
    estimatedSetupTime: '12 min',
    useCount: 3789,
    rating: 4.7,
    tags: ['support', 'routing', 'escalation', 'tickets'],
    steps: [
      { id: 's1', name: 'Classify Ticket', type: 'agent_call', config: { agent: 'classifier', categories: 'billing,technical,general' }, inputMapping: '$.ticket', outputMapping: '$.classification' },
      { id: 's2', name: 'Route', type: 'transform', config: { action: 'route', rules: 'routing_rules.json' }, inputMapping: '$.classification', outputMapping: '$.routeResult' },
      { id: 's3', name: 'Generate Response', type: 'agent_call', config: { agent: 'support-agent', tone: 'professional' }, inputMapping: '$.ticket', outputMapping: '$.response' },
      { id: 's4', name: 'Escalation Check', type: 'condition', config: { field: '$.classification.urgency', operator: '>=', value: 'high' }, inputMapping: '$.response', outputMapping: '$.escalationResult' },
    ],
    variables: [
      { id: 'v1', name: 'ticket_source', type: 'string', default: 'email', required: true, description: 'Ticket source channel' },
      { id: 'v2', name: 'auto_respond', type: 'boolean', default: 'true', required: false, description: 'Auto-respond to simple tickets' },
      { id: 'v3', name: 'escalation_threshold', type: 'number', default: '3', required: false, description: 'Min urgency to escalate' },
    ],
    triggerType: 'event',
    triggerConfig: { event_type: 'ticket_created', source: 'helpdesk' },
    isBuiltIn: true,
    createdAt: '2024-01-25',
  },
  {
    id: 'tpl-monitoring-alert',
    name: 'Monitoring Alert',
    description: 'Watch metric → Threshold check → Alert → Auto-remediate.',
    longDescription: 'A monitoring automation that continuously watches configured metrics, checks against defined thresholds, sends alerts through multiple channels when breached, and optionally triggers auto-remediation actions to resolve common issues.',
    category: 'Monitoring',
    icon: HeartPulse,
    author: 'AgentOS Team',
    version: '1.6.0',
    difficulty: 'intermediate',
    requiredAgents: 2,
    estimatedSetupTime: '10 min',
    useCount: 2103,
    rating: 4.3,
    tags: ['monitoring', 'alerts', 'remediation', 'metrics'],
    steps: [
      { id: 's1', name: 'Watch Metric', type: 'agent_call', config: { agent: 'metric-watcher', interval: '60s' }, inputMapping: '$.metricConfig', outputMapping: '$.metricValue' },
      { id: 's2', name: 'Threshold Check', type: 'condition', config: { field: '$.metricValue', operator: '>', value: 'threshold' }, inputMapping: '$.metricValue', outputMapping: '$.breachResult' },
      { id: 's3', name: 'Send Alert', type: 'webhook', config: { channels: 'slack,pagerduty,email' }, inputMapping: '$.breachResult', outputMapping: '$.alertResult' },
      { id: 's4', name: 'Auto-remediate', type: 'agent_call', config: { agent: 'remediator', actions: 'restart,scale' }, inputMapping: '$.breachResult', outputMapping: '$.remediationResult' },
    ],
    variables: [
      { id: 'v1', name: 'metric_name', type: 'string', default: 'cpu_usage', required: true, description: 'Metric to monitor' },
      { id: 'v2', name: 'threshold', type: 'number', default: '90', required: true, description: 'Alert threshold' },
      { id: 'v3', name: 'auto_remediate', type: 'boolean', default: 'false', required: false, description: 'Enable auto-remediation' },
    ],
    triggerType: 'cron',
    triggerConfig: { schedule: '*/1 * * * *', timezone: 'UTC' },
    isBuiltIn: true,
    createdAt: '2024-03-10',
  },
  {
    id: 'tpl-multi-model-research',
    name: 'Multi-Model Research',
    description: 'Query multiple AI models → Compare results → Consensus → Report.',
    longDescription: 'A research workflow that queries multiple AI models in parallel with the same prompt, compares and analyzes their responses to find consensus, highlights disagreements, and produces a comprehensive research report with confidence scores.',
    category: 'Agent Chain',
    icon: Layers,
    author: 'AgentOS Team',
    version: '1.3.0',
    difficulty: 'advanced',
    requiredAgents: 4,
    estimatedSetupTime: '18 min',
    useCount: 1245,
    rating: 4.6,
    tags: ['research', 'multi-model', 'consensus', 'analysis'],
    steps: [
      { id: 's1', name: 'Query Models', type: 'agent_call', config: { agent: 'model-router', models: 'gpt-4,claude,gemini' }, inputMapping: '$.query', outputMapping: '$.modelResponses' },
      { id: 's2', name: 'Compare Results', type: 'transform', config: { action: 'compare', dimensions: 'accuracy,completeness,consistency' }, inputMapping: '$.modelResponses', outputMapping: '$.comparison' },
      { id: 's3', name: 'Build Consensus', type: 'agent_call', config: { agent: 'consensus-builder', strategy: 'weighted' }, inputMapping: '$.comparison', outputMapping: '$.consensus' },
      { id: 's4', name: 'Generate Report', type: 'agent_call', config: { agent: 'report-writer', format: 'markdown' }, inputMapping: '$.consensus', outputMapping: '$.report' },
    ],
    variables: [
      { id: 'v1', name: 'models', type: 'json', default: '["gpt-4","claude","gemini"]', required: true, description: 'Models to query' },
      { id: 'v2', name: 'consensus_threshold', type: 'number', default: '0.7', required: false, description: 'Min agreement score' },
      { id: 'v3', name: 'report_format', type: 'string', default: 'markdown', required: false, description: 'Output format' },
    ],
    triggerType: 'manual',
    triggerConfig: {},
    isBuiltIn: true,
    createdAt: '2024-03-15',
  },
  {
    id: 'tpl-backup-sync',
    name: 'Backup & Sync',
    description: 'Schedule → Snapshot → Verify → Sync → Cleanup backup workflow.',
    longDescription: 'A comprehensive backup and synchronization workflow that schedules regular snapshots, verifies data integrity, synchronizes to remote storage, and cleans up old backups based on retention policies. Supports incremental and full backup modes.',
    category: 'Data Pipeline',
    icon: HardDrive,
    author: 'AgentOS Team',
    version: '1.7.0',
    difficulty: 'intermediate',
    requiredAgents: 2,
    estimatedSetupTime: '12 min',
    useCount: 1678,
    rating: 4.4,
    tags: ['backup', 'sync', 'verification', 'cleanup'],
    steps: [
      { id: 's1', name: 'Schedule Trigger', type: 'delay', config: { wait_for: 'scheduled_time' }, inputMapping: '$.schedule', outputMapping: '$.triggerTime' },
      { id: 's2', name: 'Create Snapshot', type: 'agent_call', config: { agent: 'backup-agent', type: 'incremental' }, inputMapping: '$.sourceConfig', outputMapping: '$.snapshot' },
      { id: 's3', name: 'Verify Integrity', type: 'condition', config: { check: 'checksum,size,structure' }, inputMapping: '$.snapshot', outputMapping: '$.verifyResult' },
      { id: 's4', name: 'Sync Remote', type: 'webhook', config: { target: 's3', compression: 'gzip' }, inputMapping: '$.snapshot', outputMapping: '$.syncResult' },
      { id: 's5', name: 'Cleanup Old', type: 'transform', config: { retention: '30d', strategy: 'keep-weekly-after-30d' }, inputMapping: '$.syncResult', outputMapping: '$.cleanupResult' },
    ],
    variables: [
      { id: 'v1', name: 'source_path', type: 'string', default: '', required: true, description: 'Path to backup' },
      { id: 'v2', name: 'remote_target', type: 'string', default: 's3://backups', required: true, description: 'Remote storage path' },
      { id: 'v3', name: 'retention_days', type: 'number', default: '30', required: false, description: 'Backup retention days' },
    ],
    triggerType: 'cron',
    triggerConfig: { schedule: '0 3 * * *', timezone: 'UTC' },
    isBuiltIn: true,
    createdAt: '2024-02-20',
  },
]

// ===================== HELPER FUNCTIONS =====================

function generateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : star - 0.5 <= rating
                ? 'text-amber-400 fill-amber-400/50'
                : 'text-[#4b5563]'
          }`}
        />
      ))}
      <span className="text-[10px] text-[#9ca3af] ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

function renderDifficultyDots(difficulty: Difficulty) {
  const cfg = difficultyConfig[difficulty]
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={`w-1.5 h-1.5 rounded-full ${
            dot <= cfg.dots ? cfg.color.replace('text-', 'bg-') : 'bg-[#2d2e3d]'
          }`}
        />
      ))}
      <span className={`text-[10px] ml-1 ${cfg.color}`}>{cfg.label}</span>
    </div>
  )
}

// ===================== STEP FLOW PREVIEW =====================

function StepFlowPreview({ steps, compact = false }: { steps: TemplateStep[]; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const stc = stepTypeConfig[step.type]
        const StepIcon = stc.icon
        return (
          <div key={step.id}>
            <div className={`flex items-center gap-2 ${compact ? 'py-0.5' : 'py-1'}`}>
              <div
                className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded flex items-center justify-center flex-shrink-0 ${stc.bg}`}
              >
                <StepIcon className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${stc.color}`} />
              </div>
              <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-white font-medium truncate`}>
                {step.name}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${stc.bg} ${stc.color} ml-auto`}>
                {stc.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="w-px h-3 bg-gradient-to-b from-emerald-500/40 to-emerald-500/10" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===================== BROWSE TAB =====================

function BrowseTab({
  templates,
  onSelectTemplate,
  onUseTemplate,
}: {
  templates: WorkflowTemplate[]
  onSelectTemplate: (t: WorkflowTemplate) => void
  onUseTemplate: (t: WorkflowTemplate) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'name'>('popular')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const categories: (Category | 'all')[] = ['all', 'Automation', 'Data Pipeline', 'Agent Chain', 'Monitoring', 'Deployment', 'Custom']

  const filteredTemplates = useMemo(() => {
    let result = templates.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === 'all' || t.difficulty === selectedDifficulty
      return matchesSearch && matchesCategory && matchesDifficulty
    })

    switch (sortBy) {
      case 'popular':
        result = result.sort((a, b) => b.useCount - a.useCount)
        break
      case 'rating':
        result = result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [templates, searchQuery, selectedCategory, selectedDifficulty, sortBy])

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, tags..."
            className="pl-10 bg-[#1a1b2e] border-[#2d2e3d] text-white placeholder:text-[#6b7280] h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category | 'all')}>
            <SelectTrigger className="w-[140px] bg-[#1a1b2e] border-[#2d2e3d] text-white text-xs h-9">
              <Filter className="w-3 h-3 mr-1 text-[#6b7280]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as Difficulty | 'all')}>
            <SelectTrigger className="w-[130px] bg-[#1a1b2e] border-[#2d2e3d] text-white text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[120px] bg-[#1a1b2e] border-[#2d2e3d] text-white text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const cfg = cat === 'all' ? null : categoryConfig[cat]
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
              }`}
            >
              {cat === 'all' ? (
                <Layers className="w-3.5 h-3.5" />
              ) : cfg ? (
                <cfg.icon className="w-3.5 h-3.5" />
              ) : null}
              {cat === 'all' ? 'All' : cat}
            </button>
          )
        })}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-8 sm:p-12 text-center">
          <Workflow className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No templates found</p>
          <p className="text-xs text-[#6b7280] mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTemplates.map((template, idx) => {
            const cc = categoryConfig[template.category]
            const TemplateIcon = template.icon
            const isHovered = hoveredId === template.id

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5 hover:border-emerald-500/30 transition-all duration-200 group"
              >
                {/* Hover Preview */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 bottom-full mb-2 mx-2 z-50 rounded-lg border border-[#2d2e3d] bg-[#0f1117] p-3 shadow-xl shadow-black/40"
                    >
                      <p className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-2">Step Flow Preview</p>
                      <StepFlowPreview steps={template.steps} compact />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cc.color === 'text-emerald-400' ? '#10b981' : cc.color === 'text-blue-400' ? '#3b82f6' : cc.color === 'text-purple-400' ? '#8b5cf6' : cc.color === 'text-amber-400' ? '#f59e0b' : cc.color === 'text-orange-400' ? '#f97316' : '#ec4899'}15` }}
                    >
                      <TemplateIcon
                        className="w-4.5 h-4.5"
                        style={{
                          color:
                            cc.color === 'text-emerald-400'
                              ? '#10b981'
                              : cc.color === 'text-blue-400'
                                ? '#3b82f6'
                                : cc.color === 'text-purple-400'
                                  ? '#8b5cf6'
                                  : cc.color === 'text-amber-400'
                                    ? '#f59e0b'
                                    : cc.color === 'text-orange-400'
                                      ? '#f97316'
                                      : '#ec4899',
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{template.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                        <span>v{template.version}</span>
                        <span>by {template.author}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors flex-shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#9ca3af] line-clamp-2 mb-3">{template.description}</p>

                {/* Category & Difficulty */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${cc.bg} ${cc.border} ${cc.color}`}
                  >
                    {template.category}
                  </span>
                  {renderDifficultyDots(template.difficulty)}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 mb-3 text-[10px] text-[#6b7280]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {template.requiredAgents} agents
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.estimatedSetupTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {template.useCount.toLocaleString()}
                  </span>
                </div>

                {/* Rating */}
                <div className="mb-3">{renderStars(template.rating)}</div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#6b7280]"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#6b7280]">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Action */}
                <Button
                  onClick={() => onUseTemplate(template)}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Use Template
                </Button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===================== MY TEMPLATES TAB =====================

function MyTemplatesTab({
  templates,
  onSelectTemplate,
  onUseTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}: {
  templates: WorkflowTemplate[]
  onSelectTemplate: (t: WorkflowTemplate) => void
  onUseTemplate: (t: WorkflowTemplate) => void
  onDeleteTemplate: (id: string) => void
  onDuplicateTemplate: (t: WorkflowTemplate) => void
}) {
  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-8 sm:p-12 text-center">
          <LayoutTemplate className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No custom templates yet</p>
          <p className="text-xs text-[#6b7280] mt-1">Create one in the Builder tab or duplicate a built-in template</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {templates.map((template, idx) => {
            const cc = categoryConfig[template.category]
            const TemplateIcon = template.icon
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5 hover:border-emerald-500/30 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cc.color === 'text-emerald-400' ? '#10b981' : cc.color === 'text-blue-400' ? '#3b82f6' : cc.color === 'text-purple-400' ? '#8b5cf6' : cc.color === 'text-amber-400' ? '#f59e0b' : cc.color === 'text-orange-400' ? '#f97316' : '#ec4899'}15` }}
                    >
                      <TemplateIcon
                        className="w-4.5 h-4.5"
                        style={{
                          color:
                            cc.color === 'text-emerald-400'
                              ? '#10b981'
                              : cc.color === 'text-blue-400'
                                ? '#3b82f6'
                                : cc.color === 'text-purple-400'
                                  ? '#8b5cf6'
                                  : cc.color === 'text-amber-400'
                                    ? '#f59e0b'
                                    : cc.color === 'text-orange-400'
                                      ? '#f97316'
                                      : '#ec4899',
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{template.name}</h3>
                      <span className="text-[10px] text-[#6b7280]">v{template.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onDuplicateTemplate(template)}
                      className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(template.id)}
                      className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#9ca3af] line-clamp-2 mb-3">{template.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${cc.bg} ${cc.border} ${cc.color}`}
                  >
                    {template.category}
                  </span>
                  {renderDifficultyDots(template.difficulty)}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-[#6b7280] mb-4">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {template.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {template.requiredAgents} agents
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onUseTemplate(template)}
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Use
                  </Button>
                  <Button
                    onClick={() => onSelectTemplate(template)}
                    size="sm"
                    variant="outline"
                    className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#252636] text-xs h-8"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===================== BUILDER TAB =====================

function BuilderTab({
  editingTemplate,
  onSave,
  onCancel,
}: {
  editingTemplate: WorkflowTemplate | null
  onSave: (template: WorkflowTemplate) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(editingTemplate?.name || '')
  const [description, setDescription] = useState(editingTemplate?.description || '')
  const [category, setCategory] = useState<Category>(editingTemplate?.category || 'Custom')
  const [difficulty, setDifficulty] = useState<Difficulty>(editingTemplate?.difficulty || 'beginner')
  const [triggerType, setTriggerType] = useState<TriggerType>(editingTemplate?.triggerType || 'manual')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>(
    editingTemplate?.triggerConfig || {}
  )
  const [steps, setSteps] = useState<TemplateStep[]>(
    editingTemplate?.steps || [
      { id: generateStepId(), name: '', type: 'agent_call', config: {}, inputMapping: '', outputMapping: '' },
    ]
  )
  const [variables, setVariables] = useState<TemplateVariable[]>(
    editingTemplate?.variables || []
  )
  const [activeBuilderSection, setActiveBuilderSection] = useState<'steps' | 'variables' | 'trigger' | 'preview'>('steps')
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null)

  const addStep = () => {
    const newStep: TemplateStep = {
      id: generateStepId(),
      name: '',
      type: 'agent_call',
      config: {},
      inputMapping: '',
      outputMapping: '',
    }
    setSteps([...steps, newStep])
    setExpandedStep(newStep.id)
  }

  const removeStep = (id: string) => {
    if (steps.length <= 1) return
    setSteps(steps.filter((s) => s.id !== id))
    if (expandedStep === id) setExpandedStep(steps[0]?.id || null)
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setSteps(updated)
  }

  const updateStep = (id: string, updates: Partial<TemplateStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addVariable = () => {
    setVariables([
      ...variables,
      { id: `var-${Date.now()}`, name: '', type: 'string', default: '', required: false, description: '' },
    ])
  }

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id))
  }

  const updateVariable = (id: string, updates: Partial<TemplateVariable>) => {
    setVariables(variables.map((v) => (v.id === id ? { ...v, ...updates } : v)))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const template: WorkflowTemplate = {
      id: editingTemplate?.id || generateId(),
      name,
      description,
      longDescription: description,
      category,
      icon: categoryConfig[category].icon,
      author: 'You',
      version: editingTemplate?.version || '1.0.0',
      difficulty,
      requiredAgents: steps.filter((s) => s.type === 'agent_call').length,
      estimatedSetupTime: `${steps.length * 3} min`,
      useCount: editingTemplate?.useCount || 0,
      rating: editingTemplate?.rating || 0,
      tags: [category.toLowerCase()],
      steps,
      variables,
      triggerType,
      triggerConfig,
      isBuiltIn: false,
      isOwner: true,
      createdAt: editingTemplate?.createdAt || new Date().toISOString().split('T')[0],
    }
    onSave(template)
  }

  const builderSections = [
    { key: 'steps' as const, label: 'Steps', icon: Workflow },
    { key: 'variables' as const, label: 'Variables', icon: Code },
    { key: 'trigger' as const, label: 'Trigger', icon: Zap },
    { key: 'preview' as const, label: 'Preview', icon: Eye },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            Build a reusable workflow template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1a1b2e]"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4">
        <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-3">Basic Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-[#9ca3af] text-xs">Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workflow Template"
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9"
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      {key}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[#9ca3af] text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow template does..."
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1 min-h-[60px] resize-none"
              rows={2}
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Builder Section Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {builderSections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveBuilderSection(section.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeBuilderSection === section.key
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
            }`}
          >
            <section.icon className="w-3.5 h-3.5" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Steps Section */}
      <AnimatePresence mode="wait">
        {activeBuilderSection === 'steps' && (
          <motion.div
            key="steps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#6b7280] uppercase tracking-wider">
                Pipeline Steps ({steps.length})
              </p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs" onClick={addStep}>
                <Plus className="w-3 h-3 mr-1" /> Add Step
              </Button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {steps.map((step, index) => {
                const stc = stepTypeConfig[step.type]
                const StepIcon = stc.icon
                const isExpanded = expandedStep === step.id

                return (
                  <div key={step.id}>
                    {/* Connector Arrow */}
                    {index > 0 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90" />
                      </div>
                    )}

                    {/* Step Card */}
                    <div
                      className={`rounded-lg border transition-colors ${
                        isExpanded ? 'border-emerald-500/30 bg-[#0f1117]' : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
                      }`}
                    >
                      {/* Step Header */}
                      <div
                        className="flex items-center gap-2 p-3 cursor-pointer"
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#4b5563] cursor-grab flex-shrink-0" />
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${stc.bg}`}>
                          <StepIcon className={`w-3 h-3 ${stc.color}`} />
                        </div>
                        <span className="text-xs text-white font-medium flex-1 truncate">
                          {step.name || `Step ${index + 1}`}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${stc.bg} ${stc.color}`}>
                          {stc.label}
                        </span>
                        <div className="flex items-center gap-0.5 ml-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStep(index, 'up') }}
                            disabled={index === 0}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#6b7280] hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStep(index, 'down') }}
                            disabled={index === steps.length - 1}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#6b7280] hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3 rotate-90" />
                          </button>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#6b7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>

                      {/* Step Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-0 border-t border-[#2d2e3d]">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                                <div>
                                  <Label className="text-[10px] text-[#6b7280]">Step Name</Label>
                                  <Input
                                    value={step.name}
                                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                    placeholder="e.g. Analyze Data"
                                    className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-1 h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-[#6b7280]">Step Type</Label>
                                  <Select value={step.type} onValueChange={(v) => updateStep(step.id, { type: v as StepType })}>
                                    <SelectTrigger className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-1 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                                      {Object.entries(stepTypeConfig).map(([key, cfg]) => (
                                        <SelectItem key={key} value={key}>
                                          <div className="flex items-center gap-2">
                                            <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                                            {cfg.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-[10px] text-[#6b7280]">Input Mapping</Label>
                                  <Input
                                    value={step.inputMapping}
                                    onChange={(e) => updateStep(step.id, { inputMapping: e.target.value })}
                                    placeholder="$.prev.output"
                                    className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-1 h-8 text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-[#6b7280]">Output Mapping</Label>
                                  <Input
                                    value={step.outputMapping}
                                    onChange={(e) => updateStep(step.id, { outputMapping: e.target.value })}
                                    placeholder="$.result"
                                    className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-1 h-8 text-xs font-mono"
                                  />
                                </div>
                              </div>

                              {/* Config Key-Value */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <Label className="text-[10px] text-[#6b7280]">Configuration</Label>
                                  <button
                                    onClick={() => {
                                      const newKey = `key_${Object.keys(step.config).length + 1}`
                                      updateStep(step.id, { config: { ...step.config, [newKey]: '' } })
                                    }}
                                    className="text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors"
                                  >
                                    + Add Config
                                  </button>
                                </div>
                                <div className="space-y-1.5">
                                  {Object.entries(step.config).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                      <Input
                                        value={key}
                                        onChange={(e) => {
                                          const newConfig = { ...step.config }
                                          delete newConfig[key]
                                          newConfig[e.target.value] = value
                                          updateStep(step.id, { config: newConfig })
                                        }}
                                        placeholder="key"
                                        className="bg-[#1a1b2e] border-[#2d2e3d] text-white h-7 text-[10px] font-mono w-1/3"
                                      />
                                      <Input
                                        value={value}
                                        onChange={(e) =>
                                          updateStep(step.id, { config: { ...step.config, [key]: e.target.value } })
                                        }
                                        placeholder="value"
                                        className="bg-[#1a1b2e] border-[#2d2e3d] text-white h-7 text-[10px] font-mono flex-1"
                                      />
                                      <button
                                        onClick={() => {
                                          const newConfig = { ...step.config }
                                          delete newConfig[key]
                                          updateStep(step.id, { config: newConfig })
                                        }}
                                        className="w-6 h-6 rounded flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Delete Step */}
                              <div className="flex justify-end mt-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-7"
                                  onClick={() => removeStep(step.id)}
                                  disabled={steps.length <= 1}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Remove Step
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Variables Section */}
        {activeBuilderSection === 'variables' && (
          <motion.div
            key="variables"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#6b7280] uppercase tracking-wider">
                Template Variables ({variables.length})
              </p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs" onClick={addVariable}>
                <Plus className="w-3 h-3 mr-1" /> Add Variable
              </Button>
            </div>

            {variables.length === 0 ? (
              <div className="text-center py-6">
                <Code className="w-8 h-8 text-[#2d2e3d] mx-auto mb-2" />
                <p className="text-xs text-[#6b7280]">No variables defined. Add variables to make your template configurable.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {variables.map((variable) => (
                  <div
                    key={variable.id}
                    className="flex items-start gap-2 p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-[#6b7280]">Name</Label>
                        <Input
                          value={variable.name}
                          onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                          placeholder="variable_name"
                          className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-0.5 h-7 text-[10px] font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-[#6b7280]">Type</Label>
                        <Select value={variable.type} onValueChange={(v) => updateVariable(variable.id, { type: v as TemplateVariable['type'] })}>
                          <SelectTrigger className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-0.5 h-7 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-[#6b7280]">Default</Label>
                        <Input
                          value={variable.default}
                          onChange={(e) => updateVariable(variable.id, { default: e.target.value })}
                          placeholder="default value"
                          className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-0.5 h-7 text-[10px] font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-[#6b7280]">Description</Label>
                        <Input
                          value={variable.description}
                          onChange={(e) => updateVariable(variable.id, { description: e.target.value })}
                          placeholder="What this variable controls..."
                          className="bg-[#1a1b2e] border-[#2d2e3d] text-white mt-0.5 h-7 text-[10px]"
                        />
                      </div>
                      <div className="flex items-end gap-2 h-full pb-0.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={variable.required}
                            onChange={(e) => updateVariable(variable.id, { required: e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-[#2d2e3d] bg-[#1a1b2e] accent-emerald-500"
                          />
                          <span className="text-[10px] text-[#9ca3af]">Required</span>
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => removeVariable(variable.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors flex-shrink-0 mt-4"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Trigger Section */}
        {activeBuilderSection === 'trigger' && (
          <motion.div
            key="trigger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4"
          >
            <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-3">Trigger Configuration</p>

            <div className="space-y-4">
              <div>
                <Label className="text-[#9ca3af] text-xs">Trigger Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                  {Object.entries(triggerConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setTriggerType(key as TriggerType)}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs transition-colors ${
                        triggerType === key
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#252636] border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {triggerType === 'webhook' && (
                <div>
                  <Label className="text-[#9ca3af] text-xs">Webhook Path</Label>
                  <Input
                    value={triggerConfig.path || ''}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, path: e.target.value })}
                    placeholder="/webhook/my-workflow"
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9 text-xs font-mono"
                  />
                </div>
              )}

              {triggerType === 'cron' && (
                <div>
                  <Label className="text-[#9ca3af] text-xs">Cron Schedule</Label>
                  <Input
                    value={triggerConfig.schedule || ''}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, schedule: e.target.value })}
                    placeholder="0 9 * * *"
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9 text-xs font-mono"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1">Format: minute hour day month weekday</p>
                </div>
              )}

              {triggerType === 'event' && (
                <>
                  <div>
                    <Label className="text-[#9ca3af] text-xs">Event Type</Label>
                    <Input
                      value={triggerConfig.event_type || ''}
                      onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                      placeholder="e.g. deployment.completed"
                      className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[#9ca3af] text-xs">Event Source</Label>
                    <Input
                      value={triggerConfig.source || ''}
                      onChange={(e) => setTriggerConfig({ ...triggerConfig, source: e.target.value })}
                      placeholder="e.g. monitoring, ci-cd"
                      className="bg-[#252636] border-[#2d2e3d] text-white mt-1 h-9 text-xs"
                    />
                  </div>
                </>
              )}

              {triggerType === 'manual' && (
                <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                  <p className="text-xs text-[#9ca3af]">Manual triggers require explicit invocation through the AgentOS dashboard or API.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Preview Section */}
        {activeBuilderSection === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4"
          >
            <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-3">Template Preview</p>

            <div className="space-y-4">
              {/* Info Summary */}
              <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    {(() => {
                      const Icon = categoryConfig[category].icon
                      return <Icon className="w-4 h-4 text-emerald-400" />
                    })()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{name || 'Untitled Template'}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                      <span className={`px-1.5 py-0.5 rounded ${categoryConfig[category].bg} ${categoryConfig[category].color}`}>
                        {category}
                      </span>
                      <span>{difficultyConfig[difficulty].label}</span>
                      <span>{triggerConfig[triggerType]?.icon} {triggerConfig[triggerType]?.label}</span>
                    </div>
                  </div>
                </div>
                {description && <p className="text-[11px] text-[#9ca3af]">{description}</p>}
              </div>

              {/* Step Flow */}
              <div>
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">
                  Pipeline Flow ({steps.length} steps)
                </p>
                <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                  <StepFlowPreview steps={steps} />
                </div>
              </div>

              {/* Variables Summary */}
              {variables.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">
                    Variables ({variables.length})
                  </p>
                  <div className="space-y-1">
                    {variables.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 p-2 rounded bg-[#0f1117] text-xs">
                        <Code className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="text-white font-mono">{v.name || 'unnamed'}</span>
                        <span className="text-[#6b7280]">({v.type})</span>
                        {v.required && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400">required</span>
                        )}
                        {v.default && (
                          <span className="text-[9px] text-[#6b7280] ml-auto">default: {v.default}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Section */}
              <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div className="flex items-center gap-2 mb-2">
                  <TestTube className="w-4 h-4 text-amber-400" />
                  <p className="text-xs text-white font-medium">Test & Validate</p>
                </div>
                <p className="text-[11px] text-[#9ca3af] mb-3">
                  Validate your template structure before saving. Checks for missing step names, unconnected inputs, and required variables.
                </p>
                <div className="space-y-1.5">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2 text-[10px]">
                      {step.name.trim() ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                      )}
                      <span className="text-[#9ca3af]">Step {i + 1}: {step.name || 'Missing name'}</span>
                    </div>
                  ))}
                  {variables.filter((v) => v.required && !v.default).map((v) => (
                    <div key={v.id} className="flex items-center gap-2 text-[10px]">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-[#9ca3af]">Variable &quot;{v.name}&quot; is required with no default</span>
                    </div>
                  ))}
                  {steps.every((s) => s.name.trim()) && variables.filter((v) => v.required && !v.default).length === 0 && (
                    <div className="flex items-center gap-2 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">All checks passed!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ===================== TEMPLATE DETAIL DRAWER =====================

function TemplateDetailDrawer({
  template,
  open,
  onClose,
  onInstantiate,
}: {
  template: WorkflowTemplate | null
  open: boolean
  onClose: () => void
  onInstantiate: (t: WorkflowTemplate) => void
}) {
  if (!template) return null

  const cc = categoryConfig[template.category]
  const TemplateIcon = template.icon
  const tc = triggerConfig[template.triggerType]

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="bg-[#0f1117] border-[#2d2e3d] max-h-[85vh]">
        <DrawerHeader className="border-b border-[#2d2e3d] pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cc.color === 'text-emerald-400' ? '#10b981' : cc.color === 'text-blue-400' ? '#3b82f6' : cc.color === 'text-purple-400' ? '#8b5cf6' : cc.color === 'text-amber-400' ? '#f59e0b' : cc.color === 'text-orange-400' ? '#f97316' : '#ec4899'}15` }}
              >
                <TemplateIcon
                  className="w-5 h-5"
                  style={{
                    color:
                      cc.color === 'text-emerald-400'
                        ? '#10b981'
                        : cc.color === 'text-blue-400'
                          ? '#3b82f6'
                          : cc.color === 'text-purple-400'
                            ? '#8b5cf6'
                            : cc.color === 'text-amber-400'
                              ? '#f59e0b'
                              : cc.color === 'text-orange-400'
                                ? '#f97316'
                                : '#ec4899',
                  }}
                />
              </div>
              <div>
                <span>{template.name}</span>
                <div className="flex items-center gap-2 text-xs font-normal text-[#9ca3af] mt-0.5">
                  <span>v{template.version}</span>
                  <span>by {template.author}</span>
                  {template.isBuiltIn && (
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" /> Built-in
                    </span>
                  )}
                </div>
              </div>
            </DrawerTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#1a1b2e] hover:bg-[#252636] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar p-4 space-y-5">
          {/* Description */}
          <div>
            <p className="text-sm text-[#9ca3af] leading-relaxed">{template.longDescription}</p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${cc.bg} ${cc.border} ${cc.color}`}>
              {template.category}
            </span>
            {renderDifficultyDots(template.difficulty)}
            <span className={`text-[10px] ${tc.color}`}>{tc.icon} {tc.label}</span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Agents', value: template.requiredAgents, icon: Users, color: '#10b981' },
              { label: 'Setup Time', value: template.estimatedSetupTime, icon: Clock, color: '#f59e0b' },
              { label: 'Uses', value: template.useCount.toLocaleString(), icon: Download, color: '#3b82f6' },
              { label: 'Rating', value: template.rating.toFixed(1), icon: Star, color: '#f59e0b' },
            ].map((stat) => (
              <div key={stat.label} className="p-2.5 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d]">
                <div className="flex items-center gap-1.5">
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  <span className="text-[10px] text-[#6b7280]">{stat.label}</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Step Flow */}
          <div>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">
              Workflow Steps ({template.steps.length})
            </p>
            <div className="p-3 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d]">
              <StepFlowPreview steps={template.steps} />
            </div>
          </div>

          {/* Required Variables */}
          {template.variables.length > 0 && (
            <div>
              <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">
                Required Variables ({template.variables.length})
              </p>
              <div className="space-y-1.5">
                {template.variables.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d]">
                    <Code className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-mono">{v.name}</span>
                        <span className="text-[9px] text-[#6b7280]">({v.type})</span>
                        {v.required && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/10 text-red-400">required</span>
                        )}
                      </div>
                      {v.description && (
                        <p className="text-[10px] text-[#6b7280] mt-0.5">{v.description}</p>
                      )}
                    </div>
                    {v.default && (
                      <span className="text-[9px] text-[#6b7280] bg-[#252636] px-1.5 py-0.5 rounded font-mono">
                        {v.default}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trigger Config */}
          <div>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Trigger Configuration</p>
            <div className="p-3 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm ${tc.color}`}>{tc.icon}</span>
                <span className="text-xs text-white font-medium">{tc.label}</span>
              </div>
              {Object.entries(template.triggerConfig).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(template.triggerConfig).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-[10px]">
                      <span className="text-[#6b7280]">{key}:</span>
                      <span className="text-white font-mono">{value || '(not set)'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[#6b7280]">No additional trigger configuration needed.</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d] text-[#9ca3af]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Instantiate Button */}
          <Button
            onClick={() => onInstantiate(template)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10"
          >
            <Zap className="w-4 h-4 mr-2" />
            Instantiate Workflow from Template
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ===================== MAIN COMPONENT =====================

export function WorkflowTemplates() {
  const [activeTab, setActiveTab] = useState<TabType>('browse')
  const [allTemplates, setAllTemplates] = useState<WorkflowTemplate[]>(builtInTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null)
  const [instantiating, setInstantiating] = useState<string | null>(null)

  const builtInCount = allTemplates.filter((t) => t.isBuiltIn).length
  const customCount = allTemplates.filter((t) => !t.isBuiltIn).length
  const totalUses = allTemplates.reduce((sum, t) => sum + t.useCount, 0)

  const myTemplates = allTemplates.filter((t) => !t.isBuiltIn)
  const browseTemplates = allTemplates

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
    setDrawerOpen(true)
  }

  const handleUseTemplate = (template: WorkflowTemplate) => {
    setInstantiating(template.id)
    // Simulate instantiation
    setTimeout(() => {
      setAllTemplates(
        allTemplates.map((t) =>
          t.id === template.id ? { ...t, useCount: t.useCount + 1 } : t
        )
      )
      setInstantiating(null)
    }, 800)
  }

  const handleInstantiate = (template: WorkflowTemplate) => {
    setInstantiating(template.id)
    setTimeout(() => {
      setAllTemplates(
        allTemplates.map((t) =>
          t.id === template.id ? { ...t, useCount: t.useCount + 1 } : t
        )
      )
      setDrawerOpen(false)
      setInstantiating(null)
    }, 800)
  }

  const handleDeleteTemplate = (id: string) => {
    setAllTemplates(allTemplates.filter((t) => t.id !== id))
  }

  const handleDuplicateTemplate = (template: WorkflowTemplate) => {
    const newTemplate: WorkflowTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      isBuiltIn: false,
      isOwner: true,
      useCount: 0,
      rating: 0,
      version: '1.0.0',
      author: 'You',
      createdAt: new Date().toISOString().split('T')[0],
    }
    setAllTemplates([...allTemplates, newTemplate])
  }

  const handleSaveTemplate = (template: WorkflowTemplate) => {
    if (editingTemplate) {
      setAllTemplates(allTemplates.map((t) => (t.id === template.id ? template : t)))
    } else {
      setAllTemplates([...allTemplates, template])
    }
    setEditingTemplate(null)
    setActiveTab('my-templates')
  }

  const handleEditTemplate = (template: WorkflowTemplate) => {
    setEditingTemplate(template)
    setDrawerOpen(false)
    setActiveTab('builder')
  }

  const tabs: { key: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'browse', label: 'Browse', icon: Search, count: browseTemplates.length },
    { key: 'my-templates', label: 'My Templates', icon: LayoutTemplate, count: myTemplates.length },
    { key: 'builder', label: 'Builder', icon: Edit3 },
  ]

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
            Workflow Templates
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Pre-built workflow patterns you can instantiate and customize
          </p>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          onClick={() => {
            setEditingTemplate(null)
            setActiveTab('builder')
          }}
        >
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Templates', value: allTemplates.length, icon: Package, color: '#10b981' },
          { label: 'Built-in', value: builtInCount, icon: Star, color: '#f59e0b' },
          { label: 'Custom', value: customCount, icon: Sparkles, color: '#8b5cf6' },
          { label: 'Total Uses', value: totalUses.toLocaleString(), icon: Download, color: '#3b82f6' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[#9ca3af]">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key !== 'builder') setEditingTemplate(null)
              setActiveTab(tab.key)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[10px] text-[#6b7280]">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <BrowseTab
              templates={browseTemplates}
              onSelectTemplate={handleSelectTemplate}
              onUseTemplate={handleUseTemplate}
            />
          </motion.div>
        )}

        {activeTab === 'my-templates' && (
          <motion.div
            key="my-templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <MyTemplatesTab
              templates={myTemplates}
              onSelectTemplate={handleSelectTemplate}
              onUseTemplate={handleUseTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
            />
          </motion.div>
        )}

        {activeTab === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <BuilderTab
              editingTemplate={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setEditingTemplate(null)
                setActiveTab('my-templates')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Detail Drawer */}
      <TemplateDetailDrawer
        template={selectedTemplate}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onInstantiate={handleInstantiate}
      />

      {/* Instantiating Overlay */}
      <AnimatePresence>
        {instantiating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#1a1b2e] border border-[#2d2e3d] shadow-xl"
            >
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <p className="text-sm text-white font-medium">Instantiating workflow...</p>
              <p className="text-xs text-[#9ca3af]">Setting up from template</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
