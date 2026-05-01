"use client"
import { useState, useEffect } from "react"
import { GitBranch, GitPullRequest, AlertCircle, Star, RefreshCw, Activity, Clock, ExternalLink } from "lucide-react"

interface GitHubRepo {
  id: number; name: string; full_name: string; description: string | null; html_url: string
  stargazers_count: number; forks_count: number; open_issues_count: number; watchers_count: number
  language: string | null; visibility: string
  recent_commits: Array<{ sha: string; commit: { message: string; author: { date: string } }; html_url: string }>
  commit_trend: number[]; last_activity: string
}

interface GitHubStatusProps { compact?: boolean }

export default function GitHubStatus({ compact = false }: GitHubStatusProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  const fetchGitHubStatus = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/github/sync', { method: 'GET' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRepos(data.repos || []); setLastSynced(data.lastSynced)
    } catch (err) { console.error('获取GitHub状态失败:', err); setError('加载失败') }
    finally { setLoading(false) }
  }

  const handleSync = async () => { setSyncing(true); await fetchGitHubStatus(); setSyncing(false) }
  useEffect(() => { fetchGitHubStatus() }, [])

  const formatTime = (dateStr: string) => {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const renderTrend = (trend: number[]) => {
    const max = Math.max(...trend, 1)
    return (
      <div className="flex items-end gap-0.5 h-6">
        {trend.map((count, i) => (
          <div key={i} className="w-3 bg-theme-accent/30 rounded-t relative" style={{ height: '100%' }} title={`${count} commits`}>
            <div className="absolute bottom-0 w-full bg-theme-accent rounded-t" style={{ height: `${Math.max((count / max) * 100, 10)}%` }} />
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <div className="glass-card p-4"><div className="flex items-center gap-2 mb-3"><GitBranch className="w-4 h-4 text-theme-accent" /><h3 className="text-sm font-medium text-theme-primary">GitHub 状态</h3></div><div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-skeleton rounded animate-pulse" />)}</div></div>
  if (error) return <div className="glass-card p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-theme-accent" /><h3 className="text-sm font-medium text-theme-primary">GitHub 状态</h3></div><button onClick={handleSync} className="p-1 hover:bg-theme-list-item rounded"><RefreshCw className="w-3 h-3 text-theme-muted" /></button></div><p className="text-xs text-red-500 text-center py-4">{error}</p></div>

  if (compact) {
    const totalIssues = repos.reduce((sum, r) => sum + r.open_issues_count, 0)
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0)
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-theme-accent" /><h3 className="text-sm font-medium text-theme-primary">GitHub</h3></div>
          <button onClick={handleSync} disabled={syncing} className="p-1 hover:bg-theme-border rounded disabled:opacity-50"><RefreshCw className={`w-3 h-3 text-theme-muted ${syncing ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-theme-list-item rounded"><div className="text-lg font-bold text-theme-primary">{repos.length}</div><div className="text-xs text-theme-muted">仓库</div></div>
          <div className="text-center p-2 bg-theme-list-item rounded"><div className="text-lg font-bold text-yellow-500">{totalStars}</div><div className="text-xs text-theme-muted">Stars</div></div>
          <div className="text-center p-2 bg-theme-list-item rounded"><div className="text-lg font-bold text-orange-500">{totalIssues}</div><div className="text-xs text-theme-muted">Issues</div></div>
        </div>
        {lastSynced && <p className="text-xs text-theme-muted mt-2 text-center">最后同步: {formatTime(lastSynced)}</p>}
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-theme-accent" /><h3 className="text-base font-semibold text-theme-primary">GitHub 项目状态</h3></div>
        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-list-item hover:bg-theme-list-item-hover rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />{syncing ? '同步中...' : '同步'}
        </button>
      </div>
      {repos.length === 0 ? <p className="text-sm text-theme-muted text-center py-6">暂无仓库数据</p> : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {repos.slice(0, 8).map(repo => (
            <div key={repo.id} className="p-3 bg-theme-list-item rounded-lg hover:bg-theme-list-item-hover transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-theme-primary hover:text-theme-accent flex items-center gap-1">
                    {repo.name}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  {repo.description && <p className="text-xs text-theme-muted mt-0.5 line-clamp-1">{repo.description}</p>}
                </div>
                <span className="text-xs px-1.5 py-0.5 bg-theme-accent/20 text-theme-accent rounded">{repo.visibility === 'public' ? '公开' : '私有'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-theme-secondary mb-2">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{repo.stargazers_count}</span>
                <span className="flex items-center gap-1"><GitPullRequest className="w-3 h-3 text-green-500" />{repo.forks_count}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-500" />{repo.open_issues_count}</span>
                {repo.language && <span className="px-1.5 py-0.5 bg-[var(--list-item-bg)] rounded text-[10px]">{repo.language}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-theme-muted flex items-center gap-1"><Activity className="w-3 h-3" />7天趋势</span>
                {renderTrend(repo.commit_trend)}
                <span className="text-xs text-theme-muted flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{formatTime(repo.last_activity)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {lastSynced && <p className="text-xs text-theme-muted mt-3 text-center">最后同步: {new Date(lastSynced).toLocaleString('zh-CN')}</p>}
    </div>
  )
}
