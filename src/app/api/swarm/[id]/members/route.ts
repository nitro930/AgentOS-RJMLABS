import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { agentId, role } = await request.json()
    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    const member = await db.swarmMember.create({
      data: { swarmId: id, agentId, role: role || 'worker' },
    })
    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { agentId } = await request.json()
    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    await db.swarmMember.deleteMany({ where: { swarmId: id, agentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
