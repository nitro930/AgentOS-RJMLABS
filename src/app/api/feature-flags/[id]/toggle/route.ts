import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    const oldEnabled = existing.isEnabled
    const flag = await db.featureFlag.update({
      where: { id },
      data: { isEnabled: !oldEnabled },
    })

    await db.featureFlagHistory.create({
      data: {
        flagId: flag.id,
        action: 'toggled',
        oldValue: JSON.stringify({ isEnabled: oldEnabled }),
        newValue: JSON.stringify({ isEnabled: flag.isEnabled }),
        changedBy: 'system',
      },
    })

    return NextResponse.json(flag)
  } catch {
    return NextResponse.json({ error: 'Failed to toggle feature flag' }, { status: 500 })
  }
}
