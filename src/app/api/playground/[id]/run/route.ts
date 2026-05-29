import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const input = body.input || ''

    const startTime = Date.now()
    const tokensUsed = Math.floor(Math.random() * 500) + 50

    const output = JSON.stringify({
      status: 'completed',
      input: input,
      response: `Processed: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`,
      tokensUsed,
      model: 'gpt-4o',
      duration: Date.now() - startTime,
    })

    const duration = Date.now() - startTime

    const session = await prisma.playgroundSession.update({
      where: { id },
      data: {
        status: 'completed',
        input: JSON.stringify({ prompt: input }),
        output,
        iterations: { increment: 1 },
        tokensUsed: { increment: tokensUsed },
        duration: { increment: duration },
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'execute',
        resource: 'agent',
        resourceId: id,
        details: JSON.stringify({ type: 'playground_run', tokensUsed, duration }),
        source: 'user',
        severity: 'info',
      },
    })

    return NextResponse.json({
      ...session,
      input: JSON.parse(session.input || '{}'),
      output: session.output ? JSON.parse(session.output) : null,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to run test' }, { status: 500 })
  }
}
