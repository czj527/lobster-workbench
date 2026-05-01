"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, RefreshCw, Loader2 } from "lucide-react";

interface CalendarEvent {
  id: string;
  event_type: string;
  payload: { title: string; event_date: string; start_time: string; end_time?: string };
  source: string;
}

const eventTypeConfig: Record<string, { icon: typeof BookOpen; label: string; color: string }> = {
  study: { icon: BookOpen, label: "学习", color: "text-blue-500 bg-blue-500/20" },
  work: { icon: Clock, label: "工作", color: "text-amber-500 bg-amber-500/20" },
  sync: { icon: RefreshCw, label: "同步", color: "text-purple-500 bg-purple-500/20" },
};

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchEvents = async () => {
    setLoading(true); setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/calendar?date=${today}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) { console.error("获取日程失败:", err); setError("加载失败"); }
    finally { setLoading(false) }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 7 }) });
      const data = await res.json();
      if (data.success) await fetchEvents();
      else setError(data.error || "同步失败");
    } catch (err) { console.error("同步日历失败:", err); setError("同步失败"); }
    finally { setSyncing(false) }
  };

  useEffect(() => { fetchEvents() }, []);

  const eventsByDate = events.reduce((acc, event) => {
    const date = event.payload.event_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === today.toISOString().split("T")[0]) return "今天";
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "明天";
    return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", weekday: "short" });
  };

  if (loading) return <div className="glass-card p-4"><div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-theme-accent" /><h3 className="text-sm font-medium text-theme-primary">今日日程</h3></div><div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-skeleton rounded animate-pulse" />)}</div></div>

  if (error) return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-theme-accent" /><h3 className="text-sm font-medium text-theme-primary">今日日程</h3></div>
        <button onClick={handleSync} disabled={syncing} className="p-1 hover:bg-theme-list-item rounded disabled:opacity-50"><RefreshCw className={`w-3 h-3 text-theme-muted ${syncing ? 'animate-spin' : ''}`} /></button>
      </div>
      <p className="text-xs text-red-500 text-center py-4">{error}</p>
    </div>
  );

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-theme-accent" /><h3 className="text-sm font-medium text-theme-primary">今日日程</h3></div>
        <div className="flex items-center gap-1">
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1 px-2 py-1 text-xs bg-theme-accent/10 hover:bg-theme-accent/20 rounded transition-colors disabled:opacity-50">
            {syncing ? <><Loader2 className="w-3 h-3 animate-spin text-theme-accent" /><span className="text-theme-accent">同步中</span></> : <><RefreshCw className="w-3 h-3 text-theme-accent" /><span className="text-theme-accent">同步</span></>}
          </button>
          <button onClick={fetchEvents} className="p-1 hover:bg-theme-list-item rounded transition-colors" title="刷新"><RefreshCw className="w-3 h-3 text-theme-muted hover:text-theme-accent" /></button>
        </div>
      </div>
      {Object.keys(eventsByDate).length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-theme-muted mb-2">暂无日程安排</p>
          <button onClick={handleSync} disabled={syncing} className="text-xs text-theme-accent hover:underline disabled:opacity-50">{syncing ? '同步中...' : '点击从蓝的日历同步'}</button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {Object.entries(eventsByDate).map(([date, dayEvents]) => (
            <div key={date}>
              <div className="text-xs font-medium text-theme-secondary mb-2 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(date)}</div>
              <div className="space-y-1.5">
                {dayEvents.map((event) => {
                  const config = eventTypeConfig[event.event_type] || eventTypeConfig.sync;
                  return (
                    <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg bg-theme-list-item hover:bg-theme-list-item-hover transition-colors">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${config.color} flex-shrink-0`}>{config.label}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-theme-primary truncate">{event.payload.title}</p>
                        <p className="text-xs text-theme-muted">{event.payload.start_time}{event.payload.end_time && ` - ${event.payload.end_time}`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
