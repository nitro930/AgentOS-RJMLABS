import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface VoteData {
  agentId: string
  vote: string
  weight: number
  confidence: number
}

interface OptionData {
  id: string
  label: string
  description?: string
}

// GET /api/consensus/[id]/result - Calculate and return round result based on strategy
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

    const votes: VoteData[] = round.votes.map(v => ({
      agentId: v.agentId,
      vote: v.vote,
      weight: v.weight,
      confidence: v.confidence,
    }))

    let options: OptionData[] = []
    try {
      options = JSON.parse(round.options || '[]')
    } catch { /* use empty */ }

    let weights: Record<string, number> = {}
    try {
      weights = JSON.parse(round.weights || '{}')
    } catch { /* use empty */ }

    // Count votes per option
    const voteCounts: Record<string, { count: number; weightedScore: number; totalConfidence: number }> = {}
    for (const option of options) {
      voteCounts[option.id] = { count: 0, weightedScore: 0, totalConfidence: 0 }
    }

    // Tally votes
    for (const v of votes) {
      const optionId = v.vote
      if (!voteCounts[optionId]) {
        voteCounts[optionId] = { count: 0, weightedScore: 0, totalConfidence: 0 }
      }
      const agentWeight = weights[v.agentId] ?? v.weight
      voteCounts[optionId].count += 1
      voteCounts[optionId].weightedScore += agentWeight * v.confidence
      voteCounts[optionId].totalConfidence += v.confidence
    }

    const totalVotes = votes.length
    const totalWeighted = Object.values(voteCounts).reduce((sum, vc) => sum + vc.weightedScore, 0)

    // Determine winner based on strategy
    let winner: string | null = null
    let passed = false
    let strategyDetails: Record<string, unknown> = {}

    switch (round.strategy) {
      case 'simple_majority': {
        // Option with most votes wins
        let maxVotes = 0
        for (const [optionId, vc] of Object.entries(voteCounts)) {
          if (vc.count > maxVotes) {
            maxVotes = vc.count
            winner = optionId
          }
        }
        passed = totalVotes > 0 && maxVotes / totalVotes >= round.threshold
        strategyDetails = { type: 'simple_majority', threshold: round.threshold, winnerVotes: maxVotes, totalVotes }
        break
      }
      case 'super_majority': {
        // Needs 2/3 or specified threshold
        let maxVotes = 0
        for (const [optionId, vc] of Object.entries(voteCounts)) {
          if (vc.count > maxVotes) {
            maxVotes = vc.count
            winner = optionId
          }
        }
        const superThreshold = round.threshold || 0.667
        passed = totalVotes > 0 && maxVotes / totalVotes >= superThreshold
        strategyDetails = { type: 'super_majority', threshold: superThreshold, winnerVotes: maxVotes, totalVotes }
        break
      }
      case 'unanimous': {
        // All voters must agree
        const uniqueVotes = new Set(votes.map(v => v.vote))
        if (uniqueVotes.size === 1 && votes.length > 0) {
          winner = votes[0].vote
          passed = true
        } else {
          // Pick the plurality winner anyway
          let maxVotes = 0
          for (const [optionId, vc] of Object.entries(voteCounts)) {
            if (vc.count > maxVotes) {
              maxVotes = vc.count
              winner = optionId
            }
          }
          passed = false
        }
        strategyDetails = { type: 'unanimous', uniqueOptions: uniqueVotes.size, totalVotes }
        break
      }
      case 'weighted': {
        // Use weighted scores
        let maxWeighted = 0
        for (const [optionId, vc] of Object.entries(voteCounts)) {
          if (vc.weightedScore > maxWeighted) {
            maxWeighted = vc.weightedScore
            winner = optionId
          }
        }
        passed = totalWeighted > 0 && maxWeighted / totalWeighted >= round.threshold
        strategyDetails = { type: 'weighted', threshold: round.threshold, winnerWeightedScore: maxWeighted, totalWeighted }
        break
      }
      case 'borda': {
        // Borda count: rank-based scoring (simplified for approval/vote)
        // Each voter ranks options. Here we simplify by giving points based on vote order.
        // For single-vote: 1st choice = N points, where N = number of options
        const bordaScores: Record<string, number> = {}
        for (const option of options) {
          bordaScores[option.id] = 0
        }
        const numOptions = options.length
        for (const v of votes) {
          const agentWeight = weights[v.agentId] ?? v.weight
          // Simple borda: first choice gets numOptions points
          if (!bordaScores[v.vote]) bordaScores[v.vote] = 0
          bordaScores[v.vote] += numOptions * agentWeight * v.confidence
        }
        let maxBorda = 0
        for (const [optionId, score] of Object.entries(bordaScores)) {
          if (score > maxBorda) {
            maxBorda = score
            winner = optionId
          }
        }
        const totalBorda = Object.values(bordaScores).reduce((s, v) => s + v, 0)
        passed = totalBorda > 0 && maxBorda / totalBorda >= round.threshold
        strategyDetails = { type: 'borda', bordaScores, threshold: round.threshold }
        break
      }
      default: {
        // Fallback to simple majority
        let maxVotes = 0
        for (const [optionId, vc] of Object.entries(voteCounts)) {
          if (vc.count > maxVotes) {
            maxVotes = vc.count
            winner = optionId
          }
        }
        passed = totalVotes > 0 && maxVotes / totalVotes >= round.threshold
        strategyDetails = { type: 'simple_majority_fallback', threshold: round.threshold }
      }
    }

    // Build breakdown per option
    const breakdown = options.map(option => {
      const vc = voteCounts[option.id] || { count: 0, weightedScore: 0, totalConfidence: 0 }
      return {
        id: option.id,
        label: option.label,
        description: option.description,
        votes: vc.count,
        weightedScore: vc.weightedScore,
        avgConfidence: vc.count > 0 ? vc.totalConfidence / vc.count : 0,
        percentage: totalVotes > 0 ? Math.round((vc.count / totalVotes) * 100) : 0,
      }
    })

    const winnerOption = options.find(o => o.id === winner)

    const result = {
      roundId: round.id,
      roundTitle: round.title,
      strategy: round.strategy,
      threshold: round.threshold,
      totalVotes,
      winner: winnerOption ? { id: winner, label: winnerOption.label } : null,
      passed,
      breakdown,
      strategyDetails,
      status: round.status,
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Failed to calculate result:', error)
    return NextResponse.json({ error: 'Failed to calculate result' }, { status: 500 })
  }
}
