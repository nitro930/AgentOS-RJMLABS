import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const START_TIME = Date.now()

export async function GET() {
  const now = new Date()
  const uptimeMs = Date.now() - START_TIME
  const uptimeSeconds = Math.floor(uptimeMs / 1000)

  // Format uptime
  const days = Math.floor(uptimeSeconds / 86400)
  const hours = Math.floor((uptimeSeconds % 86400) / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const seconds = uptimeSeconds % 60
  const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`

  // Memory usage
  const mem = process.memoryUsage()

  // Database connectivity check
  let dbStatus: 'connected' | 'disconnected' = 'disconnected'
  let dbResponseTime = 0
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    dbResponseTime = Date.now() - dbStart
    dbStatus = 'connected'
  } catch {
    dbStatus = 'disconnected'
    dbResponseTime = -1
  }

  const response = {
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    version: '0.2.0',
    timestamp: now.toISOString(),
    uptime: {
      ms: uptimeMs,
      formatted: uptimeFormatted,
    },
    database: {
      status: dbStatus,
      responseTimeMs: dbResponseTime,
    },
    memory: {
      rss: formatBytes(mem.rss),
      heapTotal: formatBytes(mem.heapTotal),
      heapUsed: formatBytes(mem.heapUsed),
      external: formatBytes(mem.external),
      arrayBuffers: formatBytes(mem.arrayBuffers),
      rssBytes: mem.rss,
      heapTotalBytes: mem.heapTotal,
      heapUsedBytes: mem.heapUsed,
      externalBytes: mem.external,
      arrayBuffersBytes: mem.arrayBuffers,
      heapUsagePercent: parseFloat(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)),
    },
    environment: process.env.NODE_ENV || 'development',
    branding: 'RJMLABS.CO.UK',
  }

  const statusCode = dbStatus === 'connected' ? 200 : 503

  return NextResponse.json(response, { status: statusCode })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
