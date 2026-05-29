import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const task = await db.scheduledTask.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.status && { status: body.status }),
        ...(body.cronExpr && { cronExpr: body.cronExpr }),
        ...(body.agentId !== undefined && { agentId: body.agentId }),
        ...(body.workflowId !== undefined && { workflowId: body.workflowId }),
        ...(body.taskType && { taskType: body.taskType }),
        ...(body.taskConfig && { taskConfig: JSON.stringify(body.taskConfig) }),
        ...(body.lastRunAt && { lastRunAt: new Date(body.lastRunAt) }),
        ...(body.nextRunAt && { nextRunAt: new Date(body.nextRunAt) }),
        ...(body.runCount !== undefined && { runCount: body.runCount }),
        ...(body.failCount !== undefined && { failCount: body.failCount }),
      },
    })
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Failed to update scheduled task' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.scheduledTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete scheduled task' }, { status: 500 })
  }
}
