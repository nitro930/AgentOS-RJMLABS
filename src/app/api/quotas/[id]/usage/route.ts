import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const quota = await db.resourceQuota.findUnique({ where: { id } })
    if (!quota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    const [records, total] = await Promise.all([
      db.quotaUsageRecord.findMany({
        where: { quotaId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.quotaUsageRecord.count({ where: { quotaId: id } }),
    ])

    return NextResponse.json({ records, total, quota })
  } catch (error) {
    console.error('Failed to fetch usage records:', error)
    return NextResponse.json({ error: 'Failed to fetch usage records' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    const quota = await db.resourceQuota.findUnique({ where: { id } })
    if (!quota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    // Create the usage record
    const record = await db.quotaUsageRecord.create({
      data: {
        quotaId: id,
        amount: parseFloat(body.amount),
        source: body.source || null,
        description: body.description || null,
        metadata: JSON.stringify(body.metadata || {}),
      },
    })

    // Update the quota's current usage
    const newUsage = quota.currentUsage + parseFloat(body.amount)
    const isAlertFired = quota.limitValue > 0 && (newUsage / quota.limitValue) >= quota.alertThreshold

    await db.resourceQuota.update({
      where: { id },
      data: {
        currentUsage: newUsage,
        isAlertFired,
        lastUpdatedAt: new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to add usage record:', error)
    return NextResponse.json({ error: 'Failed to add usage record' }, { status: 500 })
  }
}
