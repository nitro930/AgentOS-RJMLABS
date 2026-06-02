import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rooms = await prisma.chatRoom.findMany({
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    const result = rooms.map((room) => ({
      ...room,
      memberCount: room._count.members,
      lastMessage: room.messages[0] || null,
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type || 'group',
        icon: body.icon || '💬',
        isPrivate: body.isPrivate ?? false,
        maxMembers: body.maxMembers ?? 10,
        topic: body.topic,
        status: body.status || 'active',
        createdBy: body.createdBy,
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 })
  }
}
