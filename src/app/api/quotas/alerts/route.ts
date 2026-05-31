import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const alerts = await db.resourceQuota.findMany({
      where: {
        isAlertFired: true,
      },
      orderBy: { lastUpdatedAt: 'desc' },
      include: {
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })

    // Enrich with computed data
    const enrichedAlerts = alerts.map((quota) => {
      const usagePercent = quota.limitValue > 0 ? (quota.currentUsage / quota.limitValue) * 100 : 0
      const timeSinceAlert = quota.lastUpdatedAt
        ? Date.now() - new Date(quota.lastUpdatedAt).getTime()
        : null

      return {
        ...quota,
        usagePercent: Math.round(usagePercent * 10) / 10,
        timeSinceAlertMs: timeSinceAlert,
        isOverLimit: quota.currentUsage >= quota.limitValue,
      }
    })

    return NextResponse.json({ alerts: enrichedAlerts })
  } catch (error) {
    console.error('Failed to fetch quota alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch quota alerts' }, { status: 500 })
  }
}
