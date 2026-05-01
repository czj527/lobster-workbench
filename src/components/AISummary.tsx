'use client'

import { useState, useCallback } from 'react'
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Loader2, Calendar, CheckCircle2, Clock, AlertTriangle, Lightbulb, Copy, Check } from 'lucide-react'

interface AISummaryProps {
  projectId: string
  projectName: string
  compact?: boolean
}

interface SummaryData {
  summary: string
  stats: {
    totalTasks: number
    completedThisWeek: number
    newTasksThisWeek: number
    overdueTasks: number
    inProgressTasks: number
    tasksByStatus: {
      todo: number
      in_progress: number
      testing: number
      done: number
    }
  }
}

export default function AISummary({ projectId, projectName, compact = false }: AISummaryProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [isLoading, setIsLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateSummary = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/ai/summary?project_id=${projectId}`)
      const data = await response.json()
      
      if (data.success) {
        setSummaryData(data)
      } else {
        setError(data.error || '生成摘要失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const copyToClipboard = useCallback(() => {
    if (summaryData?.summary) {
      navigator.clipboard.writeText(summaryData.summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [summaryData])

  // 解析 Markdown 样式的摘要
  const renderSummary = (markdown: string) => {
    const lines = markdown.split('\n')
    return lines.map((line, index) => {
      // 标题行
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-theme-primary mt-4 mb-2">
            {line.replace('## ', '')}
          </h3>
        )
      }
      // 三级标题
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-base font-medium text-theme-secondary mt-3 mb-2 flex items-center gap-2">
            {line.replace('### ', '')}
          </h4>
        )
      }
      // 引用行
      if (line.startsWith('> ')) {
        return (
          <p key={index} className="text-sm text-theme-muted italic pl-2 border-l-2 border-theme-accent my-2">
            {line.replace('> ', '')}
          </p>
        )
      }
      // 列表项
      if (line.startsWith('- ')) {
        const content = line.substring(2)
        // 处理加粗
        const parts = content.split(/(\*\*[^*]+\*\*)/)
        return (
          <li key={index} className="ml-4 list-disc text-sm text-theme-secondary my-1">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-theme-primary font-medium">{part.replace(/\*\*/g, '')}</strong>
              }
              return part
            })}
          </li>
        )
      }
      // 分隔线
      if (line.startsWith('---')) {
        return <hr key={index} className="border-theme-border my-3" />
      }
      // 空行
      if (!line.trim()) {
        return <div key={index} className="h-2" />
      }
      // 普通文本
      return (
        <p key={index} className="text-sm text-theme-secondary my-1">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-theme-accent" />
          <h3 className="font-semibold text-theme-primary">AI 周报摘要</h3>
        </div>
        <div className="flex items-center gap-2">
          {summaryData && !compact && (
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-lg hover:bg-theme-list-item transition-colors"
              title="复制摘要"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-theme-muted" />
              )}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-theme-list-item transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-theme-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-theme-muted" />
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[600px] overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
        <div className="p-4">
          {!summaryData && !isLoading && !error && (
            <div className="text-center py-6">
              <Sparkles className="w-12 h-12 text-theme-accent mx-auto mb-3 opacity-50" />
              <p className="text-theme-secondary mb-4">基于项目数据生成智能周报</p>
              <button
                onClick={generateSummary}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                生成 AI 摘要
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-theme-accent mx-auto mb-3 animate-spin" />
              <p className="text-theme-secondary">正在分析项目数据...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-6">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={generateSummary}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                重试
              </button>
            </div>
          )}

          {summaryData && !isLoading && !error && (
            <>
              {/* 统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-theme-list-item rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-theme-primary">{summaryData.stats.totalTasks}</div>
                  <div className="text-xs text-theme-muted">总任务</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-500">{summaryData.stats.completedThisWeek}</div>
                  <div className="text-xs text-green-500">本周完成</div>
                </div>
                <div className="bg-sky-500/10 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-sky-500">{summaryData.stats.inProgressTasks}</div>
                  <div className="text-xs text-sky-500">进行中</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-500">{summaryData.stats.overdueTasks}</div>
                  <div className="text-xs text-red-500">逾期</div>
                </div>
              </div>

              {/* 摘要内容 */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderSummary(summaryData.summary)}
              </div>

              {/* 重新生成按钮 */}
              <div className="mt-4 pt-4 border-t border-theme-border flex justify-center">
                <button
                  onClick={generateSummary}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-theme-muted hover:text-theme-accent transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新生成
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
