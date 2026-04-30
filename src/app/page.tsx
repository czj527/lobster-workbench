import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';

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
    .limit(5)

  const statusMap: Record<string, string> = {
    'planning': '规划中',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }

  return (
    <div className="space-y-8">
      {/* 欢迎区 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🦞 龙虾工作台</h1>
        <p className="text-gray-600">
          当前有 {projects?.length || 0} 个项目，{activities?.length || 0} 条最近动态
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-indigo-600">{projects?.length || 0}</div>
          <div className="text-gray-500 text-sm">项目总数</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">
            {projects?.filter(p => p.status === 'in_progress').length || 0}
          </div>
          <div className="text-gray-500 text-sm">进行中</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{activities?.length || 0}</div>
          <div className="text-gray-500 text-sm">最近活动</div>
        </div>
      </div>

      {/* 最新动态 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">最新动态</h2>
        </div>
        <div className="p-6">
          {activities && activities.length > 0 ? (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start space-x-3">
                  <span className="text-sm text-gray-500">
                    {new Date(activity.created_at).toLocaleString('zh-CN')}
                  </span>
                  <span className="text-gray-700">{activity.content}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">暂无动态</p>
          )}
        </div>
      </div>

      {/* 项目卡片 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">项目列表</h2>
          <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-800">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{project.icon || '📦'}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                      project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {statusMap[project.status] || project.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {project.description || '暂无描述'}
                  </p>
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{project.current_phase || '未开始'}</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              暂无项目
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
