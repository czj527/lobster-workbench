'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface RealtimeStatus {
  connected: boolean
  lastUpdate: Date | null
}

// 创建全局状态共享器
let globalStatusCallback: ((status: RealtimeStatus) => void) | null = null

export function setRealtimeStatusCallback(callback: ((status: RealtimeStatus) => void) | null) {
  globalStatusCallback = callback
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // 通知状态更新
    const notifyStatus = (connected: boolean) => {
      setIsConnected(connected)
      if (globalStatusCallback) {
        globalStatusCallback({
          connected,
          lastUpdate: connected ? new Date() : null
        })
      }
    }

    const channel = supabase
      .channel('workbench-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        setLastUpdate(new Date())
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        setLastUpdate(new Date())
        router.refresh()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        setLastUpdate(new Date())
        router.refresh()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          notifyStatus(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          notifyStatus(false)
        }
      })

    return () => {
      notifyStatus(false)
      supabase.removeChannel(channel)
    }
  }, [router])

  return <>{children}</>
}
