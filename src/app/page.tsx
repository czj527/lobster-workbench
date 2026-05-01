import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderKanban, TrendingUp, Activity, Clock, ArrowRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import CalendarWidget from '@/components/CalendarWidget'
import StatsWidgets from '@/components/StatsWidgets'

export default async function HomePage() {
  const supabase = await createClient()
  
  // 获取项目列表
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)
  
  // 获取最近活动
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  // 获取所有任务（用于最近任务模块）
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*, projects(name, icon)')
    .order('updated_at', { ascending: false })
    .limit(10)

  const inProgressCount = projects?.filter(p => p.status === 'in_progress').length || 0
  const completedCount = projects?.filter(p => p.status === 'completed').length || 0

  const statusMap: Record<string, string> = {
    'planning': '规划中',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }

  const taskStatusIcon: Record<string, React.ReactNode> = {
    'todo': <Circle className="w-4 h-4 text-theme-muted" />,
    'in_progress': <Loader2 className="w-4 h-4 text-theme-accent animate-spin" />,
    'testing': <Loader2 className="w-4 h-4 text-amber-500" />,
    'done': <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
  }

  return (
    <div className="space-y-6 md:space-y-8 page-enter">
      {/* 欢迎区 */}
      <div className="glass-card p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              <span className="gradient-text">💙 蓝的工作台</span>
            </h1>
            <p className="text-sm md:text-base text-theme-accent">
              可视化项目管理与任务追踪，让工作更高效
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-2xl md:text-4xl font-bold text-theme-primary">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 - 移动端2列，桌面4列 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sky-500/20 dark:bg-blue-500/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
            </div>
            <span className="text-xs text-theme-accent">总项目</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold stat-number">{projects?.length || 0}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">项目总数</div>
        </div>
        
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/20 dark:bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-500 dark:text-green-400" />
            </div>
            <span className="text-xs text-green-500 dark:text-green-400">进行中</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-green-500 dark:text-green-400">{inProgressCount}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">活跃项目</div>
        </div>
        
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-500 dark:text-emerald-400">已完成</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-emerald-500 dark:text-emerald-400">{completedCount}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">已完成</div>
        </div>
        
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-xs text-purple-500 dark:text-purple-400">动态</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-purple-500 dark:text-purple-400">{activities?.length || 0}</div>
          <div className="text-xs md:text-sm text-theme-secondary mt-1">最近活动</div>
        </div>
      </div>

      {/* 日历日程 + 增强统计 - 移动端单列，桌面双列 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 今日日程 */}
        <div className="card-appear" style={{ animationDelay: '350ms' }}>
          <CalendarWidget />
        </div>

        {/* 增强统计 */}
        <div className="card-appear" style={{ animationDelay: '400ms' }}>
          <StatsWidgets />
        </div>
      </div>

      {/* 最近任务 + 活动时间线 - 移动端单列，桌面双列 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 最近任务 */}
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-theme-primary flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-theme-accent" />
              最近任务
            </h2>
            <Link href="/projects" className="text-xs md:text-sm text-theme-link flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            </Link>
          </div>
          <div className="space-y-2 md:space-y-3">
            {allTasks && allTasks.length > 0 ? (
              allTasks.slice(0, 6).map((task, index) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-theme-list-item hover:bg-theme-list-item-hover transition-colors min-h-[44px]"
                  style={{ animationDelay: `${500 + index * 50}ms` }}
                >
                  {taskStatusIcon[task.status] || <Circle className="w-4 h-4" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-theme-primary font-medium truncate">{task.title}</p>
                    <p className="text-xs text-theme-muted truncate hidden sm:block">
                      {task.projects?.icon} {task.projects?.name || '未知项目'}
                    </p>
                  </div>
                  {task.priority && (
                    <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                      task.priority === 1 ? 'tag-error' :
                      task.priority === 2 ? 'tag-warning' :
                      'tag-success'
                    }`}>
                      {task.priority === 1 ? '高' : task.priority === 2 ? '中' : '低'}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-theme-muted">
                <Clock className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
                <p className="text-sm md:text-base">暂无任务</p>
                <p className="text-xs md:text-sm mt-1">蓝正在创建中...</p>
              </div>
            )}
          </div>
        </div>

        {/* 活动时间线 */}
        <div className="glass-card p-4 md:p-6 card-appear" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-theme-primary flex items-center gap-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-500 dark:text-purple-400" />
              活动时间线
            </h2>
          </div>
          <div className="space-y-3 md:space-y-4 relative max-h-[400px] overflow-y-auto">
            {/* 时间线竖线 */}
            <div className="absolute left-[14px] md:left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-sky-500 via-blue-500 to-cyan-500"></div>
            
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 md:gap-4 pl-1 relative"
                  style={{ animationDelay: `${600 + index * 80}ms` }}
                >
                  {/* 时间线圆点 */}
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="flex-1 pb-3 md:pb-4">
                    <p className="text-xs md:text-sm text-theme-primary break-words">{activity.content}</p>
                    <p className="text-xs text-theme-muted mt-1">
                      {new Date(activity.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-theme-muted">
                <Activity className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
                <p className="text-sm md:text-base">暂无活动记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 项目卡片 - 移动端1列，桌面3列 */}
      <div className="card-appear" style={{ animationDelay: '700ms' }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-theme-primary flex items-center gap-2">
            <FolderKanban className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
            项目列表
          </h2>
          <Link href="/projects" className="text-xs md:text-sm text-theme-link flex items-center gap-1">
            查看全部项目 <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </div>
        
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {projects.map((project, index) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div 
                  className="glass-card p-4 md:p-6 cursor-pointer card-glow h-full"
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className="text-3xl md:text-4xl">{project.icon || '📦'}</span>
                    <span className={`text-xs px-2 md:px-3 py-1 rounded-full ${
                      project.status === 'in_progress' 
                        ? 'tag-success status-active' 
                        : project.status === 'planning'
                        ? 'tag-info'
                        : project.status === 'completed'
                        ? 'tag-success'
                        : 'tag-warning'
                    }`}>
                      {statusMap[project.status] || project.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base md:text-lg text-theme-primary mb-2">{project.name}</h3>
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
                    <div className="w-full h-1.5 md:h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full progress-gradient"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
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
    </div>
  );
}
