'use client'

import { useEffect, useState, useRef } from 'react'
import { Activity, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { setRealtimeStatusCallback } from './RealtimeProvider'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export default function RealtimeIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    // 注册状态回调
    setRealtimeStatusCallback((newStatus) => {
      setStatus(newStatus.connected ? 'connected' : 'disconnected')
      if (newStatus.lastUpdate) {
        setLastUpdate(newStatus.lastUpdate)
      }
    })

    // 初始化为 disconnected，等 RealtimeProvider 连接后更新
    const timeout = setTimeout(() => {
      if (statusRef.current === 'connecting') {
        setStatus('disconnected')
      }
    }, 5000)

    return () => {
      setRealtimeStatusCallback(null)
      clearTimeout(timeout)
    }
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          dotColor: 'bg-green-500',
          pingColor: 'bg-green-400',
          label: '实时同步中',
          icon: <Wifi className="w-3 h-3" />
        }
      case 'connecting':
        return {
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/20',
          dotColor: 'bg-amber-500',
          pingColor: 'bg-amber-400',
          label: '连接中...',
          icon: <Loader2 className="w-3 h-3 animate-spin" />
        }
      case 'disconnected':
      default:
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          dotColor: 'bg-red-500',
          pingColor: 'bg-red-400',
          label: '离线',
          icon: <WifiOff className="w-3 h-3" />
        }
    }
  }

  const config = getStatusConfig()

  const formatLastUpdate = () => {
    if (!lastUpdate) return null
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)
    
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    return lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${config.color}`}>
      {config.icon}
      <span>{config.label}</span>
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}></span>
      </span>
      {lastUpdate && status === 'connected' && (
        <span className="text-[var(--text-muted)] ml-1">
          {formatLastUpdate()}
        </span>
      )}
    </div>
  )
}
