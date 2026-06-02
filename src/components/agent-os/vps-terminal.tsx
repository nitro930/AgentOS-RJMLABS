'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal as TerminalIcon,
  Plus,
  Trash2,
  Play,
  Copy,
  RotateCcw,
  ChevronDown,
  Server,
  Wifi,
  WifiOff,
  Clock,
  Star,
  StarOff,
  Search,
  X,
  Check,
  Trash,
  Download,
  FolderOpen,
  Cpu,
  HardDrive,
  Globe,
  Container,
  Shield,
  Database,
  Code,
  Settings,
  Zap,
  FileText,
  Activity,
  GitBranch,
  Users,
  Lock,
  Layers,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface TerminalSession {
  id: string
  name: string
  host: string
  port: number
  username: string
  status: string
  lastCommand: string | null
  commandCount: number
  createdAt: string
}

interface TerminalCommand {
  id: string
  sessionId: string
  command: string
  output: string
  exitCode: number | null
  duration: number
  createdAt: string
}

// ─── Quick Command Definitions ─────────────────────────────────

interface QuickCommand {
  label: string
  cmd: string
  category: string
  icon: React.ElementType
  description: string
}

const quickCommands: QuickCommand[] = [
  // System
  { label: 'System Info', cmd: 'uname -a', category: 'System', icon: Cpu, description: 'Kernel & OS details' },
  { label: 'Hostname', cmd: 'hostname && hostname -I', category: 'System', icon: Server, description: 'Host name & IP' },
  { label: 'Uptime', cmd: 'uptime', category: 'System', icon: Clock, description: 'System uptime & load' },
  { label: 'Who Am I', cmd: 'whoami && id', category: 'System', icon: Users, description: 'Current user info' },
  { label: 'Date/Time', cmd: 'date && timedatectl', category: 'System', icon: Clock, description: 'System date & timezone' },
  { label: 'Kernel Modules', cmd: 'lsmod | head -20', category: 'System', icon: Layers, description: 'Loaded kernel modules' },
  { label: 'Systemd Status', cmd: 'systemctl list-units --type=service --state=running | head -20', category: 'System', icon: Activity, description: 'Running services' },
  { label: 'Reboot History', cmd: 'last reboot | head -10', category: 'System', icon: RotateCcw, description: 'Recent reboots' },
  { label: 'Crontab', cmd: 'crontab -l 2>/dev/null || echo "No crontab"', category: 'System', icon: Clock, description: 'User crontab entries' },
  { label: 'Env Vars', cmd: 'env | sort', category: 'System', icon: Settings, description: 'Environment variables' },

  // CPU & Memory
  { label: 'Memory', cmd: 'free -h', category: 'CPU & Memory', icon: HardDrive, description: 'RAM usage summary' },
  { label: 'Top Processes', cmd: 'ps aux --sort=-%mem | head -10', category: 'CPU & Memory', icon: Cpu, description: 'Top 10 by memory' },
  { label: 'CPU Top', cmd: 'ps aux --sort=-%cpu | head -10', category: 'CPU & Memory', icon: Cpu, description: 'Top 10 by CPU' },
  { label: 'CPU Info', cmd: 'lscpu | head -20', category: 'CPU & Memory', icon: Cpu, description: 'CPU architecture' },
  { label: 'Load Average', cmd: 'cat /proc/loadavg', category: 'CPU & Memory', icon: Activity, description: 'System load averages' },
  { label: 'Swap Usage', cmd: 'swapon --show && free -h | grep Swap', category: 'CPU & Memory', icon: HardDrive, description: 'Swap space usage' },

  // Disk & Storage
  { label: 'Disk Usage', cmd: 'df -h', category: 'Disk & Storage', icon: HardDrive, description: 'Filesystem disk usage' },
  { label: 'Directory Size', cmd: 'du -sh /* 2>/dev/null | sort -rh | head -15', category: 'Disk & Storage', icon: FolderOpen, description: 'Largest directories' },
  { label: 'Inodes', cmd: 'df -i', category: 'Disk & Storage', icon: HardDrive, description: 'Inode usage' },
  { label: 'Mount Points', cmd: 'mount | grep -v cgroup', category: 'Disk & Storage', icon: HardDrive, description: 'Mounted filesystems' },
  { label: 'Block Devices', cmd: 'lsblk', category: 'Disk & Storage', icon: HardDrive, description: 'Block device tree' },
  { label: 'Large Files', cmd: 'find / -type f -size +100M 2>/dev/null | head -20', category: 'Disk & Storage', icon: FileText, description: 'Files over 100MB' },
  { label: 'Home Usage', cmd: 'du -sh ~/ 2>/dev/null', category: 'Disk & Storage', icon: FolderOpen, description: 'Home directory size' },

  // Network
  { label: 'Network', cmd: 'ss -tuln', category: 'Network', icon: Globe, description: 'Listening ports' },
  { label: 'Connections', cmd: 'ss -tunap | head -30', category: 'Network', icon: Globe, description: 'Active connections' },
  { label: 'Interfaces', cmd: 'ip addr show', category: 'Network', icon: Globe, description: 'Network interfaces' },
  { label: 'Routes', cmd: 'ip route show', category: 'Network', icon: Globe, description: 'Routing table' },
  { label: 'DNS', cmd: 'cat /etc/resolv.conf', category: 'Network', icon: Globe, description: 'DNS configuration' },
  { label: 'Firewall', cmd: 'ufw status 2>/dev/null || iptables -L -n 2>/dev/null | head -20', category: 'Network', icon: Shield, description: 'Firewall rules' },
  { label: 'Bandwidth', cmd: 'cat /proc/net/dev', category: 'Network', icon: Globe, description: 'Network traffic stats' },
  { label: 'Ping Test', cmd: 'ping -c 4 8.8.8.8', category: 'Network', icon: Globe, description: 'Ping Google DNS' },
  { label: 'Curl Headers', cmd: 'curl -sI https://rjmlabs.co.uk', category: 'Network', icon: Globe, description: 'HTTP header check' },
  { label: 'Traceroute', cmd: 'traceroute -m 15 8.8.8.8 2>/dev/null || echo "traceroute not available"', category: 'Network', icon: Globe, description: 'Network path trace' },

  // Docker
  { label: 'Docker PS', cmd: 'docker ps', category: 'Docker', icon: Container, description: 'Running containers' },
  { label: 'Docker All', cmd: 'docker ps -a', category: 'Docker', icon: Container, description: 'All containers' },
  { label: 'Docker Images', cmd: 'docker images', category: 'Docker', icon: Container, description: 'Available images' },
  { label: 'Docker Volumes', cmd: 'docker volume ls', category: 'Docker', icon: Container, description: 'Docker volumes' },
  { label: 'Docker Networks', cmd: 'docker network ls', category: 'Docker', icon: Container, description: 'Docker networks' },
  { label: 'Docker Stats', cmd: 'docker stats --no-stream', category: 'Docker', icon: Activity, description: 'Container resource usage' },
  { label: 'Docker Compose', cmd: 'docker compose ls 2>/dev/null || docker-compose ls 2>/dev/null', category: 'Docker', icon: Container, description: 'Compose projects' },
  { label: 'Docker Disk', cmd: 'docker system df', category: 'Docker', icon: HardDrive, description: 'Docker disk usage' },
  { label: 'Docker Logs', cmd: 'docker logs --tail 50 $(docker ps -q | head -1) 2>/dev/null || echo "No running containers"', category: 'Docker', icon: FileText, description: 'Latest container logs' },

  // Security
  { label: 'Auth Log', cmd: 'tail -30 /var/log/auth.log 2>/dev/null || journalctl -u sshd --no-pager -n 30 2>/dev/null', category: 'Security', icon: Shield, description: 'Recent auth attempts' },
  { label: 'Failed SSH', cmd: 'grep "Failed password" /var/log/auth.log 2>/dev/null | tail -10 || echo "No auth.log"', category: 'Security', icon: Lock, description: 'Failed SSH logins' },
  { label: 'Active SSH', cmd: 'who && last -10', category: 'Security', icon: Users, description: 'Active & recent sessions' },
  { label: 'Open Ports', cmd: 'ss -tlnp', category: 'Security', icon: Shield, description: 'Open ports with processes' },
  { label: 'Sudo Log', cmd: 'grep -i sudo /var/log/auth.log 2>/dev/null | tail -10 || echo "No sudo log"', category: 'Security', icon: Lock, description: 'Recent sudo commands' },
  { label: 'User Accounts', cmd: 'cat /etc/passwd | grep -v nologin | grep -v false', category: 'Security', icon: Users, description: 'Login-capable users' },
  { label: 'Root Check', cmd: 'cat /etc/ssh/sshd_config | grep -i permitroot', category: 'Security', icon: Lock, description: 'Root SSH access setting' },

  // Processes & Logs
  { label: 'All Processes', cmd: 'ps auxf | head -40', category: 'Processes & Logs', icon: Activity, description: 'Process tree (top 40)' },
  { label: 'System Log', cmd: 'journalctl --no-pager -n 30', category: 'Processes & Logs', icon: FileText, description: 'Recent system log' },
  { label: 'Kernel Log', cmd: 'dmesg | tail -20', category: 'Processes & Logs', icon: FileText, description: 'Kernel messages' },
  { label: 'Syslog', cmd: 'tail -30 /var/log/syslog 2>/dev/null || echo "No syslog"', category: 'Processes & Logs', icon: FileText, description: 'System log entries' },
  { label: 'OOM Kills', cmd: 'dmesg | grep -i "oom\|killed process" | tail -10', category: 'Processes & Logs', icon: Activity, description: 'Out-of-memory kills' },
  { label: 'Zombie Procs', cmd: 'ps aux | awk "{if(\$8==\"Z\") print}"', category: 'Processes & Logs', icon: Activity, description: 'Zombie processes' },

  // Git & Dev
  { label: 'Git Status', cmd: 'git status 2>/dev/null || echo "Not a git repo"', category: 'Git & Dev', icon: GitBranch, description: 'Current git status' },
  { label: 'Git Log', cmd: 'git log --oneline -15 2>/dev/null || echo "Not a git repo"', category: 'Git & Dev', icon: GitBranch, description: 'Recent git commits' },
  { label: 'Node Version', cmd: 'node -v 2>/dev/null && npm -v 2>/dev/null || echo "Node not found"', category: 'Git & Dev', icon: Code, description: 'Node.js & npm versions' },
  { label: 'Python Version', cmd: 'python3 --version 2>/dev/null && pip3 --version 2>/dev/null || echo "Python not found"', category: 'Git & Dev', icon: Code, description: 'Python & pip versions' },
  { label: 'Go Version', cmd: 'go version 2>/dev/null || echo "Go not found"', category: 'Git & Dev', icon: Code, description: 'Go version' },
  { label: 'Disk I/O', cmd: 'iostat -x 1 1 2>/dev/null || cat /proc/diskstats', category: 'Git & Dev', icon: HardDrive, description: 'Disk I/O statistics' },

  // Deploy
  { label: '🚀 Full Deploy', cmd: 'cd /home/z/my-project && git pull origin main && echo "✅ Code pulled!" || echo "❌ Git pull failed"', category: 'Deploy', icon: Zap, description: 'Pull latest code from GitHub' },
  { label: 'Git Pull', cmd: 'cd /home/z/my-project && git pull origin main', category: 'Deploy', icon: GitBranch, description: 'Pull latest code from GitHub' },
  { label: 'Git Fetch', cmd: 'cd /home/z/my-project && git fetch origin && git status', category: 'Deploy', icon: GitBranch, description: 'Check for updates' },
  { label: 'Git Log', cmd: 'cd /home/z/my-project && git log --oneline -10', category: 'Deploy', icon: GitBranch, description: 'Recent git commits' },
  { label: 'Git Diff', cmd: 'cd /home/z/my-project && git diff HEAD~1 --stat', category: 'Deploy', icon: GitBranch, description: 'Changes in last commit' },
  { label: 'Restart Dev', cmd: 'cd /home/z/my-project && pkill -f "next dev" ; sleep 2 && nohup next dev -p 3000 > /dev/null 2>&1 & echo "✅ Dev server restarted"', category: 'Deploy', icon: RotateCcw, description: 'Restart Next.js dev server' },
  { label: 'Build Prod', cmd: 'cd /home/z/my-project && npx next build 2>&1 | tail -20', category: 'Deploy', icon: Code, description: 'Run Next.js production build' },
  { label: 'DB Migrate', cmd: 'cd /home/z/my-project && npx prisma db push 2>&1 | tail -10', category: 'Deploy', icon: Database, description: 'Push Prisma schema to DB' },
  { label: 'App Health', cmd: 'curl -s http://localhost:3000/api/health | head -c 500 || echo "App not responding"', category: 'Deploy', icon: Activity, description: 'Check app health endpoint' },
  { label: 'Test Route', cmd: 'curl -s -X POST http://localhost:3000/api/providers/test -H "Content-Type: application/json" -d \'{"provider":"z-ai"}\'', category: 'Deploy', icon: Zap, description: 'Test provider API endpoint' },
  { label: 'Docker Rebuild', cmd: 'cd /home/z/my-project && docker compose down 2>/dev/null; docker compose up -d --build 2>&1 | tail -10 || echo "Docker not configured for this project"', category: 'Deploy', icon: Container, description: 'Rebuild & restart Docker containers' },
  { label: 'Docker Logs', cmd: 'cd /home/z/my-project && docker compose logs --tail=50 2>/dev/null || echo "Docker not configured"', category: 'Deploy', icon: FileText, description: 'Container logs' },
  { label: 'PM2 Status', cmd: 'pm2 list 2>/dev/null || echo "PM2 not installed — app runs via next dev"', category: 'Deploy', icon: Server, description: 'PM2 process status' },
  { label: 'Rollback', cmd: 'cd /home/z/my-project && git log --oneline -5 && echo "Run: git checkout <hash> to rollback"', category: 'Deploy', icon: RotateCcw, description: 'Show recent commits for rollback' },
  { label: 'Clean Install', cmd: 'cd /home/z/my-project && rm -rf node_modules && npm install 2>&1 | tail -5', category: 'Deploy', icon: Trash, description: 'Clean reinstall node_modules' },
]

const commandCategories = ['All', 'System', 'CPU & Memory', 'Disk & Storage', 'Network', 'Docker', 'Security', 'Processes & Logs', 'Git & Dev', 'Deploy']

export function VPSTerminal() {
  const { addToast } = useAgentOSStore()
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [commands, setCommands] = useState<TerminalCommand[]>([])
  const [input, setInput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [showSessionMenu, setShowSessionMenu] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSession, setNewSession] = useState({ name: '', host: 'localhost', port: 22, username: 'root' })
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [favouriteCommands, setFavouriteCommands] = useState<string[]>([])
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false)
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load favourites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agentos-terminal-favourites')
      if (saved) setFavouriteCommands(JSON.parse(saved))
    } catch {}
  }, [])

  // Save favourites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agentos-terminal-favourites', JSON.stringify(favouriteCommands))
    } catch {}
  }, [favouriteCommands])

  useEffect(() => { fetchSessions() }, [])

  useEffect(() => {
    if (activeSessionId) fetchCommands()
  }, [activeSessionId])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/terminal/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id)
        }
      }
    } catch {}
  }

  const fetchCommands = async () => {
    if (!activeSessionId) return
    try {
      const res = await fetch(`/api/terminal/commands?sessionId=${activeSessionId}`)
      if (res.ok) {
        const data = await res.json()
        setCommands(data)
      }
    } catch {}
  }

  const createSession = async () => {
    try {
      const res = await fetch('/api/terminal/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      })
      if (res.ok) {
        const session = await res.json()
        setSessions((prev) => [...prev, session])
        setActiveSessionId(session.id)
        setShowNewSession(false)
        setNewSession({ name: '', host: 'localhost', port: 22, username: 'root' })
        addToast('Terminal session created', 'success')
      }
    } catch {
      addToast('Failed to create session', 'error')
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/terminal/sessions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id))
        if (activeSessionId === id) {
          setActiveSessionId(sessions.find((s) => s.id !== id)?.id || null)
        }
        addToast('Session deleted', 'success')
      }
    } catch {
      addToast('Failed to delete session', 'error')
    }
  }

  const executeCommand = async (cmdOverride?: string) => {
    const cmd = cmdOverride || input.trim()
    if (!cmd || !activeSessionId || isExecuting) return
    if (!cmdOverride) setInput('')
    setIsExecuting(true)
    setCommandHistoryIndex(-1)

    try {
      const res = await fetch('/api/terminal/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, command: cmd }),
      })
      if (res.ok) {
        const result = await res.json()
        setCommands((prev) => [...prev, result])
      }
    } catch {
      addToast('Command execution failed', 'error')
    } finally {
      setIsExecuting(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const historyCmds = commands.map(c => c.command).reverse()
      if (historyCmds.length === 0) return
      const newIndex = Math.min(commandHistoryIndex + 1, historyCmds.length - 1)
      setCommandHistoryIndex(newIndex)
      setInput(historyCmds[newIndex])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (commandHistoryIndex <= 0) {
        setCommandHistoryIndex(-1)
        setInput('')
        return
      }
      const historyCmds = commands.map(c => c.command).reverse()
      const newIndex = commandHistoryIndex - 1
      setCommandHistoryIndex(newIndex)
      setInput(historyCmds[newIndex])
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setCommands([])
    }
  }, [input, commands, commandHistoryIndex, activeSessionId, isExecuting])

  const copyOutput = (id: string, output: string) => {
    navigator.clipboard.writeText(output)
    setCopiedId(id)
    addToast('Output copied to clipboard', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleFavourite = (cmd: string) => {
    setFavouriteCommands(prev =>
      prev.includes(cmd) ? prev.filter(c => c !== cmd) : [...prev, cmd]
    )
  }

  const exportOutput = () => {
    const text = commands.map(c =>
      `$ ${c.command}\n${c.output || ''}${c.exitCode ? `\nexit code: ${c.exitCode}` : ''}\n---`
    ).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terminal-output-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Terminal output exported', 'success')
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const getPrompt = () => {
    if (!activeSession) return '$ '
    return `${activeSession.username}@${activeSession.host}:~$ `
  }

  const filteredCommands = quickCommands.filter(qc => {
    const matchesCategory = selectedCategory === 'All' || qc.category === selectedCategory
    const matchesSearch = !searchQuery || qc.label.toLowerCase().includes(searchQuery.toLowerCase()) || qc.cmd.toLowerCase().includes(searchQuery.toLowerCase()) || qc.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFav = !showFavouritesOnly || favouriteCommands.includes(qc.cmd)
    return matchesCategory && matchesSearch && matchesFav
  })

  const groupedCommands = filteredCommands.reduce((acc, qc) => {
    if (!acc[qc.category]) acc[qc.category] = []
    acc[qc.category].push(qc)
    return acc
  }, {} as Record<string, QuickCommand[]>)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-emerald-400" />
            VPS Terminal
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Execute commands on your VPS directly from AgentOS</p>
        </div>
        <div className="flex items-center gap-2">
          {commands.length > 0 && (
            <>
              <button
                onClick={() => setCommands([])}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1f2b] hover:bg-[#252636] text-[#9ca3af] hover:text-white text-sm rounded-lg border border-[#2d2e3d] transition-colors"
                title="Clear terminal (Ctrl+L)"
              >
                <Trash className="w-3.5 h-3.5" />
                Clear
              </button>
              <button
                onClick={exportOutput}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1f2b] hover:bg-[#252636] text-[#9ca3af] hover:text-white text-sm rounded-lg border border-[#2d2e3d] transition-colors"
                title="Export terminal output"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </>
          )}
          <button
            onClick={() => setShowNewSession(true)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors flex-shrink-0 ${
              activeSessionId === session.id
                ? 'bg-[#1e1f2b] text-white border border-[#2d2e3d]'
                : 'text-[#9ca3af] hover:bg-[#1e1f2b] hover:text-white'
            }`}
          >
            <Server className="w-3 h-3" />
            {session.name}
            <div className={`w-1.5 h-1.5 rounded-full ${
              session.status === 'connected' ? 'bg-emerald-400' : 'bg-[#6b7280]'
            }`} />
            <button
              onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
              className="text-[#6b7280] hover:text-red-400 ml-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div className="bg-[#0a0b0e] border border-[#2d2e3d] rounded-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111218] border-b border-[#2d2e3d]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs text-[#6b7280] font-mono ml-2">
              {activeSession ? `${activeSession.username}@${activeSession.host}` : 'No session'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeSession?.status === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-[#6b7280]" />
            )}
            <span className="text-[10px] text-[#6b7280] font-mono">
              {activeSession ? `${activeSession.commandCount} commands` : '---'}
            </span>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="h-[500px] overflow-y-auto custom-scrollbar p-4 font-mono text-sm space-y-1"
        >
          {!activeSession ? (
            <div className="flex flex-col items-center justify-center h-full text-[#6b7280]">
              <TerminalIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No active terminal session</p>
              <p className="text-xs mt-1">Create a new session to get started</p>
            </div>
          ) : (
            <>
              <div className="text-emerald-400">
                {`AgentOS Terminal v2.1 — Connected to ${activeSession.host}`}
              </div>
              <div className="text-[#6b7280]">
                {`Session: ${activeSession.name} | User: ${activeSession.username} | 50+ quick commands | ↑↓ history | Ctrl+L clear`}
              </div>
              <div className="text-[#4b5563]">{'─'.repeat(60)}</div>

              {commands.map((cmd) => (
                <div key={cmd.id} className="space-y-0.5 group relative">
                  <div className="text-emerald-400">
                    <span className="text-[#6b7280]">{getPrompt()}</span>
                    {cmd.command}
                  </div>
                  {cmd.output && (
                    <div className="relative">
                      <pre className="text-[#d1d5db] whitespace-pre-wrap text-xs leading-relaxed pr-8">
                        {cmd.output}
                      </pre>
                      <button
                        onClick={() => copyOutput(cmd.id, cmd.output)}
                        className="absolute top-0 right-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e1f2b] text-[#6b7280] hover:text-white"
                        title="Copy output"
                      >
                        {copiedId === cmd.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                  {cmd.exitCode !== null && cmd.exitCode !== 0 && (
                    <div className="text-red-400 text-xs">
                      exit code: {cmd.exitCode}
                    </div>
                  )}
                  <div className="text-[#4b5563] text-[10px]">
                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                    {cmd.duration}ms
                  </div>
                </div>
              ))}

              {isExecuting && (
                <div className="text-emerald-400 animate-pulse">
                  <span className="text-[#6b7280]">{getPrompt()}</span>
                  executing...
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Line */}
        {activeSession && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#111218] border-t border-[#2d2e3d]">
            <span className="text-emerald-400 font-mono text-sm">{getPrompt()}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder-[#4b5563]"
              placeholder="Type a command... (↑↓ for history, Ctrl+L to clear)"
              disabled={isExecuting}
              autoFocus
            />
            <button
              onClick={() => executeCommand()}
              disabled={isExecuting || !input.trim()}
              className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Commands Panel */}
      {activeSession && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#9ca3af] flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Quick Commands
              <span className="text-[10px] text-[#4b5563] font-mono">({quickCommands.length} available)</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  showFavouritesOnly
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    : 'bg-[#1e1f2b] text-[#6b7280] border-[#2d2e3d] hover:text-white'
                }`}
              >
                <Star className="w-3 h-3" />
                Favourites
              </button>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4b5563]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-xs text-white outline-none focus:border-emerald-500/50 placeholder-[#4b5563] w-48"
                  placeholder="Search commands..."
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4b5563] hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {commandCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#1e1f2b] text-[#6b7280] border border-[#2d2e3d] hover:text-white hover:bg-[#252636]'
                }`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1 text-[10px] opacity-60">
                    ({quickCommands.filter(qc => qc.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Command Grid */}
          {selectedCategory === 'All' && !searchQuery && !showFavouritesOnly ? (
            // Grouped view when "All" is selected
            <div className="space-y-4">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">{category}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {cmds.map((qc) => (
                      <button
                        key={qc.label}
                        onClick={() => executeCommand(qc.cmd)}
                        className="group/cmd relative px-3 py-2 text-left bg-[#1e1f2b] hover:bg-[#252636] rounded-lg border border-[#2d2e3d] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <qc.icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-[#d1d5db] group-hover/cmd:text-white truncate">{qc.label}</span>
                        </div>
                        <p className="text-[10px] text-[#4b5563] mt-0.5 truncate">{qc.description}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavourite(qc.cmd) }}
                          className="absolute top-1 right-1 opacity-0 group-hover/cmd:opacity-100 transition-opacity"
                        >
                          {favouriteCommands.includes(qc.cmd) ? (
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <Star className="w-3 h-3 text-[#4b5563] hover:text-yellow-400" />
                          )}
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat grid for filtered views
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredCommands.map((qc) => (
                <button
                  key={qc.label}
                  onClick={() => executeCommand(qc.cmd)}
                  className="group/cmd relative px-3 py-2 text-left bg-[#1e1f2b] hover:bg-[#252636] rounded-lg border border-[#2d2e3d] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <qc.icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-[#d1d5db] group-hover/cmd:text-white truncate">{qc.label}</span>
                  </div>
                  <p className="text-[10px] text-[#4b5563] mt-0.5 truncate">{qc.description}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavourite(qc.cmd) }}
                    className="absolute top-1 right-1 opacity-0 group-hover/cmd:opacity-100 transition-opacity"
                  >
                    {favouriteCommands.includes(qc.cmd) ? (
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <Star className="w-3 h-3 text-[#4b5563] hover:text-yellow-400" />
                    )}
                  </button>
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <div className="col-span-full py-6 text-center text-[#4b5563] text-sm">
                  {showFavouritesOnly ? 'No favourite commands yet. Star commands to add them here.' : 'No commands match your search.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New Session Dialog */}
      <AnimatePresence>
        {showNewSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNewSession(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">New Terminal Session</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Session Name</label>
                  <input
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="My VPS"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Host</label>
                    <input
                      value={newSession.host}
                      onChange={(e) => setNewSession({ ...newSession, host: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Port</label>
                    <input
                      type="number"
                      value={newSession.port}
                      onChange={(e) => setNewSession({ ...newSession, port: parseInt(e.target.value) || 22 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Username</label>
                  <input
                    value={newSession.username}
                    onChange={(e) => setNewSession({ ...newSession, username: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    placeholder="root"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewSession(false)}
                  className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSession}
                  disabled={!newSession.name.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
