import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tasks = await db.agentTask.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const task = await db.agentTask.create({
      data: {
        agentId: id,
        title: body.title,
        description: body.description || '',
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        input: JSON.stringify(body.input || {}),
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
