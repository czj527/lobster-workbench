import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FolderKanban, Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // 获取项目详情
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!project) {
    notFound()
  }
  
  // 获取任务列表
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })
  
  // 按状态分组
  const tasksByStatus = {
    todo: tasks?.filter(t => t.status === 'todo') || [],
    in_progress: tasks?.filter(t => t.status === 'in_progress') || [],
    testing: tasks?.filter(t => t.status === 'testing') || [],
    done: tasks?.filter(t => t.status === 'done') || []
  }
  
  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    'todo': { 
      label: '📋 待办', 
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-500/20'
    },
    'in_progress': { 
      label: '🔨 进行中', 
      icon: <PlayCircle className="w-4 h-4" />,
      color: 'text-sky-500 dark:text-blue-400',
      bg: 'bg-sky-100 dark:bg-blue-500/20'
    },
    'testing': { 
      label: '🔍 测试中', 
      icon: <Clock className="w-4 h-4" />,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-500/20'
    },
    'done': { 
      label: '✅ 已完成', 
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-green-500 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-500/20'
    }
  }
  
  const statusMap: Record<string, string> = {
    'planning': '规划中',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }

  // 进度环计算
  const progressAngle = ((project.progress || 0) / 100) * 360
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progressAngle / 360) * circumference

  return (
    <div className="space-y-8 page-enter">
      {/* 返回链接和标题 */}
      <div>
        <Link href="/projects" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回项目列表
        </Link>
        
        <div className="glass-card p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400/30 to-cyan-400/30 dark:from-blue-500/30 dark:to-purple-500/30 flex items-center justify-center text-5xl backdrop-blur-sm">
                {project.icon || '📦'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-700 dark:text-white mb-2">{project.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {project.current_phase || '未开始'}
                </p>
                <span className={`inline-block mt-3 text-sm px-4 py-1 rounded-full ${
                  project.status === 'in_progress' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 status-active' 
                    : project.status === 'planning'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : project.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {statusMap[project.status] || project.status}
                </span>
              </div>
            </div>
            
            {/* 进度环 */}
            <div className="relative w-32 h-32">
              <svg className="progress-ring w-full h-full">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  fill="none"
                  stroke="rgba(148,163,184,0.2)"
                  strokeWidth="8"
                />
                <circle
                  className="progress-ring-circle"
                  cx="64"
                  cy="64"
                  r="45"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">{project.progress || 0}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">完成度</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban看板 */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-white mb-6 flex items-center gap-2">
          <FolderKanban className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
          任务看板
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const config = statusConfig[status]
            return (
              <div 
                key={status} 
                className={`glass-card p-4 kanban-${status === 'in_progress' ? 'progress' : status === 'testing' ? 'testing' : status === 'done' ? 'done' : 'todo'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-medium ${config.color} flex items-center gap-2`}>
                    {config.icon}
                    {config.label}
                  </h3>
                  <span className={`text-xs ${config.bg} ${config.color} px-2 py-1 rounded-full`}>
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {statusTasks.length > 0 ? (
                    statusTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`glass p-4 rounded-lg priority-${task.priority || 'low'}`}
                      >
                        <p className="text-sm font-medium text-slate-700 dark:text-white mb-2">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          {task.due_date && (
                            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.due_date}
                            </span>
                          )}
                          {task.priority && (
                            <span className={`${
                              task.priority === 'high' ? 'text-red-500' :
                              task.priority === 'medium' ? 'text-amber-500' :
                              'text-green-500'
                            }`}>
                              {task.priority === 'high' ? '🔴 高' : 
                               task.priority === 'medium' ? '🟡 中' : '🟢 低'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <p className="text-sm">暂无任务</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 项目描述 */}
      {project.description && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-white mb-4">📝 项目描述</h2>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{project.description}</p>
        </div>
      )}
      
      {/* 更新时间 */}
      <div className="text-center text-sm text-slate-400 dark:text-slate-500">
        最后更新: {new Date(project.updated_at).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}
