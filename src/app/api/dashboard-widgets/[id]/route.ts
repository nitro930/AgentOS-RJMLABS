import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard-widgets/[id] - Get widget details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const widget = await db.dashboardWidget.findUnique({
      where: { id },
    })

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ widget })
  } catch (error) {
    console.error('Failed to fetch dashboard widget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard widget' },
      { status: 500 }
    )
  }
}

// PUT /api/dashboard-widgets/[id] - Update widget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, size, position, column, row, config, isActive, icon } = body

    const existing = await db.dashboardWidget.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (size !== undefined) updateData.size = size
    if (position !== undefined) updateData.position = position
    if (column !== undefined) updateData.column = column
    if (row !== undefined) updateData.row = row
    if (config !== undefined) updateData.config = typeof config === 'string' ? config : JSON.stringify(config)
    if (isActive !== undefined) updateData.isActive = isActive
    if (icon !== undefined) updateData.icon = icon

    const widget = await db.dashboardWidget.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ widget })
  } catch (error) {
    console.error('Failed to update dashboard widget:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard widget' },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboard-widgets/[id] - Remove/deactivate widget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.dashboardWidget.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      )
    }

    if (existing.isBuiltIn) {
      // For built-in widgets, just deactivate
      const widget = await db.dashboardWidget.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({ widget, deactivated: true })
    }

    // For custom widgets, delete entirely
    await db.dashboardWidget.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error('Failed to delete dashboard widget:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard widget' },
      { status: 500 }
    )
  }
}
