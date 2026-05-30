import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/servers - List all MCP servers
export async function GET() {
  try {
    const servers = await prisma.mCPServer.findMany({
      include: {
        tools: { where: { isActive: true } },
        resources: { where: { isActive: true } },
        prompts: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Failed to fetch MCP servers:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP servers' }, { status: 500 })
  }
}

// POST /api/mcp/servers - Create a new MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, description, version, transportType, command, args, envVars,
      url, headers, autoConnect, tags, icon
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 })
    }

    const server = await prisma.mCPServer.create({
      data: {
        name,
        description: description || null,
        version: version || '1.0.0',
        transportType: transportType || 'stdio',
        command: command || null,
        args: typeof args === 'string' ? args : JSON.stringify(args || []),
        envVars: typeof envVars === 'string' ? envVars : JSON.stringify(envVars || {}),
        url: url || null,
        headers: typeof headers === 'string' ? headers : JSON.stringify(headers || {}),
        autoConnect: autoConnect || false,
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        icon: icon || '🔌',
      },
    })

    // If autoConnect, attempt to discover tools
    if (autoConnect) {
      await discoverServerCapabilities(server.id, server)
    }

    return NextResponse.json({ server }, { status: 201 })
  } catch (error) {
    console.error('Failed to create MCP server:', error)
    return NextResponse.json({ error: 'Failed to create MCP server' }, { status: 500 })
  }
}

// Helper: Discover capabilities from an MCP server
async function discoverServerCapabilities(serverId: string, server: any) {
  try {
    await prisma.mCPServer.update({
      where: { id: serverId },
      data: { status: 'connecting' },
    })

    // Simulate discovery based on transport type
    // In production, this would actually connect to the MCP server
    const mockTools = generateMockToolsForServer(server.name)
    const mockResources = generateMockResourcesForServer(server.name)
    const mockPrompts = generateMockPromptsForServer(server.name)

    // Create discovered tools
    for (const tool of mockTools) {
      await prisma.mCPTool.upsert({
        where: { serverId_name: { serverId, name: tool.name } },
        update: { description: tool.description, inputSchema: JSON.stringify(tool.inputSchema) },
        create: {
          serverId,
          name: tool.name,
          description: tool.description,
          inputSchema: JSON.stringify(tool.inputSchema),
          annotations: JSON.stringify(tool.annotations || {}),
        },
      })
    }

    // Create discovered resources
    for (const resource of mockResources) {
      await prisma.mCPResource.upsert({
        where: { serverId_uri: { serverId, uri: resource.uri } },
        update: { name: resource.name, description: resource.description },
        create: {
          serverId,
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        },
      })
    }

    // Create discovered prompts
    for (const prompt of mockPrompts) {
      await prisma.mCPPrompt.upsert({
        where: { serverId_name: { serverId, name: prompt.name } },
        update: { description: prompt.description, arguments: JSON.stringify(prompt.arguments) },
        create: {
          serverId,
          name: prompt.name,
          description: prompt.description,
          arguments: JSON.stringify(prompt.arguments),
        },
      })
    }

    // Update server stats
    await prisma.mCPServer.update({
      where: { id: serverId },
      data: {
        status: 'connected',
        lastConnectedAt: new Date(),
        toolCount: mockTools.length,
        resourceCount: mockResources.length,
        promptCount: mockPrompts.length,
      },
    })
  } catch (error) {
    await prisma.mCPServer.update({
      where: { id: serverId },
      data: { status: 'error' },
    })
  }
}

function generateMockToolsForServer(serverName: string) {
  const nameLower = serverName.toLowerCase()
  const tools: any[] = []

  if (nameLower.includes('filesystem') || nameLower.includes('fs') || nameLower.includes('file')) {
    tools.push(
      { name: 'read_file', description: 'Read the contents of a file from the filesystem', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Path to the file' } }, required: ['path'] }, annotations: { readOnlyHint: true } },
      { name: 'write_file', description: 'Write content to a file on the filesystem', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, content: { type: 'string', description: 'Content to write' } }, required: ['path', 'content'] }, annotations: { destructiveHint: true } },
      { name: 'list_directory', description: 'List contents of a directory', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Directory path' } }, required: ['path'] }, annotations: { readOnlyHint: true } },
      { name: 'search_files', description: 'Search for files matching a pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'Search pattern' }, directory: { type: 'string', description: 'Root directory' } }, required: ['pattern'] }, annotations: { readOnlyHint: true } },
      { name: 'move_file', description: 'Move or rename a file', inputSchema: { type: 'object', properties: { source: { type: 'string' }, destination: { type: 'string' } }, required: ['source', 'destination'] }, annotations: { destructiveHint: true } },
    )
  } else if (nameLower.includes('github') || nameLower.includes('git')) {
    tools.push(
      { name: 'create_issue', description: 'Create a new GitHub issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'title'] }, annotations: {} },
      { name: 'search_repositories', description: 'Search GitHub repositories', inputSchema: { type: 'object', properties: { query: { type: 'string' }, sort: { type: 'string', enum: ['stars', 'forks', 'updated'] } }, required: ['query'] }, annotations: { readOnlyHint: true } },
      { name: 'get_file_contents', description: 'Get file contents from a repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path'] }, annotations: { readOnlyHint: true } },
      { name: 'create_pull_request', description: 'Create a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, head: { type: 'string' }, base: { type: 'string' } }, required: ['owner', 'repo', 'title', 'head', 'base'] }, annotations: {} },
      { name: 'list_commits', description: 'List commits in a repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, sha: { type: 'string' }, per_page: { type: 'number' } }, required: ['owner', 'repo'] }, annotations: { readOnlyHint: true } },
    )
  } else if (nameLower.includes('slack') || nameLower.includes('discord') || nameLower.includes('chat')) {
    tools.push(
      { name: 'send_message', description: 'Send a message to a channel', inputSchema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID or name' }, text: { type: 'string', description: 'Message text' } }, required: ['channel', 'text'] }, annotations: {} },
      { name: 'list_channels', description: 'List available channels', inputSchema: { type: 'object', properties: { types: { type: 'string', enum: ['public', 'private', 'all'] } }, required: [] }, annotations: { readOnlyHint: true } },
      { name: 'search_messages', description: 'Search messages in channels', inputSchema: { type: 'object', properties: { query: { type: 'string' }, count: { type: 'number' } }, required: ['query'] }, annotations: { readOnlyHint: true } },
      { name: 'get_channel_history', description: 'Get recent messages from a channel', inputSchema: { type: 'object', properties: { channel: { type: 'string' }, limit: { type: 'number' } }, required: ['channel'] }, annotations: { readOnlyHint: true } },
    )
  } else if (nameLower.includes('database') || nameLower.includes('db') || nameLower.includes('sql') || nameLower.includes('postgres')) {
    tools.push(
      { name: 'execute_query', description: 'Execute a SQL query', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'SQL query to execute' }, params: { type: 'array', items: { type: 'string' } } }, required: ['query'] }, annotations: { destructiveHint: true } },
      { name: 'list_tables', description: 'List all tables in the database', inputSchema: { type: 'object', properties: { schema: { type: 'string', default: 'public' } }, required: [] }, annotations: { readOnlyHint: true } },
      { name: 'describe_table', description: 'Get schema information for a table', inputSchema: { type: 'object', properties: { table: { type: 'string' }, schema: { type: 'string' } }, required: ['table'] }, annotations: { readOnlyHint: true } },
    )
  } else if (nameLower.includes('web') || nameLower.includes('browser') || nameLower.includes('scrape')) {
    tools.push(
      { name: 'fetch_url', description: 'Fetch content from a URL', inputSchema: { type: 'object', properties: { url: { type: 'string' }, format: { type: 'string', enum: ['html', 'markdown', 'text'] } }, required: ['url'] }, annotations: { readOnlyHint: true } },
      { name: 'search_web', description: 'Search the web for information', inputSchema: { type: 'object', properties: { query: { type: 'string' }, num_results: { type: 'number' } }, required: ['query'] }, annotations: { readOnlyHint: true } },
      { name: 'screenshot', description: 'Take a screenshot of a webpage', inputSchema: { type: 'object', properties: { url: { type: 'string' }, width: { type: 'number' }, height: { type: 'number' } }, required: ['url'] }, annotations: { readOnlyHint: true } },
    )
  } else {
    // Generic tools for unknown server types
    tools.push(
      { name: 'ping', description: 'Test connectivity to the MCP server', inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: [] }, annotations: { readOnlyHint: true } },
      { name: 'get_info', description: 'Get server information and capabilities', inputSchema: { type: 'object', properties: {}, required: [] }, annotations: { readOnlyHint: true } },
      { name: 'execute', description: 'Execute a command on the server', inputSchema: { type: 'object', properties: { command: { type: 'string' }, args: { type: 'object' } }, required: ['command'] }, annotations: {} },
    )
  }
  return tools
}

function generateMockResourcesForServer(serverName: string) {
  const nameLower = serverName.toLowerCase()
  const resources: any[] = []

  if (nameLower.includes('filesystem') || nameLower.includes('fs') || nameLower.includes('file')) {
    resources.push(
      { uri: 'file:///home/user/documents', name: 'Documents Directory', description: 'Access to the documents directory', mimeType: 'text/directory' },
      { uri: 'file:///home/user/projects', name: 'Projects Directory', description: 'Access to the projects directory', mimeType: 'text/directory' },
    )
  } else if (nameLower.includes('github') || nameLower.includes('git')) {
    resources.push(
      { uri: 'github://repos', name: 'Repositories', description: 'List of accessible repositories', mimeType: 'application/json' },
      { uri: 'github://issues', name: 'Open Issues', description: 'Current open issues across repos', mimeType: 'application/json' },
    )
  } else {
    resources.push(
      { uri: `mcp://${nameLower}/config`, name: 'Server Configuration', description: 'Current server configuration', mimeType: 'application/json' },
    )
  }
  return resources
}

function generateMockPromptsForServer(serverName: string) {
  const nameLower = serverName.toLowerCase()
  const prompts: any[] = []

  if (nameLower.includes('github') || nameLower.includes('git')) {
    prompts.push(
      { name: 'review_pr', description: 'Generate a pull request review', arguments: [{ name: 'pr_url', description: 'URL of the PR to review', required: true }] },
      { name: 'summarize_issues', description: 'Summarize open issues for a repository', arguments: [{ name: 'owner', description: 'Repository owner', required: true }, { name: 'repo', description: 'Repository name', required: true }] },
    )
  } else if (nameLower.includes('database') || nameLower.includes('db')) {
    prompts.push(
      { name: 'explain_query', description: 'Explain a SQL query execution plan', arguments: [{ name: 'query', description: 'SQL query to explain', required: true }] },
      { name: 'generate_schema', description: 'Generate schema migration from description', arguments: [{ name: 'description', description: 'Natural language description of the schema', required: true }] },
    )
  } else {
    prompts.push(
      { name: 'help', description: 'Get help with available capabilities', arguments: [] },
    )
  }
  return prompts
}
