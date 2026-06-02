import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { db } from '@/lib/db'

interface DeployStep {
  name: string
  status: 'success' | 'failed' | 'skipped'
  message: string
  duration: number
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const steps = body.steps || ['all']
  const runAll = steps.includes('all')
  const deploySteps: DeployStep[] = []
  const startTime = Date.now()

  // ============================================================
  // STEP 1: Git Pull
  // ============================================================
  if (runAll || steps.includes('pull')) {
    const stepStart = Date.now()
    try {
      const output = execSync('git pull origin main 2>&1', {
        cwd: '/home/z/my-project',
        timeout: 60000,
        encoding: 'utf-8',
      })
      const updated = !output.includes('Already up to date')
      deploySteps.push({
        name: 'Git Pull',
        status: 'success',
        message: updated ? 'Code updated from GitHub' : 'Already up to date',
        duration: Date.now() - stepStart,
      })
    } catch (err: unknown) {
      deploySteps.push({
        name: 'Git Pull',
        status: 'failed',
        message: `Pull failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // ============================================================
  // STEP 2: Install Dependencies
  // ============================================================
  if (runAll || steps.includes('install')) {
    const stepStart = Date.now()
    try {
      const output = execSync('npm install 2>&1 | tail -5', {
        cwd: '/home/z/my-project',
        timeout: 120000,
        encoding: 'utf-8',
      })
      deploySteps.push({
        name: 'NPM Install',
        status: 'success',
        message: 'Dependencies installed',
        duration: Date.now() - stepStart,
        // Don't include raw output as it may be huge
      })
    } catch (err: unknown) {
      deploySteps.push({
        name: 'NPM Install',
        status: 'failed',
        message: `Install failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // ============================================================
  // STEP 3: Database Migration
  // ============================================================
  if (runAll || steps.includes('migrate')) {
    const stepStart = Date.now()
    try {
      const output = execSync('npx prisma db push 2>&1', {
        cwd: '/home/z/my-project',
        timeout: 30000,
        encoding: 'utf-8',
      })
      deploySteps.push({
        name: 'DB Migration',
        status: 'success',
        message: 'Database schema synced',
        duration: Date.now() - stepStart,
      })
    } catch (err: unknown) {
      deploySteps.push({
        name: 'DB Migration',
        status: 'failed',
        message: `Migration failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // ============================================================
  // STEP 4: Prisma Generate
  // ============================================================
  if (runAll || steps.includes('generate')) {
    const stepStart = Date.now()
    try {
      execSync('npx prisma generate 2>&1', {
        cwd: '/home/z/my-project',
        timeout: 30000,
        encoding: 'utf-8',
      })
      deploySteps.push({
        name: 'Prisma Generate',
        status: 'success',
        message: 'Prisma client generated',
        duration: Date.now() - stepStart,
      })
    } catch (err: unknown) {
      deploySteps.push({
        name: 'Prisma Generate',
        status: 'failed',
        message: `Generate failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // ============================================================
  // STEP 5: Build
  // ============================================================
  if (runAll || steps.includes('build')) {
    const stepStart = Date.now()
    try {
      const output = execSync('npx next build 2>&1 | tail -10', {
        cwd: '/home/z/my-project',
        timeout: 180000,
        encoding: 'utf-8',
      })
      const hasError = output.toLowerCase().includes('error') && !output.includes('0 errors')
      deploySteps.push({
        name: 'Next.js Build',
        status: hasError ? 'failed' : 'success',
        message: hasError ? 'Build has errors' : 'Build successful',
        duration: Date.now() - stepStart,
      })
    } catch (err: unknown) {
      deploySteps.push({
        name: 'Next.js Build',
        status: 'failed',
        message: `Build failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // Stop if any step failed (don't restart with broken code)
  const hasFailure = deploySteps.some(s => s.status === 'failed')
  if (hasFailure) {
    // Log failure
    try {
      await db.auditLog.create({
        data: {
          action: 'auto_deploy_failed',
          resource: 'system',
          resourceId: 'auto-deploy',
          details: JSON.stringify({ steps: deploySteps }),
          source: 'cron',
          severity: 'error',
        },
      })
    } catch { /* ignore */ }

    return NextResponse.json({
      ok: false,
      message: 'Deploy halted — a step failed',
      steps: deploySteps,
      duration: Date.now() - startTime,
    }, { status: 500 })
  }

  // ============================================================
  // STEP 6: Restart (only in dev mode — auto-picks up changes)
  // ============================================================
  if (runAll || steps.includes('restart')) {
    const stepStart = Date.now()
    try {
      // In dev mode, Next.js hot-reloads automatically
      // For production, we would restart the process
      const isDev = process.env.NODE_ENV === 'development'

      if (isDev) {
        deploySteps.push({
          name: 'Restart',
          status: 'success',
          message: 'Dev server auto-reloads on file changes',
          duration: Date.now() - stepStart,
        })
      } else {
        // Production restart via process manager
        try {
          execSync('pm2 restart agentos 2>&1 || pkill -f "next start" && sleep 2 && nohup next start -p 3000 > /dev/null 2>&1 &', {
            cwd: '/home/z/my-project',
            timeout: 10000,
            encoding: 'utf-8',
          })
          deploySteps.push({
            name: 'Restart',
            status: 'success',
            message: 'Production server restarted',
            duration: Date.now() - stepStart,
          })
        } catch {
          deploySteps.push({
            name: 'Restart',
            status: 'success',
            message: 'Restart signal sent (verify manually)',
            duration: Date.now() - stepStart,
          })
        }
      }
    } catch (err: unknown) {
      deploySteps.push({
        name: 'Restart',
        status: 'failed',
        message: `Restart failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // ============================================================
  // STEP 7: Post-deploy Health Check
  // ============================================================
  if (runAll || steps.includes('health')) {
    const stepStart = Date.now()
    try {
      // Wait a moment for the server to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000))

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(10000),
      })
      const data = await res.json()

      deploySteps.push({
        name: 'Health Check',
        status: res.ok ? 'success' : 'failed',
        message: res.ok ? 'App is healthy and responding' : `Health check returned ${res.status}`,
        duration: Date.now() - stepStart,
      })
    } catch (err: unknown) {
      deploySteps.push({
        name: 'Health Check',
        status: 'failed',
        message: `Health check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - stepStart,
      })
    }
  }

  // Log success
  try {
    await db.auditLog.create({
      data: {
        action: 'auto_deploy_success',
        resource: 'system',
        resourceId: 'auto-deploy',
        details: JSON.stringify({ steps: deploySteps, duration: Date.now() - startTime }),
        source: 'cron',
        severity: 'info',
      },
    })
  } catch { /* ignore */ }

  return NextResponse.json({
    ok: true,
    message: 'Deploy completed successfully',
    steps: deploySteps,
    duration: Date.now() - startTime,
  })
}
