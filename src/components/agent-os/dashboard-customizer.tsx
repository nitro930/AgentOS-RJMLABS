'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid,
  Palette,
  Sliders,
  Eye,
  Move,
  Plus,
  Minus,
  Activity,
  DollarSign,
  Database,
  List,
  Heart,
  ListTodo,
  Zap,
  FileOutput,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Save,
  Check,
  X,
  Sun,
  Moon,
  Monitor,
  Timer,
  SidebarOpen,
  Layers,
  Maximize2,
  Grid2X2,
  Grid3X3,
  Sparkles,
  Droplets,
  TreePine,
  Clock,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ==========================================
// Types
// ==========================================

interface WidgetData {
  id: string
  type: string
  title: string
  description?: string | null
  size: string
  position: number
  column: number
  row: number
  config: string
  isActive: boolean
  isBuiltIn: boolean
  icon: string
  createdAt: string
  updatedAt: string
}

interface PreferenceData {
  id: string
  key: string
  value: string
  category: string
  createdAt: string
  updatedAt: string
}

interface ThemePreset {
  name: string
  primary: string
  accent: string
  background: string
  card: string
  text: string
  icon: React.ElementType
}

// ==========================================
// Widget type definitions
// ==========================================

const WIDGET_DEFINITIONS = [
  {
    type: 'agent_status',
    title: 'Agent Status',
    description: 'Real-time status of all agents with health indicators',
    icon: Activity,
    size: 'medium' as const,
    category: 'Monitoring',
  },
  {
    type: 'cost_summary',
    title: 'Cost Summary',
    description: 'Token usage and cost tracking overview',
    icon: DollarSign,
    size: 'small' as const,
    category: 'Analytics',
  },
  {
    type: 'memory_stats',
    title: 'Memory Stats',
    description: 'Memory vault usage and storage metrics',
    icon: Database,
    size: 'small' as const,
    category: 'Analytics',
  },
  {
    type: 'activity_feed',
    title: 'Activity Feed',
    description: 'Live stream of agent activities and events',
    icon: List,
    size: 'large' as const,
    category: 'Monitoring',
  },
  {
    type: 'health_monitor',
    title: 'Health Monitor',
    description: 'System health metrics and alert status',
    icon: Heart,
    size: 'medium' as const,
    category: 'System',
  },
  {
    type: 'task_queue',
    title: 'Task Queue',
    description: 'Pending and running tasks across all agents',
    icon: ListTodo,
    size: 'medium' as const,
    category: 'Monitoring',
  },
  {
    type: 'quick_actions',
    title: 'Quick Actions',
    description: 'Shortcuts to common actions and commands',
    icon: Zap,
    size: 'small' as const,
    category: 'Productivity',
  },
  {
    type: 'recent_outputs',
    title: 'Recent Outputs',
    description: 'Latest outputs from agent executions',
    icon: FileOutput,
    size: 'medium' as const,
    category: 'Productivity',
  },
]

const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Cyberpunk',
    primary: '#10b981',
    accent: '#34d399',
    background: '#0f1117',
    card: '#1a1b2e',
    text: '#ffffff',
    icon: Sparkles,
  },
  {
    name: 'Ocean',
    primary: '#0ea5e9',
    accent: '#38bdf8',
    background: '#0c1222',
    card: '#1a2332',
    text: '#e0f2fe',
    icon: Droplets,
  },
  {
    name: 'Midnight',
    primary: '#8b5cf6',
    accent: '#a78bfa',
    background: '#0a0a0f',
    card: '#161622',
    text: '#e2e8f0',
    icon: Moon,
  },
  {
    name: 'Forest',
    primary: '#22c55e',
    accent: '#4ade80',
    background: '#0a140a',
    card: '#142014',
    text: '#dcfce7',
    icon: TreePine,
  },
]

const TABS = [
  { id: 'widgets', label: 'Widgets', icon: LayoutGrid },
  { id: 'layout', label: 'Layout', icon: Grid2X2 },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
]

// ==========================================
// Main Component
// ==========================================

export function DashboardCustomizer() {
  const { dashboardTab, setDashboardTab } = useAgentOSStore()
  const [widgets, setWidgets] = useState<WidgetData[]>([])
  const [preferences, setPreferences] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  // Theme state
  const [themeColors, setThemeColors] = useState({
    primary: '#10b981',
    accent: '#34d399',
    background: '#0f1117',
    card: '#1a1b2e',
    text: '#ffffff',
  })
  const [activePreset, setActivePreset] = useState('Cyberpunk')

  // Preference state
  const [prefCompact, setPrefCompact] = useState(false)
  const [prefLayerBadges, setPrefLayerBadges] = useState(true)
  const [prefAnimSpeed, setPrefAnimSpeed] = useState(1)
  const [prefDefaultSection, setPrefDefaultSection] = useState('mission-control')
  const [prefRefreshInterval, setPrefRefreshInterval] = useState(30)
  const [prefSidebarDefault, setPrefSidebarDefault] = useState<'expanded' | 'collapsed'>('expanded')

  const fetchWidgets = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard-widgets')
      if (res.ok) {
        const data = await res.json()
        setWidgets(data.widgets || [])
      }
    } catch (err) {
      console.error('Failed to fetch widgets:', err)
    }
  }, [])

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard-preferences')
      if (res.ok) {
        const data = await res.json()
        const prefsMap: Record<string, unknown> = {}
        for (const p of data.preferences || []) {
          try {
            prefsMap[p.key] = JSON.parse(p.value)
          } catch {
            prefsMap[p.key] = p.value
          }
        }
        setPreferences(prefsMap)

        // Apply saved preferences
        if (prefsMap.compactMode !== undefined) setPrefCompact(!!prefsMap.compactMode)
        if (prefsMap.showLayerBadges !== undefined) setPrefLayerBadges(!!prefsMap.showLayerBadges)
        if (prefsMap.animationSpeed !== undefined) setPrefAnimSpeed(prefsMap.animationSpeed as number)
        if (prefsMap.defaultSection) setPrefDefaultSection(prefsMap.defaultSection as string)
        if (prefsMap.autoRefreshInterval !== undefined) setPrefRefreshInterval(prefsMap.autoRefreshInterval as number)
        if (prefsMap.sidebarDefault) setPrefSidebarDefault(prefsMap.sidebarDefault as 'expanded' | 'collapsed')

        if (prefsMap.themeColors) {
          const tc = prefsMap.themeColors as Record<string, string>
          setThemeColors({
            primary: tc.primary || '#10b981',
            accent: tc.accent || '#34d399',
            background: tc.background || '#0f1117',
            card: tc.card || '#1a1b2e',
            text: tc.text || '#ffffff',
          })
        }
        if (prefsMap.themePreset) {
          setActivePreset(prefsMap.themePreset as string)
        }
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await Promise.all([fetchWidgets(), fetchPreferences()])
      setIsLoading(false)
    }
    init()
  }, [fetchWidgets, fetchPreferences])

  const toggleWidget = async (type: string) => {
    const existing = widgets.find((w) => w.type === type)
    if (existing) {
      const res = await fetch(`/api/dashboard-widgets/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !existing.isActive }),
      })
      if (res.ok) {
        const data = await res.json()
        setWidgets((prev) =>
          prev.map((w) => (w.id === existing.id ? data.widget : w))
        )
      }
    } else {
      const def = WIDGET_DEFINITIONS.find((d) => d.type === type)
      if (!def) return
      const res = await fetch('/api/dashboard-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: def.type,
          title: def.title,
          description: def.description,
          size: def.size,
          icon: '📊',
          isBuiltIn: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setWidgets((prev) => [...prev, data.widget])
      }
    }
  }

  const updateWidgetPosition = async (id: string, updates: Partial<WidgetData>) => {
    const res = await fetch(`/api/dashboard-widgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? data.widget : w))
      )
    }
  }

  const saveTheme = async () => {
    setSaving(true)
    try {
      await fetch('/api/dashboard-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: [
            { key: 'themeColors', value: themeColors, category: 'theme' },
            { key: 'themePreset', value: activePreset, category: 'theme' },
          ],
        }),
      })
    } catch (err) {
      console.error('Failed to save theme:', err)
    }
    setSaving(false)
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      await fetch('/api/dashboard-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: [
            { key: 'compactMode', value: prefCompact, category: 'preferences' },
            { key: 'showLayerBadges', value: prefLayerBadges, category: 'preferences' },
            { key: 'animationSpeed', value: prefAnimSpeed, category: 'preferences' },
            { key: 'defaultSection', value: prefDefaultSection, category: 'preferences' },
            { key: 'autoRefreshInterval', value: prefRefreshInterval, category: 'preferences' },
            { key: 'sidebarDefault', value: prefSidebarDefault, category: 'preferences' },
          ],
        }),
      })
    } catch (err) {
      console.error('Failed to save preferences:', err)
    }
    setSaving(false)
  }

  const applyPreset = (preset: ThemePreset) => {
    setActivePreset(preset.name)
    setThemeColors({
      primary: preset.primary,
      accent: preset.accent,
      background: preset.background,
      card: preset.card,
      text: preset.text,
    })
  }

  const isWidgetActive = (type: string) => {
    const w = widgets.find((w) => w.type === type)
    return w ? w.isActive : false
  }

  const activeTab = dashboardTab || 'widgets'

  // Grid layout calculations
  const activeWidgets = widgets.filter((w) => w.isActive).sort((a, b) => a.position - b.position)
  const GRID_COLS = 4

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            Dashboard Customizer
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">
            Personalize your AgentOS dashboard layout, widgets, and appearance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchWidgets(); fetchPreferences() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] transition-colors text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#1a1b2e] rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDashboardTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'widgets' && (
            <WidgetsTab
              widgets={widgets}
              isWidgetActive={isWidgetActive}
              toggleWidget={toggleWidget}
              updateWidgetPosition={updateWidgetPosition}
              draggedWidget={draggedWidget}
              setDraggedWidget={setDraggedWidget}
            />
          )}
          {activeTab === 'layout' && (
            <LayoutTab
              activeWidgets={activeWidgets}
              updateWidgetPosition={updateWidgetPosition}
              GRID_COLS={GRID_COLS}
            />
          )}
          {activeTab === 'themes' && (
            <ThemesTab
              themeColors={themeColors}
              setThemeColors={setThemeColors}
              activePreset={activePreset}
              applyPreset={applyPreset}
              saveTheme={saveTheme}
              saving={saving}
            />
          )}
          {activeTab === 'preferences' && (
            <PreferencesTab
              prefCompact={prefCompact}
              setPrefCompact={setPrefCompact}
              prefLayerBadges={prefLayerBadges}
              setPrefLayerBadges={setPrefLayerBadges}
              prefAnimSpeed={prefAnimSpeed}
              setPrefAnimSpeed={setPrefAnimSpeed}
              prefDefaultSection={prefDefaultSection}
              setPrefDefaultSection={setPrefDefaultSection}
              prefRefreshInterval={prefRefreshInterval}
              setPrefRefreshInterval={setPrefRefreshInterval}
              prefSidebarDefault={prefSidebarDefault}
              setPrefSidebarDefault={setPrefSidebarDefault}
              savePreferences={savePreferences}
              saving={saving}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// Widgets Tab
// ==========================================

function WidgetsTab({
  widgets,
  isWidgetActive,
  toggleWidget,
  updateWidgetPosition,
  draggedWidget,
  setDraggedWidget,
}: {
  widgets: WidgetData[]
  isWidgetActive: (type: string) => boolean
  toggleWidget: (type: string) => void
  updateWidgetPosition: (id: string, updates: Partial<WidgetData>) => void
  draggedWidget: string | null
  setDraggedWidget: (id: string | null) => void
}) {
  const categories = [...new Set(WIDGET_DEFINITIONS.map((d) => d.category))]

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Available', value: WIDGET_DEFINITIONS.length, color: 'text-emerald-400' },
          { label: 'Active', value: widgets.filter((w) => w.isActive).length, color: 'text-emerald-400' },
          { label: 'Inactive', value: widgets.filter((w) => !w.isActive).length, color: 'text-[#6b7280]' },
          { label: 'Built-in', value: WIDGET_DEFINITIONS.length, color: 'text-[#9ca3af]' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1a1b2e] rounded-lg p-3 border border-[#2d2e3d]"
          >
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Widget Categories */}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WIDGET_DEFINITIONS.filter((d) => d.category === category).map((def) => {
              const active = isWidgetActive(def.type)
              const widgetData = widgets.find((w) => w.type === def.type)
              const IconComp = def.icon

              return (
                <motion.div
                  key={def.type}
                  layout
                  className={`relative bg-[#1a1b2e] rounded-lg border transition-all ${
                    active
                      ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : 'border-[#2d2e3d] opacity-60'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Drag Handle */}
                        <div
                          className={`mt-0.5 cursor-grab active:cursor-grabbing text-[#4b5563] hover:text-[#9ca3af] transition-colors ${
                            draggedWidget === def.type ? 'text-emerald-400' : ''
                          }`}
                          onMouseDown={() => setDraggedWidget(def.type)}
                          onMouseUp={() => setDraggedWidget(null)}
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-[#252636] text-[#6b7280]'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {def.title}
                            </h4>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                def.size === 'small'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : def.size === 'large'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-[#252636] text-[#9ca3af]'
                              }`}
                            >
                              {def.size}
                            </span>
                          </div>
                          <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">
                            {def.description}
                          </p>
                          {widgetData && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[9px] font-mono text-[#4b5563]">
                                Col {widgetData.column} · Row {widgetData.row}
                              </span>
                              {widgetData.position > 0 && (
                                <span className="text-[9px] font-mono text-[#4b5563]">
                                  · Pos {widgetData.position}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleWidget(def.type)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {active ? (
                          <ToggleRight className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-[#4b5563]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Active indicator bar */}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/50 rounded-b-lg" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ==========================================
// Layout Tab
// ==========================================

function LayoutTab({
  activeWidgets,
  updateWidgetPosition,
  GRID_COLS,
}: {
  activeWidgets: WidgetData[]
  updateWidgetPosition: (id: string, updates: Partial<WidgetData>) => void
  GRID_COLS: number
}) {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'grid' | 'list'>('grid')

  // Build grid layout
  const gridRows = Math.max(4, Math.ceil(activeWidgets.length / GRID_COLS) + 1)
  const gridCells: (WidgetData | null)[][] = Array.from({ length: gridRows }, () =>
    Array.from({ length: GRID_COLS }, () => null)
  )

  // Place widgets in grid
  activeWidgets.forEach((widget) => {
    const row = Math.min(widget.row, gridRows - 1)
    const col = Math.min(widget.column, GRID_COLS - 1)
    const colSpan = widget.size === 'large' ? 2 : 1
    const rowSpan = widget.size === 'large' ? 2 : 1

    for (let r = row; r < Math.min(row + rowSpan, gridRows); r++) {
      for (let c = col; c < Math.min(col + colSpan, GRID_COLS); c++) {
        if (!gridCells[r][c]) {
          gridCells[r][c] = widget
        }
      }
    }
  })

  const selected = activeWidgets.find((w) => w.id === selectedWidget)

  const moveWidget = (id: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const widget = activeWidgets.find((w) => w.id === id)
    if (!widget) return

    const updates: Partial<WidgetData> = {}
    switch (direction) {
      case 'up':
        updates.row = Math.max(0, widget.row - 1)
        break
      case 'down':
        updates.row = widget.row + 1
        break
      case 'left':
        updates.column = Math.max(0, widget.column - 1)
        break
      case 'right':
        updates.column = Math.min(GRID_COLS - 1, widget.column + 1)
        break
    }
    updateWidgetPosition(id, updates)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Grid Layout</h3>
          <span className="text-xs text-[#6b7280]">{activeWidgets.length} widgets</span>
        </div>
        <div className="flex items-center gap-1 bg-[#1a1b2e] rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              previewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#6b7280] hover:text-white'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              previewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#6b7280] hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {previewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-1.5">
          {/* Column Headers */}
          {Array.from({ length: GRID_COLS }).map((_, i) => (
            <div key={`col-${i}`} className="text-center text-[9px] font-mono text-[#4b5563] pb-1">
              Col {i}
            </div>
          ))}

          {/* Grid Cells */}
          {gridCells.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              if (cell) {
                const colSpan = cell.size === 'large' ? 2 : 1
                const isStartCell = cell.row === rowIdx && cell.column === colIdx

                if (!isStartCell && cell.size === 'large') return null

                return (
                  <motion.div
                    key={`${rowIdx}-${colIdx}`}
                    layout
                    className={`${colSpan > 1 ? 'col-span-2' : ''} ${
                      selectedWidget === cell.id
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-[#1a1b2e] border-[#2d2e3d] hover:border-[#4b5563]'
                    } border rounded-lg p-2 cursor-pointer transition-all min-h-[60px] flex flex-col items-center justify-center gap-1`}
                    style={{ gridRow: rowIdx + 1, gridColumn: `${colIdx + 1} / span ${colSpan}` }}
                    onClick={() => setSelectedWidget(cell.id === selectedWidget ? null : cell.id)}
                  >
                    <span className="text-lg">{cell.icon}</span>
                    <span className="text-[10px] text-[#9ca3af] text-center truncate w-full">
                      {cell.title}
                    </span>
                    <span className={`text-[8px] font-mono px-1 rounded ${
                      cell.size === 'small'
                        ? 'bg-blue-500/20 text-blue-400'
                        : cell.size === 'large'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-[#252636] text-[#6b7280]'
                    }`}>
                      {cell.size}
                    </span>
                  </motion.div>
                )
              }

              // Empty cell
              return (
                <div
                  key={`empty-${rowIdx}-${colIdx}`}
                  className="bg-[#0f1117] border border-dashed border-[#2d2e3d] rounded-lg min-h-[60px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-[#2d2e3d]" />
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {activeWidgets.map((widget, idx) => (
            <motion.div
              key={widget.id}
              layout
              className={`flex items-center gap-3 bg-[#1a1b2e] rounded-lg border p-3 transition-all ${
                selectedWidget === widget.id
                  ? 'border-emerald-500/50'
                  : 'border-[#2d2e3d]'
              }`}
              onClick={() => setSelectedWidget(widget.id === selectedWidget ? null : widget.id)}
            >
              <span className="text-[#4b5563] font-mono text-xs w-6 text-center">{idx + 1}</span>
              <span className="text-lg">{widget.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{widget.title}</p>
                <p className="text-[10px] text-[#6b7280]">
                  Col {widget.column} · Row {widget.row} · {widget.size}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); moveWidget(widget.id, 'up') }}
                  className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveWidget(widget.id, 'down') }}
                  className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {activeWidgets.length === 0 && (
            <div className="text-center py-8 text-[#6b7280]">
              <Grid2X2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active widgets</p>
              <p className="text-xs">Enable widgets from the Widgets tab</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Widget Detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1a1b2e] rounded-lg border border-emerald-500/30 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-lg">{selected.icon}</span>
                {selected.title}
              </h4>
              <button onClick={() => setSelectedWidget(null)} className="text-[#6b7280] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Column</label>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => updateWidgetPosition(selected.id, { column: Math.max(0, selected.column - 1) })}
                    className="p-1 rounded bg-[#252636] hover:bg-[#2d2e3d] text-[#9ca3af] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono text-white w-6 text-center">{selected.column}</span>
                  <button
                    onClick={() => updateWidgetPosition(selected.id, { column: Math.min(3, selected.column + 1) })}
                    className="p-1 rounded bg-[#252636] hover:bg-[#2d2e3d] text-[#9ca3af] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Row</label>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => updateWidgetPosition(selected.id, { row: Math.max(0, selected.row - 1) })}
                    className="p-1 rounded bg-[#252636] hover:bg-[#2d2e3d] text-[#9ca3af] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono text-white w-6 text-center">{selected.row}</span>
                  <button
                    onClick={() => updateWidgetPosition(selected.id, { row: selected.row + 1 })}
                    className="p-1 rounded bg-[#252636] hover:bg-[#2d2e3d] text-[#9ca3af] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Size</label>
                <div className="flex items-center gap-1 mt-1">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateWidgetPosition(selected.id, { size })}
                      className={`text-[10px] px-2 py-1 rounded transition-colors ${
                        selected.size === size
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-[#252636] text-[#6b7280] hover:text-white'
                      }`}
                    >
                      {size.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Position</label>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => updateWidgetPosition(selected.id, { position: Math.max(0, selected.position - 1) })}
                    className="p-1 rounded bg-[#252636] hover:bg-[#2d2e3d] text-[#9ca3af] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono text-white w-6 text-center">{selected.position}</span>
                  <button
                    onClick={() => updateWidgetPosition(selected.id, { position: selected.position + 1 })}
                    className="p-1 rounded bg-[#252636] hover:bg-[#2d2e3d] text-[#9ca3af] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// Themes Tab
// ==========================================

function ThemesTab({
  themeColors,
  setThemeColors,
  activePreset,
  applyPreset,
  saveTheme,
  saving,
}: {
  themeColors: Record<string, string>
  setThemeColors: (colors: Record<string, string>) => void
  activePreset: string
  applyPreset: (preset: ThemePreset) => void
  saveTheme: () => void
  saving: boolean
}) {
  const colorFields = [
    { key: 'primary', label: 'Primary Color' },
    { key: 'accent', label: 'Accent Color' },
    { key: 'background', label: 'Background' },
    { key: 'card', label: 'Card Color' },
    { key: 'text', label: 'Text Color' },
  ]

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Preset Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => {
            const IconComp = preset.icon
            const isActive = activePreset === preset.name
            return (
              <motion.button
                key={preset.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => applyPreset(preset)}
                className={`relative rounded-lg border p-3 text-left transition-all ${
                  isActive
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'border-[#2d2e3d] hover:border-[#4b5563]'
                }`}
                style={{ backgroundColor: preset.background }}
              >
                {/* Mini color preview */}
                <div className="flex gap-1 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.accent }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.card }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <IconComp className="w-3.5 h-3.5" style={{ color: preset.primary }} />
                  <span className="text-xs font-semibold" style={{ color: preset.text }}>
                    {preset.name}
                  </span>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="theme-active"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Custom Colors</h3>
        <div className="bg-[#1a1b2e] rounded-lg border border-[#2d2e3d] p-4 space-y-4">
          {colorFields.map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <div className="w-20 flex-shrink-0">
                <label className="text-xs text-[#9ca3af]">{field.label}</label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={themeColors[field.key] || '#000000'}
                  onChange={(e) =>
                    setThemeColors({ ...themeColors, [field.key]: e.target.value })
                  }
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#2d2e3d] bg-transparent"
                />
                <input
                  type="text"
                  value={themeColors[field.key] || '#000000'}
                  onChange={(e) =>
                    setThemeColors({ ...themeColors, [field.key]: e.target.value })
                  }
                  className="flex-1 bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Preview</h3>
        <div
          className="rounded-lg border border-[#2d2e3d] overflow-hidden"
          style={{ backgroundColor: themeColors.background }}
        >
          {/* Preview Header */}
          <div
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{ backgroundColor: themeColors.card, borderColor: `${themeColors.primary}20` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.primary }} />
              <span className="text-xs font-semibold" style={{ color: themeColors.text }}>
                AgentOS Dashboard
              </span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.accent }} />
            </div>
          </div>

          {/* Preview Grid */}
          <div className="p-3 grid grid-cols-3 gap-2">
            {[
              { title: 'Agent Status', wide: false },
              { title: 'Cost', wide: false },
              { title: 'Memory', wide: false },
              { title: 'Activity Feed', wide: true },
            ].map((item, i) => (
              <div
                key={i}
                className={`rounded-lg p-2.5 ${item.wide ? 'col-span-2' : ''}`}
                style={{ backgroundColor: themeColors.card }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                  <span className="text-[10px] font-medium" style={{ color: themeColors.text }}>
                    {item.title}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: `${themeColors.primary}20` }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: themeColors.primary,
                        width: `${60 + Math.random() * 30}%`,
                      }}
                    />
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: `${themeColors.primary}10` }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: themeColors.accent,
                        width: `${30 + Math.random() * 40}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveTheme}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full"
            />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Theme
        </button>
      </div>
    </div>
  )
}

// ==========================================
// Preferences Tab
// ==========================================

function PreferencesTab({
  prefCompact,
  setPrefCompact,
  prefLayerBadges,
  setPrefLayerBadges,
  prefAnimSpeed,
  setPrefAnimSpeed,
  prefDefaultSection,
  setPrefDefaultSection,
  prefRefreshInterval,
  setPrefRefreshInterval,
  prefSidebarDefault,
  setPrefSidebarDefault,
  savePreferences,
  saving,
}: {
  prefCompact: boolean
  setPrefCompact: (v: boolean) => void
  prefLayerBadges: boolean
  setPrefLayerBadges: (v: boolean) => void
  prefAnimSpeed: number
  setPrefAnimSpeed: (v: number) => void
  prefDefaultSection: string
  setPrefDefaultSection: (v: string) => void
  prefRefreshInterval: number
  setPrefRefreshInterval: (v: number) => void
  prefSidebarDefault: 'expanded' | 'collapsed'
  setPrefSidebarDefault: (v: 'expanded' | 'collapsed') => void
  savePreferences: () => void
  saving: boolean
}) {
  const sectionOptions = [
    'mission-control',
    'agents',
    'memory',
    'brain',
    'workflows',
    'production',
    'swarm',
    'analytics',
  ]

  return (
    <div className="space-y-6">
      {/* Display Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          Display
        </h3>
        <div className="bg-[#1a1b2e] rounded-lg border border-[#2d2e3d] divide-y divide-[#2d2e3d]">
          {/* Compact Mode */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-white">Compact Mode</p>
              <p className="text-xs text-[#6b7280]">Reduce padding and spacing for denser layout</p>
            </div>
            <button onClick={() => setPrefCompact(!prefCompact)}>
              {prefCompact ? (
                <ToggleRight className="w-7 h-7 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-[#4b5563]" />
              )}
            </button>
          </div>

          {/* Layer Badges */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-white">Show Layer Badges</p>
              <p className="text-xs text-[#6b7280]">Display architecture layer tags (L0, L4++, etc.)</p>
            </div>
            <button onClick={() => setPrefLayerBadges(!prefLayerBadges)}>
              {prefLayerBadges ? (
                <ToggleRight className="w-7 h-7 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-[#4b5563]" />
              )}
            </button>
          </div>

          {/* Sidebar Default */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-white">Sidebar Default State</p>
              <p className="text-xs text-[#6b7280]">Choose whether sidebar starts expanded or collapsed</p>
            </div>
            <div className="flex items-center gap-1 bg-[#0f1117] rounded-lg p-1">
              <button
                onClick={() => setPrefSidebarDefault('expanded')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  prefSidebarDefault === 'expanded'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-[#6b7280] hover:text-white'
                }`}
              >
                <SidebarOpen className="w-3.5 h-3.5" />
                Open
              </button>
              <button
                onClick={() => setPrefSidebarDefault('collapsed')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  prefSidebarDefault === 'collapsed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-[#6b7280] hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Collapsed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Behavior
        </h3>
        <div className="bg-[#1a1b2e] rounded-lg border border-[#2d2e3d] divide-y divide-[#2d2e3d]">
          {/* Animation Speed */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white">Animation Speed</p>
                <p className="text-xs text-[#6b7280]">Control transition and animation duration</p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                {prefAnimSpeed}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#6b7280]">Slow</span>
              <input
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={prefAnimSpeed}
                onChange={(e) => setPrefAnimSpeed(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-[#2d2e3d] rounded-full appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[10px] text-[#6b7280]">Fast</span>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white">Auto-Refresh Interval</p>
                <p className="text-xs text-[#6b7280]">How often dashboard data refreshes automatically</p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                {prefRefreshInterval}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[10, 30, 60, 120, 300].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setPrefRefreshInterval(interval)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    prefRefreshInterval === interval
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-[#252636] text-[#6b7280] hover:text-white'
                  }`}
                >
                  {interval >= 60 ? `${interval / 60}m` : `${interval}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Default Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white">Default Section</p>
                <p className="text-xs text-[#6b7280]">Section shown when dashboard loads</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sectionOptions.map((section) => (
                <button
                  key={section}
                  onClick={() => setPrefDefaultSection(section)}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    prefDefaultSection === section
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-[#252636] text-[#6b7280] hover:text-white'
                  }`}
                >
                  {section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setPrefCompact(false)
            setPrefLayerBadges(true)
            setPrefAnimSpeed(1)
            setPrefDefaultSection('mission-control')
            setPrefRefreshInterval(30)
            setPrefSidebarDefault('expanded')
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] transition-colors text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full"
            />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  )
}
