import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SANDBOX_DIR = process.env.SANDBOX_DIR || '/tmp/agentos-sandbox'

// GET /api/sandbox/files - Read file content
export async function GET(req: NextRequest) {
  try {
    const filePath = req.nextUrl.searchParams.get('path')
    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    const safePath = path.resolve(filePath)

    // Ensure we don't escape the sandbox
    if (!safePath.startsWith(path.resolve(SANDBOX_DIR)) && safePath !== path.resolve(SANDBOX_DIR)) {
      return NextResponse.json({ error: 'Path outside sandbox' }, { status: 403 })
    }

    try {
      const content = await fs.readFile(safePath, 'utf-8')
      const stat = await fs.stat(safePath)
      return NextResponse.json({
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        path: safePath,
      })
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      if (err.code === 'EISDIR') {
        return NextResponse.json({ error: 'Path is a directory' }, { status: 400 })
      }
      throw err
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/sandbox/files - Write file content
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { path: filePath, content } = body

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 })
    }

    const safePath = path.resolve(filePath)

    // Ensure we don't escape the sandbox
    if (!safePath.startsWith(path.resolve(SANDBOX_DIR)) && safePath !== path.resolve(SANDBOX_DIR)) {
      return NextResponse.json({ error: 'Path outside sandbox' }, { status: 403 })
    }

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(safePath), { recursive: true })
    await fs.writeFile(safePath, content, 'utf-8')

    return NextResponse.json({ success: true, path: safePath })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/sandbox/files - Delete a file
export async function DELETE(req: NextRequest) {
  try {
    const filePath = req.nextUrl.searchParams.get('path')
    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    const safePath = path.resolve(filePath)

    if (!safePath.startsWith(path.resolve(SANDBOX_DIR)) && safePath !== path.resolve(SANDBOX_DIR)) {
      return NextResponse.json({ error: 'Path outside sandbox' }, { status: 403 })
    }

    await fs.rm(safePath, { recursive: true, force: true })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
