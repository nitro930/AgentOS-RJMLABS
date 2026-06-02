import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const dashboards = await prisma.customDashboard.findMany({
      include: {
        _count: {
          select: { widgets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = dashboards.map((dashboard) => ({
      ...dashboard,
      widgetCount: dashboard._count.widgets,
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch custom dashboards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Dashboard name is required' }, { status: 400 })
    }

    const dashboard = await prisma.customDashboard.create({
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon || '📊',
        layout: body.layout || 'grid',
        columns: body.columns ?? 3,
        isDefault: body.isDefault ?? false,
        isPublic: body.isPublic ?? false,
        bgColor: body.bgColor || '#0f1117',
        gridGap: body.gridGap ?? 16,
        createdBy: body.createdBy,
      },
      include: {
        widgets: true,
      },
    })

    return NextResponse.json(dashboard, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create custom dashboard' }, { status: 500 })
  }
}
