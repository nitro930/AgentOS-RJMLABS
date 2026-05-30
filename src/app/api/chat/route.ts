import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, model } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Use z-ai-web-dev-sdk for chat
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant in the AgentOS dashboard. Be concise and helpful.',
        },
        { role: 'user', content: message },
      ],
    })

    const responseContent = completion.choices?.[0]?.message?.content || 'No response generated'
    const usedModel = model || completion.model || 'default'

    return NextResponse.json({
      content: responseContent,
      model: usedModel,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get chat response', content: 'Error: Unable to connect to AI model. Please try again.' },
      { status: 500 }
    )
  }
}
