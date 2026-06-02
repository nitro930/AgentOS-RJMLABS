'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code,
  FileText,
  FolderTree,
  Search,
  Save,
  Copy,
  Check,
  X,
  Plus,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
  Trash2,
  Download,
  RefreshCw,
  Play,
  Settings,
  Hash,
  Braces,
  FileType,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  Terminal,
  BookOpen,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
  language?: string
  modified?: boolean
}

interface EditorTab {
  id: string
  name: string
  language: string
  content: string
  modified: boolean
  path: string
}

// ─── Demo file tree ──────────────────────────────────────────────

const demoFileTree: FileNode[] = [
  {
    name: 'agents', type: 'folder', children: [
      { name: 'code-reviewer.py', type: 'file', language: 'python', content: `#!/usr/bin/env python3
"""Code Review Agent — RJMLABS AgentOS"""
import os
import json
from typing import List, Dict

class CodeReviewerAgent:
    """Reviews code for quality, security, and best practices."""

    def __init__(self, config: Dict):
        self.model = config.get("model", "gpt-4o")
        self.strictness = config.get("strictness", "medium")
        self.focus_areas = config.get("focus_areas", [
            "security", "performance", "readability", "testing"
        ])

    async def review(self, code: str, language: str) -> Dict:
        """Perform a comprehensive code review."""
        findings = []

        # Security checks
        if "eval(" in code:
            findings.append({
                "severity": "critical",
                "category": "security",
                "message": "Use of eval() detected — potential code injection risk",
                "suggestion": "Replace with ast.literal_eval() or json.loads()"
            })

        # Performance checks
        if "for i in range(len(" in code:
            findings.append({
                "severity": "warning",
                "category": "performance",
                "message": "Consider using enumerate() instead of range(len())",
                "suggestion": "for i, item in enumerate(collection):"
            })

        return {
            "findings": findings,
            "summary": f"Found {len(findings)} issues",
            "grade": "B+" if len(findings) < 3 else "C"
        }

if __name__ == "__main__":
    agent = CodeReviewerAgent({"model": "gpt-4o"})
    print("Code Review Agent initialised")
` },
      { name: 'bug-hunter.ts', type: 'file', language: 'typescript', content: `/**
 * Bug Hunter Agent — RJMLABS AgentOS
 * Scans code for bugs, vulnerabilities, and edge cases
 */
import { z } from 'zod';

interface BugReport {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  location: { file: string; line: number };
  description: string;
  fix: string;
}

export class BugHunterAgent {
  private scanDepth: number;
  private enabledChecks: string[];

  constructor(config: { scanDepth?: number; checks?: string[] }) {
    this.scanDepth = config.scanDepth ?? 3;
    this.enabledChecks = config.checks ?? [
      'null-deref', 'race-condition', 'memory-leak',
      'sql-injection', 'xss', 'csrf'
    ];
  }

  async scanCodebase(path: string): Promise<BugReport[]> {
    const bugs: BugReport[] = [];

    // Scan logic would go here
    console.log(\`Scanning \${path} at depth \${this.scanDepth}\`);

    return bugs;
  }
}
` },
      { name: 'api-architect.js', type: 'file', language: 'javascript', content: `/**
 * API Architect Agent — RJMLABS AgentOS
 * Designs and validates REST/GraphQL APIs
 */

const API_ARCHITECT_PROMPT = \`
You are an expert API architect. Design APIs following:
- RESTful conventions (proper HTTP methods, status codes)
- OpenAPI 3.0 specification
- Versioning strategy (URL-based: /v1/, /v2/)
- Authentication (Bearer tokens, API keys)
- Rate limiting headers (X-RateLimit-*)
- Pagination (cursor-based for large datasets)
- Error format: { error: { code, message, details } }
- All monetary values in GBP (£)
\`;

module.exports = { API_ARCHITECT_PROMPT };
` },
    ]
  },
  {
    name: 'workflows', type: 'folder', children: [
      { name: 'deploy-pipeline.yaml', type: 'file', language: 'yaml', content: `# AgentOS Deployment Pipeline
name: production-deploy
version: 1.0.0
trigger:
  type: webhook
  path: /deploy/trigger

steps:
  - id: build
    agent: code-reviewer
    action: review_and_build
    timeout: 300s

  - id: test
    agent: test-engineer
    action: run_test_suite
    depends_on: [build]
    timeout: 600s

  - id: security-scan
    agent: security-scanner
    action: vulnerability_scan
    depends_on: [build]
    timeout: 300s

  - id: deploy
    agent: devops-automator
    action: deploy_to_production
    depends_on: [test, security-scan]
    timeout: 120s
    on_failure: rollback

  - id: notify
    agent: email-composer
    action: send_deployment_report
    depends_on: [deploy]
` },
      { name: 'support-flow.json', type: 'file', language: 'json', content: `{
  "name": "customer-support-escalation",
  "version": "2.1.0",
  "description": "Automated customer support with escalation tiers",
  "steps": [
    {
      "id": "triage",
      "agent": "customer-support",
      "prompt": "Classify the issue severity and category"
    },
    {
      "id": "respond",
      "agent": "customer-support",
      "prompt": "Generate a helpful response",
      "condition": "severity != 'critical'"
    },
    {
      "id": "escalate",
      "agent": "human-agent",
      "prompt": "Escalate to human support",
      "condition": "severity == 'critical'"
    }
  ]
}` },
    ]
  },
  {
    name: 'config', type: 'folder', children: [
      { name: 'agents.yaml', type: 'file', language: 'yaml', content: `# AgentOS Configuration
agents:
  code-reviewer:
    model: gpt-4o
    temperature: 0.3
    max_tokens: 4096
    rate_limit: 60/min
    cost_budget: £50/day

  bug-hunter:
    model: claude-3.5-sonnet
    temperature: 0.2
    max_tokens: 8192
    rate_limit: 30/min
    cost_budget: £75/day

  devops-automator:
    model: gpt-4o
    temperature: 0.1
    max_tokens: 2048
    rate_limit: 15/min
    cost_budget: £30/day

defaults:
  currency: GBP
  timezone: Europe/London
  retry_policy: exponential_backoff
  max_retries: 3
` },
      { name: 'providers.json', type: 'file', language: 'json', content: `{
  "providers": {
    "openrouter": {
      "apiKey": "env:OPENROUTER_API_KEY",
      "baseUrl": "https://openrouter.ai/api/v1",
      "models": ["gpt-4o", "claude-3.5-sonnet", "gemini-pro"]
    },
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "models": ["llama3", "codellama", "mistral"]
    }
  }
}` },
    ]
  },
  { name: 'README.md', type: 'file', language: 'markdown', content: `# AgentOS — RJMLABS

## Overview
Agent Operating System for VPS management. Built with Next.js, Prisma, and Zustand.

## Architecture
- **L0-L1**: Infrastructure (Security, Resources, Docker, Terminal)
- **L2-L3**: Data & Intelligence (Memory, Knowledge, Brain Router)
- **L4-L4++**: Agents (Grid, Swarm, Teams, Chains, Delegation)
- **L5-L6**: Orchestration (Workflows, Scheduler, Production)
- **L7-L8**: Operations (Loops, Analytics, Benchmarking)
- **L9-L10**: Platform (Export, Marketplace, Plugins)

## Quick Start
\`\`\`bash
npm install
npx prisma db push
npm run dev
\`\`\`

## Currency
All costs displayed in **GBP (£)**.

## License
Proprietary — RJMLABS.CO.UK
` },
]

// ─── Language detection ───────────────────────────────────────────

function getLanguageIcon(lang: string) {
  switch (lang) {
    case 'python': return '🐍'
    case 'typescript': return '🔷'
    case 'javascript': return '🟨'
    case 'yaml': return '⚙️'
    case 'json': return '📋'
    case 'markdown': return '📝'
    default: return '📄'
  }
}

function getLanguageColor(lang: string) {
  switch (lang) {
    case 'python': return 'text-yellow-400'
    case 'typescript': return 'text-blue-400'
    case 'javascript': return 'text-yellow-300'
    case 'yaml': return 'text-pink-400'
    case 'json': return 'text-green-400'
    case 'markdown': return 'text-purple-400'
    default: return 'text-[#6b7280]'
  }
}

// ─── Syntax highlighter (basic) ──────────────────────────────────

function highlightCode(content: string, language: string): string {
  let highlighted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Comments
  if (['python', 'yaml'].includes(language)) {
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="text-[#6a9955]">$1</span>')
  } else if (['typescript', 'javascript'].includes(language)) {
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-[#6a9955]">$1</span>')
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-[#6a9955]">$1</span>')
  } else if (language === 'markdown') {
    highlighted = highlighted.replace(/^(#{1,6}\s.*$)/gm, '<span class="text-emerald-400 font-bold">$1</span>')
  }

  // Strings
  highlighted = highlighted.replace(/(&quot;.*?&quot;|".*?"|'.*?'|`[^`]*`)/g, '<span class="text-[#ce9178]">$1</span>')

  // Numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-[#b5cea8]">$1</span>')

  // Keywords
  const keywords = ['import', 'from', 'export', 'class', 'def', 'async', 'await', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'new', 'this', 'interface', 'type', 'extends', 'implements']
  keywords.forEach(kw => {
    const re = new RegExp(`\\b(${kw})\\b`, 'g')
    highlighted = highlighted.replace(re, '<span class="text-[#569cd6]">$1</span>')
  })

  return highlighted
}

// ─── File Tree Component ─────────────────────────────────────────

function FileTreeItem({ node, depth, onFileClick, expandedPaths, toggleExpand }: {
  node: FileNode
  depth: number
  onFileClick: (node: FileNode) => void
  expandedPaths: Set<string>
  toggleExpand: (path: string) => void
}) {
  const path = node.name
  const isExpanded = expandedPaths.has(path)

  return (
    <div>
      <button
        onClick={() => node.type === 'folder' ? toggleExpand(path) : onFileClick(node)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-[#1e1f2b] transition-colors rounded ${
          node.type === 'folder' ? 'text-[#9ca3af]' : 'text-[#d1d5db]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-yellow-400" /> : <FolderOpen className="w-3.5 h-3.5 text-yellow-400/70" />}
          </>
        ) : (
          <>
            <span className="w-3" />
            <span className="text-[10px]">{getLanguageIcon(node.language || '')}</span>
          </>
        )}
        <span className="truncate">{node.name}</span>
        {node.modified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-auto flex-shrink-0" />}
      </button>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────

export function AgentCodeEditor() {
  const { addToast } = useAgentOSStore()
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['agents', 'workflows', 'config']))
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ name: string; path: string; line: number }[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)
  const [fontSize, setFontSize] = useState(13)
  const [wordWrap, setWordWrap] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const activeTab = openTabs.find(t => t.id === activeTabId)

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const onFileClick = useCallback((node: FileNode) => {
    if (node.type !== 'file') return
    const existingTab = openTabs.find(t => t.name === node.name)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }
    const newTab: EditorTab = {
      id: node.name,
      name: node.name,
      language: node.language || 'text',
      content: node.content || '',
      modified: false,
      path: node.name,
    }
    setOpenTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [openTabs])

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => prev.filter(t => t.id !== tabId))
    if (activeTabId === tabId) {
      const remaining = openTabs.filter(t => t.id !== tabId)
      setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
    }
  }, [activeTabId, openTabs])

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setOpenTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, content, modified: true } : t
    ))
  }, [])

  const saveFile = useCallback(() => {
    if (!activeTab) return
    setOpenTabs(prev => prev.map(t =>
      t.id === activeTab.id ? { ...t, modified: false } : t
    ))
    addToast(`Saved ${activeTab.name}`, 'success')
  }, [activeTab, addToast])

  const copyContent = useCallback(() => {
    if (!activeTab) return
    navigator.clipboard.writeText(activeTab.content)
    setCopied(true)
    addToast('Code copied to clipboard', 'success')
    setTimeout(() => setCopied(false), 2000)
  }, [activeTab, addToast])

  const downloadFile = useCallback(() => {
    if (!activeTab) return
    const blob = new Blob([activeTab.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeTab.name
    a.click()
    URL.revokeObjectURL(url)
    addToast(`Downloaded ${activeTab.name}`, 'success')
  }, [activeTab, addToast])

  const searchInFiles = useCallback((query: string) => {
    if (!query.trim()) { setSearchResults([]); return }
    const results: { name: string; path: string; line: number }[] = []
    const searchNode = (nodes: FileNode[], parentPath: string = '') => {
      nodes.forEach(node => {
        const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name
        if (node.type === 'file' && node.content) {
          const lines = node.content.split('\n')
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({ name: node.name, path: currentPath, line: idx + 1 })
            }
          })
        }
        if (node.children) searchNode(node.children, currentPath)
      })
    }
    searchNode(demoFileTree)
    setSearchResults(results)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveFile])

  const lineCount = activeTab ? activeTab.content.split('\n').length : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            Agent Code Editor
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Browse, edit, and review agent code files with syntax highlighting</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1e1f2b] rounded-lg border border-[#2d2e3d] p-0.5">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-2 py-1 text-xs text-[#6b7280] hover:text-white transition-colors"
            >A-</button>
            <span className="text-[10px] text-[#6b7280] font-mono px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
              className="px-2 py-1 text-xs text-[#6b7280] hover:text-white transition-colors"
            >A+</button>
          </div>
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
              wordWrap ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#1e1f2b] text-[#6b7280] border-[#2d2e3d]'
            }`}
          >
            Wrap
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-2 bg-[#1e1f2b] text-[#6b7280] hover:text-white text-xs rounded-lg border border-[#2d2e3d] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className={`bg-[#0a0b0e] border border-[#2d2e3d] rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-40 rounded-none' : ''}`}>
        {/* Tab Bar */}
        <div className="flex items-center bg-[#111218] border-b border-[#2d2e3d] overflow-x-auto custom-scrollbar">
          {openTabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-[#2d2e3d] transition-colors flex-shrink-0 ${
                activeTabId === tab.id
                  ? 'bg-[#0a0b0e] text-white border-t-2 border-t-emerald-500'
                  : 'bg-[#111218] text-[#6b7280] hover:text-[#d1d5db]'
              }`}
            >
              <span className="text-[10px]">{getLanguageIcon(tab.language)}</span>
              <span>{tab.name}</span>
              {tab.modified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className="ml-1 text-[#4b5563] hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {openTabs.length === 0 && (
            <div className="px-4 py-2 text-xs text-[#4b5563]">No files open — click a file in the explorer to start editing</div>
          )}
        </div>

        <div className="flex" style={{ height: isFullscreen ? 'calc(100vh - 36px)' : '500px' }}>
          {/* File Explorer Sidebar */}
          <div className="w-56 border-r border-[#2d2e3d] bg-[#0f1117] overflow-y-auto custom-scrollbar flex-shrink-0">
            <div className="px-3 py-2 border-b border-[#2d2e3d] flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Explorer</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-1 text-[#4b5563] hover:text-white transition-colors"
                  title="Search in files (Ctrl+F)"
                >
                  <Search className="w-3 h-3" />
                </button>
                <button
                  className="p-1 text-[#4b5563] hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Search */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-[#2d2e3d] overflow-hidden"
                >
                  <div className="p-2">
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); searchInFiles(e.target.value) }}
                      className="w-full px-2 py-1.5 bg-[#0a0b0e] border border-[#2d2e3d] rounded text-xs text-white outline-none focus:border-emerald-500/50 placeholder-[#4b5563]"
                      placeholder="Search in files..."
                      autoFocus
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                        {searchResults.map((r, i) => (
                          <div key={i} className="text-[10px] text-[#6b7280] hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#1e1f2b] truncate">
                            <span className="text-emerald-400">{r.name}</span>:L{r.line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Tree */}
            <div className="py-1">
              {demoFileTree.map(node => (
                <FileTreeItem
                  key={node.name}
                  node={node}
                  depth={0}
                  onFileClick={onFileClick}
                  expandedPaths={expandedPaths}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeTab ? (
              <>
                {/* Breadcrumb & Actions */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f1117] border-b border-[#2d2e3d]">
                  <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                    <FolderTree className="w-3 h-3" />
                    <span>{activeTab.path}</span>
                    <span className={getLanguageColor(activeTab.language)}>{activeTab.language.toUpperCase()}</span>
                    <span>UTF-8</span>
                    <span>LF</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={copyContent} className="p-1 text-[#4b5563] hover:text-white transition-colors" title="Copy (Ctrl+C)">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={saveFile} className="p-1 text-[#4b5563] hover:text-white transition-colors" title="Save (Ctrl+S)">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={downloadFile} className="p-1 text-[#4b5563] hover:text-white transition-colors" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Code Area */}
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <div className="flex">
                    {/* Line numbers */}
                    <div className="py-3 pl-3 pr-2 text-right select-none flex-shrink-0 border-r border-[#1e1f2b]" style={{ minWidth: '3rem' }}>
                      {Array.from({ length: lineCount }, (_, i) => (
                        <div key={i} className="text-[10px] leading-5 text-[#4b5563] font-mono">{i + 1}</div>
                      ))}
                    </div>
                    {/* Code content */}
                    <textarea
                      ref={editorRef}
                      value={activeTab.content}
                      onChange={(e) => updateTabContent(activeTab.id, e.target.value)}
                      className="flex-1 py-3 px-3 bg-transparent text-[#d1d5db] font-mono outline-none resize-none leading-5"
                      style={{ fontSize: `${fontSize}px`, whiteSpace: wordWrap ? 'pre-wrap' : 'pre', tabSize: 2 }}
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-1 bg-[#111218] border-t border-[#2d2e3d] text-[10px] text-[#4b5563]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Ln {lineCount}, Col 1</span>
                    <span className="flex items-center gap-1"><Braces className="w-3 h-3" />{activeTab.language}</span>
                    <span>{activeTab.content.length} chars</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeTab.modified && <span className="text-yellow-400 flex items-center gap-1"><FileText className="w-3 h-3" />Modified</span>}
                    <span className="text-emerald-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />AgentOS</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#4b5563]">
                <Code className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">Agent Code Editor</p>
                <p className="text-xs mt-1">Open a file from the explorer to start editing</p>
                <div className="flex gap-4 mt-4 text-[10px]">
                  <span>Ctrl+S Save</span>
                  <span>Ctrl+F Search</span>
                  <span>Ctrl+P Quick Open</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
