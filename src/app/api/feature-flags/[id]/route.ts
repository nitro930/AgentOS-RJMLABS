import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const flag = await db.featureFlag.findUnique({
      where: { id },
      include: { history: { orderBy: { createdAt: 'desc' } } },
    })
    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }
    return NextResponse.json(flag)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch feature flag' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    const oldState = JSON.stringify({ isEnabled: existing.isEnabled, value: existing.value, rules: existing.rules })

    const flag = await db.featureFlag.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
        ...(body.flagType !== undefined && { flagType: body.flagType }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.rules !== undefined && { rules: JSON.stringify(body.rules) }),
        ...(body.targetScope !== undefined && { targetScope: body.targetScope }),
        ...(body.targetIds !== undefined && { targetIds: JSON.stringify(body.targetIds) }),
        ...(body.percentage !== undefined && { percentage: body.percentage }),
        ...(body.variants !== undefined && { variants: JSON.stringify(body.variants) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    const newState = JSON.stringify({ isEnabled: flag.isEnabled, value: flag.value, rules: flag.rules })

    if (oldState !== newState) {
      await db.featureFlagHistory.create({
        data: {
          flagId: flag.id,
          action: 'updated',
          oldValue: oldState,
          newValue: newState,
          changedBy: body.changedBy || 'system',
        },
      })
    }

    return NextResponse.json(flag)
  } catch {
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    // Create history entry before deleting
    await db.featureFlagHistory.create({
      data: {
        flagId: id,
        action: 'deleted',
        oldValue: JSON.stringify({ key: existing.key, name: existing.name }),
        newValue: '',
        changedBy: 'system',
      },
    })

    await db.featureFlagHistory.deleteMany({ where: { flagId: id } })
    await db.featureFlag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 })
  }
}
