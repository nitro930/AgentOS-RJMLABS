import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const sort = searchParams.get('sort') || 'popular'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      status: 'published',
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { author: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    let orderBy: any = { installCount: 'desc' }
    if (sort === 'rating') orderBy = { rating: 'desc' }
    else if (sort === 'newest') orderBy = { createdAt: 'desc' }
    else if (sort === 'name') orderBy = { name: 'asc' }
    else if (sort === 'reviews') orderBy = { reviewCount: 'desc' }

    const [agents, total] = await Promise.all([
      db.marketplaceAgent.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: { select: { reviews: true } },
        },
      }),
      db.marketplaceAgent.count({ where }),
    ])

    return NextResponse.json({
      agents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch marketplace agents:', error)
    return NextResponse.json({ error: 'Failed to fetch marketplace agents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, icon, config, author, version, tags, isOfficial, isVerified } = body

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }

    const agent = await db.marketplaceAgent.create({
      data: {
        name,
        description,
        category: category || 'general',
        icon: icon || '🏪',
        config: config || '{}',
        author: author || 'community',
        version: version || '1.0.0',
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        isOfficial: isOfficial || false,
        isVerified: isVerified || false,
        status: 'published',
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('Failed to submit marketplace agent:', error)
    return NextResponse.json({ error: 'Failed to submit marketplace agent' }, { status: 500 })
  }
}
