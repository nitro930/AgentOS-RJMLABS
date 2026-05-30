'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  RotateCcw,
  Palette,
  Bell,
  Database,
  Shield,
  Globe,
  Cpu,
  Clock,
  Zap,
  Monitor,
  CheckCircle,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface SettingsConfig {
  general: {
    systemName: string
    timezone: string
    language: string
    autoSeed: boolean
  }
  appearance: {
    theme: string
    sidebarDefault: string
    compactMode: boolean
    animations: boolean
  }
  notifications: {
    desktopNotifications: boolean
    soundAlerts: boolean
    digestFrequency: string
    quietHoursStart: string
    quietHoursEnd: string
  }
  performance: {
    pollingInterval: number
    maxMemoryEntries: number
    autoBackupDays: number
    logRetentionDays: number
  }
  security: {
    sessionTimeout: number
    apiRateLimit: number
    encryptionEnabled: boolean
    auditLogging: boolean
  }
  advanced: {
    debugMode: boolean
    experimentalFeatures: boolean
    customCssUrl: string
  }
}

const defaultSettings: SettingsConfig = {
  general: { systemName: 'AgentOS', timezone: 'UTC', language: 'en', autoSeed: true },
  appearance: { theme: 'dark', sidebarDefault: 'expanded', compactMode: false, animations: true },
  notifications: { desktopNotifications: true, soundAlerts: false, digestFrequency: 'daily', quietHoursStart: '22:00', quietHoursEnd: '08:00' },
  performance: { pollingInterval: 30, maxMemoryEntries: 10000, autoBackupDays: 7, logRetentionDays: 90 },
  security: { sessionTimeout: 60, apiRateLimit: 100, encryptionEnabled: true, auditLogging: true },
  advanced: { debugMode: false, experimentalFeatures: false, customCssUrl: '' },
}

export function SettingsPage() {
  const { addToast } = useAgentOSStore()
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings)
  const [activeSection, setActiveSection] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load from SystemConfig in the future
    const saved = localStorage.getItem('agentos-settings')
    if (saved) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(saved) }) } catch {}
    }
  }, [])

  const updateSetting = (section: keyof SettingsConfig, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    localStorage.setItem('agentos-settings', JSON.stringify(settings))
    setHasChanges(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    addToast('Settings saved', 'success')
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
    addToast('Settings reset to defaults', 'info')
  }

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Cpu },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Settings
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Configure your AgentOS instance</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="w-3 h-3" />Saved
            </motion.span>
          )}
          <button onClick={resetSettings} className="flex items-center gap-2 px-3 py-2 bg-[#1e1f2b] text-[#9ca3af] hover:text-white text-sm rounded-lg border border-[#2d2e3d] transition-colors">
            <RotateCcw className="w-4 h-4" />Reset
          </button>
          <button onClick={saveSettings} disabled={!hasChanges} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Section Nav */}
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeSection === section.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-[#9ca3af] hover:bg-[#1e1f2b] hover:text-white'
              }`}>
                <Icon className="w-4 h-4" />{section.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-6 space-y-6">
          {activeSection === 'general' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">General Settings</h3>
              {[
                { key: 'systemName', label: 'System Name', type: 'text', desc: 'The display name for your AgentOS instance' },
                { key: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'US/Eastern', 'US/Pacific', 'Europe/London', 'Asia/Tokyo'], desc: 'Timezone for scheduled tasks and timestamps' },
                { key: 'language', label: 'Language', type: 'select', options: ['en', 'es', 'fr', 'de', 'ja', 'zh'], desc: 'Interface language' },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm text-white font-medium">{field.label}</label>
                  <p className="text-xs text-[#6b7280]">{field.desc}</p>
                  {field.type === 'text' ? (
                    <input value={(settings.general as any)[field.key]} onChange={(e) => updateSetting('general', field.key, e.target.value)} className="w-full max-w-md px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
                  ) : (
                    <select value={(settings.general as any)[field.key]} onChange={(e) => updateSetting('general', field.key, e.target.value)} className="w-full max-w-md px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500">
                      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm text-white font-medium">Auto-seed database</p><p className="text-xs text-[#6b7280]">Automatically seed sample data on first load</p></div>
                <button onClick={() => updateSetting('general', 'autoSeed', !settings.general.autoSeed)} className={`w-10 h-5 rounded-full transition-colors ${settings.general.autoSeed ? 'bg-emerald-500' : 'bg-[#252636]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.general.autoSeed ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">Appearance</h3>
              {[
                { key: 'theme', label: 'Theme', type: 'select', options: ['dark', 'light', 'system'], desc: 'Application color theme' },
                { key: 'sidebarDefault', label: 'Sidebar Default', type: 'select', options: ['expanded', 'collapsed'], desc: 'Default sidebar state on load' },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm text-white font-medium">{field.label}</label>
                  <p className="text-xs text-[#6b7280]">{field.desc}</p>
                  <select value={(settings.appearance as any)[field.key]} onChange={(e) => updateSetting('appearance', field.key, e.target.value)} className="w-full max-w-md px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500">
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[
                { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce padding and spacing throughout the UI' },
                { key: 'animations', label: 'Animations', desc: 'Enable transition animations and motion effects' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-white font-medium">{field.label}</p><p className="text-xs text-[#6b7280]">{field.desc}</p></div>
                  <button onClick={() => updateSetting('appearance', field.key, !(settings.appearance as any)[field.key])} className={`w-10 h-5 rounded-full transition-colors ${(settings.appearance as any)[field.key] ? 'bg-emerald-500' : 'bg-[#252636]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${(settings.appearance as any)[field.key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
              {[
                { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Show browser notifications for important events' },
                { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play audio for critical alerts' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-white font-medium">{field.label}</p><p className="text-xs text-[#6b7280]">{field.desc}</p></div>
                  <button onClick={() => updateSetting('notifications', field.key, !(settings.notifications as any)[field.key])} className={`w-10 h-5 rounded-full transition-colors ${(settings.notifications as any)[field.key] ? 'bg-emerald-500' : 'bg-[#252636]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${(settings.notifications as any)[field.key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
              {[
                { key: 'digestFrequency', label: 'Digest Frequency', type: 'select', options: ['realtime', 'hourly', 'daily', 'weekly'], desc: 'How often to receive notification digests' },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm text-white font-medium">{field.label}</label>
                  <p className="text-xs text-[#6b7280]">{field.desc}</p>
                  <select value={(settings.notifications as any)[field.key]} onChange={(e) => updateSetting('notifications', field.key, e.target.value)} className="w-full max-w-md px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500">
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-white font-medium">Quiet Hours Start</label>
                  <input type="time" value={settings.notifications.quietHoursStart} onChange={(e) => updateSetting('notifications', 'quietHoursStart', e.target.value)} className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-white font-medium">Quiet Hours End</label>
                  <input type="time" value={settings.notifications.quietHoursEnd} onChange={(e) => updateSetting('notifications', 'quietHoursEnd', e.target.value)} className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">Performance Tuning</h3>
              {[
                { key: 'pollingInterval', label: 'Polling Interval (seconds)', desc: 'How often to refresh dashboard data', min: 5, max: 300 },
                { key: 'maxMemoryEntries', label: 'Max Memory Entries', desc: 'Maximum number of entries in the memory vault', min: 100, max: 100000 },
                { key: 'autoBackupDays', label: 'Auto-backup Interval (days)', desc: 'Days between automatic system backups', min: 1, max: 30 },
                { key: 'logRetentionDays', label: 'Log Retention (days)', desc: 'How long to keep audit and activity logs', min: 7, max: 365 },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white font-medium">{field.label}</label>
                    <span className="text-sm text-emerald-400 font-mono">{(settings.performance as any)[field.key]}</span>
                  </div>
                  <p className="text-xs text-[#6b7280]">{field.desc}</p>
                  <input type="range" min={field.min} max={field.max} value={(settings.performance as any)[field.key]} onChange={(e) => updateSetting('performance', field.key, parseInt(e.target.value))} className="w-full max-w-md accent-emerald-500" />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">Security Settings</h3>
              {[
                { key: 'sessionTimeout', label: 'Session Timeout (minutes)', desc: 'Minutes of inactivity before session expires', min: 5, max: 480 },
                { key: 'apiRateLimit', label: 'API Rate Limit (req/min)', desc: 'Maximum API requests per minute', min: 10, max: 1000 },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between"><label className="text-sm text-white font-medium">{field.label}</label><span className="text-sm text-emerald-400 font-mono">{(settings.security as any)[field.key]}</span></div>
                  <p className="text-xs text-[#6b7280]">{field.desc}</p>
                  <input type="range" min={field.min} max={field.max} value={(settings.security as any)[field.key]} onChange={(e) => updateSetting('security', field.key, parseInt(e.target.value))} className="w-full max-w-md accent-emerald-500" />
                </div>
              ))}
              {[
                { key: 'encryptionEnabled', label: 'API Key Encryption', desc: 'Encrypt stored API keys with AES-256-CBC' },
                { key: 'auditLogging', label: 'Audit Logging', desc: 'Log all system actions for compliance and debugging' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-white font-medium">{field.label}</p><p className="text-xs text-[#6b7280]">{field.desc}</p></div>
                  <button onClick={() => updateSetting('security', field.key, !(settings.security as any)[field.key])} className={`w-10 h-5 rounded-full transition-colors ${(settings.security as any)[field.key] ? 'bg-emerald-500' : 'bg-[#252636]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${(settings.security as any)[field.key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'advanced' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">Advanced Settings</h3>
              {[
                { key: 'debugMode', label: 'Debug Mode', desc: 'Enable verbose logging and debug UI elements' },
                { key: 'experimentalFeatures', label: 'Experimental Features', desc: 'Enable beta features that may be unstable' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-white font-medium">{field.label}</p><p className="text-xs text-[#6b7280]">{field.desc}</p></div>
                  <button onClick={() => updateSetting('advanced', field.key, !(settings.advanced as any)[field.key])} className={`w-10 h-5 rounded-full transition-colors ${(settings.advanced as any)[field.key] ? 'bg-emerald-500' : 'bg-[#252636]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${(settings.advanced as any)[field.key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm text-white font-medium">Custom CSS URL</label>
                <p className="text-xs text-[#6b7280]">Load custom stylesheets for theming overrides</p>
                <input value={settings.advanced.customCssUrl} onChange={(e) => updateSetting('advanced', 'customCssUrl', e.target.value)} className="w-full max-w-md px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono" placeholder="https://..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
