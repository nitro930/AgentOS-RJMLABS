import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/executions - List executions with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const serverId = searchParams.get('serverId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (serverId) where.serverId = serverId
    if (status) where.status = status
    if (type) where.type = type

    const [executions, total] = await Promise.all([
      prisma.mCPExecution.findMany({
        where,
        include: { server: { select: { id: true, name: true, icon: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.mCPExecution.count({ where }),
    ])

    return NextResponse.json({ executions, total })
  } catch (error) {
    console.error('Failed to fetch executions:', error)
    return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 })
  }
}
