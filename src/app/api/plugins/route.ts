import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const plugins = await prisma.plugin.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const parsed = plugins.map(p => ({
      ...p,
      config: JSON.parse(p.config || '{}'),
      permissions: JSON.parse(p.permissions || '[]'),
      hooks: JSON.parse(p.hooks || '[]'),
    }))
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plugins' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const plugin = await prisma.plugin.create({
      data: {
        name: body.name,
        description: body.description || '',
        version: body.version || '1.0.0',
        author: body.author || 'community',
        category: body.category || 'utility',
        icon: body.icon || '🧩',
        entryPoint: body.entryPoint || '',
        config: JSON.stringify(body.config || {}),
        permissions: JSON.stringify(body.permissions || []),
        hooks: JSON.stringify(body.hooks || []),
        isActive: body.isActive ?? false,
        isInstalled: true,
        isBuiltIn: body.isBuiltIn ?? false,
        rating: body.rating ?? 0,
        installCount: body.installCount ?? 0,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'system',
        resourceId: plugin.id,
        details: JSON.stringify({ type: 'plugin_install', name: plugin.name }),
        source: 'user',
        severity: 'info',
      },
    })

    return NextResponse.json({
      ...plugin,
      config: JSON.parse(plugin.config || '{}'),
      permissions: JSON.parse(plugin.permissions || '[]'),
      hooks: JSON.parse(plugin.hooks || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plugin' }, { status: 500 })
  }
}
