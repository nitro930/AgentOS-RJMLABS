import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const SANDBOX_DIR = process.env.SANDBOX_DIR || '/tmp/agentos-sandbox'

// GET /api/sandbox - List sandbox directory contents
export async function GET(req: NextRequest) {
  try {
    const requestedPath = req.nextUrl.searchParams.get('path') || SANDBOX_DIR
    const safePath = path.resolve(requestedPath)

    // Ensure we don't escape the sandbox
    if (!safePath.startsWith(path.resolve(SANDBOX_DIR)) && safePath !== path.resolve(SANDBOX_DIR)) {
      return NextResponse.json({ error: 'Path outside sandbox' }, { status: 403 })
    }

    try {
      await fs.access(safePath)
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(safePath, { recursive: true })
      return NextResponse.json({ files: [], path: safePath })
    }

    const entries = await fs.readdir(safePath, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter((e) => !e.name.startsWith('.'))
        .map(async (entry) => {
          const fullPath = path.join(safePath, entry.name)
          try {
            const stat = await fs.stat(fullPath)
            return {
              name: entry.name,
              path: fullPath,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: stat.size,
              modified: stat.mtime.toISOString(),
              permissions: stat.mode.toString(8).slice(-3),
            }
          } catch {
            return null
          }
        })
    )

    const validFiles = files.filter(Boolean)
    return NextResponse.json({ files: validFiles, path: safePath })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/sandbox - Execute a command in the sandbox
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { command, workingDir } = body

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    const cwd = workingDir || SANDBOX_DIR

    // Ensure sandbox dir exists
    await fs.mkdir(cwd, { recursive: true })

    const startTime = Date.now()
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: 60000,
        maxBuffer: 1024 * 1024,
      })
      const duration = Date.now() - startTime

      return NextResponse.json({
        output: stdout + (stderr ? '\n' + stderr : ''),
        exitCode: 0,
        duration,
        workingDir: cwd,
      })
    } catch (err: any) {
      const duration = Date.now() - startTime
      return NextResponse.json({
        output: err.stdout || '' + (err.stderr ? '\n' + err.stderr : ''),
        exitCode: err.code || 1,
        duration,
        workingDir: cwd,
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
