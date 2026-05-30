import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard-preferences - Get dashboard preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const preferences = await db.dashboardPreference.findMany({
      where: category ? { category } : undefined,
      orderBy: { category: 'asc' },
    })

    // Parse JSON values
    const parsed = preferences.map((p) => ({
      ...p,
      parsedValue: safeParseJSON(p.value),
    }))

    return NextResponse.json({ preferences: parsed })
  } catch (error) {
    console.error('Failed to fetch dashboard preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/dashboard-preferences - Update dashboard preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { preferences } = body as {
      preferences: Array<{
        key: string
        value: unknown
        category?: string
      }>
    }

    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Preferences array is required' },
        { status: 400 }
      )
    }

    const results = []

    for (const pref of preferences) {
      if (!pref.key) continue

      const valueStr = typeof pref.value === 'string' ? pref.value : JSON.stringify(pref.value)

      const upserted = await db.dashboardPreference.upsert({
        where: { key: pref.key },
        update: {
          value: valueStr,
          category: pref.category || 'preferences',
        },
        create: {
          key: pref.key,
          value: valueStr,
          category: pref.category || 'preferences',
        },
      })

      results.push(upserted)
    }

    return NextResponse.json({ preferences: results })
  } catch (error) {
    console.error('Failed to update dashboard preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard preferences' },
      { status: 500 }
    )
  }
}

function safeParseJSON(str: string): unknown {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}
