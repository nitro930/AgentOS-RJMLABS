import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/mcp/discover - Discover capabilities from a connected server
export async function POST(request: NextRequest) {
  try {
    const { serverId } = await request.json()
    if (!serverId) {
      return NextResponse.json({ error: 'serverId is required' }, { status: 400 })
    }

    const server = await prisma.mCPServer.findUnique({ where: { id: serverId } })
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Update status to connecting
    await prisma.mCPServer.update({
      where: { id: serverId },
      data: { status: 'connecting' },
    })

    // Simulate discovery delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate capabilities based on server name and type
    const nameLower = server.name.toLowerCase()
    const toolCount = nameLower.includes('filesystem') ? 5 : nameLower.includes('github') ? 5 : nameLower.includes('database') ? 3 : 3
    const resourceCount = nameLower.includes('filesystem') ? 2 : nameLower.includes('github') ? 2 : 1
    const promptCount = nameLower.includes('github') ? 2 : nameLower.includes('database') ? 2 : 1

    // Update server with discovered info
    const updated = await prisma.mCPServer.update({
      where: { id: serverId },
      data: {
        status: 'connected',
        lastConnectedAt: new Date(),
        toolCount,
        resourceCount,
        promptCount,
      },
      include: { tools: true, resources: true, prompts: true },
    })

    return NextResponse.json({
      server: updated,
      discovered: {
        tools: updated.tools.length,
        resources: updated.resources.length,
        prompts: updated.prompts.length,
      }
    })
  } catch (error) {
    console.error('Discovery failed:', error)
    // Mark server as error
    const { serverId } = await request.json().catch(() => ({}))
    if (serverId) {
      await prisma.mCPServer.update({
        where: { id: serverId },
        data: { status: 'error' },
      }).catch(() => {})
    }
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}

// GET /api/mcp/discover - Get popular MCP server templates
export async function GET() {
  const templates = [
    {
      name: 'Filesystem',
      description: 'Read, write, and search files on the local filesystem',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user'],
      icon: '📁',
      tags: ['filesystem', 'files', 'io'],
      category: 'storage',
    },
    {
      name: 'GitHub',
      description: 'Interact with GitHub repositories, issues, and pull requests',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      envVars: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
      icon: '🐙',
      tags: ['github', 'git', 'vcs'],
      category: 'development',
    },
    {
      name: 'PostgreSQL',
      description: 'Query and manage PostgreSQL databases',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      envVars: { POSTGRES_CONNECTION_STRING: '' },
      icon: '🐘',
      tags: ['database', 'postgres', 'sql'],
      category: 'database',
    },
    {
      name: 'Slack',
      description: 'Send messages and read channels in Slack workspaces',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      envVars: { SLACK_BOT_TOKEN: '', SLACK_TEAM_ID: '' },
      icon: '💬',
      tags: ['slack', 'communication', 'messaging'],
      category: 'communication',
    },
    {
      name: 'Brave Search',
      description: 'Web search using Brave Search API',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      envVars: { BRAVE_API_KEY: '' },
      icon: '🔍',
      tags: ['search', 'web', 'brave'],
      category: 'search',
    },
    {
      name: 'Memory',
      description: 'Persistent key-value memory store for agents',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      icon: '🧠',
      tags: ['memory', 'storage', 'key-value'],
      category: 'storage',
    },
    {
      name: 'Puppeteer',
      description: 'Browser automation and web scraping with headless Chrome',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      icon: '🎭',
      tags: ['browser', 'scraping', 'automation'],
      category: 'automation',
    },
    {
      name: 'Sentry',
      description: 'Track and manage errors and performance issues',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sentry'],
      envVars: { SENTRY_AUTH_TOKEN: '', SENTRY_ORG: '' },
      icon: '🛡️',
      tags: ['monitoring', 'errors', 'sentry'],
      category: 'monitoring',
    },
    {
      name: 'Google Drive',
      description: 'Search and read files from Google Drive',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gdrive'],
      icon: '☁️',
      tags: ['google', 'drive', 'cloud'],
      category: 'cloud',
    },
    {
      name: 'Docker',
      description: 'Manage Docker containers, images, and compose stacks',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-docker'],
      icon: '🐳',
      tags: ['docker', 'containers', 'devops'],
      category: 'devops',
    },
    {
      name: 'Linear',
      description: 'Manage projects and issues in Linear',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-linear'],
      envVars: { LINEAR_API_KEY: '' },
      icon: '📊',
      tags: ['project-management', 'issues', 'linear'],
      category: 'project-management',
    },
    {
      name: 'Notion',
      description: 'Search and manage content in Notion workspaces',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-notion'],
      envVars: { NOTION_API_KEY: '' },
      icon: '📝',
      tags: ['notion', 'knowledge', 'docs'],
      category: 'knowledge',
    },
  ]

  return NextResponse.json({ templates })
}
