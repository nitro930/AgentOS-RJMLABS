import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const fromAgent = searchParams.get('fromAgent')
    const toAgent = searchParams.get('toAgent')
    const type = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (fromAgent) where.fromAgentId = fromAgent
    if (toAgent) where.toAgentId = toAgent
    if (type) where.type = type

    const delegations = await db.delegation.findMany({
      where,
      include: {
        history: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ delegations })
  } catch (error) {
    console.error('Failed to fetch delegations:', error)
    return NextResponse.json({ error: 'Failed to fetch delegations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fromAgentId, toAgentId, taskId, type, title, description,
      input, output, priority, deadline, autoAccept, requireAck, reason, tags,
    } = body

    if (!fromAgentId || !toAgentId || !title) {
      return NextResponse.json(
        { error: 'fromAgentId, toAgentId, and title are required' },
        { status: 400 }
      )
    }

    if (fromAgentId === toAgentId) {
      return NextResponse.json(
        { error: 'Cannot delegate to the same agent' },
        { status: 400 }
      )
    }

    const delegation = await db.delegation.create({
      data: {
        fromAgentId,
        toAgentId,
        taskId: taskId || null,
        type: type || 'task',
        title,
        description: description || '',
        input: input || '{}',
        output: output || null,
        priority: priority || 'normal',
        status: 'pending',
        deadline: deadline ? new Date(deadline) : null,
        autoAccept: autoAccept || false,
        requireAck: requireAck !== undefined ? requireAck : true,
        reason: reason || null,
        tags: tags || '[]',
      },
    })

    // Create initial history entry
    await db.delegationHistory.create({
      data: {
        delegationId: delegation.id,
        action: 'created',
        agentId: fromAgentId,
        details: JSON.stringify({ type: delegation.type, priority: delegation.priority }),
      },
    })

    // If autoAccept, automatically accept
    if (autoAccept) {
      await db.delegation.update({
        where: { id: delegation.id },
        data: { status: 'accepted' },
      })
      await db.delegationHistory.create({
        data: {
          delegationId: delegation.id,
          action: 'accepted',
          agentId: toAgentId,
          details: JSON.stringify({ autoAccepted: true }),
        },
      })
    }

    const result = await db.delegation.findUnique({
      where: { id: delegation.id },
      include: { history: true },
    })

    return NextResponse.json({ delegation: result }, { status: 201 })
  } catch (error) {
    console.error('Failed to create delegation:', error)
    return NextResponse.json({ error: 'Failed to create delegation' }, { status: 500 })
  }
}
