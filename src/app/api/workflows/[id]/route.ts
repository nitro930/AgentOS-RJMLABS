import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const workflow = await db.workflow.findUnique({ where: { id } })
    if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    return NextResponse.json(workflow)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const workflow = await db.workflow.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.steps && { steps: JSON.stringify(body.steps) }),
        ...(body.triggerType && { triggerType: body.triggerType }),
        ...(body.triggerConfig && { triggerConfig: JSON.stringify(body.triggerConfig) }),
        ...(body.lastRunAt && { lastRunAt: new Date(body.lastRunAt) }),
        ...(body.runCount !== undefined && { runCount: body.runCount }),
        ...(body.successRate !== undefined && { successRate: body.successRate }),
      },
    })
    return NextResponse.json(workflow)
  } catch {
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.workflow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
