import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const delegation = await db.delegation.findUnique({ where: { id } })
    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 })
    }

    const history = await db.delegationHistory.findMany({
      where: { delegationId: id },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Failed to fetch delegation history:', error)
    return NextResponse.json({ error: 'Failed to fetch delegation history' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, agentId, details } = body

    const delegation = await db.delegation.findUnique({ where: { id } })
    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const history = await db.delegationHistory.create({
      data: {
        delegationId: id,
        action,
        agentId: agentId || null,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : '{}',
      },
    })

    return NextResponse.json({ history }, { status: 201 })
  } catch (error) {
    console.error('Failed to add delegation history:', error)
    return NextResponse.json({ error: 'Failed to add delegation history' }, { status: 500 })
  }
}
