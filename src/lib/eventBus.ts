/**
 * 事件总线 - 基于Supabase的事件发布/订阅机制
 */
import { createClient } from '@/lib/supabase/client'

export type EventType = 
  | 'task_completed' | 'task_created' | 'task_updated' | 'task_deleted'
  | 'project_updated' | 'project_created' | 'project_deleted'
  | 'sync_requested' | 'sync_completed' | 'notification'
  | 'calendar_sync' | 'github_sync'

export interface EventPayload { timestamp?: string; source?: string; [key: string]: unknown }
export interface EventRecord { id: string; event_type: EventType; payload: EventPayload; source?: string; target?: string; processed: boolean; created_at: string }
export type EventCallback = (event: EventRecord) => void

let supabaseClient: ReturnType<typeof createClient> | null = null
function getSupabaseClient() {
  if (!supabaseClient) supabaseClient = createClient()
  return supabaseClient
}

export async function emitEvent(type: EventType, payload: EventPayload, options?: { source?: string; target?: string }): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()
    const eventData = {
      event_type: type,
      payload: { ...payload, timestamp: new Date().toISOString(), source: options?.source || 'lobster-workbench' },
      source: options?.source || 'lobster-workbench',
      target: options?.target,
      processed: false,
    }
    const { data, error } = await supabase.from('events').insert(eventData).select('id').single()
    if (error) { console.error('emitEvent error:', error); return null }
    return data?.id || null
  } catch (error) { console.error('emitEvent exception:', error); return null }
}

export async function subscribeToEvents(type: EventType, callback: EventCallback, options?: { since?: string; limit?: number }): Promise<() => void> {
  const supabase = getSupabaseClient()
  const since = options?.since || new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const limit = options?.limit || 50

  const { data: existingEvents } = await supabase.from('events').select('*').eq('event_type', type).gte('created_at', since).order('created_at', { ascending: true }).limit(limit)
  if (existingEvents) existingEvents.forEach((event) => { if (!event.processed) callback(event as EventRecord) })

  const pollInterval = setInterval(async () => {
    try {
      const { data: newEvents } = await supabase.from('events').select('*').eq('event_type', type).gte('created_at', since).order('created_at', { ascending: true }).limit(limit)
      if (newEvents) newEvents.forEach((event) => { if (!event.processed) { callback(event as EventRecord); markEventProcessed(event.id).catch(console.error) } })
    } catch (error) { console.error('Poll error:', error) }
  }, 5000)
  return () => { clearInterval(pollInterval) }
}

export function subscribeToEventsRealtime(types: EventType[], callback: EventCallback): () => void {
  const supabase = getSupabaseClient()
  const channel = supabase.channel('event-bus').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
    const event = payload.new as EventRecord
    if (types.includes(event.event_type as EventType)) { callback(event); markEventProcessed(event.id).catch(console.error) }
  }).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export async function markEventProcessed(eventId: string): Promise<void> {
  try { await getSupabaseClient().from('events').update({ processed: true }).eq('id', eventId) } catch (error) { console.error('markEventProcessed error:', error) }
}

export async function getUnprocessedEvents(type?: EventType, limit: number = 100): Promise<EventRecord[]> {
  try {
    let query = getSupabaseClient().from('events').select('*').eq('processed', false).order('created_at', { ascending: true }).limit(limit)
    if (type) query = query.eq('event_type', type)
    const { data, error } = await query
    if (error) { console.error('getUnprocessedEvents error:', error); return [] }
    return (data || []) as EventRecord[]
  } catch (error) { console.error('getUnprocessedEvents exception:', error); return [] }
}

export async function cleanupOldEvents(daysToKeep: number = 7): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const { count: totalCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).lt('created_at', cutoffDate.toISOString())
    await supabase.from('events').delete().lt('created_at', cutoffDate.toISOString())
    return totalCount || 0
  } catch (error) { console.error('cleanupOldEvents error:', error); return 0 }
}

// 便捷函数
export async function emitTaskCompleted(taskId: string, taskTitle: string, projectId: string): Promise<void> {
  await emitEvent('task_completed', { taskId, taskTitle, projectId, message: `任务「${taskTitle}」已完成` })
}
export async function emitProjectUpdated(projectId: string, projectName: string, changes: Record<string, unknown>): Promise<void> {
  await emitEvent('project_updated', { projectId, projectName, changes, message: `项目「${projectName}」已更新` })
}
export async function emitSyncRequested(source: string): Promise<void> {
  await emitEvent('sync_requested', { source, message: `${source} 请求同步数据` })
}
export async function emitSyncCompleted(source: string, itemCount: number): Promise<void> {
  await emitEvent('sync_completed', { source, itemCount, message: `${source} 同步完成，共 ${itemCount} 条记录` })
}
export async function emitNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
  await emitEvent('notification', { title, message, notificationType: type })
}
