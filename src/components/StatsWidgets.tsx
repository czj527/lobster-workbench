"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsData {
  weekCompleted: number;
  overdueTasks: number;
  taskDistribution: {
    todo: number;
    in_progress: number;
    testing: number;
    done: number;
  };
}

interface StatsWidgetsProps {
  projectId?: string;
}

export default function StatsWidgets({ projectId }: StatsWidgetsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [projectId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wotpzpegbgpqzxesqcas.supabase.co";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JGFZUvYJ3I7PB1n-bAD8Qw_AFBRVPVK";

      // 获取本周完成的任务
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      let tasksUrl = `${supabaseUrl}/rest/v1/tasks?select=*&status=eq.done&updated_at=gte.${weekAgo.toISOString()}`;
      if (projectId) {
        tasksUrl += `&project_id=eq.${projectId}`;
      }

      const tasksRes = await fetch(tasksUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      const completedTasks = await tasksRes.json();

      // 获取逾期任务
      const today = new Date().toISOString().split("T")[0];
      let overdueUrl = `${supabaseUrl}/rest/v1/tasks?select=*&due_date=lt.${today}&status=not.eq.done`;
      if (projectId) {
        overdueUrl += `&project_id=eq.${projectId}`;
      }

      const overdueRes = await fetch(overdueUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      const overdueTasks = await overdueRes.json();

      // 获取任务分布
      let distUrl = `${supabaseUrl}/rest/v1/tasks?select=status`;
      if (projectId) {
        distUrl += `&project_id=eq.${projectId}`;
      }

      const distRes = await fetch(distUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      const allTasks = await distRes.json();

      const distribution = { todo: 0, in_progress: 0, testing: 0, done: 0 };
      allTasks.forEach((t: { status: string }) => {
        if (distribution.hasOwnProperty(t.status)) {
          distribution[t.status as keyof typeof distribution]++;
        }
      });

      setStats({
        weekCompleted: Array.isArray(completedTasks) ? completedTasks.length : 0,
        overdueTasks: Array.isArray(overdueTasks) ? overdueTasks.length : 0,
        taskDistribution: distribution,
      });
    } catch (err) {
      console.error("获取统计数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card p-4 h-24">
            <div className="h-full bg-skeleton rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const totalTasks = stats
    ? stats.taskDistribution.todo +
      stats.taskDistribution.in_progress +
      stats.taskDistribution.testing +
      stats.taskDistribution.done
    : 0;

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{stats?.weekCompleted || 0}</div>
            <div className="text-xs text-theme-secondary">本周完成</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{stats?.overdueTasks || 0}</div>
            <div className="text-xs text-theme-secondary">逾期任务</div>
          </div>
        </div>
      </div>

      {/* 任务分布饼图 - CSS实现 */}
      {totalTasks > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-medium text-theme-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-theme-accent" />
            任务分布
          </h4>
          <div className="flex items-center gap-4">
            {/* 饼图 */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const segments = [
                    { key: "todo", color: "#64748b", value: stats?.taskDistribution.todo || 0 },
                    { key: "in_progress", color: "#3b82f6", value: stats?.taskDistribution.in_progress || 0 },
                    { key: "testing", color: "#f59e0b", value: stats?.taskDistribution.testing || 0 },
                    { key: "done", color: "#22c55e", value: stats?.taskDistribution.done || 0 },
                  ];

                  let cumulativePercent = 0;
                  return segments.map((seg, idx) => {
                    if (seg.value === 0) return null;
                    const percent = seg.value / totalTasks;
                    const dashArray = `${percent * 100} ${100 - percent * 100}`;
                    const dashOffset = -cumulativePercent * 100;
                    cumulativePercent += percent;
                    return (
                      <circle
                        key={seg.key}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="4"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-theme-primary">{totalTasks}</span>
              </div>
            </div>

            {/* 图例 */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-theme-secondary">待办</span>
                </span>
                <span className="font-medium text-theme-primary">
                  {stats?.taskDistribution.todo || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-theme-secondary">进行中</span>
                </span>
                <span className="font-medium text-theme-primary">
                  {stats?.taskDistribution.in_progress || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-theme-secondary">测试中</span>
                </span>
                <span className="font-medium text-theme-primary">
                  {stats?.taskDistribution.testing || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-theme-secondary">已完成</span>
                </span>
                <span className="font-medium text-theme-primary">
                  {stats?.taskDistribution.done || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
