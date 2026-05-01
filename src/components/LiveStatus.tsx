'use client'

import { useState, useEffect } from 'react'
import { Activity, CheckCircle2, Loader2, Circle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Step {
  text: string
  status: 'done' | 'doing' | 'todo'
}

interface StatusPayload {
  current_task: string
  steps: Step[]
  status: 'working' | 'idle' | 'thinking'
  updated_at?: string
}

interface LiveStatusData {
  id: string
  payload: StatusPayload
  created_at: string
}

export default function LiveStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 初始获取
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('event_type', 'live_status')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') { // 忽略 "no rows returned" 错误
          console.error('Failed to fetch live status:', error)
          return
        }

        if (data) {
          const statusData = data.payload as StatusPayload
          statusData.updated_at = data.created_at
          setStatus(statusData)
          setLastUpdate(new Date(data.created_at))
        } else {
          // 默认状态
          setStatus({
            current_task: '空闲中，等待任务',
            steps: [],
            status: 'idle'
          })
        }
      } catch (err) {
        console.error('Failed to fetch live status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()

    // 订阅实时更新
    const channel = supabase
      .channel('live-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: 'event_type=eq.live_status'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newEvent = payload.new as { payload: StatusPayload; created_at: string }
            const statusData = { ...newEvent.payload, updated_at: newEvent.created_at }
            setStatus(statusData)
            setLastUpdate(new Date(newEvent.created_at))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 状态图标
  const statusIcon = {
    working: <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />,
    thinking: <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />,
    idle: <div className="w-3 h-3 rounded-full bg-[var(--text-secondary)]" />
  }

  // 状态文字
  const statusText = {
    working: '蓝正在工作',
    thinking: '蓝在思考中',
    idle: '蓝暂时空闲'
  }

  // 状态颜色
  const statusColor = {
    working: 'text-green-500',
    thinking: 'text-blue-500',
    idle: 'text-[var(--text-secondary)]'
  }

  // 步骤图标
  const stepIcon = {
    done: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
    doing: <Loader2 className="w-4 h-4 text-sky-500 animate-spin flex-shrink-0" />,
    todo: <Circle className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
  }

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--list-item-bg)]" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-[var(--list-item-bg)] rounded mb-2" />
            <div className="h-3 w-40 bg-[var(--list-item-bg)] rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-4 md:p-5">
      {/* 头部状态 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          {statusIcon[status?.status || 'idle']}
          {/* 脉冲环 */}
          {(status?.status === 'working' || status?.status === 'thinking') && (
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500/50 animate-ping" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${statusColor[status?.status || 'idle']}`} />
            <span className={`text-sm font-medium ${statusColor[status?.status || 'idle']}`}>
              {statusText[status?.status || 'idle']}
            </span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-theme-muted mt-0.5">
              <Clock className="w-3 h-3" />
              <span>更新于 {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* 当前任务 */}
      {status?.current_task && (
        <div className="mb-3">
          <div className="text-xs text-theme-muted mb-1">当前任务</div>
          <p className="text-sm text-theme-primary font-medium line-clamp-2">
            {status.current_task}
          </p>
        </div>
      )}

      {/* 步骤列表 */}
      {status?.steps && status.steps.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-theme-muted">执行步骤</div>
          <div className="space-y-1.5">
            {status.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                {stepIcon[step.status]}
                <span className={`text-xs ${
                  step.status === 'done' ? 'text-theme-secondary line-through opacity-60' :
                  step.status === 'doing' ? 'text-theme-primary font-medium' :
                  'text-theme-muted'
                }`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
