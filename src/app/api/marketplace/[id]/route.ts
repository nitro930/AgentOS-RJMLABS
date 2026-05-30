import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await db.marketplaceAgent.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Marketplace agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Failed to fetch marketplace agent:', error)
    return NextResponse.json({ error: 'Failed to fetch marketplace agent' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, category, icon, config, author, version, tags, isOfficial, isVerified, status, rating, installCount } = body

    const existing = await db.marketplaceAgent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Marketplace agent not found' }, { status: 404 })
    }

    const agent = await db.marketplaceAgent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(icon !== undefined && { icon }),
        ...(config !== undefined && { config }),
        ...(author !== undefined && { author }),
        ...(version !== undefined && { version }),
        ...(tags !== undefined && { tags: typeof tags === 'string' ? tags : JSON.stringify(tags) }),
        ...(isOfficial !== undefined && { isOfficial }),
        ...(isVerified !== undefined && { isVerified }),
        ...(status !== undefined && { status }),
        ...(rating !== undefined && { rating }),
        ...(installCount !== undefined && { installCount }),
      },
    })

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Failed to update marketplace agent:', error)
    return NextResponse.json({ error: 'Failed to update marketplace agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.marketplaceAgent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Marketplace agent not found' }, { status: 404 })
    }

    await db.marketplaceReview.deleteMany({ where: { agentId: id } })
    await db.marketplaceAgent.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete marketplace agent:', error)
    return NextResponse.json({ error: 'Failed to delete marketplace agent' }, { status: 500 })
  }
}
