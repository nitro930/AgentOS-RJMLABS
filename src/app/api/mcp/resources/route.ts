import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/resources - List all MCP resources
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const serverId = searchParams.get('serverId')

    const where: any = { isActive: true }
    if (serverId) where.serverId = serverId

    const resources = await prisma.mCPResource.findMany({
      where,
      include: { server: { select: { id: true, name: true, icon: true } } },
      orderBy: { accessCount: 'desc' },
    })

    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Failed to fetch MCP resources:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP resources' }, { status: 500 })
  }
}
