import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard-widgets - List all dashboard widgets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const widgets = await db.dashboardWidget.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ widgets })
  } catch (error) {
    console.error('Failed to fetch dashboard widgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard widgets' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard-widgets - Create/activate a widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, description, size, position, column, row, config, icon, isBuiltIn } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      )
    }

    const validTypes = [
      'agent_status',
      'cost_summary',
      'memory_stats',
      'activity_feed',
      'health_monitor',
      'task_queue',
      'quick_actions',
      'recent_outputs',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid widget type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if widget of this type already exists
    const existing = await db.dashboardWidget.findFirst({
      where: { type },
    })

    if (existing) {
      // Reactivate existing widget
      const updated = await db.dashboardWidget.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          title: title || existing.title,
          description: description ?? existing.description,
          size: size || existing.size,
          position: position ?? existing.position,
          column: column ?? existing.column,
          row: row ?? existing.row,
          config: config ? JSON.stringify(config) : existing.config,
          icon: icon || existing.icon,
        },
      })
      return NextResponse.json({ widget: updated })
    }

    const widget = await db.dashboardWidget.create({
      data: {
        type,
        title,
        description: description || null,
        size: size || 'medium',
        position: position ?? 0,
        column: column ?? 0,
        row: row ?? 0,
        config: config ? JSON.stringify(config) : '{}',
        icon: icon || '📊',
        isBuiltIn: isBuiltIn ?? false,
      },
    })

    return NextResponse.json({ widget }, { status: 201 })
  } catch (error) {
    console.error('Failed to create dashboard widget:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard widget' },
      { status: 500 }
    )
  }
}
