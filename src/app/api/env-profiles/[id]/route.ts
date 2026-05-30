import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/env-profiles/[id] - Get profile details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const profile = await db.envProfile.findUnique({ where: { id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get associated env vars
    const envVars = await db.envVar.findMany({
      where: { profileId: id },
      orderBy: [{ key: 'asc' }],
    })

    const maskedVars = envVars.map((v) => ({
      ...v,
      value: v.isSecret ? '••••••••' : v.value,
    }))

    const overrides = JSON.parse(profile.variables || '{}')

    return NextResponse.json({
      profile: {
        ...profile,
        variables: overrides,
      },
      envVars: maskedVars,
      variableCount: envVars.length,
      overrideCount: Object.keys(overrides).length,
    })
  } catch (error) {
    console.error('Failed to get env profile:', error)
    return NextResponse.json({ error: 'Failed to get env profile' }, { status: 500 })
  }
}

// PUT /api/env-profiles/[id] - Update profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, variables } = body

    const existing = await db.envProfile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // If changing name, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await db.envProfile.findFirst({ where: { name } })
      if (duplicate) {
        return NextResponse.json({ error: 'Profile with this name already exists' }, { status: 409 })
      }
    }

    // Validate variables JSON if provided
    let varsJson: string | undefined
    if (variables !== undefined) {
      try {
        const parsed = typeof variables === 'string' ? JSON.parse(variables) : variables
        varsJson = JSON.stringify(parsed)
      } catch {
        return NextResponse.json({ error: 'Invalid variables JSON' }, { status: 400 })
      }
    }

    const profile = await db.envProfile.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(varsJson !== undefined && { variables: varsJson }),
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Failed to update env profile:', error)
    return NextResponse.json({ error: 'Failed to update env profile' }, { status: 500 })
  }
}

// DELETE /api/env-profiles/[id] - Delete profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.envProfile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Unlink all env vars from this profile
    await db.envVar.updateMany({
      where: { profileId: id },
      data: { profileId: null },
    })

    await db.envProfile.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Profile deleted' })
  } catch (error) {
    console.error('Failed to delete env profile:', error)
    return NextResponse.json({ error: 'Failed to delete env profile' }, { status: 500 })
  }
}
