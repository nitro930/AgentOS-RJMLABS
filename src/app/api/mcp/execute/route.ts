import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/mcp/execute - Execute an MCP tool/resource/prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverId, toolId, type, name, input, agentId, pipelineId, stepIndex } = body

    if (!serverId || !name) {
      return NextResponse.json({ error: 'serverId and name are required' }, { status: 400 })
    }

    // Check server is connected
    const server = await prisma.mCPServer.findUnique({ where: { id: serverId } })
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Create execution record
    const execution = await prisma.mCPExecution.create({
      data: {
        serverId,
        toolId: toolId || null,
        type: type || 'tool',
        name,
        input: typeof input === 'string' ? input : JSON.stringify(input || {}),
        status: 'running',
        pipelineId: pipelineId || null,
        stepIndex: stepIndex || 0,
        agentId: agentId || null,
      },
    })

    // Update server request count
    await prisma.mCPServer.update({
      where: { id: serverId },
      data: { requestCount: { increment: 1 } },
    })

    // Simulate execution with varying duration based on tool type
    const startTime = Date.now()
    const executionType = type || 'tool'

    let mockOutput: any = {}
    let mockDuration = 0

    if (executionType === 'tool') {
      // Simulate different execution times for different tools
      const isReadOnly = name.includes('read') || name.includes('list') || name.includes('search') || name.includes('get') || name.includes('fetch') || name.includes('ping') || name.includes('info')
      mockDuration = isReadOnly ? Math.floor(Math.random() * 500) + 200 : Math.floor(Math.random() * 1500) + 500

      await new Promise(resolve => setTimeout(resolve, Math.min(mockDuration, 2000)))

      // Generate mock output based on tool name
      if (name.includes('read_file')) {
        mockOutput = { content: `// File contents from ${(typeof input === 'string' ? JSON.parse(input) : input)?.path || '/unknown'}\nconsole.log('Hello from MCP!');\n`, mimeType: 'text/javascript' }
      } else if (name.includes('write_file')) {
        mockOutput = { success: true, bytesWritten: (typeof input === 'string' ? JSON.parse(input) : input)?.content?.length || 42 }
      } else if (name.includes('list_directory') || name.includes('list_channel')) {
        mockOutput = { entries: [{ name: 'src', type: 'directory' }, { name: 'package.json', type: 'file', size: 1234 }, { name: 'README.md', type: 'file', size: 567 }] }
      } else if (name.includes('search')) {
        mockOutput = { results: [{ name: 'result-1', score: 0.95, path: '/path/to/result' }, { name: 'result-2', score: 0.87, path: '/path/to/another' }], total: 2 }
      } else if (name.includes('create_issue') || name.includes('create_pull_request')) {
        mockOutput = { id: Math.floor(Math.random() * 1000), url: `https://github.com/example/repo/issues/${Math.floor(Math.random() * 100)}`, status: 'created' }
      } else if (name.includes('send_message')) {
        mockOutput = { messageId: `msg_${Date.now()}`, timestamp: new Date().toISOString(), delivered: true }
      } else if (name.includes('execute_query') || name.includes('execute')) {
        mockOutput = { rows: [{ id: 1, name: 'example', value: 42 }], rowCount: 1, executionTime: mockDuration }
      } else if (name.includes('ping')) {
        mockOutput = { pong: true, latency: mockDuration, serverVersion: server.version }
      } else {
        mockOutput = { success: true, data: `Executed ${name} successfully`, timestamp: new Date().toISOString() }
      }

      // Update tool stats
      if (toolId) {
        const tool = await prisma.mCPTool.findUnique({ where: { id: toolId } })
        if (tool) {
          const newUseCount = tool.useCount + 1
          const newAvgDuration = Math.round((tool.avgDuration * tool.useCount + mockDuration) / newUseCount)
          await prisma.mCPTool.update({
            where: { id: toolId },
            data: { useCount: newUseCount, avgDuration: newAvgDuration, lastUsedAt: new Date() },
          })
        }
      }
    } else if (executionType === 'resource') {
      mockDuration = Math.floor(Math.random() * 300) + 100
      await new Promise(resolve => setTimeout(resolve, mockDuration))
      mockOutput = { uri: name, content: `Resource data from ${name}`, mimeType: 'application/json' }

      // Update resource stats
      await prisma.mCPResource.updateMany({
        where: { serverId, uri: name },
        data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
      })
    } else if (executionType === 'prompt') {
      mockDuration = Math.floor(Math.random() * 800) + 300
      await new Promise(resolve => setTimeout(resolve, mockDuration))
      mockOutput = { messages: [{ role: 'user', content: { type: 'text', text: `Generated prompt from ${name} with arguments: ${JSON.stringify(input)}` } }] }

      // Update prompt stats
      await prisma.mCPPrompt.updateMany({
        where: { serverId, name },
        data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
      })
    }

    const actualDuration = Date.now() - startTime

    // Update execution record
    const completedExecution = await prisma.mCPExecution.update({
      where: { id: execution.id },
      data: {
        status: 'success',
        output: JSON.stringify(mockOutput),
        duration: actualDuration,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ execution: completedExecution })
  } catch (error) {
    console.error('MCP execution failed:', error)

    // Try to update the execution record
    try {
      const body = await request.json()
      // Find the most recent running execution for this server
      const runningExec = await prisma.mCPExecution.findFirst({
        where: { serverId: body.serverId, status: 'running' },
        orderBy: { createdAt: 'desc' },
      })
      if (runningExec) {
        await prisma.mCPExecution.update({
          where: { id: runningExec.id },
          data: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        })
        // Increment server error count
        await prisma.mCPServer.update({
          where: { id: body.serverId },
          data: { errorCount: { increment: 1 } },
        })
      }
    } catch {}

    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  }
}
