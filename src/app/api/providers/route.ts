import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const providers = await db.providerConfig.findMany({
      orderBy: { createdAt: 'asc' },
    })
    // Mask API keys for security
    const masked = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 8)}${'•'.repeat(Math.max(0, p.apiKey.length - 8))}` : '',
    }))
    return NextResponse.json({ providers: masked })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const provider = await db.providerConfig.create({
      data: {
        name: body.name,
        displayName: body.displayName || body.name,
        provider: body.provider || body.name,
        apiKey: body.apiKey || '',
        baseUrl: body.baseUrl || '',
        isActive: body.isActive ?? false,
        isBuiltIn: body.isBuiltIn ?? false,
        models: JSON.stringify(body.models || []),
        config: JSON.stringify(body.config || {}),
      },
    })
    return NextResponse.json(provider, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create provider'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
