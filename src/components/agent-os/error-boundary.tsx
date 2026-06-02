'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showStack: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[AgentOS ErrorBoundary]', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showStack: false })
    window.location.reload()
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showStack: false })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showStack: false })
    window.location.href = '/'
  }

  toggleStack = () => {
    this.setState((prev) => ({ showStack: !prev.showStack }))
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unknown error occurred'
      const stackTrace = this.state.errorInfo?.componentStack || this.state.error?.stack || ''

      return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-2xl">
            {/* Glitch effect background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.03)_0%,_transparent_70%)]" />
            </div>

            {/* Main error card */}
            <div className="relative rounded-xl border border-[#2d2e3d] bg-[#1a1b2e]/80 backdrop-blur-sm overflow-hidden">
              {/* Top accent line */}
              <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-emerald-500" />

              <div className="p-6 sm:p-8">
                {/* Icon and title */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                      System Malfunction Detected
                    </h1>
                    <p className="text-sm text-[#9ca3af]">
                      AgentOS encountered a critical error and needs attention.
                    </p>
                  </div>
                </div>

                {/* Error message */}
                <div className="mb-6 p-4 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-red-400 uppercase tracking-wider">Error</span>
                  </div>
                  <p className="text-sm text-white font-mono break-words leading-relaxed">
                    {errorMessage}
                  </p>
                </div>

                {/* Stack trace - collapsible */}
                {stackTrace && (
                  <div className="mb-6">
                    <button
                      onClick={this.toggleStack}
                      className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-emerald-400 transition-colors mb-2"
                    >
                      {this.state.showStack ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span className="font-mono uppercase tracking-wider">
                        {this.state.showStack ? 'Hide' : 'Show'} Stack Trace
                      </span>
                    </button>
                    {this.state.showStack && (
                      <div className="p-4 rounded-lg bg-[#0f1117] border border-[#2d2e3d] max-h-64 overflow-y-auto custom-scrollbar">
                        <pre className="text-[11px] font-mono text-[#6b7280] whitespace-pre-wrap break-words leading-relaxed">
                          {stackTrace}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleTryAgain}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#4b5563] transition-all text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload System
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#4b5563] transition-all text-sm font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Mission Control
                  </button>
                </div>
              </div>

              {/* Footer branding */}
              <div className="px-6 sm:px-8 py-4 border-t border-[#2d2e3d] bg-[#0f1117]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <span className="text-[6px] font-extrabold text-emerald-400">RJM</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#4b5563]">RJMLABS.CO.UK</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#4b5563]">
                    AgentOS Error Boundary v1.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
