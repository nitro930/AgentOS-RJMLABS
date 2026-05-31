import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const flags = await db.featureFlag.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { history: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    return NextResponse.json(flags)
  } catch (error: unknown) {
    console.error('Feature flags GET error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to fetch feature flags'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const flag = await db.featureFlag.create({
      data: {
        key: body.key,
        name: body.name,
        description: body.description || null,
        isEnabled: body.isEnabled ?? false,
        flagType: body.flagType || 'boolean',
        value: body.value || 'true',
        rules: JSON.stringify(body.rules || []),
        targetScope: body.targetScope || 'all',
        targetIds: JSON.stringify(body.targetIds || []),
        percentage: body.percentage ?? 100,
        variants: JSON.stringify(body.variants || []),
        isActive: body.isActive ?? true,
        createdBy: body.createdBy || 'system',
      },
    })
    // Create history entry
    await db.featureFlagHistory.create({
      data: {
        flagId: flag.id,
        action: 'created',
        oldValue: '',
        newValue: JSON.stringify({ isEnabled: flag.isEnabled, value: flag.value }),
        changedBy: flag.createdBy,
      },
    })
    return NextResponse.json(flag, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create feature flag'
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Flag key already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
