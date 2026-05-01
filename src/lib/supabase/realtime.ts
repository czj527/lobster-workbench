import { createClient } from '@/lib/supabase/client'

// 创建实时订阅客户端
export function createRealtimeClient() {
  const supabase = createClient()
  return supabase
}

// 订阅项目变化
export function subscribeToProjects(callback: (payload: any) => void) {
  const supabase = createRealtimeClient()
  
  const subscription = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects'
      },
      callback
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
}

// 订阅任务变化
export function subscribeToTasks(projectId: string, callback: (payload: any) => void) {
  const supabase = createRealtimeClient()
  
  const subscription = supabase
    .channel(`tasks-changes-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`
      },
      callback
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
}

// 订阅活动日志变化
export function subscribeToActivities(callback: (payload: any) => void) {
  const supabase = createRealtimeClient()
  
  const subscription = supabase
    .channel('activities-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_log'
      },
      callback
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
}
