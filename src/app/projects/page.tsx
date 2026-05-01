import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FolderKanban, Clock, TrendingUp } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const statusMap: Record<string, string> = {
    'planning': '规划中',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }

  // 计算统计数据
  const stats = {
    total: projects?.length || 0,
    inProgress: projects?.filter(p => p.status === 'in_progress').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
    avgProgress: projects && projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
      : 0
  }

  return (
    <div className="space-y-8 page-enter">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回仪表盘
          </Link>
          <h1 className="text-3xl font-bold text-slate-700 dark:text-white flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-sky-500 dark:text-blue-400" />
            所有项目
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">共 {stats.total} 个项目，平均进度 {stats.avgProgress}%</p>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 dark:bg-blue-500/20 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-sky-500 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700 dark:text-white">{stats.total}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">项目总数</div>
          </div>
        </div>
        
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500 dark:text-green-400">{stats.inProgress}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">进行中</div>
          </div>
        </div>
        
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{stats.completed}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">已完成</div>
          </div>
        </div>
      </div>

      {/* 项目网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects && projects.length > 0 ? (
          projects.map((project, index) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div 
                className="glass-card p-6 cursor-pointer card-glow h-full"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400/30 to-cyan-400/30 dark:from-blue-500/30 dark:to-purple-500/30 flex items-center justify-center text-3xl backdrop-blur-sm">
                      {project.icon || '📦'}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg text-slate-700 dark:text-white">{project.name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.current_phase || '未开始'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
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
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 line-clamp-2">
                  {project.description || '暂无描述'}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">进度</span>
                    <span className="text-slate-700 dark:text-white font-medium">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full progress-gradient"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full glass-card p-16 text-center">
            <div className="text-6xl mb-4">💙</div>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">暂无项目</p>
            <p className="text-slate-400 dark:text-slate-500">蓝正在创建中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
