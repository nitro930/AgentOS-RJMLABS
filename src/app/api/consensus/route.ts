import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET /api/consensus - List all consensus rounds with vote counts
export async function GET() {
  try {
    const rounds = await prisma.consensusRound.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { votes: true } },
      },
    })
    return NextResponse.json({ rounds })
  } catch (error) {
    console.error('Failed to fetch consensus rounds:', error)
    return NextResponse.json({ error: 'Failed to fetch consensus rounds' }, { status: 500 })
  }
}

// POST /api/consensus - Create a new consensus round
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      topic,
      type = 'vote',
      proposerId,
      options = [],
      threshold = 0.5,
      strategy = 'simple_majority',
      weights = {},
      maxVotes = 0,
      deadline,
    } = body

    if (!title || !topic) {
      return NextResponse.json({ error: 'Title and topic are required' }, { status: 400 })
    }

    const round = await prisma.consensusRound.create({
      data: {
        title,
        description,
        topic,
        type,
        proposerId,
        options: JSON.stringify(options),
        threshold,
        strategy,
        weights: JSON.stringify(weights),
        maxVotes,
        deadline: deadline ? new Date(deadline) : null,
        status: 'open',
        totalVotes: 0,
      },
    })

    return NextResponse.json({ round }, { status: 201 })
  } catch (error) {
    console.error('Failed to create consensus round:', error)
    return NextResponse.json({ error: 'Failed to create consensus round' }, { status: 500 })
  }
}
