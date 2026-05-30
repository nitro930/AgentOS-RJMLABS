import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const agent = await db.agent.findUnique({
      where: { id },
      include: { tasks: true, outputs: true, memories: true },
    })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    return NextResponse.json(agent)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const agent = await db.agent.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.type && { type: body.type }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.modelId !== undefined && { modelId: body.modelId }),
        ...(body.config && { config: JSON.stringify(body.config) }),
        ...(body.avatar && { avatar: body.avatar }),
        ...(body.color && { color: body.color }),
        ...(body.tasksCompleted !== undefined && { tasksCompleted: body.tasksCompleted }),
        ...(body.tasksFailed !== undefined && { tasksFailed: body.tasksFailed }),
        ...(body.lastActiveAt && { lastActiveAt: new Date(body.lastActiveAt) }),
      },
    })
    return NextResponse.json(agent)
  } catch {
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.agent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
