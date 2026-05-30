import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const backup = await db.backup.findUnique({ where: { id } })
    if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 })

    const data = JSON.parse(backup.data)

    // Restore based on what's in the backup data
    if (data.configs) {
      for (const config of data.configs) {
        await db.systemConfig.upsert({
          where: { key: config.key },
          update: { value: config.value, category: config.category },
          create: { key: config.key, value: config.value, category: config.category },
        })
      }
    }

    if (data.modelConfigs) {
      for (const mc of data.modelConfigs) {
        await db.modelConfig.upsert({
          where: { name: mc.name },
          update: {
            provider: mc.provider,
            modelId: mc.modelId,
            isActive: mc.isActive,
            costPer1k: mc.costPer1k,
            maxTokens: mc.maxTokens,
            capabilities: mc.capabilities,
            priority: mc.priority,
          },
          create: {
            name: mc.name,
            provider: mc.provider,
            modelId: mc.modelId,
            isActive: mc.isActive,
            costPer1k: mc.costPer1k,
            maxTokens: mc.maxTokens,
            capabilities: mc.capabilities,
            priority: mc.priority,
          },
        })
      }
    }

    if (data.routingRules) {
      for (const rule of data.routingRules) {
        await db.routingRule.upsert({
          where: { id: rule.id },
          update: {
            name: rule.name,
            condition: rule.condition,
            modelId: rule.modelId,
            isActive: rule.isActive,
            priority: rule.priority,
          },
          create: {
            id: rule.id,
            name: rule.name,
            condition: rule.condition,
            modelId: rule.modelId,
            isActive: rule.isActive,
            priority: rule.priority,
          },
        })
      }
    }

    if (data.agents) {
      for (const agent of data.agents) {
        const agentData = Array.isArray(agent) ? agent : [agent]
        for (const a of agentData) {
          await db.agent.upsert({
            where: { id: a.id },
            update: {
              name: a.name,
              type: a.type,
              description: a.description,
              status: a.status,
              modelId: a.modelId,
              config: a.config,
              avatar: a.avatar,
              color: a.color,
              tasksCompleted: a.tasksCompleted,
              tasksFailed: a.tasksFailed,
              lastActiveAt: a.lastActiveAt ? new Date(a.lastActiveAt) : null,
            },
            create: {
              id: a.id,
              name: a.name,
              type: a.type,
              description: a.description,
              status: a.status,
              modelId: a.modelId,
              config: a.config,
              avatar: a.avatar,
              color: a.color,
              tasksCompleted: a.tasksCompleted,
              tasksFailed: a.tasksFailed,
              lastActiveAt: a.lastActiveAt ? new Date(a.lastActiveAt) : null,
            },
          })
        }
      }
    }

    if (data.memories) {
      for (const m of data.memories) {
        await db.memoryEntry.upsert({
          where: { id: m.id },
          update: {
            type: m.type,
            title: m.title,
            content: m.content,
            tags: m.tags,
            source: m.source,
            agentId: m.agentId,
            path: m.path,
            pinned: m.pinned,
          },
          create: {
            id: m.id,
            type: m.type,
            title: m.title,
            content: m.content,
            tags: m.tags,
            source: m.source,
            agentId: m.agentId,
            path: m.path,
            pinned: m.pinned,
          },
        })
      }
    }

    if (data.workflows) {
      for (const w of data.workflows) {
        await db.workflow.upsert({
          where: { id: w.id },
          update: {
            name: w.name,
            description: w.description,
            status: w.status,
            steps: w.steps,
            triggerType: w.triggerType,
            triggerConfig: w.triggerConfig,
            lastRunAt: w.lastRunAt ? new Date(w.lastRunAt) : null,
            runCount: w.runCount,
            successRate: w.successRate,
          },
          create: {
            id: w.id,
            name: w.name,
            description: w.description,
            status: w.status,
            steps: w.steps,
            triggerType: w.triggerType,
            triggerConfig: w.triggerConfig,
            lastRunAt: w.lastRunAt ? new Date(w.lastRunAt) : null,
            runCount: w.runCount,
            successRate: w.successRate,
          },
        })
      }
    }

    if (data.outputs) {
      for (const o of data.outputs) {
        await db.agentOutput.upsert({
          where: { id: o.id },
          update: {
            agentId: o.agentId,
            type: o.type,
            title: o.title,
            content: o.content,
            routedTo: o.routedTo,
            memoryId: o.memoryId,
            isArchived: o.isArchived,
          },
          create: {
            id: o.id,
            agentId: o.agentId,
            type: o.type,
            title: o.title,
            content: o.content,
            routedTo: o.routedTo,
            memoryId: o.memoryId,
            isArchived: o.isArchived,
          },
        })
      }
    }

    if (data.goals) {
      for (const g of data.goals) {
        await db.goal.upsert({
          where: { id: g.id },
          update: {
            title: g.title,
            description: g.description,
            status: g.status,
            progress: g.progress,
            priority: g.priority,
            dueDate: g.dueDate ? new Date(g.dueDate) : null,
            workspaceId: g.workspaceId,
          },
          create: {
            id: g.id,
            title: g.title,
            description: g.description,
            status: g.status,
            progress: g.progress,
            priority: g.priority,
            dueDate: g.dueDate ? new Date(g.dueDate) : null,
            workspaceId: g.workspaceId,
          },
        })
      }
    }

    if (data.tasks) {
      for (const t of data.tasks) {
        await db.agentTask.upsert({
          where: { id: t.id },
          update: {
            agentId: t.agentId,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            input: t.input,
            output: t.output,
            error: t.error,
            startedAt: t.startedAt ? new Date(t.startedAt) : null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
          },
          create: {
            id: t.id,
            agentId: t.agentId,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            input: t.input,
            output: t.output,
            error: t.error,
            startedAt: t.startedAt ? new Date(t.startedAt) : null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
          },
        })
      }
    }

    return NextResponse.json({ success: true, message: `Backup restored (type: ${backup.type})` })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 })
  }
}
