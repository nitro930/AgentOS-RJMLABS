import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quota = await db.resourceQuota.findUnique({
      where: { id },
      include: {
        usageRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!quota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    return NextResponse.json(quota)
  } catch (error) {
    console.error('Failed to fetch quota:', error)
    return NextResponse.json({ error: 'Failed to fetch quota' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if the new values trigger an alert
    const existingQuota = await db.resourceQuota.findUnique({ where: { id } })
    if (!existingQuota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    const limitValue = body.limitValue !== undefined ? parseFloat(body.limitValue) : existingQuota.limitValue
    const currentUsage = body.currentUsage !== undefined ? parseFloat(body.currentUsage) : existingQuota.currentUsage
    const alertThreshold = body.alertThreshold !== undefined ? parseFloat(body.alertThreshold) : existingQuota.alertThreshold
    const isAlertFired = limitValue > 0 && (currentUsage / limitValue) >= alertThreshold

    const quota = await db.resourceQuota.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.targetType !== undefined && { targetType: body.targetType }),
        ...(body.targetId !== undefined && { targetId: body.targetId || null }),
        ...(body.resourceType !== undefined && { resourceType: body.resourceType }),
        ...(body.limitValue !== undefined && { limitValue: parseFloat(body.limitValue) }),
        ...(body.currentUsage !== undefined && { currentUsage: parseFloat(body.currentUsage) }),
        ...(body.period !== undefined && { period: body.period }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.alertThreshold !== undefined && { alertThreshold: parseFloat(body.alertThreshold) }),
        ...(body.isHardLimit !== undefined && { isHardLimit: body.isHardLimit }),
        isAlertFired,
        lastUpdatedAt: new Date(),
      },
    })

    return NextResponse.json(quota)
  } catch (error) {
    console.error('Failed to update quota:', error)
    return NextResponse.json({ error: 'Failed to update quota' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete usage records first
    await db.quotaUsageRecord.deleteMany({ where: { quotaId: id } })
    await db.resourceQuota.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quota:', error)
    return NextResponse.json({ error: 'Failed to delete quota' }, { status: 500 })
  }
}
