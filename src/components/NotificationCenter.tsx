"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, X, Clock, GitBranch, RefreshCw, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  content: string;
  type: string;
  created_at: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wotpzpegbgpqzxesqcas.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JGFZUvYJ3I7PB1n-bAD8Qw_AFBRVPVK";

  // 获取通知（从 activity_log 读取所有类型，但过滤出 info 类型的系统消息）
  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/activity_log?type=eq.info&order=created_at.desc&limit=20`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
        setUnreadCount(data?.length || 0); // 简化：所有未读
        
        // 新通知时触发摇晃动画
        if ((data?.length || 0) > prevCountRef.current && isOpen) {
          triggerShake();
        }
        prevCountRef.current = data?.length || 0;
      }
    } catch (error) {
      console.error("获取通知失败:", error);
    }
  };

  // 标记单个已读（通过从列表移除来模拟）
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // 全部已读
  const markAllAsRead = async () => {
    setUnreadCount(0);
    // 清空本地显示，实际数据保留在数据库
  };

  // 摇晃动画
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // 获取通知图标
  const getNotificationIcon = (content: string) => {
    if (content.includes("同步")) return <RefreshCw className="w-4 h-4 text-green-500" />;
    if (content.includes("GitHub")) return <GitBranch className="w-4 h-4 text-blue-500" />;
    if (content.includes("进度")) return <Clock className="w-4 h-4 text-amber-500" />;
    if (content.includes("错误")) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Bell className="w-4 h-4 text-theme-accent" />;
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 初始加载 + 定时刷新
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 铃铛按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg hover:bg-theme-list-item transition-colors ${
          shake ? "animate-bell-shake" : ""
        }`}
        title="通知"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-theme-accent" : "text-theme-secondary"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-[var(--text-primary)] rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 通知列表下拉 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] glass-card rounded-xl shadow-xl overflow-hidden z-50 animate-dropdown">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b border-theme-border">
            <h3 className="font-semibold text-theme-primary">通知中心</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-theme-accent hover:bg-theme-accent/10 rounded transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  全部已读
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-theme-list-item-hover rounded transition-colors"
              >
                <X className="w-4 h-4 text-theme-muted" />
              </button>
            </div>
          </div>

          {/* 通知列表 */}
          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-theme-muted text-sm">加载中...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-theme-muted/50 mb-2" />
                <p className="text-sm text-theme-muted">暂无通知</p>
              </div>
            ) : (
              <div className="divide-y divide-theme-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 hover:bg-theme-list-item/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.content)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-theme-primary">
                        {notification.content}
                      </p>
                      <p className="text-xs text-theme-muted mt-1">{formatTime(notification.created_at)}</p>
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="flex-shrink-0 p-1 hover:bg-theme-list-item-hover rounded transition-colors"
                      title="标记已读"
                    >
                      <Check className="w-4 h-4 text-theme-muted hover:text-theme-accent" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes bell-shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
        }
        .animate-bell-shake {
          animation: bell-shake 0.5s ease-in-out;
        }
        @keyframes dropdown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdown {
          animation: dropdown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
