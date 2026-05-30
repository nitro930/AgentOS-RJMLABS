import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/env-profiles/[id]/activate - Activate a profile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const profile = await db.envProfile.findUnique({ where: { id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.isActive) {
      return NextResponse.json({ error: 'Profile is already active' }, { status: 400 })
    }

    // Deactivate all other profiles
    await db.envProfile.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Activate the selected profile
    const activated = await db.envProfile.update({
      where: { id },
      data: { isActive: true },
    })

    return NextResponse.json({
      profile: activated,
      message: `Profile "${activated.name}" activated successfully`,
    })
  } catch (error) {
    console.error('Failed to activate profile:', error)
    return NextResponse.json({ error: 'Failed to activate profile' }, { status: 500 })
  }
}
