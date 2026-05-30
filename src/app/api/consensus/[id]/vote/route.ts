import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// POST /api/consensus/[id]/vote - Cast a vote on a round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { agentId, vote, reason, weight = 1, confidence = 1 } = body

    if (!agentId || !vote) {
      return NextResponse.json({ error: 'Agent ID and vote are required' }, { status: 400 })
    }

    const round = await prisma.consensusRound.findUnique({
      where: { id },
      include: { votes: true },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status !== 'open' && round.status !== 'voting') {
      return NextResponse.json({ error: 'Round is not open for voting' }, { status: 400 })
    }

    // Check if agent already voted
    const existingVote = round.votes.find(v => v.agentId === agentId)
    if (existingVote) {
      return NextResponse.json({ error: 'Agent has already voted on this round' }, { status: 409 })
    }

    // Check max votes limit
    if (round.maxVotes > 0 && round.votes.length >= round.maxVotes) {
      return NextResponse.json({ error: 'Maximum votes reached for this round' }, { status: 400 })
    }

    // Check deadline
    if (round.deadline && new Date() > new Date(round.deadline)) {
      // Auto-expire the round
      await prisma.consensusRound.update({
        where: { id },
        data: { status: 'expired', closedAt: new Date() },
      })
      return NextResponse.json({ error: 'Round deadline has passed' }, { status: 400 })
    }

    // Create the vote
    const newVote = await prisma.consensusVote.create({
      data: {
        roundId: id,
        agentId,
        vote,
        reason,
        weight,
        confidence,
      },
    })

    // Update round totalVotes and status
    const newTotalVotes = round.votes.length + 1
    await prisma.consensusRound.update({
      where: { id },
      data: {
        totalVotes: newTotalVotes,
        status: 'voting',
      },
    })

    return NextResponse.json({ vote: newVote }, { status: 201 })
  } catch (error) {
    console.error('Failed to cast vote:', error)
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
  }
}
