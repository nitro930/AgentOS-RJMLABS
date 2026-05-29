import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.priority && { priority: body.priority }),
        ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
        ...(body.workspaceId !== undefined && { workspaceId: body.workspaceId }),
      },
    })
    return NextResponse.json(goal)
  } catch {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.goal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
