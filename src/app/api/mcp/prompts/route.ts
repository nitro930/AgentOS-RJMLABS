import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/prompts - List all MCP prompts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const serverId = searchParams.get('serverId')

    const where: any = { isActive: true }
    if (serverId) where.serverId = serverId

    const prompts = await prisma.mCPPrompt.findMany({
      where,
      include: { server: { select: { id: true, name: true, icon: true } } },
      orderBy: { useCount: 'desc' },
    })

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Failed to fetch MCP prompts:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP prompts' }, { status: 500 })
  }
}
