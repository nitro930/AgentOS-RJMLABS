import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET(request: Request) {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()
    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '20')
    const branch = searchParams.get('branch') || undefined

    // Get commit log
    const format = '%H|%h|%an|%ae|%ai|%s'
    const logCmd = branch
      ? `git log ${branch} --format="${format}" -${count}`
      : `git log --format="${format}" -${count}`

    const logOutput = execSync(logCmd, {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 10000,
    })

    const commits = logOutput.trim().split('\n').filter(Boolean).map(line => {
      const [hash, shortHash, author, email, date, message] = line.split('|')
      return {
        hash,
        shortHash,
        author,
        email,
        date,
        message,
      }
    })

    // Get branches
    const branchesOutput = execSync('git branch -a --format="%(refname:short)|%(upstream:short)|%(HEAD)"', {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 10000,
    })

    const branches = branchesOutput.trim().split('\n').filter(Boolean).map(line => {
      const [name, upstream, isHead] = line.split('|')
      return {
        name,
        upstream,
        isCurrent: isHead === '*',
        isRemote: name.startsWith('remotes/'),
      }
    })

    return NextResponse.json({ commits, branches })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get git log' },
      { status: 500 }
    )
  }
}
