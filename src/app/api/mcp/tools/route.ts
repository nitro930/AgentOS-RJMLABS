import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/tools - List all MCP tools across servers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const serverId = searchParams.get('serverId')
    const search = searchParams.get('search')

    const where: any = { isActive: true }
    if (serverId) where.serverId = serverId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const tools = await prisma.mCPTool.findMany({
      where,
      include: { server: { select: { id: true, name: true, icon: true, status: true } } },
      orderBy: { useCount: 'desc' },
    })

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Failed to fetch MCP tools:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP tools' }, { status: 500 })
  }
}
