import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET /api/consensus/[id] - Get round by ID with votes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const round = await prisma.consensusRound.findUnique({
      where: { id },
      include: { votes: true },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    return NextResponse.json({ round })
  } catch (error) {
    console.error('Failed to fetch consensus round:', error)
    return NextResponse.json({ error: 'Failed to fetch consensus round' }, { status: 500 })
  }
}

// PUT /api/consensus/[id] - Update round (close, cancel)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, result } = body

    const existing = await prisma.consensusRound.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (result !== undefined) updateData.result = JSON.stringify(result)
    if (status === 'closed' || status === 'cancelled' || status === 'expired') {
      updateData.closedAt = new Date()
    }

    const round = await prisma.consensusRound.update({
      where: { id },
      data: updateData,
      include: { votes: true },
    })

    return NextResponse.json({ round })
  } catch (error) {
    console.error('Failed to update consensus round:', error)
    return NextResponse.json({ error: 'Failed to update consensus round' }, { status: 500 })
  }
}
