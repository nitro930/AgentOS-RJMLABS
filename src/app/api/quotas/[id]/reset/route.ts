import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const quota = await db.resourceQuota.findUnique({ where: { id } })
    if (!quota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    // Reset the quota usage
    const updated = await db.resourceQuota.update({
      where: { id },
      data: {
        currentUsage: 0,
        isAlertFired: false,
        resetAt: new Date(),
        lastUpdatedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to reset quota:', error)
    return NextResponse.json({ error: 'Failed to reset quota' }, { status: 500 })
  }
}
