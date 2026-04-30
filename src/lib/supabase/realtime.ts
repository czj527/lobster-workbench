import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from './client'

export function subscribeToProject(projectId: string, callback: (payload: any) => void) {
  const supabase = createClient()
  
  return supabase
    .channel(`project:${projectId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
      callback
    )
    .subscribe()
}

export function subscribeToAllProjects(callback: (payload: any) => void) {
  const supabase = createClient()
  
  return supabase
    .channel('projects')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_log' },
      callback
    )
    .subscribe()
}
