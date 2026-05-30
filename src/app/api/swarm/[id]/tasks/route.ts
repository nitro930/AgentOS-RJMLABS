import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tasks = await db.swarmTask.findMany({ where: { swarmId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ tasks })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, priority, input, assignedAgentId, parentTaskId, dependencies } = body
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    // Auto-decompose if enabled
    const swarm = await db.swarm.findUnique({ where: { id } })
    const task = await db.swarmTask.create({
      data: {
        swarmId: id,
        title,
        description: description || '',
        priority: priority || 'medium',
        input: typeof input === 'string' ? input : JSON.stringify(input || {}),
        assignedAgentId: assignedAgentId || null,
        parentTaskId: parentTaskId || null,
        dependencies: typeof dependencies === 'string' ? dependencies : JSON.stringify(dependencies || []),
      },
    })

    // Update swarm task count
    await db.swarm.update({ where: { id }, data: { totalTasks: { increment: 1 } } })

    // If auto-decompose, create subtasks
    if (swarm?.taskDecomposition === 'auto' && !parentTaskId) {
      const subtaskNames = generateSubtasks(title, description)
      const subtaskIds: string[] = []
      for (const subName of subtaskNames) {
        const sub = await db.swarmTask.create({
          data: { swarmId: id, title: subName, description: `Subtask of: ${title}`, parentTaskId: task.id, priority: priority || 'medium', input: '{}' },
        })
        subtaskIds.push(sub.id)
        await db.swarm.update({ where: { id }, data: { totalTasks: { increment: 1 } } })
      }
      await db.swarmTask.update({ where: { id: task.id }, data: { decomposition: JSON.stringify(subtaskIds) } })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

function generateSubtasks(title: string, description: string): string[] {
  const t = title.toLowerCase()
  if (t.includes('build') || t.includes('create') || t.includes('develop')) {
    return ['Research & Planning', 'Implementation', 'Testing & Review']
  } else if (t.includes('analyze') || t.includes('research') || t.includes('investigate')) {
    return ['Data Collection', 'Analysis', 'Report Generation']
  } else if (t.includes('deploy') || t.includes('release')) {
    return ['Pre-deployment Checks', 'Deployment', 'Post-deployment Verification']
  } else if (t.includes('fix') || t.includes('debug') || t.includes('troubleshoot')) {
    return ['Reproduce Issue', 'Root Cause Analysis', 'Fix & Verify']
  }
  return ['Preparation', 'Execution', 'Validation']
}
