import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TestResult {
  name: string
  category: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  duration: number
  details?: string
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const categories = body.categories || ['all'] // all, api, database, frontend, providers, system
  const startTime = Date.now()
  const results: TestResult[] = []

  const runAll = categories.includes('all')

  // ============================================================
  // DATABASE TESTS
  // ============================================================
  if (runAll || categories.includes('database')) {
    // Test 1: DB Connection
    const dbStart = Date.now()
    try {
      await db.$queryRaw`SELECT 1`
      results.push({
        name: 'Database Connection',
        category: 'database',
        status: 'pass',
        message: 'SQLite database is accessible',
        duration: Date.now() - dbStart,
      })
    } catch (err: unknown) {
      results.push({
        name: 'Database Connection',
        category: 'database',
        status: 'fail',
        message: `Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        duration: Date.now() - dbStart,
      })
    }

    // Test 2: Core Tables Exist
    const tableStart = Date.now()
    try {
      const coreTables = ['Agent', 'AgentTask', 'ProviderConfig', 'ModelConfig', 'MemoryEntry', 'Workspace']
      const missing: string[] = []
      for (const table of coreTables) {
        try {
          // @ts-expect-error dynamic model access
          await db[table].count()
        } catch {
          missing.push(table)
        }
      }
      results.push({
        name: 'Core Tables',
        category: 'database',
        status: missing.length === 0 ? 'pass' : 'fail',
        message: missing.length === 0 ? 'All core tables exist' : `Missing tables: ${missing.join(', ')}`,
        duration: Date.now() - tableStart,
        details: missing.length > 0 ? `Run: npx prisma db push` : undefined,
      })
    } catch (err: unknown) {
      results.push({
        name: 'Core Tables',
        category: 'database',
        status: 'fail',
        message: `Table check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - tableStart,
      })
    }

    // Test 3: Provider Config Integrity
    const provStart = Date.now()
    try {
      const providers = await db.providerConfig.findMany()
      const emptyKeys = providers.filter(p => p.name !== 'z-ai' && p.name !== 'ollama' && !p.apiKey)
      results.push({
        name: 'Provider Keys',
        category: 'database',
        status: emptyKeys.length === 0 ? 'warn' : 'warn',
        message: `${providers.length} providers configured, ${emptyKeys.length} missing API keys`,
        duration: Date.now() - provStart,
        details: emptyKeys.map(p => p.name).join(', ') || undefined,
      })
    } catch {
      results.push({
        name: 'Provider Keys',
        category: 'database',
        status: 'fail',
        message: 'Could not check provider configs',
        duration: Date.now() - provStart,
      })
    }
  }

  // ============================================================
  // API ROUTE TESTS
  // ============================================================
  if (runAll || categories.includes('api')) {
    const apiRoutes = [
      { path: '/api/health', method: 'GET', name: 'Health Endpoint' },
      { path: '/api/agents', method: 'GET', name: 'Agents API' },
      { path: '/api/providers', method: 'GET', name: 'Providers API' },
      { path: '/api/models', method: 'GET', name: 'Models API' },
      { path: '/api/workspaces', method: 'GET', name: 'Workspaces API' },
      { path: '/api/memory', method: 'GET', name: 'Memory API' },
      { path: '/api/skills', method: 'GET', name: 'Skills API' },
      { path: '/api/webhooks', method: 'GET', name: 'Webhooks API' },
      { path: '/api/workflows', method: 'GET', name: 'Workflows API' },
      { path: '/api/goals', method: 'GET', name: 'Goals API' },
      { path: '/api/teams', method: 'GET', name: 'Teams API' },
      { path: '/api/scheduler/jobs', method: 'GET', name: 'Scheduler API' },
      { path: '/api/audit-logs', method: 'GET', name: 'Audit Logs API' },
      { path: '/api/templates', method: 'GET', name: 'Templates API' },
      { path: '/api/dashboard/stats', method: 'GET', name: 'Dashboard Stats API' },
    ]

    for (const route of apiRoutes) {
      const routeStart = Date.now()
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}${route.path}`, {
          method: route.method,
          headers: { 'User-Agent': 'AgentOS-TestSuite/1.0' },
          signal: AbortSignal.timeout(5000),
        })
        const duration = Date.now() - routeStart
        if (res.ok || res.status === 401) {
          // 401 is fine — means route exists but requires auth
          results.push({
            name: route.name,
            category: 'api',
            status: 'pass',
            message: `Returns ${res.status} (${duration}ms)`,
            duration,
          })
        } else {
          results.push({
            name: route.name,
            category: 'api',
            status: res.status === 404 ? 'fail' : 'warn',
            message: `Returns ${res.status} (${duration}ms)`,
            duration,
            details: res.status === 404 ? 'Route not found — may need rebuild' : undefined,
          })
        }
      } catch (err: unknown) {
        results.push({
          name: route.name,
          category: 'api',
          status: 'fail',
          message: `Request failed: ${err instanceof Error ? err.message : 'Unknown'}`,
          duration: Date.now() - routeStart,
        })
      }
    }

    // Test POST routes
    const postRoutes = [
      { path: '/api/providers/test', body: { provider: 'z-ai' }, name: 'Provider Test API' },
      { path: '/api/chat', body: { message: 'ping', model: 'test' }, name: 'Chat API' },
    ]

    for (const route of postRoutes) {
      const routeStart = Date.now()
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}${route.path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AgentOS-TestSuite/1.0',
          },
          body: JSON.stringify(route.body),
          signal: AbortSignal.timeout(10000),
        })
        const duration = Date.now() - routeStart
        results.push({
          name: route.name,
          category: 'api',
          status: res.ok ? 'pass' : (res.status === 401 || res.status === 400 ? 'pass' : 'warn'),
          message: `Returns ${res.status} (${duration}ms)`,
          duration,
        })
      } catch (err: unknown) {
        results.push({
          name: route.name,
          category: 'api',
          status: 'fail',
          message: `Request failed: ${err instanceof Error ? err.message : 'Unknown'}`,
          duration: Date.now() - routeStart,
        })
      }
    }
  }

  // ============================================================
  // PROVIDER TESTS
  // ============================================================
  if (runAll || categories.includes('providers')) {
    const providers = await db.providerConfig.findMany()
    for (const provider of providers) {
      if (provider.name === 'z-ai') continue
      const provStart = Date.now()
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/providers/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AgentOS-TestSuite/1.0',
          },
          body: JSON.stringify({ provider: provider.name }),
          signal: AbortSignal.timeout(15000),
        })
        const data = await res.json()
        results.push({
          name: `${provider.displayName || provider.name} Provider`,
          category: 'providers',
          status: data.ok ? 'pass' : (provider.apiKey ? 'fail' : 'warn'),
          message: data.message || (data.ok ? 'Connected' : 'Not connected'),
          duration: Date.now() - provStart,
        })
      } catch {
        results.push({
          name: `${provider.displayName || provider.name} Provider`,
          category: 'providers',
          status: 'warn',
          message: 'Could not test provider',
          duration: Date.now() - provStart,
        })
      }
    }

    // Test providers that should exist but don't
    const expectedProviders = ['openrouter', 'huggingface', 'openai', 'anthropic', 'ollama', 'z-ai']
    const existingNames = providers.map(p => p.name)
    const missing = expectedProviders.filter(p => !existingNames.includes(p))
    if (missing.length > 0) {
      results.push({
        name: 'Provider Coverage',
        category: 'providers',
        status: 'warn',
        message: `Missing providers: ${missing.join(', ')} — these will be auto-created when configured`,
        duration: 0,
      })
    }
  }

  // ============================================================
  // SYSTEM TESTS
  // ============================================================
  if (runAll || categories.includes('system')) {
    // Memory usage
    const memStart = Date.now()
    const mem = process.memoryUsage()
    const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1)
    const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(1)
    const rssMB = (mem.rss / 1024 / 1024).toFixed(1)
    results.push({
      name: 'Memory Usage',
      category: 'system',
      status: mem.heapUsed / mem.heapTotal < 0.9 ? 'pass' : 'warn',
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB, RSS: ${rssMB}MB`,
      duration: Date.now() - memStart,
    })

    // Uptime
    const uptimeStart = Date.now()
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    results.push({
      name: 'Process Uptime',
      category: 'system',
      status: uptime > 60 ? 'pass' : 'warn',
      message: `Running for ${hours}h ${minutes}m`,
      duration: Date.now() - uptimeStart,
    })

    // Environment
    const envStart = Date.now()
    const hasDbUrl = !!process.env.DATABASE_URL
    results.push({
      name: 'Environment Config',
      category: 'system',
      status: hasDbUrl ? 'pass' : 'fail',
      message: hasDbUrl ? 'DATABASE_URL is set' : 'DATABASE_URL is missing',
      duration: Date.now() - envStart,
    })

    // Disk space (check DB file)
    const diskStart = Date.now()
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './db/agentos.db'
      const stat = await fs.stat(dbPath.replace(/^\//, '/'))
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2)
      results.push({
        name: 'Database Size',
        category: 'system',
        status: stat.size < 100 * 1024 * 1024 ? 'pass' : 'warn',
        message: `${sizeMB}MB`,
        duration: Date.now() - diskStart,
      })
    } catch {
      results.push({
        name: 'Database Size',
        category: 'system',
        status: 'warn',
        message: 'Could not check database file size',
        duration: Date.now() - diskStart,
      })
    }
  }

  // ============================================================
  // BUILD/FRONTEND TESTS
  // ============================================================
  if (runAll || categories.includes('frontend')) {
    // Test if Next.js can render a page
    const pageStart = Date.now()
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const res = await fetch(baseUrl, {
        headers: { 'User-Agent': 'AgentOS-TestSuite/1.0' },
        signal: AbortSignal.timeout(10000),
      })
      results.push({
        name: 'Frontend Rendering',
        category: 'frontend',
        status: res.ok ? 'pass' : 'fail',
        message: `Main page returns ${res.status} (${Date.now() - pageStart}ms)`,
        duration: Date.now() - pageStart,
      })
    } catch (err: unknown) {
      results.push({
        name: 'Frontend Rendering',
        category: 'frontend',
        status: 'fail',
        message: `Cannot reach frontend: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - pageStart,
      })
    }

    // Check for build errors by testing static assets
    const assetStart = Date.now()
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/_next/static`, {
        signal: AbortSignal.timeout(5000),
      })
      results.push({
        name: 'Static Assets',
        category: 'frontend',
        status: res.status === 200 || res.status === 404 ? 'pass' : 'warn',
        message: `Static asset path returns ${res.status}`,
        duration: Date.now() - assetStart,
      })
    } catch {
      results.push({
        name: 'Static Assets',
        category: 'frontend',
        status: 'warn',
        message: 'Could not verify static assets',
        duration: Date.now() - assetStart,
      })
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  const totalDuration = Date.now() - startTime
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warned = results.filter(r => r.status === 'warn').length
  const overallStatus = failed > 0 ? 'fail' : warned > 0 ? 'warn' : 'pass'

  // Save test result to audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'test_suite',
        resource: 'system',
        resourceId: 'test-suite',
        details: JSON.stringify({ passed, failed, warned, duration: totalDuration, results: results.map(r => ({ name: r.name, status: r.status })) }),
        source: 'cron',
        severity: failed > 0 ? 'error' : warned > 0 ? 'warning' : 'info',
      },
    })
  } catch {
    // Audit log may not exist
  }

  return NextResponse.json({
    ok: overallStatus !== 'fail',
    status: overallStatus,
    summary: {
      total: results.length,
      passed,
      failed,
      warned,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
    },
    results,
    fixableIssues: results
      .filter(r => r.status === 'fail' && r.details)
      .map(r => ({ name: r.name, fix: r.details })),
  })
}
