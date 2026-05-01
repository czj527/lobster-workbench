'use client'

import { useState, useEffect } from 'react'
import { FolderKanban, TrendingUp, Activity, Clock, ArrowRight, CheckCircle2, Circle, Loader2, Sparkles, Calendar, Plus, GitBranch, Bell, Settings, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import AISummary from './AISummary'
import TaskSuggestions from './TaskSuggestions'
import CalendarWidget from './CalendarWidget'
import GitHubStatus from './GitHubStatus'
import QuickAdd from './QuickAdd'
import StatsWidgets from './StatsWidgets'
import LiveStatus from './LiveStatus'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  icon: string
  description: string | null
  status: string
  progress: number
  current_phase: string | null
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: number
  project_id: string
  projects?: { name: string; icon: string }
}

interface Activity {
  id: string
  content: string
  type: string
  created_at: string
}

interface DashboardV2Props {
  projects: Project[]
  activities: Activity[]
  tasks: Task[]
}

export default function DashboardV2({ projects: initialProjects, activities: initialActivities, tasks: initialTasks }: DashboardV2Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [activities, setActivities] = useState(initialActivities)
  const [tasks, setTasks] = useState(initialTasks)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  
  // 实时订阅活动日志
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
        setActivities(prev => [payload.new as Activity, ...prev.slice(0, 19)])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 统计数据
  const inProgressCount = projects.filter(p => p.status === 'in_progress').length
  const completedCount = projects.filter(p => p.status === 'completed').length
  
  // 今日相关统计
  const today = new Date().toISOString().split('T')[0]
  const dueTodayTasks = tasks.filter(t => {
    // 假设 tasks 表有 due_date 字段
    return false // 暂时禁用，因为 tasks 可能没有 due_date
  })
  const overdueTasks = tasks.filter(t => {
    // 假设 tasks 表有 due_date 字段
    return false
  })

  const statusMap: Record<string, string> = { 
    'planning': '规划中', 
    'in_progress': '进行中', 
    'completed': '已完成', 
    'paused': '已暂停' 
  }

  const taskStatusIcon: Record<string, React.ReactNode> = {
    'todo': <Circle className="w-4 h-4 text-theme-muted" />,
    'in_progress': <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />,
    'testing': <Loader2 className="w-4 h-4 text-amber-500" />,
    'done': <CheckCircle2 className="w-4 h-4 text-green-500" />
  }

  const handleTaskCreated = () => {
    // 刷新任务列表
    window.location.reload()
  }

    return (
    <div className="space-y-6 md:space-y-8 page-enter">
      {/* 顶部欢迎区 */}
      <div className="glass-card p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              <span className="gradient-text">💙 蓝的工作台</span>
            </h1>
            <p className="text-sm md:text-base text-theme-accent">
              欢迎回来！今天也要加油哦 ✨
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-2xl md:text-4xl font-bold text-theme-primary">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* 实时状态卡片 - 放在欢迎语下方 */}
      <div className="card-appear" style={{ animationDelay: '50ms' }}>
        <LiveStatus />
      </div>

      {/* 今日概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 md:w-6 md:h-6 text-sky-500" />
            </div>
            <span className="text-xs text-sky-500">总项目</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold stat-number">{projects.length}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">项目总数</div>
        </div>

        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            </div>
            <span className="text-xs text-green-500">进行中</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-green-500">{inProgressCount}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">活跃项目</div>
        </div>

        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
            </div>
            <span className="text-xs text-emerald-500">已完成</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-emerald-500">{completedCount}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">已完成</div>
        </div>

        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
            </div>
            <span className="text-xs text-purple-500">动态</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-purple-500">{activities.length}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">最近活动</div>
        </div>
      </div>

      {/* 主内容区 - 三列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* 左侧 - AI 摘要和智能建议 */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="card-appear" style={{ animationDelay: '450ms' }}>
            {projects.length > 0 ? (
              <AISummary 
                projectId={projects[0].id} 
                projectName={projects[0].name}
                compact={true}
              />
            ) : (
              <div className="glass-card p-6 text-center">
                <Sparkles className="w-10 h-10 text-theme-accent mx-auto mb-3 opacity-50" />
                <p className="text-theme-secondary">创建项目后即可生成 AI 摘要</p>
              </div>
            )}
          </div>

          <div className="card-appear" style={{ animationDelay: '500ms' }}>
            <TaskSuggestions compact={true} />
          </div>
        </div>

        {/* 中间 - 日历和快速添加 */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="card-appear" style={{ animationDelay: '550ms' }}>
            <CalendarWidget />
          </div>

          {/* 快速添加预览 */}
          <div className="glass-card p-4 card-appear" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-theme-accent" />
              <span className="font-semibold text-theme-primary">快速添加</span>
              <span className="text-xs text-theme-muted ml-auto">Ctrl+N</span>
            </div>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="w-full p-3 bg-theme-list-item rounded-lg border border-dashed border-theme-border hover:border-theme-accent transition-colors flex items-center gap-3"
            >
              <Plus className="w-5 h-5 text-theme-muted" />
              <span className="text-theme-secondary">输入任务描述...</span>
            </button>
          </div>

          {/* GitHub 状态 */}
          <div className="card-appear" style={{ animationDelay: '650ms' }}>
            <GitHubStatus compact={true} />
          </div>
        </div>

        {/* 右侧 - 任务和时间线 */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          {/* 最近任务 */}
          <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '700ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-theme-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                最近任务
              </h2>
              <Link href="/projects" className="text-xs text-theme-link flex items-center gap-1">
                查看全部 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-theme-list-item hover:bg-theme-list-item-hover transition-colors">
                  {taskStatusIcon[task.status] || <Circle className="w-4 h-4" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-primary font-medium truncate">{task.title}</p>
                    {task.projects && (
                      <p className="text-xs text-theme-muted truncate">
                        {task.projects.icon} {task.projects.name}
                      </p>
                    )}
                  </div>
                  {task.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.priority === 1 ? 'tag-error' : 
                      task.priority === 2 ? 'tag-warning' : 'tag-success'
                    }`}>
                      {task.priority === 1 ? '高' : task.priority === 2 ? '中' : '低'}
                    </span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-6 text-theme-muted">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无任务</p>
                </div>
              )}
            </div>
          </div>

          {/* 活动时间线 */}
          <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '750ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-theme-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                活动时间线
              </h2>
            </div>
            <div className="space-y-3 relative max-h-[300px] overflow-y-auto">
              <div className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-sky-500 via-blue-500 to-cyan-500" />
              {activities.slice(0, 8).map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3 pl-1 relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-xs text-theme-primary break-words">{activity.content}</p>
                    <p className="text-xs text-theme-muted mt-1">
                      {new Date(activity.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-6 text-theme-muted">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无活动</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="card-appear" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-theme-primary flex items-center gap-2">
            <FolderKanban className="w-5 h-5 md:w-6 md:h-6 text-sky-500" />
            项目列表
          </h2>
          <Link href="/projects" className="text-xs md:text-sm text-theme-link flex items-center gap-1">
            查看全部项目 <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {projects.slice(0, 6).map((project, index) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div 
                  className="glass-card p-4 md:p-6 cursor-pointer card-glow h-full"
                  style={{ animationDelay: `${900 + index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl md:text-4xl">{project.icon || '📦'}</span>
                    <span className={`text-xs px-2 md:px-3 py-1 rounded-full ${
                      project.status === 'in_progress' ? 'tag-success status-active' : 
                      project.status === 'planning' ? 'tag-info' : 
                      project.status === 'completed' ? 'tag-success' : 'tag-warning'
                    }`}>
                      {statusMap[project.status] || project.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base md:text-lg text-theme-primary mb-2">
                    {project.name}
                  </h3>
                  <p className="text-xs md:text-sm text-theme-secondary mb-3 md:mb-4 line-clamp-2">
                    {project.description || '暂无描述'}
                  </p>
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-theme-muted mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.current_phase || '未开始'}
                      </span>
                      <span className="text-theme-primary font-medium">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-[var(--list-item-bg)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full progress-gradient" 
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 md:p-12 text-center">
            <div className="text-5xl md:text-6xl mb-3 md:mb-4">💙</div>
            <p className="text-lg md:text-xl text-theme-primary mb-2">暂无项目</p>
            <p className="text-sm md:text-base text-theme-muted">蓝正在创建中...</p>
          </div>
        )}
      </div>

      {/* 快速添加弹窗 */}
      <QuickAdd 
        projectId={projects[0]?.id}
        projects={projects.map(p => ({ id: p.id, name: p.name, icon: p.icon }))}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}
