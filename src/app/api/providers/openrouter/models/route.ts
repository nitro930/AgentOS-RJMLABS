import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get the OpenRouter provider config for API key
    const provider = await db.providerConfig.findFirst({
      where: { name: 'openrouter' },
    })

    if (!provider?.apiKey || provider.apiKey.includes('•')) {
      return NextResponse.json({
        error: 'OpenRouter API key not configured. Please add your API key in Provider Settings.',
        models: [],
      }, { status: 400 })
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({
        error: `OpenRouter API error: ${res.status} ${errText}`,
        models: [],
      }, { status: res.status })
    }

    const data = await res.json()

    // Transform OpenRouter models to a simplified format
    // OpenRouter pricing values come as strings, so convert to numbers
    const models = (data.data || []).map((m: Record<string, unknown>) => {
      const pricing = m.pricing as Record<string, unknown> | undefined
      return {
        id: m.id as string,
        name: m.name || m.id,
        provider: (m.id as string).split('/')[0] || 'unknown',
        contextLength: Number(m.context_length) || null,
        pricing: {
          prompt: Number(pricing?.prompt) || 0,
          completion: Number(pricing?.completion) || 0,
        },
        capabilities: [
          ...((m.architecture as Record<string, unknown>)?.modality as string || '').includes('text') ? ['chat'] : [],
          ...((m.architecture as Record<string, unknown>)?.modality as string || '').includes('image') ? ['vision'] : [],
          ...((m.architecture as Record<string, unknown>)?.modality as string || '').includes('code') ? ['code'] : [],
        ],
        description: m.description || '',
      }
    })

    // Cache the model list
    await db.providerConfig.update({
      where: { id: provider.id },
      data: {
        models: JSON.stringify(models.slice(0, 200).map((m: { id: string }) => m.id)),
        lastSyncAt: new Date(),
      },
    })

    return NextResponse.json({ models, total: models.length })
  } catch (error) {
    console.error('OpenRouter models fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch OpenRouter models. Check your API key and network connection.',
      models: [],
    }, { status: 500 })
  }
}
