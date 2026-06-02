import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        pinnedMessages: {
          include: {
            room: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chat room' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.chatRoom.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    const room = await prisma.chatRoom.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.isPrivate !== undefined && { isPrivate: body.isPrivate }),
        ...(body.maxMembers !== undefined && { maxMembers: body.maxMembers }),
        ...(body.topic !== undefined && { topic: body.topic }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.lastMessageAt !== undefined && { lastMessageAt: new Date(body.lastMessageAt) }),
        ...(body.messageCount !== undefined && { messageCount: body.messageCount }),
      },
    })

    return NextResponse.json(room)
  } catch {
    return NextResponse.json({ error: 'Failed to update chat room' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.chatRoom.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    await prisma.chatRoom.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete chat room' }, { status: 500 })
  }
}
