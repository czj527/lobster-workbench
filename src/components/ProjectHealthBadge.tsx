"use client";

import { useState, useEffect } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface ProjectHealthBadgeProps {
  projectId: string;
  updatedAt: string;
}

interface HealthData {
  overdueTasks: number;
  totalTasks: number;
  lastActivity: string;
}

export default function ProjectHealthBadge({ projectId, updatedAt }: ProjectHealthBadgeProps) {
  const [health, setHealth] = useState<"good" | "warning" | "critical" | "inactive">("good");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, [projectId]);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wotpzpegbgpqzxesqcas.supabase.co";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JGFZUvYJ3I7PB1n-bAD8Qw_AFBRVPVK";

      // 获取逾期任务
      const today = new Date().toISOString().split("T")[0];
      const overdueRes = await fetch(
        `${supabaseUrl}/rest/v1/tasks?project_id=eq.${projectId}&due_date=lt.${today}&status=not.eq.done`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const overdueTasks = await overdueRes.json();
      const overdueCount = Array.isArray(overdueTasks) ? overdueTasks.length : 0;

      // 获取总任务数
      const totalRes = await fetch(
        `${supabaseUrl}/rest/v1/tasks?project_id=eq.${projectId}&select=id`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const allTasks = await totalRes.json();
      const totalCount = Array.isArray(allTasks) ? allTasks.length : 0;

      // 判断健康状态
      let status: "good" | "warning" | "critical" | "inactive" = "good";
      
      if (totalCount === 0) {
        status = "inactive";
      } else if (overdueCount > 3) {
        status = "critical";
      } else if (overdueCount > 0) {
        status = "warning";
      } else {
        // 检查最后活动时间
        const lastActivity = new Date(updatedAt);
        const daysSinceUpdate = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 14) {
          status = "inactive";
        }
      }

      setHealth(status);
    } catch (err) {
      console.error("获取项目健康状态失败:", err);
      setHealth("good");
    } finally {
      setLoading(false);
    }
  };

  const config = {
    good: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/20", label: "健康" },
    warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/20", label: "注意" },
    critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/20", label: "危险" },
    inactive: { icon: Clock, color: "text-[var(--text-muted)]", bg: "bg-[var(--list-item-bg)]", label: "闲置" },
  };

  const { icon: Icon, color, bg, label } = config[health];

  if (loading) {
    return <div className="w-6 h-6 bg-skeleton rounded-full animate-pulse" />;
  }

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${bg} ${color} text-xs`}
      title={`项目健康状态: ${label}`}
    >
      <Icon className="w-3 h-3" />
      <span className="font-medium">{label}</span>
    </div>
  );
}
