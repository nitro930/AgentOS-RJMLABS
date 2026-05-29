import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const resource = searchParams.get('resource')
    const severity = searchParams.get('severity')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '200')

    const where: any = {}
    if (action) where.action = action
    if (resource) where.resource = resource
    if (severity) where.severity = severity
    if (source) where.source = source

    const entries = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const entry = await prisma.auditLog.create({
      data: {
        action: body.action || 'read',
        resource: body.resource || 'system',
        resourceId: body.resourceId || null,
        details: JSON.stringify(body.details || {}),
        source: body.source || 'system',
        sourceId: body.sourceId || null,
        ipAddress: body.ipAddress || null,
        severity: body.severity || 'info',
      },
    })
    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create audit entry' }, { status: 500 })
  }
}
