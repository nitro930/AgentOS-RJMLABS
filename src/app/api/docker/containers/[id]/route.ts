import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/docker/containers/[id] — Get container details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const container = await db.dockerContainer.findUnique({ where: { id } })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Generate mock logs based on container status
    const logLines = [
      `[${new Date().toISOString()}] Container ${container.name} (${container.id.slice(0, 12)})`,
    ]

    if (container.status === 'running') {
      logLines.push(
        `[${new Date(Date.now() - 60000).toISOString()}] Server listening on port ${JSON.parse(container.ports)[0]?.internal || 3000}`,
        `[${new Date(Date.now() - 45000).toISOString()}] Health check passed`,
        `[${new Date(Date.now() - 30000).toISOString()}] Memory usage: ${container.memoryUsage}MB / ${container.memoryLimit}MB`,
        `[${new Date(Date.now() - 15000).toISOString()}] CPU usage: ${container.cpuPercent.toFixed(1)}%`,
        `[${new Date().toISOString()}] Request processed in 12ms`
      )
    } else if (container.status === 'stopped') {
      logLines.push(
        `[${new Date(Date.now() - 3600000).toISOString()}] Received SIGTERM`,
        `[${new Date(Date.now() - 3599000).toISOString()}] Graceful shutdown initiated`,
        `[${new Date(Date.now() - 3598000).toISOString()}] Server stopped`
      )
    } else if (container.status === 'paused') {
      logLines.push(
        `[${new Date(Date.now() - 1800000).toISOString()}] Container paused`,
        `[${new Date(Date.now() - 1799000).toISOString()}] All processes suspended`
      )
    } else if (container.status === 'dead') {
      logLines.push(
        `[${new Date(Date.now() - 7200000).toISOString()}] ERROR: Process exited with code 137`,
        `[${new Date(Date.now() - 7199000).toISOString()}] OOM killer triggered`,
        `[${new Date(Date.now() - 7198000).toISOString()}] Container marked as dead`
      )
    }

    return NextResponse.json({
      container,
      logs: logLines.join('\n'),
    })
  } catch (error) {
    console.error('Failed to get container:', error)
    return NextResponse.json({ error: 'Failed to get container' }, { status: 500 })
  }
}

// PUT /api/docker/containers/[id] — Update container (start/stop/restart via action query param)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    const container = await db.dockerContainer.findUnique({ where: { id } })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    let newStatus = container.status

    if (action === 'start') {
      newStatus = 'running'
    } else if (action === 'stop') {
      newStatus = 'stopped'
    } else if (action === 'restart') {
      newStatus = 'running'
    } else if (action === 'pause') {
      newStatus = 'paused'
    } else if (action === 'unpause') {
      newStatus = 'running'
    } else if (body.status) {
      newStatus = body.status
    }

    const updated = await db.dockerContainer.update({
      where: { id },
      data: {
        status: newStatus,
        cpuPercent: newStatus === 'running' ? Math.random() * 15 : 0,
        memoryUsage: newStatus === 'running' ? Math.floor(Math.random() * 256) + 32 : 0,
      },
    })

    return NextResponse.json({ container: updated })
  } catch (error) {
    console.error('Failed to update container:', error)
    return NextResponse.json({ error: 'Failed to update container' }, { status: 500 })
  }
}

// DELETE /api/docker/containers/[id] — Remove container
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const container = await db.dockerContainer.findUnique({ where: { id } })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    await db.dockerContainer.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove container:', error)
    return NextResponse.json({ error: 'Failed to remove container' }, { status: 500 })
  }
}
