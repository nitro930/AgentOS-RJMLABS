import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const channels = await db.teamChannel.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Failed to fetch team channels:', error)
    return NextResponse.json({ error: 'Failed to fetch team channels' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, description } = body

    if (!name) return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })

    const channel = await db.teamChannel.create({
      data: {
        teamId: id,
        name,
        type: type || 'general',
        description: description || null,
        messages: '[]',
      },
    })
    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Failed to create channel:', error)
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { channelId, name, description, isActive, message } = body

    if (!channelId) return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })

    const channel = await db.teamChannel.findUnique({ where: { id: channelId } })
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

    // If adding a message, parse existing messages and append
    let updatedMessages = channel.messages
    if (message) {
      try {
        const msgs = JSON.parse(channel.messages || '[]')
        msgs.push({
          senderId: message.senderId || 'system',
          content: message.content || '',
          timestamp: new Date().toISOString(),
        })
        updatedMessages = JSON.stringify(msgs)
      } catch {
        updatedMessages = JSON.stringify([{
          senderId: message.senderId || 'system',
          content: message.content || '',
          timestamp: new Date().toISOString(),
        }])
      }
    }

    const updated = await db.teamChannel.update({
      where: { id: channelId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(message && { messages: updatedMessages }),
      },
    })
    return NextResponse.json({ channel: updated })
  } catch (error) {
    console.error('Failed to update channel:', error)
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
  }
}
