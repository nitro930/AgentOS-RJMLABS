import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'

const prisma = new PrismaClient()
const execAsync = promisify(exec)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    const commands = await prisma.terminalCommand.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(commands.reverse())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch commands' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, command } = body

    if (!sessionId || !command) {
      return NextResponse.json({ error: 'sessionId and command required' }, { status: 400 })
    }

    // Execute command safely
    const startTime = Date.now()
    let output = ''
    let exitCode: number | null = 0

    // Only allow safe commands
    const safeCommands = ['ls', 'pwd', 'whoami', 'date', 'uname', 'uptime', 'df', 'free', 'ps', 'ss', 'docker', 'echo', 'cat', 'head', 'tail', 'wc', 'grep', 'find', 'top', 'hostname', 'ip', 'netstat', 'which', 'env', 'id', 'cal', 'history', 'help']
    const cmdBase = command.trim().split(/\s+/)[0]
    
    if (command.includes('rm -rf') || command.includes('sudo') || command.includes('mkfs') || command.includes('dd if')) {
      output = 'Command blocked for security reasons. Destructive commands are not allowed.'
      exitCode = 1
    } else {
      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: 10000,
          cwd: '/tmp',
          env: { ...process.env, PATH: process.env.PATH },
        })
        output = stdout || stderr || '(no output)'
        exitCode = 0
      } catch (err: any) {
        output = err.stderr || err.message || 'Command failed'
        exitCode = err.code || 1
      }
    }

    const duration = Date.now() - startTime

    const cmd = await prisma.terminalCommand.create({
      data: {
        sessionId,
        command,
        output: output.substring(0, 10000), // Limit output size
        exitCode,
        duration,
      },
    })

    // Update session
    await prisma.terminalSession.update({
      where: { id: sessionId },
      data: {
        lastCommand: command,
        commandCount: { increment: 1 },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'execute',
        resource: 'terminal',
        resourceId: sessionId,
        details: JSON.stringify({ command, exitCode, duration }),
        source: 'user',
        severity: exitCode === 0 ? 'info' : 'warning',
      },
    })

    return NextResponse.json(cmd)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to execute command' }, { status: 500 })
  }
}
