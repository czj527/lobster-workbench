'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'

export default function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // 模拟实时连接状态
    setIsConnected(true)
    setLastUpdate(new Date())
    
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000) // 每30秒更新一次显示时间
    
    return () => clearInterval(interval)
  }, [])

  if (!isConnected) return null

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <Activity className="w-3 h-3 text-green-400" />
      <span>实时同步中</span>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
    </div>
  )
}
