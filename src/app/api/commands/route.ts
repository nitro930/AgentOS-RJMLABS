import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const command = body.command?.trim()
    
    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    // Parse and execute simple commands
    let result = ''
    let status = 'executed'
    const source = body.source || 'user'

    const cmd = command.toLowerCase()
    
    if (cmd === 'help') {
      result = 'Available commands: help, status, agents, memory, clear, ping, uptime, version'
    } else if (cmd === 'status') {
      const agents = await db.agent.count()
      const active = await db.agent.count({ where: { status: 'running' } })
      const memories = await db.memoryEntry.count()
      const tasks = await db.agentTask.count({ where: { status: 'running' } })
      result = `System Status: ${agents} agents (${active} active) | ${memories} memories | ${tasks} running tasks`
    } else if (cmd === 'agents') {
      const agents = await db.agent.findMany({ select: { name: true, status: true } })
      result = agents.map(a => `${a.name}: ${a.status}`).join(' | ')
    } else if (cmd === 'memory') {
      const count = await db.memoryEntry.count()
      result = `Memory vault: ${count} entries`
    } else if (cmd === 'ping') {
      result = 'pong'
    } else if (cmd === 'version') {
      result = 'AgentOS v1.0.0'
    } else if (cmd === 'uptime') {
      result = `System running since ${new Date().toISOString()}`
    } else if (cmd === 'clear') {
      result = 'Terminal cleared'
    } else {
      result = `Command executed: ${command}`
      status = 'executed'
    }

    // Log the command
    const log = await db.commandLog.create({
      data: { command, source, result, status },
    })

    // Create activity event
    await db.activityEvent.create({
      data: {
        type: 'command',
        source: 'user',
        detail: JSON.stringify({ command, result }),
      },
    })

    return NextResponse.json(log)
  } catch {
    return NextResponse.json({ error: 'Failed to execute command' }, { status: 500 })
  }
}
