import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const goals = await db.goal.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(goals)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const goal = await db.goal.create({
      data: {
        title: body.title,
        description: body.description || '',
        status: body.status || 'active',
        progress: body.progress ?? 0,
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        workspaceId: body.workspaceId,
      },
    })
    return NextResponse.json(goal, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
