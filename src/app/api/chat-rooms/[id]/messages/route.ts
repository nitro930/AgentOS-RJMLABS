import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    const room = await prisma.chatRoom.findUnique({ where: { id } })
    if (!room) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatMessage.count({
        where: { roomId: id, isDeleted: false },
      }),
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const room = await prisma.chatRoom.findUnique({ where: { id } })
    if (!room) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: id,
        senderId: body.senderId || 'user',
        senderType: body.senderType || 'user',
        content: body.content,
        type: body.type || 'text',
        threadId: body.threadId,
        replyToId: body.replyToId,
        metadata: JSON.stringify(body.metadata || {}),
      },
    })

    // Update room's lastMessageAt and messageCount
    await prisma.chatRoom.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
