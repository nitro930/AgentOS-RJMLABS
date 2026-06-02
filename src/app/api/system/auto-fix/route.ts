import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { execSync } from 'child_process'

interface FixResult {
  name: string
  status: 'fixed' | 'already_ok' | 'failed' | 'skipped'
  message: string
  details?: string
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const fixes = body.fixes || ['all']
  const runAll = fixes.includes('all')
  const results: FixResult[] = []

  // ============================================================
  // FIX 1: Database Schema Sync
  // ============================================================
  if (runAll || fixes.includes('schema')) {
    try {
      const output = execSync('npx prisma db push --accept-data-loss 2>&1', {
        cwd: '/home/z/my-project',
        timeout: 30000,
        encoding: 'utf-8',
      })
      const hasChanges = output.includes('changed') || output.includes('created') || output.includes('applied')
      results.push({
        name: 'Database Schema Sync',
        status: hasChanges ? 'fixed' : 'already_ok',
        message: hasChanges ? 'Schema changes applied' : 'Schema is up to date',
        details: output.split('\n').slice(-3).join('\n'),
      })
    } catch (err: unknown) {
      results.push({
        name: 'Database Schema Sync',
        status: 'failed',
        message: `Schema sync failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      })
    }
  }

  // ============================================================
  // FIX 2: Generate Prisma Client
  // ============================================================
  if (runAll || fixes.includes('prisma')) {
    try {
      execSync('npx prisma generate 2>&1', {
        cwd: '/home/z/my-project',
        timeout: 30000,
        encoding: 'utf-8',
      })
      results.push({
        name: 'Prisma Client Generation',
        status: 'already_ok',
        message: 'Prisma client generated successfully',
      })
    } catch (err: unknown) {
      results.push({
        name: 'Prisma Client Generation',
        status: 'failed',
        message: `Prisma generate failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      })
    }
  }

  // ============================================================
  // FIX 3: Clean Stale Data
  // ============================================================
  if (runAll || fixes.includes('cleanup')) {
    let cleaned = 0
    try {
      // Clean old audit logs (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      try {
        const deleted = await db.auditLog.deleteMany({
          where: { createdAt: { lt: thirtyDaysAgo } },
        })
        cleaned += deleted.count
      } catch {
        // Table may not exist
      }

      // Clean old terminal sessions
      try {
        const deletedSessions = await db.terminalSession.deleteMany({
          where: { createdAt: { lt: thirtyDaysAgo } },
        })
        cleaned += deletedSessions.count
      } catch {
        // Table may not exist
      }

      results.push({
        name: 'Stale Data Cleanup',
        status: cleaned > 0 ? 'fixed' : 'already_ok',
        message: cleaned > 0 ? `Cleaned ${cleaned} old records` : 'No stale data found',
      })
    } catch (err: unknown) {
      results.push({
        name: 'Stale Data Cleanup',
        status: 'failed',
        message: `Cleanup failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      })
    }
  }

  // ============================================================
  // FIX 4: Fix Provider Keys (re-encrypt if needed)
  // ============================================================
  if (runAll || fixes.includes('providers')) {
    let fixedCount = 0
    try {
      const providers = await db.providerConfig.findMany()
      for (const p of providers) {
        // Check if apiKey contains bullet characters (corrupted)
        if (p.apiKey && p.apiKey.includes('•')) {
          await db.providerConfig.update({
            where: { id: p.id },
            data: { apiKey: '' },
          })
          fixedCount++
        }
        // Re-activate providers that have keys but are inactive
        if (p.apiKey && p.apiKey.length > 0 && !p.isActive && p.name !== 'ollama') {
          await db.providerConfig.update({
            where: { id: p.id },
            data: { isActive: true },
          })
          fixedCount++
        }
      }
      results.push({
        name: 'Provider Key Cleanup',
        status: fixedCount > 0 ? 'fixed' : 'already_ok',
        message: fixedCount > 0 ? `Fixed ${fixedCount} provider issues` : 'All providers OK',
      })
    } catch (err: unknown) {
      results.push({
        name: 'Provider Key Cleanup',
        status: 'failed',
        message: `Provider fix failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      })
    }
  }

  // ============================================================
  // FIX 5: Node Modules Check
  // ============================================================
  if (runAll || fixes.includes('deps')) {
    try {
      const fs = await import('fs/promises')
      const pkgPath = '/home/z/my-project/package.json'
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
      const deps = Object.keys(pkg.dependencies || {})
      const devDeps = Object.keys(pkg.devDependencies || {})
      const totalDeps = deps.length + devDeps.length

      // Check if node_modules exists and has content
      let modulesOk = true
      try {
        const modulesStat = await fs.stat('/home/z/my-project/node_modules')
        if (!modulesStat.isDirectory()) modulesOk = false
      } catch {
        modulesOk = false
      }

      if (!modulesOk) {
        results.push({
          name: 'Node Modules',
          status: 'failed',
          message: 'node_modules missing — run: npm install',
        })
      } else {
        results.push({
          name: 'Node Modules',
          status: 'already_ok',
          message: `${totalDeps} dependencies, node_modules present`,
        })
      }
    } catch (err: unknown) {
      results.push({
        name: 'Node Modules',
        status: 'skipped',
        message: `Could not check: ${err instanceof Error ? err.message : 'Unknown'}`,
      })
    }
  }

  // ============================================================
  // FIX 6: Build Verification
  // ============================================================
  if (runAll || fixes.includes('build')) {
    try {
      const output = execSync('npx next build 2>&1 | tail -5', {
        cwd: '/home/z/my-project',
        timeout: 180000,
        encoding: 'utf-8',
      })
      const hasError = output.toLowerCase().includes('error') && !output.includes('0 errors')
      results.push({
        name: 'Build Verification',
        status: hasError ? 'failed' : 'already_ok',
        message: hasError ? 'Build has errors — see details' : 'Build passes with no errors',
        details: output,
      })
    } catch (err: unknown) {
      results.push({
        name: 'Build Verification',
        status: 'failed',
        message: `Build failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      })
    }
  }

  // Save to audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'auto_fix',
        resource: 'system',
        resourceId: 'auto-fix',
        details: JSON.stringify({ results: results.map(r => ({ name: r.name, status: r.status, message: r.message })) }),
        source: 'cron',
        severity: results.some(r => r.status === 'failed') ? 'error' : 'info',
      },
    })
  } catch {
    // Table may not exist
  }

  const fixed = results.filter(r => r.status === 'fixed').length
  const failed = results.filter(r => r.status === 'failed').length
  const ok = results.filter(r => r.status === 'already_ok').length

  return NextResponse.json({
    ok: failed === 0,
    summary: { total: results.length, fixed, failed, ok },
    results,
  })
}
