import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const dashboard = await prisma.customDashboard.findUnique({
      where: { id },
      include: {
        widgets: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Custom dashboard not found' }, { status: 404 })
    }

    return NextResponse.json(dashboard)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch custom dashboard' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.customDashboard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Custom dashboard not found' }, { status: 404 })
    }

    // Update dashboard properties
    const dashboard = await prisma.customDashboard.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.layout !== undefined && { layout: body.layout }),
        ...(body.columns !== undefined && { columns: body.columns }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.bgColor !== undefined && { bgColor: body.bgColor }),
        ...(body.gridGap !== undefined && { gridGap: body.gridGap }),
        ...(body.createdBy !== undefined && { createdBy: body.createdBy }),
        ...(body.lastViewedAt !== undefined && { lastViewedAt: new Date(body.lastViewedAt) }),
        ...(body.viewCount !== undefined && { viewCount: body.viewCount }),
      },
      include: {
        widgets: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // If widgets are provided, replace them
    if (body.widgets && Array.isArray(body.widgets)) {
      // Delete existing widgets
      await prisma.dashboardWidgetInstance.deleteMany({
        where: { dashboardId: id },
      })

      // Create new widgets
      if (body.widgets.length > 0) {
        await prisma.dashboardWidgetInstance.createMany({
          data: body.widgets.map((widget: Record<string, unknown>, index: number) => ({
            dashboardId: id,
            widgetType: widget.widgetType as string,
            title: widget.title as string,
            config: JSON.stringify(widget.config || {}),
            position: JSON.stringify(widget.position || {}),
            refreshRate: (widget.refreshRate as number) ?? 0,
            isCollapsed: (widget.isCollapsed as boolean) ?? false,
            order: (widget.order as number) ?? index,
          })),
        })
      }

      // Re-fetch with updated widgets
      const updated = await prisma.customDashboard.findUnique({
        where: { id },
        include: {
          widgets: { orderBy: { order: 'asc' } },
        },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json(dashboard)
  } catch {
    return NextResponse.json({ error: 'Failed to update custom dashboard' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.customDashboard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Custom dashboard not found' }, { status: 404 })
    }

    // Delete widgets first (though cascade should handle it)
    await prisma.dashboardWidgetInstance.deleteMany({
      where: { dashboardId: id },
    })

    await prisma.customDashboard.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete custom dashboard' }, { status: 500 })
  }
}
