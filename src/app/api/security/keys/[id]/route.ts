import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        provider: true,
        keyPreview: true,
        permissions: true,
        usageCount: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    })
    if (!apiKey) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...apiKey,
      permissions: JSON.parse(apiKey.permissions || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch key' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: body,
    })

    await prisma.auditLog.create({
      data: {
        action: 'update',
        resource: 'api_key',
        resourceId: id,
        details: JSON.stringify({ changes: Object.keys(body) }),
        source: 'user',
        severity: 'info',
      },
    })

    return NextResponse.json({
      ...apiKey,
      permissions: JSON.parse(apiKey.permissions || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update key' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.apiKey.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        action: 'delete',
        resource: 'api_key',
        resourceId: id,
        details: JSON.stringify({ action: 'deleted' }),
        source: 'user',
        severity: 'warning',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 })
  }
}
