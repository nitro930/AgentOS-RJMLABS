import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const resourceType = searchParams.get('resourceType')
    const period = searchParams.get('period')

    const where: Record<string, unknown> = {}
    if (targetType) where.targetType = targetType
    if (resourceType) where.resourceType = resourceType
    if (period) where.period = period

    const quotas = await db.resourceQuota.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({ quotas })
  } catch (error) {
    console.error('Failed to fetch quotas:', error)
    return NextResponse.json({ error: 'Failed to fetch quotas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.targetType || !body.resourceType || !body.limitValue) {
      return NextResponse.json(
        { error: 'Missing required fields: name, targetType, resourceType, limitValue' },
        { status: 400 }
      )
    }

    // Check if alert threshold has been breached on creation
    const currentUsage = body.currentUsage || 0
    const isAlertFired = body.limitValue > 0 && (currentUsage / body.limitValue) >= (body.alertThreshold || 0.8)

    const quota = await db.resourceQuota.create({
      data: {
        name: body.name,
        targetType: body.targetType,
        targetId: body.targetId || null,
        resourceType: body.resourceType,
        limitValue: parseFloat(body.limitValue),
        currentUsage: parseFloat(String(currentUsage)),
        period: body.period || 'monthly',
        unit: body.unit || '',
        alertThreshold: parseFloat(body.alertThreshold) || 0.8,
        isAlertFired,
        isHardLimit: body.isHardLimit !== undefined ? body.isHardLimit : true,
        resetAt: body.resetAt ? new Date(body.resetAt) : null,
      },
    })

    return NextResponse.json(quota, { status: 201 })
  } catch (error) {
    console.error('Failed to create quota:', error)
    return NextResponse.json({ error: 'Failed to create quota' }, { status: 500 })
  }
}
