import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get the HuggingFace provider config for API key
    const provider = await db.providerConfig.findFirst({
      where: { name: 'huggingface' },
    })

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    if (provider?.apiKey && !provider.apiKey.includes('•')) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`
    }

    // Fetch popular text-generation models from HuggingFace
    const res = await fetch(
      'https://huggingface.co/api/models?filter=text-generation&sort=downloads&direction=-1&limit=100',
      { headers }
    )

    if (!res.ok) {
      return NextResponse.json({
        error: `HuggingFace API error: ${res.status}`,
        models: [],
      }, { status: res.status })
    }

    const data = await res.json()

    // Transform HuggingFace models to a simplified format
    const models = (data || []).map((m: Record<string, unknown>) => {
      const pipelineTags = m.pipeline_tag ? [m.pipeline_tag] : (m.pipeline_tags as string[] || [])
      const isTextGen = pipelineTags.includes('text-generation')
      const isChat = (m.tags as string[] || []).includes('conversational') || isTextGen

      return {
        id: m.id as string,
        name: (m.id as string).split('/').pop() || m.id,
        provider: 'huggingface',
        contextLength: null,
        pricing: { prompt: 0, completion: 0 }, // Free inference API
        capabilities: [
          ...(isChat ? ['chat'] : []),
          ...(isTextGen ? ['code', 'text'] : []),
        ],
        description: m.description || '',
        downloads: m.downloads || 0,
        tags: m.tags || [],
      }
    }).filter((m: { capabilities: string[] }) => m.capabilities.length > 0)

    // Cache the model list
    if (provider) {
      await db.providerConfig.update({
        where: { id: provider.id },
        data: {
          models: JSON.stringify(models.slice(0, 100).map((m: { id: string }) => m.id)),
          lastSyncAt: new Date(),
        },
      })
    }

    return NextResponse.json({ models, total: models.length })
  } catch (error) {
    console.error('HuggingFace models fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch HuggingFace models. Check your network connection.',
      models: [],
    }, { status: 500 })
  }
}
