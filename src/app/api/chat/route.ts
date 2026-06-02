import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, model, modelId, provider: providerName } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Determine which provider to use
    let chatProvider = providerName || 'z-ai'
    let chatModelId = modelId || ''
    let chatModelName = model || 'default'

    // If a specific model config ID was given, look it up
    if (model && !modelId) {
      const modelConfig = await db.modelConfig.findFirst({
        where: { name: model },
      })
      if (modelConfig) {
        chatProvider = modelConfig.provider
        chatModelId = modelConfig.modelId
        chatModelName = modelConfig.name
      }
    }

    // Route to appropriate provider
    if (chatProvider === 'openrouter') {
      return await handleOpenRouter(message, chatModelId, chatModelName)
    } else if (chatProvider === 'huggingface') {
      return await handleHuggingFace(message, chatModelId, chatModelName)
    } else if (chatProvider === 'local' || chatProvider === 'ollama') {
      return await handleLocal(message, chatModelId, chatModelName)
    } else {
      // Default: use z-ai-web-dev-sdk
      return await handleZAI(message, chatModelName)
    }
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get chat response', content: 'Error: Unable to connect to AI model. Please try again.' },
      { status: 500 }
    )
  }
}

async function handleOpenRouter(message: string, modelId: string, modelName: string) {
  const provider = await db.providerConfig.findFirst({ where: { name: 'openrouter' } })

  if (!provider?.apiKey || provider.apiKey.includes('•')) {
    return NextResponse.json({
      error: 'OpenRouter API key not configured',
      content: 'Please configure your OpenRouter API key in Provider Settings to use OpenRouter models.',
    }, { status: 400 })
  }

  const actualModelId = modelId || 'openai/gpt-4o-mini'

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://rjmlabs.co.uk',
      'X-Title': 'AgentOS by RJMLABS',
    },
    body: JSON.stringify({
      model: actualModelId,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant in the AgentOS dashboard by RJMLABS. Be concise and helpful.' },
        { role: 'user', content: message },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('OpenRouter error:', err)
    return NextResponse.json({
      error: `OpenRouter API error: ${res.status}`,
      content: `Error from OpenRouter: ${err}. Please check your API key and model selection.`,
    }, { status: res.status })
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || 'No response generated'

  return NextResponse.json({
    content,
    model: modelName || actualModelId,
    provider: 'openrouter',
    timestamp: new Date().toISOString(),
    usage: data.usage || null,
  })
}

async function handleHuggingFace(message: string, modelId: string, modelName: string) {
  const provider = await db.providerConfig.findFirst({ where: { name: 'huggingface' } })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (provider?.apiKey && !provider.apiKey.includes('•')) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`
  }

  const actualModelId = modelId || 'mistralai/Mistral-7B-Instruct-v0.3'

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${actualModelId}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('HuggingFace error:', err)
    return NextResponse.json({
      error: `HuggingFace API error: ${res.status}`,
      content: `Error from HuggingFace: ${err}. The model may be loading — try again in 20 seconds.`,
    }, { status: res.status })
  }

  const data = await res.json()

  let content = ''
  if (Array.isArray(data)) {
    content = data[0]?.generated_text || 'No response generated'
    // If the response includes the prompt, strip it
    if (content.startsWith(message)) {
      content = content.slice(message.length).trim()
    }
  } else {
    content = data.generated_text || data.error || 'No response generated'
  }

  return NextResponse.json({
    content,
    model: modelName || actualModelId,
    provider: 'huggingface',
    timestamp: new Date().toISOString(),
  })
}

async function handleLocal(message: string, modelId: string, modelName: string) {
  // Try Ollama local endpoint
  const actualModelId = modelId || 'llama3.1'

  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: actualModelId,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant in the AgentOS dashboard. Be concise and helpful.' },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({
        error: 'Local model not available',
        content: 'Local model server (Ollama) is not running. Please start Ollama and pull a model first.',
      }, { status: 503 })
    }

    const data = await res.json()
    return NextResponse.json({
      content: data.message?.content || 'No response generated',
      model: modelName || actualModelId,
      provider: 'local',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      error: 'Local model not available',
      content: 'Cannot connect to local model server (Ollama). Make sure Ollama is running on port 11434.',
    }, { status: 503 })
  }
}

async function handleZAI(message: string, modelName: string) {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant in the AgentOS dashboard by RJMLABS. Be concise and helpful.',
      },
      { role: 'user', content: message },
    ],
  })

  const responseContent = completion.choices?.[0]?.message?.content || 'No response generated'
  const usedModel = modelName || completion.model || 'z-ai'

  return NextResponse.json({
    content: responseContent,
    model: usedModel,
    provider: 'z-ai',
    timestamp: new Date().toISOString(),
  })
}
