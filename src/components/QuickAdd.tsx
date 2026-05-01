'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Sparkles, Loader2, X, Calendar, Tag, AlertTriangle, Check, Clock } from 'lucide-react'

interface QuickAddProps {
  projectId?: string
  projects?: { id: string; name: string; icon: string }[]
  onTaskCreated?: () => void
}

interface ParsedTask {
  title: string
  description?: string
  due_date?: string
  priority: number
  status: 'todo' | 'in_progress'
  tags: string[]
}

interface Project {
  id: string
  name: string
  icon: string
}

export default function QuickAdd({ projectId, projects = [], onTaskCreated }: QuickAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsed, setParsed] = useState<ParsedTask | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 键盘快捷键 Ctrl+N 唤起
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setInput('')
        setParsed(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 解析输入
  const parseInput = useCallback(async (text: string) => {
    if (!text.trim()) {
      setParsed(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          project_id: selectedProject || undefined 
        })
      })
      const data = await response.json()
      if (data.success) {
        setParsed(data.parsed)
      }
    } catch (err) {
      console.error('Parse error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedProject])

  // 防抖解析
  useEffect(() => {
    const timer = setTimeout(() => {
      parseInput(input)
    }, 300)
    return () => clearTimeout(timer)
  }, [input, parseInput])

  // 创建任务
  const createTask = useCallback(async () => {
    if (!parsed || !parsed.title) return

    const targetProject = selectedProject || projects[0]?.id
    if (!targetProject) {
      setError('请先选择项目')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: targetProject,
          title: parsed.title,
          description: parsed.description,
          due_date: parsed.due_date?.split(' ')[0], // 只取日期部分
          priority: parsed.priority,
          status: parsed.status,
        })
      })

      if (response.ok) {
        setSuccess(true)
        setInput('')
        setParsed(null)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
          onTaskCreated?.()
        }, 1000)
      } else {
        setError('创建任务失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setIsLoading(false)
    }
  }, [parsed, selectedProject, projects, onTaskCreated])

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { text: '高优先级', color: 'text-red-500 bg-red-500/10' }
      case 2: return { text: '中优先级', color: 'text-amber-500 bg-amber-500/10' }
      case 3: return { text: '低优先级', color: 'text-green-500 bg-green-500/10' }
      default: return { text: '默认', color: 'text-gray-500 bg-gray-500/10' }
    }
  }

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
        title="快速添加任务 (Ctrl+N)"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 快捷键提示 */}
      <div className="fixed bottom-6 right-20 text-xs text-theme-muted hidden md:block">
        Ctrl+N
      </div>

      {/* 弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* 弹窗内容 */}
          <div className="relative w-full max-w-lg glass-card animate-modal-enter">
            {/* 头部 */}
            <div className="p-4 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-theme-accent" />
                <span className="font-semibold text-theme-primary">快速添加任务</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-theme-list-item transition-colors"
              >
                <X className="w-5 h-5 text-theme-muted" />
              </button>
            </div>

            {/* 输入区域 */}
            <div className="p-4 space-y-4">
              {/* 项目选择 */}
              {projects.length > 0 && !projectId && (
                <div className="flex flex-wrap gap-2">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProject(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                        selectedProject === p.id
                          ? 'bg-sky-500/20 text-sky-500'
                          : 'bg-theme-list-item text-theme-secondary hover:bg-theme-list-item-hover'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 输入框 */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入任务描述，如：明天下午3点前完成首页设计"
                  className="w-full px-4 py-3 bg-theme-list-item border border-theme-border rounded-lg text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-theme-accent transition-colors"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-accent animate-spin" />
                )}
              </div>

              {/* 解析预览 */}
              {parsed && (
                <div className="bg-theme-list-item rounded-lg p-4 space-y-3 border border-theme-border">
                  <div className="flex items-center gap-2 text-sm text-theme-secondary">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>解析预览</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-theme-primary font-medium">{parsed.title}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {parsed.due_date && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-500/10 text-sky-500 rounded text-xs">
                          <Calendar className="w-3 h-3" />
                          {parsed.due_date}
                        </span>
                      )}
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getPriorityLabel(parsed.priority).color}`}>
                        <Tag className="w-3 h-3" />
                        {getPriorityLabel(parsed.priority).text}
                      </span>

                      {parsed.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs">
                          <Clock className="w-3 h-3" />
                          进行中
                        </span>
                      )}

                      {parsed.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* 成功提示 */}
              {success && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Check className="w-4 h-4" />
                  <span>任务创建成功！</span>
                </div>
              )}

              {/* 提示 */}
              <div className="text-xs text-theme-muted">
                <p>💡 支持自然语言输入：</p>
                <ul className="mt-1 space-y-0.5">
                  <li>• "明天下午3点前完成" → 自动设置截止时间</li>
                  <li>• "高优先级" / "低优先级" → 自动设置优先级</li>
                  <li>• "修复bug" → 自动添加 bug 标签</li>
                </ul>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t border-theme-border flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-theme-secondary hover:text-theme-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={createTask}
                disabled={!parsed || !parsed.title || isLoading || (!selectedProject && projects.length > 0)}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
