import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()

    const statusOutput = execSync('git status --porcelain=v2 --branch', {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 10000,
    })

    const lines = statusOutput.trim().split('\n')

    let branch = 'main'
    let upstream = ''
    let ahead = 0
    let behind = 0
    const changed: { path: string; status: string; staged: boolean }[] = []

    for (const line of lines) {
      if (line.startsWith('# branch.head')) {
        branch = line.split(' ').pop() || 'main'
      } else if (line.startsWith('# branch.upstream')) {
        upstream = line.split(' ').pop() || ''
      } else if (line.startsWith('# branch.ab')) {
        const parts = line.split(' ')
        for (const part of parts) {
          if (part.startsWith('+')) ahead = parseInt(part.slice(1)) || 0
          if (part.startsWith('-')) behind = parseInt(part.slice(1)) || 0
        }
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        const parts = line.split(' ')
        const xy = parts[1]
        const path = parts.slice(8).join(' ')
        const staged = xy[0] !== '.' && xy[0] !== '?'
        const status = xy[0] === '?' ? 'untracked' : xy[0] === '!' ? 'ignored' :
          xy.includes('D') ? 'deleted' : xy.includes('R') ? 'renamed' :
          xy.includes('A') ? 'added' : 'modified'
        changed.push({ path, status, staged })
      }
    }

    // Get current commit info
    const commitHash = execSync('git rev-parse --short HEAD', { cwd: projectDir, encoding: 'utf-8' }).trim()
    const commitMsg = execSync('git log -1 --format=%s', { cwd: projectDir, encoding: 'utf-8' }).trim()
    const commitDate = execSync('git log -1 --format=%ci', { cwd: projectDir, encoding: 'utf-8' }).trim()
    const commitAuthor = execSync('git log -1 --format=%an', { cwd: projectDir, encoding: 'utf-8' }).trim()

    // Get remote URL
    let remoteUrl = ''
    try {
      remoteUrl = execSync('git remote get-url origin', { cwd: projectDir, encoding: 'utf-8' }).trim()
      // Strip any tokens from URL
      remoteUrl = remoteUrl.replace(/https:\/\/[^@]+@/, 'https://')
    } catch {}

    // Get version from package.json
    let version = '0.0.0'
    try {
      const fs = require('fs')
      const path = require('path')
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'))
      version = pkg.version || '0.0.0'
    } catch {}

    return NextResponse.json({
      branch,
      upstream,
      ahead,
      behind,
      changed,
      commit: {
        hash: commitHash,
        message: commitMsg,
        date: commitDate,
        author: commitAuthor,
      },
      remoteUrl,
      version,
      clean: changed.length === 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get git status' },
      { status: 500 }
    )
  }
}
