import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
  
  const statusLabels: Record<string, string> = {
    'todo': '📋 待办',
    'in_progress': '🔨 进行中',
    'testing': '🔍 测试中',
    'done': '✅ 已完成'
  }
  
  const statusMap: Record<string, string> = {
    'planning': '规划中',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }

  return (
    <div>
      {/* 返回链接和标题 */}
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
          ← 返回项目列表
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">{project.icon || '📦'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-500">{project.current_phase || '未开始'}</p>
            </div>
          </div>
          <span className={`text-sm px-3 py-1 rounded ${
            project.status === 'in_progress' ? 'bg-green-100 text-green-800' :
            project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusMap[project.status] || project.status}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">整体进度</span>
          <span className="font-medium">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="h-3 rounded-full transition-all"
            style={{ 
              width: `${project.progress || 0}%`,
              backgroundColor: project.color || '#6366F1'
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          最后更新: {new Date(project.updated_at).toLocaleString('zh-CN')}
        </p>
      </div>

      {/* Kanban看板 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">任务看板</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">{statusLabels[status]}</h3>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {statusTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {statusTasks.length > 0 ? (
                  statusTasks.map((task) => (
                    <div key={task.id} className="bg-white rounded p-3 shadow-sm">
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-gray-400 mt-2">
                          截止: {task.due_date}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">暂无任务</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 项目描述 */}
      {project.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">项目描述</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}
    </div>
  );
}
