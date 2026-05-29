import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function fetchExportData(type: string) {
  switch (type) {
    case 'full': {
      const [agents, memories, workflows, outputs, goals, tasks, configs, modelConfigs, routingRules] = await Promise.all([
        db.agent.findMany(),
        db.memoryEntry.findMany(),
        db.workflow.findMany(),
        db.agentOutput.findMany(),
        db.goal.findMany(),
        db.agentTask.findMany(),
        db.systemConfig.findMany(),
        db.modelConfig.findMany(),
        db.routingRule.findMany(),
      ])
      return { agents, memories, workflows, outputs, goals, tasks, configs, modelConfigs, routingRules }
    }
    case 'memory': {
      const memories = await db.memoryEntry.findMany()
      return { memories }
    }
    case 'agents': {
      const [agents, tasks, outputs] = await Promise.all([
        db.agent.findMany(),
        db.agentTask.findMany(),
        db.agentOutput.findMany(),
      ])
      return { agents, tasks, outputs }
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

function dataToMarkdown(data: Record<string, unknown>, type: string): string {
  const lines: string[] = []
  lines.push(`# AgentOS Export - ${type.toUpperCase()}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')

  for (const [key, value] of Object.entries(data)) {
    const items = value as Record<string, unknown>[]
    if (!Array.isArray(items) || items.length === 0) continue

    lines.push(`## ${key.charAt(0).toUpperCase() + key.slice(1)} (${items.length})`)
    lines.push('')

    for (const item of items) {
      const title = (item.name || item.title || item.key || item.id) as string
      lines.push(`### ${title}`)
      lines.push('')
      for (const [field, val] of Object.entries(item)) {
        if (field === 'id') continue
        const strVal = typeof val === 'string' ? val : JSON.stringify(val)
        lines.push(`- **${field}**: ${strVal}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const type = searchParams.get('type') || 'full'

    const data = await fetchExportData(type)

    if (format === 'markdown') {
      const md = dataToMarkdown(data, type)
      return new Response(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="agentos-export-${type}.md"`,
        },
      })
    }

    // Default: JSON format
    const json = JSON.stringify(data, null, 2)
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="agentos-export-${type}.json"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
