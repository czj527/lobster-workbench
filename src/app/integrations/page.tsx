"use client"
import { useState, useEffect } from "react"
import { Link2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, ExternalLink, Settings, Plus, ChevronRight, GitBranch, Calendar, Database, Leaf } from "lucide-react"

interface IntegrationService {
  id: string; name: string; description: string; status: "connected" | "disconnected" | "connecting" | "error"
  lastSync?: string; itemCount?: number; icon: React.ReactNode; color: string; docs?: string
}

interface SyncLog {
  id: string; service: string; action: string; status: "success" | "failed"; message: string; timestamp: string
}

export default function IntegrationsPage() {
  const [services, setServices] = useState<IntegrationService[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [syncingService, setSyncingService] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setServices([
      { id: "github", name: "GitHub", description: "同步代码仓库状态、提交历史和Issues", status: "connected", lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), itemCount: 8, icon: <GitBranch className="w-5 h-5" />, color: "bg-gray-900", docs: "https://github.com/czj527" },
      { id: "calendar", name: "蓝的日历", description: "从Coze日历同步日程安排", status: "connected", lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), itemCount: 5, icon: <Calendar className="w-5 h-5" />, color: "bg-blue-500", docs: "https://api.coze.com" },
      { id: "supabase", name: "Supabase", description: "实时数据库和事件总线后端", status: "connected", lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), itemCount: 24, icon: <Database className="w-5 h-5" />, color: "bg-green-600", docs: "https://supabase.com" },
      { id: "taskflow", name: "四季清单", description: "本地任务管理应用（模拟数据）", status: "connected", lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(), itemCount: 12, icon: <Leaf className="w-5 h-5" />, color: "bg-emerald-500", docs: "/root/repos/taskflow" },
    ])
    setSyncLogs([
      { id: "log-1", service: "GitHub", action: "sync", status: "success" as const, message: "同步了 8 个仓库状态", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: "log-2", service: "日历", action: "sync", status: "success" as const, message: "同步了 5 条日程事件", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: "log-3", service: "Supabase", action: "event", status: "success" as const, message: "处理了 3 个待处理事件", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    ])
    setLoading(false)
  }, [])

  const handleSync = async (serviceId: string) => {
    setSyncingService(serviceId)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, lastSync: new Date().toISOString() } : s))
    const service = services.find(s => s.id === serviceId)
    if (service) setSyncLogs(prev => [{ id: `log-${Date.now()}`, service: service.name, action: "sync", status: "success" as const, message: `重新同步 ${service.name} 数据`, timestamp: new Date().toISOString() }, ...prev].slice(0, 10))
    setSyncingService(null)
  }

  const formatTime = (dateStr: string) => {
    const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60))
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const StatusIcon = ({ status }: { status: IntegrationService["status"] }) => {
    switch (status) {
      case "connected": return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "disconnected": return <XCircle className="w-4 h-4 text-gray-400" />
      case "connecting": return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  if (loading) return <div className="space-y-6 page-enter"><div className="glass-card p-6"><div className="h-8 w-48 bg-skeleton rounded animate-pulse mb-4" /><div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-skeleton rounded animate-pulse" />)}</div></div></div>

  const connectedCount = services.filter(s => s.status === "connected").length

  return (
    <div className="space-y-6 md:space-y-8 page-enter">
      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center"><Link2 className="w-5 h-5 text-purple-500" /></div>
          <div><h1 className="text-xl md:text-2xl font-bold text-theme-primary">集成管理</h1><p className="text-sm text-theme-muted">管理与外部服务的连接和同步</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 text-center"><div className="text-2xl md:text-3xl font-bold text-theme-primary">{services.length}</div><div className="text-xs md:text-sm text-theme-muted">总服务数</div></div>
        <div className="glass-card p-4 text-center"><div className="text-2xl md:text-3xl font-bold text-green-500">{connectedCount}</div><div className="text-xs md:text-sm text-theme-muted">已连接</div></div>
        <div className="glass-card p-4 text-center"><div className="text-2xl md:text-3xl font-bold text-theme-accent">{services.reduce((sum, s) => sum + (s.itemCount || 0), 0)}</div><div className="text-xs md:text-sm text-theme-muted">同步项目</div></div>
        <div className="glass-card p-4 text-center"><div className="text-2xl md:text-3xl font-bold text-purple-500">{syncLogs.length}</div><div className="text-xs md:text-sm text-theme-muted">同步记录</div></div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6"><h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2"><Settings className="w-5 h-5" />已连接的外部服务</h2></div>
        <div className="space-y-3 md:space-y-4">
          {services.map(service => (
            <div key={service.id} className="p-4 bg-theme-list-item rounded-xl hover:bg-theme-list-item-hover transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center text-white flex-shrink-0`}>{service.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-theme-primary">{service.name}</h3><StatusIcon status={service.status} /></div>
                  <p className="text-sm text-theme-muted mb-2">{service.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-theme-secondary">
                    {service.itemCount !== undefined && <span className="flex items-center gap-1"><Database className="w-3 h-3" />{service.itemCount} 个项目</span>}
                    {service.lastSync && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(service.lastSync)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {service.docs && <a href={service.docs} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-theme-border rounded-lg transition-colors text-theme-muted hover:text-theme-primary" title="查看文档"><ExternalLink className="w-4 h-4" /></a>}
                  <button onClick={() => handleSync(service.id)} disabled={syncingService === service.id} className="p-2 hover:bg-theme-border rounded-lg transition-colors text-theme-muted hover:text-theme-primary disabled:opacity-50" title="手动同步"><RefreshCw className={`w-4 h-4 ${syncingService === service.id ? 'animate-spin' : ''}`} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6"><h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2"><Clock className="w-5 h-5" />最近同步记录</h2><button className="text-xs text-theme-link flex items-center gap-1">查看全部 <ChevronRight className="w-3 h-3" /></button></div>
        <div className="space-y-2">
          {syncLogs.map(log => (
            <div key={log.id} className="flex items-center gap-3 p-3 bg-theme-list-item rounded-lg">
              <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-theme-primary">{log.service}</span><span className="text-xs text-theme-muted">{log.action === 'sync' ? '同步' : '事件'}</span></div>
                <p className="text-xs text-theme-muted truncate">{log.message}</p>
              </div>
              <span className="text-xs text-theme-muted flex-shrink-0">{formatTime(log.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 md:p-6 border border-dashed border-theme-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0"><Plus className="w-4 h-4 text-blue-500" /></div>
          <div>
            <h3 className="font-medium text-theme-primary mb-1">添加新的集成</h3>
            <p className="text-sm text-theme-muted mb-3">通过实现标准的API接口，可以将任何本地或外部服务连接到蓝的工作台。查看 <code className="px-1 py-0.5 bg-theme-list-item rounded text-xs">src/lib/bridge/</code> 目录下的桥接模块了解接口规范。</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-theme-list-item rounded text-theme-secondary">REST API</span>
              <span className="text-xs px-2 py-1 bg-theme-list-item rounded text-theme-secondary">WebSocket</span>
              <span className="text-xs px-2 py-1 bg-theme-list-item rounded text-theme-secondary">文件系统监视</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
