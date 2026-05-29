import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plugin = await prisma.plugin.findUnique({ where: { id } })
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...plugin,
      config: JSON.parse(plugin.config || '{}'),
      permissions: JSON.parse(plugin.permissions || '[]'),
      hooks: JSON.parse(plugin.hooks || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plugin' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const plugin = await prisma.plugin.update({
      where: { id },
      data: body,
    })

    await prisma.auditLog.create({
      data: {
        action: 'update',
        resource: 'system',
        resourceId: id,
        details: JSON.stringify({ type: 'plugin_toggle', name: plugin.name, isActive: plugin.isActive }),
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
    return NextResponse.json({ error: 'Failed to update plugin' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.plugin.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plugin' }, { status: 500 })
  }
}
