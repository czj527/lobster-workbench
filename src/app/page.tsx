import { createClient } from '@/lib/supabase/server'
import DashboardV2 from '@/components/DashboardV2'

export default async function HomePage() {
  const supabase = await createClient()
  
  // 获取项目列表
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)
  
  // 获取活动日志
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  
  // 获取任务列表
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, projects(name, icon)')
    .order('updated_at', { ascending: false })
    .limit(10)

  return (
    <DashboardV2 
      projects={projects || []}
      activities={activities || []}
      tasks={tasks || []}
    />
  )
}
