import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/env-profiles - List env profiles
export async function GET() {
  try {
    const profiles = await db.envProfile.findMany({
      orderBy: [{ name: 'asc' }],
    })

    // Count variables for each profile
    const profilesWithCounts = await Promise.all(
      profiles.map(async (profile) => {
        const varCount = await db.envVar.count({
          where: { profileId: profile.id },
        })
        const vars = JSON.parse(profile.variables || '{}')
        const overrideCount = Object.keys(vars).length

        return {
          ...profile,
          variableCount: varCount,
          overrideCount,
        }
      })
    )

    const activeProfile = profilesWithCounts.find((p) => p.isActive)

    return NextResponse.json({
      profiles: profilesWithCounts,
      total: profilesWithCounts.length,
      activeProfileId: activeProfile?.id || null,
    })
  } catch (error) {
    console.error('Failed to list env profiles:', error)
    return NextResponse.json({ error: 'Failed to list env profiles' }, { status: 500 })
  }
}

// POST /api/env-profiles - Create new profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, variables } = body

    if (!name) {
      return NextResponse.json({ error: 'Profile name is required' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await db.envProfile.findFirst({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Profile with this name already exists' }, { status: 409 })
    }

    // Validate variables JSON
    let varsJson = '{}'
    if (variables) {
      try {
        const parsed = typeof variables === 'string' ? JSON.parse(variables) : variables
        varsJson = JSON.stringify(parsed)
      } catch {
        return NextResponse.json({ error: 'Invalid variables JSON' }, { status: 400 })
      }
    }

    const profile = await db.envProfile.create({
      data: {
        name,
        description: description || null,
        isActive: false,
        variables: varsJson,
      },
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Failed to create env profile:', error)
    return NextResponse.json({ error: 'Failed to create env profile' }, { status: 500 })
  }
}
