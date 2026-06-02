'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentOSStore } from '@/lib/store'
import {
  Rocket,
  Key,
  Brain,
  Bot,
  Settings,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Eye,
  EyeOff,
  Globe,
  Building2,
  Cpu,
  Sparkles,
  PartyPopper,
  ArrowRight,
  Shield,
  Zap,
  Star,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────

interface StepData {
  // Step 1
  systemName?: string
  organizationName?: string
  timezone?: string
  // Step 2
  openrouterKey?: string
  huggingfaceKey?: string
  openaiKey?: string
  anthropicKey?: string
  ollamaEnabled?: boolean
  // Step 3
  preferredModels?: string[]
  routingPriority?: string
  // Step 4
  agentName?: string
  agentType?: string
  agentDescription?: string
  // Step 5
  theme?: string
  notifications?: string[]
  autoStartAgents?: boolean
  verboseLogging?: boolean
  defaultModel?: string
}

interface WizardStep {
  index: number
  title: string
  description: string
  icon: React.ElementType
  isRequired: boolean
}

const WIZARD_STEPS: WizardStep[] = [
  { index: 0, title: 'Welcome', description: 'System & organization setup', icon: Rocket, isRequired: true },
  { index: 1, title: 'API Keys', description: 'LLM provider credentials', icon: Key, isRequired: false },
  { index: 2, title: 'Models', description: 'Model selection & routing', icon: Brain, isRequired: false },
  { index: 3, title: 'Agents', description: 'Create your first agent', icon: Bot, isRequired: false },
  { index: 4, title: 'Preferences', description: 'Theme & behavior settings', icon: Settings, isRequired: false },
  { index: 5, title: 'Complete', description: 'Review & launch', icon: CheckCircle, isRequired: true },
]

const TIMEZONES = [
  'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland',
]

const MODEL_OPTIONS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenRouter', capabilities: ['chat', 'code', 'vision', 'reasoning'], recommended: true },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenRouter', capabilities: ['chat', 'code'], recommended: false },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'OpenRouter', capabilities: ['chat', 'code', 'vision', 'analysis'], recommended: true },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'OpenRouter', capabilities: ['chat', 'reasoning'], recommended: false },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'OpenRouter', capabilities: ['chat', 'code', 'vision'], recommended: false },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'OpenRouter', capabilities: ['chat', 'code'], recommended: false },
  { id: 'mistralai/mistral-small-24b-instruct-2501', name: 'Mistral Small 24B', provider: 'OpenRouter', capabilities: ['chat', 'code'], recommended: false },
  { id: 'z-ai-default', name: 'Z-AI (Built-in)', provider: 'Z-AI', capabilities: ['chat', 'code'], recommended: true },
]

const AGENT_TYPES = [
  { value: 'hermes', label: 'Hermes — General Purpose', icon: '⚡' },
  { value: 'openclaw', label: 'OpenClaw — Research & Analysis', icon: '🔍' },
  { value: 'claude-code', label: 'Claude Code — Development', icon: '💻' },
  { value: 'custom', label: 'Custom — Your Own Design', icon: '🎨' },
]

// ─── Main Component ───────────────────────────────────────────────────

export function OnboardingWizard() {
  const { setActiveSection, addToast } = useAgentOSStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [stepData, setStepData] = useState<StepData>({
    systemName: 'AgentOS',
    organizationName: '',
    timezone: 'UTC',
    openrouterKey: '',
    huggingfaceKey: '',
    openaiKey: '',
    anthropicKey: '',
    ollamaEnabled: false,
    preferredModels: ['gpt-4o'],
    routingPriority: 'balanced',
    agentName: '',
    agentType: 'hermes',
    agentDescription: '',
    theme: 'cyberpunk',
    notifications: ['agent_complete', 'error', 'system'],
    autoStartAgents: false,
    verboseLogging: false,
    defaultModel: 'gpt-4o',
  })
  const [skippedSteps, setSkippedSteps] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // API key visibility
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await fetch('/api/onboarding')
        if (res.ok) {
          const data = await res.json()
          if (data.state) {
            setCurrentStep(data.state.currentStep || 0)
            if (data.state.stepData && Object.keys(data.state.stepData).length > 0) {
              setStepData(prev => ({ ...prev, ...data.state.stepData }))
            }
            if (data.state.skippedSteps?.length > 0) {
              setSkippedSteps(data.state.skippedSteps)
            }
          }
        }
      } catch {
        // Use defaults
      }
    }
    loadState()
  }, [])

  // Save state to API
  const saveState = useCallback(async (step: number, data: StepData, skipped: number[]) => {
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step,
          stepData: data,
          skippedSteps: skipped,
        }),
      })
    } catch {
      // Silently fail
    }
  }, [])

  const handleNext = async () => {
    setIsSaving(true)
    const nextStep = Math.min(currentStep + 1, 5)
    setCurrentStep(nextStep)
    await saveState(nextStep, stepData, skippedSteps)
    setIsSaving(false)

    if (nextStep === 5) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }

  const handleBack = () => {
    const prevStep = Math.max(currentStep - 1, 0)
    setCurrentStep(prevStep)
  }

  const handleSkip = async () => {
    setIsSaving(true)
    const newSkipped = [...new Set([...skippedSteps, currentStep])]
    setSkippedSteps(newSkipped)
    const nextStep = Math.min(currentStep + 1, 5)
    setCurrentStep(nextStep)
    await saveState(nextStep, stepData, newSkipped)
    setIsSaving(false)

    if (nextStep === 5) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        addToast('Onboarding complete! Welcome to AgentOS.', 'success')
        setActiveSection('mission-control')
      }
    } catch {
      addToast('Failed to complete onboarding. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateStepData = (updates: Partial<StepData>) => {
    setStepData(prev => ({ ...prev, ...updates }))
  }

  const toggleModel = (modelId: string) => {
    setStepData(prev => {
      const current = prev.preferredModels || []
      const updated = current.includes(modelId)
        ? current.filter(id => id !== modelId)
        : [...current, modelId]
      return { ...prev, preferredModels: updated }
    })
  }

  const toggleNotification = (notif: string) => {
    setStepData(prev => {
      const current = prev.notifications || []
      const updated = current.includes(notif)
        ? current.filter(n => n !== notif)
        : [...current, notif]
      return { ...prev, notifications: updated }
    })
  }

  const isStepSkipped = (step: number) => skippedSteps.includes(step)
  const currentStepData = WIZARD_STEPS[currentStep]
  const progress = ((currentStep + 1) / 6) * 100

  // ─── Confetti Particles ────────────────────────────────────────────

  const ConfettiParticle = ({ delay, x, color }: { delay: number; x: number; color: string }) => (
    <motion.div
      initial={{ y: -20, x, opacity: 1, rotate: 0 }}
      animate={{ y: '100vh', opacity: 0, rotate: 720 }}
      transition={{ duration: 3, delay, ease: 'easeOut' }}
      className="absolute top-0 w-2 h-2 rounded-sm"
      style={{ backgroundColor: color }}
    />
  )

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={Math.random() * 1.5}
                x={Math.random() * 100}
                color={['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#8b5cf6'][i % 6]}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <span className="text-xs font-extrabold text-emerald-400">RJ</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Onboarding Wizard</h2>
            <p className="text-xs text-[#9ca3af]">
              RJMLABS.CO.UK — AgentOS Setup
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-3 px-1">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon
            const isActive = idx === currentStep
            const isCompleted = idx < currentStep || isStepSkipped(idx)
            const isSkipped = isStepSkipped(idx)

            return (
              <div key={step.index} className="flex items-center flex-1">
                <div className="flex flex-col items-center relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
                        : isCompleted
                        ? isSkipped
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[#2d2e3d] bg-[#1e1f2b]'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      isSkipped ? (
                        <SkipForward className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-[#6b7280]'}`} />
                    )}
                  </motion.div>
                  <span className={`text-[9px] sm:text-[10px] mt-1 font-medium ${
                    isActive ? 'text-emerald-400' : isCompleted ? 'text-[#9ca3af]' : 'text-[#4b5563]'
                  }`}>
                    {step.title}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeStep"
                      className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-emerald-400"
                    />
                  )}
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors duration-300 ${
                    idx < currentStep ? 'bg-emerald-500/40' : 'bg-[#2d2e3d]'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-[#1e1f2b] rounded-full overflow-hidden border border-[#2d2e3d]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
          />
        </div>
        <p className="text-xs text-[#6b7280] mt-2">
          Step {currentStep + 1} of 6 — {currentStepData.title}
          {isStepSkipped(currentStep) && ' (skipped)'}
        </p>
      </motion.div>

      {/* Step Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <WelcomeStep data={stepData} updateData={updateStepData} />
            )}
            {currentStep === 1 && (
              <ApiKeysStep
                data={stepData}
                updateData={updateStepData}
                visibleKeys={visibleKeys}
                toggleKeyVisibility={toggleKeyVisibility}
              />
            )}
            {currentStep === 2 && (
              <ModelsStep data={stepData} updateData={updateStepData} toggleModel={toggleModel} />
            )}
            {currentStep === 3 && (
              <AgentsStep data={stepData} updateData={updateStepData} />
            )}
            {currentStep === 4 && (
              <PreferencesStep
                data={stepData}
                updateData={updateStepData}
                toggleNotification={toggleNotification}
              />
            )}
            {currentStep === 5 && (
              <CompleteStep data={stepData} skippedSteps={skippedSteps} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mt-8 pt-6 border-t border-[#2d2e3d]"
      >
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentStep === 0
              ? 'text-[#4b5563] cursor-not-allowed'
              : 'text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] border border-[#2d2e3d] hover:border-[#3d3e4d]'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {!currentStepData.isRequired && currentStep < 5 && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-[#6b7280] hover:text-amber-400 hover:bg-amber-500/10 transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
          )}

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Go to Dashboard
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────

function WelcomeStep({ data, updateData }: { data: StepData; updateData: (u: Partial<StepData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Rocket className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Welcome to AgentOS</h3>
            <p className="text-sm text-[#9ca3af]">Let&apos;s set up your system in a few quick steps</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                System Name
              </div>
            </label>
            <input
              type="text"
              value={data.systemName || ''}
              onChange={(e) => updateData({ systemName: e.target.value })}
              placeholder="AgentOS"
              className="w-full px-4 py-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white placeholder-[#4b5563] focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            <p className="text-xs text-[#6b7280] mt-1.5">This name will appear across your dashboard</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Organization Name
              </div>
            </label>
            <input
              type="text"
              value={data.organizationName || ''}
              onChange={(e) => updateData({ organizationName: e.target.value })}
              placeholder="Your Organization"
              className="w-full px-4 py-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white placeholder-[#4b5563] focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            <p className="text-xs text-[#6b7280] mt-1.5">Used for multi-tenant identification and branding</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Timezone
              </div>
            </label>
            <select
              value={data.timezone || 'UTC'}
              onChange={(e) => updateData({ timezone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p className="text-xs text-[#6b7280] mt-1.5">Affects scheduling and timestamp display</p>
          </div>
        </div>
      </div>

      {/* Quick Info Card */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-400">Quick Setup</p>
            <p className="text-xs text-[#9ca3af] mt-1">
              The entire setup takes about 3 minutes. Steps marked as optional can be skipped and configured later from the Settings page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: API Keys ─────────────────────────────────────────────────

function ApiKeysStep({
  data,
  updateData,
  visibleKeys,
  toggleKeyVisibility,
}: {
  data: StepData
  updateData: (u: Partial<StepData>) => void
  visibleKeys: Record<string, boolean>
  toggleKeyVisibility: (key: string) => void
}) {
  const keyFields = [
    { key: 'openrouterKey' as const, label: 'OpenRouter', placeholder: 'sk-or-v1-...', color: '#6366f1', icon: '🌐', recommended: true, description: 'Access 200+ models (GPT-4o, Claude, Gemini, Llama) with one key' },
    { key: 'huggingfaceKey' as const, label: 'Hugging Face', placeholder: 'hf_...', color: '#f59e0b', icon: '🤗', recommended: false, description: 'Free inference for open-source models (optional but recommended)' },
    { key: 'openaiKey' as const, label: 'OpenAI (Direct)', placeholder: 'sk-...', color: '#10b981', icon: '🟢', recommended: false, description: 'Direct access to GPT-4o, o1, o3 — only needed if not using OpenRouter' },
    { key: 'anthropicKey' as const, label: 'Anthropic (Direct)', placeholder: 'sk-ant-...', color: '#8b5cf6', icon: '🟣', recommended: false, description: 'Direct access to Claude models — only needed if not using OpenRouter' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <Key className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Provider Keys</h3>
            <p className="text-sm text-[#9ca3af]">Connect your LLM providers (optional — can add later)</p>
          </div>
        </div>

        {/* Recommended banner */}
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 mb-5">
          <div className="flex items-start gap-2">
            <span className="text-sm">💡</span>
            <div>
              <p className="text-xs font-medium text-indigo-300">Recommended: Start with OpenRouter</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">
                One OpenRouter API key gives you access to 200+ models from OpenAI, Anthropic, Google, Meta & more. Get a key at{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {keyFields.map(({ key, label, placeholder, color, icon, recommended, description }) => (
            <div key={key} className="rounded-lg border border-[#2d2e3d] bg-[#0f1117] p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <label className="text-sm font-medium text-white">{label}</label>
                  {recommended && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {data[key] && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                  <button
                    onClick={() => toggleKeyVisibility(key)}
                    className="p-1.5 rounded-md text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] transition-all"
                  >
                    {visibleKeys[key] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#6b7280] mb-2">{description}</p>
              <input
                type={visibleKeys[key] ? 'text' : 'password'}
                value={data[key] || ''}
                onChange={(e) => updateData({ [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white placeholder-[#4b5563] font-mono text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                style={{ borderColor: data[key] ? `${color}30` : undefined }}
              />
            </div>
          ))}

          {/* Ollama toggle */}
          <div className="rounded-lg border border-[#2d2e3d] bg-[#0f1117] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🦙</span>
                <div>
                  <label className="text-sm font-medium text-white">Ollama (Local Models)</label>
                  <p className="text-[10px] text-[#6b7280]">Run open-source models locally — no API key needed</p>
                </div>
              </div>
              <button
                onClick={() => updateData({ ollamaEnabled: !data.ollamaEnabled })}
                className={`w-10 h-6 rounded-full flex items-center transition-all ${
                  data.ollamaEnabled ? 'bg-emerald-500' : 'bg-[#2d2e3d]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                  data.ollamaEnabled ? 'ml-[22px]' : 'ml-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Secure Storage</p>
            <p className="text-xs text-[#9ca3af] mt-1">
              All API keys are stored locally in your database and never sent to third parties. Keys are masked in the UI after saving. You can manage all provider keys from Brain Router → Providers tab at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Models ───────────────────────────────────────────────────

function ModelsStep({
  data,
  updateData,
  toggleModel,
}: {
  data: StepData
  updateData: (u: Partial<StepData>) => void
  toggleModel: (modelId: string) => void
}) {
  const providerGroups = [
    { name: 'OpenRouter', icon: '🌐', color: '#6366f1', models: MODEL_OPTIONS.filter(m => m.provider === 'OpenRouter') },
    { name: 'Z-AI (Built-in)', icon: '⚡', color: '#06b6d4', models: MODEL_OPTIONS.filter(m => m.provider === 'Z-AI') },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Model Selection</h3>
            <p className="text-sm text-[#9ca3af]">Choose your preferred models for different tasks</p>
          </div>
        </div>

        {/* Provider note */}
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 mb-5">
          <p className="text-[10px] text-[#9ca3af]">
            These models will be available through the providers you configured in the previous step. You can browse and add more models later from Brain Router → Browse tab.
          </p>
        </div>

        {providerGroups.map((group) => (
          <div key={group.name} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{group.icon}</span>
              <h4 className="text-xs font-semibold text-white">{group.name}</h4>
              <span className="text-[10px] text-[#6b7280]">{group.models.length} models</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.models.map((model) => {
                const isSelected = (data.preferredModels || []).includes(model.id)
                const modelWithRec = model as typeof MODEL_OPTIONS[0] & { recommended?: boolean }
                return (
                  <motion.button
                    key={model.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleModel(model.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-white">{model.name}</span>
                        {modelWithRec.recommended && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-400">Pick</span>
                        )}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        </motion.div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-[9px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Routing Priority */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          Routing Priority
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'cost', label: 'Cost Optimized', desc: 'Use cheapest capable model' },
            { value: 'balanced', label: 'Balanced', desc: 'Balance quality and cost' },
            { value: 'quality', label: 'Quality First', desc: 'Always use best model' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateData({ routingPriority: option.value })}
              className={`p-3 rounded-lg border text-center transition-all ${
                data.routingPriority === option.value
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
              }`}
            >
              <p className="text-xs font-medium text-white">{option.label}</p>
              <p className="text-[10px] text-[#6b7280] mt-1">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Agents ───────────────────────────────────────────────────

function AgentsStep({ data, updateData }: { data: StepData; updateData: (u: Partial<StepData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Bot className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create Your First Agent</h3>
            <p className="text-sm text-[#9ca3af]">Set up an agent to start automating tasks</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Agent Name</label>
            <input
              type="text"
              value={data.agentName || ''}
              onChange={(e) => updateData({ agentName: e.target.value })}
              placeholder="e.g., Hermes, Atlas, Nova..."
              className="w-full px-4 py-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white placeholder-[#4b5563] focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-3">Agent Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AGENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateData({ agentType: type.value })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    data.agentType === type.value
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-sm text-white">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
            <textarea
              value={data.agentDescription || ''}
              onChange={(e) => updateData({ agentDescription: e.target.value })}
              placeholder="Describe what this agent will do..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white placeholder-[#4b5563] focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Agent Preview */}
      {data.agentName && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
        >
          <p className="text-xs text-emerald-400 font-medium mb-2">Agent Preview</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-lg">
                {AGENT_TYPES.find(t => t.value === data.agentType)?.icon || '🤖'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{data.agentName}</p>
              <p className="text-xs text-[#9ca3af] capitalize">{data.agentType || 'hermes'} agent</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Step 5: Preferences ──────────────────────────────────────────────

function PreferencesStep({
  data,
  updateData,
  toggleNotification,
}: {
  data: StepData
  updateData: (u: Partial<StepData>) => void
  toggleNotification: (notif: string) => void
}) {
  const notificationOptions = [
    { id: 'agent_complete', label: 'Agent Task Complete', icon: '✅' },
    { id: 'error', label: 'Error Alerts', icon: '🚨' },
    { id: 'system', label: 'System Updates', icon: '🔔' },
    { id: 'cost_threshold', label: 'Cost Threshold', icon: '💰' },
    { id: 'agent_idle', label: 'Agent Idle', icon: '💤' },
  ]

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-emerald-400" />
          Theme
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'cyberpunk', label: 'Cyberpunk', preview: ['#0f1117', '#10b981', '#1e1f2b'] },
            { value: 'midnight', label: 'Midnight', preview: ['#0a0a1a', '#6366f1', '#141428'] },
            { value: 'ocean', label: 'Ocean', preview: ['#0c1929', '#0ea5e9', '#132f4c'] },
            { value: 'forest', label: 'Forest', preview: ['#0d1f0d', '#22c55e', '#1a3a1a'] },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => updateData({ theme: theme.value })}
              className={`p-3 rounded-lg border transition-all ${
                data.theme === theme.value
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
              }`}
            >
              <div className="flex gap-1 mb-2">
                {theme.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-[#2d2e3d]"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-white">{theme.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Notification Preferences
        </h4>
        <div className="space-y-2">
          {notificationOptions.map((opt) => {
            const isActive = (data.notifications || []).includes(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => toggleNotification(opt.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{opt.icon}</span>
                  <span className="text-sm text-white">{opt.label}</span>
                </div>
                <div className={`w-8 h-5 rounded-full flex items-center transition-all ${
                  isActive ? 'bg-emerald-500' : 'bg-[#2d2e3d]'
                }`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all ${
                    isActive ? 'ml-[18px]' : 'ml-0.5'
                  }`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Default Behaviors */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          Default Behaviors
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#2d2e3d] bg-[#0f1117]">
            <div>
              <p className="text-sm text-white">Auto-start agents on system boot</p>
              <p className="text-[10px] text-[#6b7280]">Automatically resume agents when the system starts</p>
            </div>
            <button
              onClick={() => updateData({ autoStartAgents: !data.autoStartAgents })}
              className={`w-8 h-5 rounded-full flex items-center transition-all ${
                data.autoStartAgents ? 'bg-emerald-500' : 'bg-[#2d2e3d]'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all ${
                data.autoStartAgents ? 'ml-[18px]' : 'ml-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[#2d2e3d] bg-[#0f1117]">
            <div>
              <p className="text-sm text-white">Verbose logging</p>
              <p className="text-[10px] text-[#6b7280]">Enable detailed debug logs for troubleshooting</p>
            </div>
            <button
              onClick={() => updateData({ verboseLogging: !data.verboseLogging })}
              className={`w-8 h-5 rounded-full flex items-center transition-all ${
                data.verboseLogging ? 'bg-emerald-500' : 'bg-[#2d2e3d]'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all ${
                data.verboseLogging ? 'ml-[18px]' : 'ml-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Complete ─────────────────────────────────────────────────

function CompleteStep({ data, skippedSteps }: { data: StepData; skippedSteps: number[] }) {
  const summaryItems = [
    { label: 'System Name', value: data.systemName || 'AgentOS', icon: Cpu },
    { label: 'Organization', value: data.organizationName || 'Not set', icon: Building2 },
    { label: 'Timezone', value: data.timezone || 'UTC', icon: Globe },
    { label: 'Providers', value: [
      data.openrouterKey && 'OpenRouter',
      data.huggingfaceKey && 'Hugging Face',
      data.openaiKey && 'OpenAI',
      data.anthropicKey && 'Anthropic',
      data.ollamaEnabled && 'Ollama (Local)',
    ].filter(Boolean).join(', ') || 'Z-AI (Built-in)', icon: Key },
    { label: 'Models', value: (data.preferredModels || []).length > 0
      ? `${(data.preferredModels || []).length} selected`
      : 'None selected', icon: Brain },
    { label: 'First Agent', value: data.agentName
      ? `${data.agentName} (${data.agentType || 'hermes'})`
      : 'Not created', icon: Bot },
    { label: 'Theme', value: (data.theme || 'cyberpunk').charAt(0).toUpperCase() + (data.theme || 'cyberpunk').slice(1), icon: Star },
  ]

  return (
    <div className="space-y-6">
      {/* Celebration Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block mb-3"
        >
          <PartyPopper className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">You&apos;re All Set!</h3>
        <p className="text-sm text-[#9ca3af]">
          Your AgentOS instance is configured and ready to go.
        </p>
        {skippedSteps.length > 0 && (
          <p className="text-xs text-amber-400 mt-2">
            {skippedSteps.length} step{skippedSteps.length > 1 ? 's' : ''} skipped — you can configure these later in Settings
          </p>
        )}
      </motion.div>

      {/* Configuration Summary */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Configuration Summary
        </h4>
        <div className="space-y-2">
          {summaryItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-[#9ca3af]">{item.label}</span>
                </div>
                <span className="text-xs text-white font-medium truncate max-w-[50%] text-right">{item.value}</span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          What&apos;s Next?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { title: 'Explore Agents', desc: 'Browse the marketplace & create more agents' },
            { title: 'Set Up Workflows', desc: 'Build automation pipelines' },
            { title: 'Connect MCP', desc: 'Extend capabilities with MCP servers' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-[#2d2e3d] bg-[#0f1117]">
              <p className="text-xs font-medium text-white">{item.title}</p>
              <p className="text-[10px] text-[#6b7280] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
