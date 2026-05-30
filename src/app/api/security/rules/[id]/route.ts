import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rule = await prisma.accessRule.findUnique({ where: { id } })
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...rule,
      conditions: JSON.parse(rule.conditions || '{}'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rule' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.accessRule.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        action: 'delete',
        resource: 'api_key',
        resourceId: id,
        details: JSON.stringify({ action: 'rule_deleted' }),
        source: 'user',
        severity: 'warning',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}
