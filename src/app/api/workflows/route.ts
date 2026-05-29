import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const workflows = await db.workflow.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(workflows)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const workflow = await db.workflow.create({
      data: {
        name: body.name,
        description: body.description,
        steps: JSON.stringify(body.steps || []),
        triggerType: body.triggerType || 'manual',
        triggerConfig: JSON.stringify(body.triggerConfig || {}),
      },
    })
    return NextResponse.json(workflow, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}
