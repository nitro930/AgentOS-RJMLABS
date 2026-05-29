import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const sessions = await prisma.terminalSession.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const session = await prisma.terminalSession.create({
      data: {
        name: body.name || 'New Session',
        host: body.host || 'localhost',
        port: body.port || 22,
        username: body.username || 'root',
        status: 'connected',
      },
    })
    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
