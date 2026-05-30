import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const runs = await prisma.chainRun.findMany({
      where: { chainId: id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Failed to fetch chain runs:', error)
    return NextResponse.json({ error: 'Failed to fetch chain runs' }, { status: 500 })
  }
}
