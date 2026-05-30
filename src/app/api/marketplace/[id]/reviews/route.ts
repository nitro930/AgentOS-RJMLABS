import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const agent = await db.marketplaceAgent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Marketplace agent not found' }, { status: 404 })
    }

    const [reviews, total] = await Promise.all([
      db.marketplaceReview.findMany({
        where: { agentId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.marketplaceReview.count({ where: { agentId: id } }),
    ])

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, rating, title, content } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const agent = await db.marketplaceAgent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Marketplace agent not found' }, { status: 404 })
    }

    const review = await db.marketplaceReview.create({
      data: {
        agentId: id,
        userId: userId || 'anonymous',
        rating,
        title: title || null,
        content: content || null,
        isVerified: false,
      },
    })

    // Recalculate agent rating and review count
    const allReviews = await db.marketplaceReview.findMany({
      where: { agentId: id },
      select: { rating: true },
    })
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    await db.marketplaceAgent.update({
      where: { id },
      data: {
        rating: Math.round(avgRating * 100) / 100,
        reviewCount: allReviews.length,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Failed to create review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
