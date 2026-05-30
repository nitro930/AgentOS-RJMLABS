import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function fetchBackupData(type: string) {
  switch (type) {
    case 'full': {
      const [agents, memories, workflows, outputs, goals, tasks, configs] = await Promise.all([
        db.agent.findMany(),
        db.memoryEntry.findMany(),
        db.workflow.findMany(),
        db.agentOutput.findMany(),
        db.goal.findMany(),
        db.agentTask.findMany(),
        db.systemConfig.findMany(),
      ])
      return { agents, memories, workflows, outputs, goals, tasks, configs }
    }
    case 'memory': {
      const memories = await db.memoryEntry.findMany()
      return { memories }
    }
    case 'agents': {
      const agents = await db.agent.findMany({ include: { tasks: true, outputs: true } })
      return { agents }
    }
    case 'workflows': {
      const workflows = await db.workflow.findMany()
      return { workflows }
    }
    case 'config': {
      const [configs, modelConfigs, routingRules] = await Promise.all([
        db.systemConfig.findMany(),
        db.modelConfig.findMany(),
        db.routingRule.findMany(),
      ])
      return { configs, modelConfigs, routingRules }
    }
    default:
      return {}
  }
}

export async function GET() {
  try {
    const backups = await db.backup.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(backups)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const type = body.type || 'full'

    const data = await fetchBackupData(type)
    const dataStr = JSON.stringify(data)
    const size = Buffer.byteLength(dataStr, 'utf-8')

    const backup = await db.backup.create({
      data: {
        name: body.name,
        ...(body.description !== undefined && { description: body.description }),
        type,
        size,
        data: dataStr,
      },
    })
    return NextResponse.json(backup, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
