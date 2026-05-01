/**
 * GitHub项目状态同步 API Route
 * 从GitHub API获取仓库信息
 * 使用 Admin Client 绕过 RLS 限制
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_USERNAME = 'czj527'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  watchers_count: number
  language: string | null
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  default_branch: string
  visibility: string
}

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  html_url: string
}

interface GitHubRepoWithActivity extends GitHubRepo {
  recent_commits: GitHubCommit[]
  commit_trend: number[]
  last_activity: string
}

export async function GET() {
  try {
    const repos = await fetchGitHubRepos()

    const reposWithActivity = await Promise.all(
      repos.map(async (repo) => {
        const recentCommits = await fetchRecentCommits(repo.name)
        const commitTrend = calculateCommitTrend(recentCommits)
        const lastActivity = recentCommits[0]?.commit.author.date || repo.pushed_at

        return {
          ...repo,
          recent_commits: recentCommits.slice(0, 5),
          commit_trend: commitTrend,
          last_activity: lastActivity,
        } as GitHubRepoWithActivity
      })
    )

    return NextResponse.json({
      success: true,
      repos: reposWithActivity,
      totalCount: repos.length,
      lastSynced: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GitHub同步异常:', error)
    return NextResponse.json(
      { error: '同步失败', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    const repos = await fetchGitHubRepos()
    const reposWithActivity = await Promise.all(
      repos.map(async (repo) => {
        const recentCommits = await fetchRecentCommits(repo.name)
        const commitTrend = calculateCommitTrend(recentCommits)
        return {
          ...repo,
          recent_commits: recentCommits.slice(0, 5),
          commit_trend: commitTrend,
          last_activity: recentCommits[0]?.commit.author.date || repo.pushed_at,
        }
      })
    )

    await supabase.from('activity_log').insert({
      content: `同步了 GitHub 状态，共 ${repos.length} 个仓库`,
      type: 'info',
    })

    return NextResponse.json({
      success: true,
      message: `成功同步 ${repos.length} 个仓库状态`,
      syncedCount: repos.length,
      repos: reposWithActivity,
      lastSynced: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GitHub同步异常:', error)
    return NextResponse.json(
      { error: '同步失败', details: String(error) },
      { status: 500 }
    )
  }
}

async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  }

  const response = await fetch(
    `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20`,
    { headers, next: { revalidate: 300 } }
  )

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const repos = await response.json()
  return repos.filter((repo: GitHubRepo) => !repo.name.includes('.github'))
}

async function fetchRecentCommits(repoName: string): Promise<GitHubCommit[]> {
  try {
    const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' }
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`

    const response = await fetch(
      `${GITHUB_API}/repos/${GITHUB_USERNAME}/${repoName}/commits?per_page=30`,
      { headers, next: { revalidate: 300 } }
    )
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

function calculateCommitTrend(commits: GitHubCommit[]): number[] {
  const trend: number[] = Array(7).fill(0)
  const now = new Date()
  commits.forEach((commit) => {
    const commitDate = new Date(commit.commit.author.date)
    const daysDiff = Math.floor((now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff >= 0 && daysDiff < 7) trend[6 - daysDiff]++
  })
  return trend
}
