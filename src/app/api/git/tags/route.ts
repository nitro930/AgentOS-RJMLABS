import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()

    // Get tags with dates
    const tagsOutput = execSync(
      'git tag -l --format="%(refname:short)|%(creatordate:iso)|%(subject)" --sort=-creatordate',
      { cwd: projectDir, encoding: 'utf-8', timeout: 10000 }
    )

    const tags = tagsOutput.trim().split('\n').filter(Boolean).map(line => {
      const [name, date, message] = line.split('|')
      return { name, date, message: message || '' }
    })

    // If no tags exist, create version tags from commits
    if (tags.length === 0) {
      // Generate pseudo-versions from commit history
      const logOutput = execSync('git log --format="%H|%h|%ai|%s" -50', {
        cwd: projectDir,
        encoding: 'utf-8',
        timeout: 10000,
      })

      const commits = logOutput.trim().split('\n').filter(Boolean).map((line, i) => {
        const [hash, shortHash, date, message] = line.split('|')
        return {
          name: `v0.0.${50 - i}`,
          date,
          message,
          hash: shortHash,
          isPseudo: true,
        }
      })

      return NextResponse.json({ tags: commits, hasRealTags: false })
    }

    // Get current tag
    let currentTag = ''
    try {
      currentTag = execSync('git describe --tags --abbrev=0', {
        cwd: projectDir,
        encoding: 'utf-8',
      }).trim()
    } catch {}

    return NextResponse.json({ tags, currentTag, hasRealTags: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()
    const { name, message } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    // Create tag
    const tagCmd = message
      ? `git tag -a "${name}" -m "${message.replace(/"/g, '\\"')}"`
      : `git tag "${name}"`

    execSync(tagCmd, {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 10000,
    })

    return NextResponse.json({ success: true, tag: name })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create tag' },
      { status: 500 }
    )
  }
}
