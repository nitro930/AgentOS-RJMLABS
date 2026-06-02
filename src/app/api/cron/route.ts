import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================
// GET — List all cron job configurations
// ============================================================
export async function GET() {
  try {
    // Store cron config in a simple key-value approach using ProviderConfig-like pattern
    // We'll use the AuditLog to track cron executions and a JSON config
    const cronConfigs = await db.auditLog.findMany({
      where: { action: 'cron_config' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const recentRuns = await db.auditLog.findMany({
      where: { source: 'cron', action: { in: ['test_suite', 'auto_fix', 'auto_deploy', 'cron_run'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      configs: cronConfigs.map(c => {
        try { return JSON.parse(c.details || '{}') } catch { return {} }
      }),
      recentRuns: recentRuns.map(r => ({
        id: r.id,
        action: r.action,
        severity: r.severity,
        createdAt: r.createdAt,
        details: (() => { try { return JSON.parse(r.details || '{}') } catch { return {} } })(),
      })),
    })
  } catch {
    return NextResponse.json({ configs: [], recentRuns: [] })
  }
}

// ============================================================
// POST — Execute a cron job manually or save config
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { jobType, schedule, enabled } = body

    // Save cron configuration
    if (body.action === 'save_config') {
      const config = {
        jobType,
        schedule: schedule || '0 */6 * * *', // Default: every 6 hours
        enabled: enabled ?? true,
        lastRun: null,
        nextRun: null,
      }

      await db.auditLog.create({
        data: {
          action: 'cron_config',
          resource: 'cron',
          resourceId: jobType,
          details: JSON.stringify(config),
          source: 'user',
          severity: 'info',
        },
      })

      return NextResponse.json({ ok: true, message: 'Cron job configuration saved', config })
    }

    // Execute a specific job type
    if (body.action === 'execute') {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      let result

      switch (jobType) {
        case 'test_suite': {
          const res = await fetch(`${baseUrl}/api/system/test-suite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'AgentOS-Cron/1.0' },
            body: JSON.stringify({ categories: ['all'] }),
            signal: AbortSignal.timeout(60000),
          })
          result = await res.json()
          break
        }
        case 'auto_fix': {
          const res = await fetch(`${baseUrl}/api/system/auto-fix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'AgentOS-Cron/1.0' },
            body: JSON.stringify({ fixes: ['all'] }),
            signal: AbortSignal.timeout(120000),
          })
          result = await res.json()
          break
        }
        case 'auto_deploy': {
          const res = await fetch(`${baseUrl}/api/system/auto-deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'AgentOS-Cron/1.0' },
            body: JSON.stringify({ steps: ['all'] }),
            signal: AbortSignal.timeout(300000),
          })
          result = await res.json()
          break
        }
        case 'full_pipeline': {
          // Run test → fix → deploy pipeline
          const pipelineResults: Record<string, unknown> = {}

          // Step 1: Test
          try {
            const testRes = await fetch(`${baseUrl}/api/system/test-suite`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'User-Agent': 'AgentOS-Cron/1.0' },
              body: JSON.stringify({ categories: ['all'] }),
              signal: AbortSignal.timeout(60000),
            })
            pipelineResults.test = await testRes.json()
          } catch (err: unknown) {
            pipelineResults.test = { ok: false, error: err instanceof Error ? err.message : 'Test failed' }
          }

          // Step 2: Fix (always run, even if tests pass — maintenance)
          try {
            const fixRes = await fetch(`${baseUrl}/api/system/auto-fix`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'User-Agent': 'AgentOS-Cron/1.0' },
              body: JSON.stringify({ fixes: ['all'] }),
              signal: AbortSignal.timeout(120000),
            })
            pipelineResults.fix = await fixRes.json()
          } catch (err: unknown) {
            pipelineResults.fix = { ok: false, error: err instanceof Error ? err.message : 'Fix failed' }
          }

          // Step 3: Deploy (only if tests didn't have critical failures)
          const testOk = (pipelineResults.test as Record<string, unknown>)?.ok !== false
          if (testOk) {
            try {
              const deployRes = await fetch(`${baseUrl}/api/system/auto-deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': 'AgentOS-Cron/1.0' },
                body: JSON.stringify({ steps: ['all'] }),
                signal: AbortSignal.timeout(300000),
              })
              pipelineResults.deploy = await deployRes.json()
            } catch (err: unknown) {
              pipelineResults.deploy = { ok: false, error: err instanceof Error ? err.message : 'Deploy failed' }
            }
          } else {
            pipelineResults.deploy = { ok: false, skipped: true, reason: 'Tests failed — skipping deploy' }
          }

          result = pipelineResults
          break
        }
        default:
          return NextResponse.json({ ok: false, message: `Unknown job type: ${jobType}` }, { status: 400 })
      }

      // Log the execution
      await db.auditLog.create({
        data: {
          action: 'cron_run',
          resource: 'cron',
          resourceId: jobType,
          details: JSON.stringify({
            jobType,
            result: { ok: result?.ok, summary: result?.summary || result?.steps || result?.results?.length },
          }),
          source: 'cron',
          severity: result?.ok ? 'info' : 'warning',
        },
      })

      return NextResponse.json({ ok: true, jobType, result })
    }

    return NextResponse.json({ ok: false, message: 'Unknown action' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Cron error:', error)
    return NextResponse.json({
      ok: false,
      message: `Cron execution failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    }, { status: 500 })
  }
}
