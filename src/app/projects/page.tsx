import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">所有项目</h1>
        <p className="text-gray-500 text-sm mt-1">共 {projects?.length || 0} 个项目</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{project.icon || '📦'}</span>
                    <div>
                      <h2 className="font-semibold text-gray-900">{project.name}</h2>
                      <p className="text-sm text-gray-500">{project.current_phase || '未开始'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    project.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {statusMap[project.status] || project.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {project.description || '暂无描述'}
                </p>
                
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>进度</span>
                  <span>{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${project.progress || 0}%`,
                      backgroundColor: project.color || '#6366F1'
                    }}
                  />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>暂无项目</p>
            <p className="text-sm mt-2">龙虾正在创建中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
