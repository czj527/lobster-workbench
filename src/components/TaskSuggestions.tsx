'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lightbulb, AlertTriangle, Clock, CheckCircle2, RefreshCw, Loader2, X, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface TaskSuggestionsProps {
  projectId?: string
  compact?: boolean
}

interface Suggestion {
  id: string
  type: 'warning' | 'urgent' | 'info' | 'tip' | 'reminder' | 'success'
  icon: string
  title: string
  description: string
  action: {
    label: string
    type: 'navigate' | 'modal' | 'action'
    target?: string
    actionType?: string
  } | null
}

interface SuggestionsData {
  success: boolean
  suggestions: Suggestion[]
  stats: {
    totalTasks: number
    overdueTasks: number
    dueTodayTasks: number
    todoTasks: number
    inProgressTasks: number
    completedTasks: number
  }
}

export default function TaskSuggestions({ projectId, compact = false }: TaskSuggestionsProps) {
  const [data, setData] = useState<SuggestionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const url = projectId 
        ? `/api/ai/suggest?project_id=${projectId}`
        : '/api/ai/suggest'
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      } else {
        setError('获取建议失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const dismissSuggestion = useCallback((id: string) => {
    setDismissed(prev => [...prev, id])
  }, [])

  const getTypeStyles = (type: Suggestion['type']) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: 'text-red-500',
          badge: 'bg-red-500/20 text-red-500'
        }
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          icon: 'text-amber-500',
          badge: 'bg-amber-500/20 text-amber-500'
        }
      case 'info':
        return {
          bg: 'bg-sky-500/10',
          border: 'border-sky-500/30',
          icon: 'text-sky-500',
          badge: 'bg-sky-500/20 text-sky-500'
        }
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: 'text-green-500',
          badge: 'bg-green-500/20 text-green-500'
        }
      case 'reminder':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          icon: 'text-purple-500',
          badge: 'bg-purple-500/20 text-purple-500'
        }
      default:
        return {
          bg: 'bg-theme-list-item',
          border: 'border-theme-border',
          icon: 'text-theme-accent',
          badge: 'bg-theme-accent/20 text-theme-accent'
        }
    }
  }

  const activeSuggestions = data?.suggestions.filter(s => !dismissed.includes(s.id)) || []

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-theme-accent animate-pulse" />
          <span className="font-semibold text-theme-primary">智能建议</span>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-theme-accent animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-theme-accent" />
          <span className="font-semibold text-theme-primary">智能建议</span>
        </div>
        <div className="text-center py-4">
          <p className="text-theme-muted text-sm mb-2">{error}</p>
          <button
            onClick={fetchSuggestions}
            className="text-xs text-theme-accent hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-theme-accent" />
          <h3 className="font-semibold text-theme-primary">智能建议</h3>
          {activeSuggestions.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-sky-500/20 text-sky-500 rounded-full">
              {activeSuggestions.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchSuggestions}
          className="p-1.5 rounded-lg hover:bg-theme-list-item transition-colors"
          title="刷新建议"
        >
          <RefreshCw className="w-4 h-4 text-theme-muted" />
        </button>
      </div>

      {/* 建议列表 */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {activeSuggestions.length === 0 ? (
          <div className="text-center py-6">
            <Lightbulb className="w-10 h-10 text-theme-accent mx-auto mb-2 opacity-50" />
            <p className="text-theme-secondary text-sm">暂无建议</p>
          </div>
        ) : (
          activeSuggestions.slice(0, compact ? 2 : 5).map((suggestion) => {
            const styles = getTypeStyles(suggestion.type)
            return (
              <div
                key={suggestion.id}
                className={`${styles.bg} border ${styles.border} rounded-lg p-3 transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-theme-primary text-sm">
                        {suggestion.title}
                      </h4>
                      <button
                        onClick={() => dismissSuggestion(suggestion.id)}
                        className="p-1 rounded hover:bg-[var(--list-item-bg-hover)] transition-colors flex-shrink-0"
                      >
                        <X className="w-3 h-3 text-theme-muted" />
                      </button>
                    </div>
                    <p className="text-xs text-theme-secondary mt-1 line-clamp-2">
                      {suggestion.description}
                    </p>
                    {suggestion.action && (
                      <Link
                        href={suggestion.action.target || '/'}
                        className={`inline-flex items-center gap-1 mt-2 text-xs ${styles.badge} px-2 py-1 rounded-full hover:opacity-80 transition-opacity`}
                      >
                        {suggestion.action.label}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部统计 */}
      {data && !compact && (
        <div className="p-3 border-t border-theme-border bg-theme-list-item/50">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-medium text-theme-primary">{data.stats.totalTasks}</div>
              <div className="text-theme-muted">总任务</div>
            </div>
            <div>
              <div className="font-medium text-red-500">{data.stats.overdueTasks}</div>
              <div className="text-theme-muted">逾期</div>
            </div>
            <div>
              <div className="font-medium text-amber-500">{data.stats.dueTodayTasks}</div>
              <div className="text-theme-muted">今日截止</div>
            </div>
            <div>
              <div className="font-medium text-green-500">{data.stats.completedTasks}</div>
              <div className="text-theme-muted">已完成</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
