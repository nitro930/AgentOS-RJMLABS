import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const delegation = await db.delegation.findUnique({
      where: { id },
      include: {
        history: { orderBy: { timestamp: 'desc' } },
      },
    })

    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 })
    }

    return NextResponse.json({ delegation })
  } catch (error) {
    console.error('Failed to fetch delegation:', error)
    return NextResponse.json({ error: 'Failed to fetch delegation' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, reason, output, agentId } = body

    const delegation = await db.delegation.findUnique({ where: { id } })
    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 })
    }

    const validActions = ['accept', 'reject', 'complete', 'revoke', 'acknowledge', 'escalate']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let historyAction = action
    const historyDetails: any = { previousStatus: delegation.status }

    switch (action) {
      case 'accept':
        if (!['pending', 'accepted'].includes(delegation.status)) {
          return NextResponse.json(
            { error: 'Can only accept pending delegations' },
            { status: 400 }
          )
        }
        updateData = { status: 'accepted' }
        historyAction = 'accepted'
        break

      case 'reject':
        if (!['pending', 'accepted'].includes(delegation.status)) {
          return NextResponse.json(
            { error: 'Can only reject pending or accepted delegations' },
            { status: 400 }
          )
        }
        updateData = { status: 'rejected', reason: reason || null }
        historyAction = 'rejected'
        historyDetails.reason = reason
        break

      case 'complete':
        if (!['accepted', 'in_progress'].includes(delegation.status)) {
          return NextResponse.json(
            { error: 'Can only complete accepted or in-progress delegations' },
            { status: 400 }
          )
        }
        updateData = { status: 'completed', output: output || delegation.output, completedAt: new Date() }
        historyAction = 'completed'
        historyDetails.output = output
        break

      case 'revoke':
        if (['completed', 'rejected', 'revoked'].includes(delegation.status)) {
          return NextResponse.json(
            { error: 'Cannot revoke a completed, rejected, or already revoked delegation' },
            { status: 400 }
          )
        }
        updateData = { status: 'revoked', reason: reason || null }
        historyAction = 'revoked'
        historyDetails.reason = reason
        break

      case 'acknowledge':
        if (delegation.acknowledgedAt) {
          return NextResponse.json(
            { error: 'Already acknowledged' },
            { status: 400 }
          )
        }
        updateData = { acknowledgedAt: new Date() }
        historyAction = 'acknowledged'
        break

      case 'escalate':
        updateData = { reason: reason || delegation.reason }
        historyAction = 'escalated'
        historyDetails.reason = reason
        break
    }

    // If accepted and has input, transition to in_progress
    if (action === 'accept' && delegation.status === 'pending') {
      updateData.status = 'in_progress'
    }

    const updated = await db.delegation.update({
      where: { id },
      data: updateData,
    })

    await db.delegationHistory.create({
      data: {
        delegationId: id,
        action: historyAction,
        agentId: agentId || null,
        details: JSON.stringify(historyDetails),
      },
    })

    const result = await db.delegation.findUnique({
      where: { id },
      include: { history: { orderBy: { timestamp: 'desc' } } },
    })

    return NextResponse.json({ delegation: result })
  } catch (error) {
    console.error('Failed to update delegation:', error)
    return NextResponse.json({ error: 'Failed to update delegation' }, { status: 500 })
  }
}
