"use client";

import { useState, useCallback } from "react";
import { Plus, AlertCircle, PlayCircle, Clock, CheckCircle2, GripVertical } from "lucide-react";
import TaskModal from "./TaskModal";
import { showToast } from "./Toast";

interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  due_date?: string;
  sort_order: number;
}

interface KanbanBoardProps {
  projectId: string;
  initialTasks: Task[];
}

const STATUS_CONFIG = {
  todo: {
    label: "📋 待办",
    shortLabel: "待办",
    icon: AlertCircle,
    color: "text-theme-muted",
    bg: "bg-slate-100 dark:bg-slate-500/20",
    borderColor: "border-slate-200 dark:border-slate-600",
  },
  in_progress: {
    label: "🔨 进行中",
    shortLabel: "进行中",
    icon: PlayCircle,
    color: "text-theme-accent",
    bg: "bg-sky-100 dark:bg-blue-500/20",
    borderColor: "border-sky-200 dark:border-blue-700",
  },
  testing: {
    label: "🔍 测试中",
    shortLabel: "测试中",
    icon: Clock,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/20",
    borderColor: "border-amber-200 dark:border-amber-700",
  },
  done: {
    label: "✅ 已完成",
    shortLabel: "已完成",
    icon: CheckCircle2,
    color: "text-green-500 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-500/20",
    borderColor: "border-green-200 dark:border-green-700",
  },
};

const PRIORITY_COLORS = {
  1: "border-l-red-500",
  2: "border-l-amber-500",
  3: "border-l-green-500",
};

export default function KanbanBoard({ projectId, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState("todo");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // 按状态分组任务
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo").sort((a, b) => a.sort_order - b.sort_order),
    in_progress: tasks.filter((t) => t.status === "in_progress").sort((a, b) => a.sort_order - b.sort_order),
    testing: tasks.filter((t) => t.status === "testing").sort((a, b) => a.sort_order - b.sort_order),
    done: tasks.filter((t) => t.status === "done").sort((a, b) => a.sort_order - b.sort_order),
  };

  // API 调用
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wotpzpegbgpqzxesqcas.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JGFZUvYJ3I7PB1n-bAD8Qw_AFBRVPVK";

  const apiCall = async (method: string, endpoint: string, body?: object) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      method,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return method === "DELETE" ? null : res.json();
  };

  // 创建任务
  const handleCreateTask = async (taskData: Partial<Task>) => {
    const { data: maxOrderData } = await fetch(
      `${supabaseUrl}/rest/v1/tasks?project_id=eq.${projectId}&status=eq.${taskData.status}&select=sort_order&order=sort_order.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    ).then((r) => r.json());

    const newSortOrder = maxOrderData?.[0]?.sort_order
      ? maxOrderData[0].sort_order + 1
      : 1;

    const result = await apiCall("POST", "tasks", {
      ...taskData,
      sort_order: newSortOrder,
    });

    if (result && result.length > 0) {
      setTasks((prev) => [...prev, result[0]]);
      showToast("任务创建成功", "success");
    }
  };

  // 更新任务
  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editTask?.id) return;

    const result = await apiCall("PATCH", `tasks?id=eq.${editTask.id}`, taskData);

    if (result && result.length > 0) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editTask.id ? { ...t, ...result[0] } : t))
      );
      showToast("任务已更新", "success");
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    await apiCall("DELETE", `tasks?id=eq.${taskId}`);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast("任务已删除", "success");
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    // 添加拖拽样式
    (e.target as HTMLElement).classList.add("opacity-50", "scale-95");
  };

  // 拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove("opacity-50", "scale-95");
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // 拖拽经过列
  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  // 拖拽离开列
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // 放置任务
  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask) return;

    const sourceStatus = draggedTask.status;
    
    // 计算目标列的 sort_order
    const targetTasks = tasks.filter((t) => t.status === targetStatus);
    const newSortOrder = targetTasks.length > 0 
      ? Math.max(...targetTasks.map((t) => t.sort_order)) + 1 
      : 1;

    // 更新本地状态
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTask.id
          ? { ...t, status: targetStatus, sort_order: newSortOrder }
          : t
      )
    );

    // 调用 API 更新
    try {
      await apiCall("PATCH", `tasks?id=eq.${draggedTask.id}`, {
        status: targetStatus,
        sort_order: newSortOrder,
      });

      if (sourceStatus !== targetStatus) {
        showToast(`任务已移至${STATUS_CONFIG[targetStatus as keyof typeof STATUS_CONFIG].shortLabel}`, "info");
      }
    } catch (error) {
      console.error("更新任务状态失败:", error);
      // 回滚
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask.id
            ? { ...t, status: sourceStatus }
            : t
        )
      );
      showToast("更新失败，请重试", "error");
    }
  };

  // 打开创建模态框
  const openCreateModal = (status: string) => {
    setEditTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  // 打开编辑模态框
  const openEditModal = (task: Task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  // 获取当前时间（用于判断截止日期是否临近）
  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 2;
  };

  return (
    <>
      <div className="flex overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 gap-3 md:gap-4 snap-x snap-mandatory scrollbar-hide">
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
          const config = STATUS_CONFIG[status];
          const columnTasks = tasksByStatus[status];
          const isDragOver = dragOverColumn === status;

          return (
            <div
              key={status}
              className={`glass-card p-3 md:p-4 flex-shrink-0 w-[280px] md:w-auto snap-center flex-1 min-w-[280px] transition-all ${
                isDragOver ? "ring-2 ring-theme-accent bg-theme-accent/5" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* 列头 */}
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className={`font-medium text-sm md:text-base ${config.color} flex items-center gap-1 md:gap-2`}>
                  <config.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="sm:hidden">{status === "in_progress" ? "进行中" : status === "testing" ? "测试中" : status === "done" ? "已完成" : "待办"}</span>
                </h3>
                <span className={`text-xs ${config.bg} ${config.color} px-1.5 md:px-2 py-0.5 md:py-1 rounded-full`}>
                  {columnTasks.length}
                </span>
              </div>

              {/* 任务列表 */}
              <div className="space-y-2 md:space-y-3 max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openEditModal(task)}
                      className={`glass p-3 md:p-4 rounded-lg cursor-pointer border-l-4 ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || "border-l-green-500"} hover:shadow-md transition-all group`}
                    >
                      {/* 拖拽手柄 */}
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-theme-muted opacity-0 group-hover:opacity-50 flex-shrink-0 mt-0.5 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary mb-2 break-words leading-relaxed">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-theme-muted line-clamp-2 mb-2 break-words">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs gap-2">
                            {task.due_date ? (
                              <span className={`flex items-center gap-1 truncate ${
                                isOverdue(task.due_date) ? "text-red-500" :
                                isDueSoon(task.due_date) ? "text-amber-500" :
                                "text-theme-muted"
                              }`}>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{task.due_date}</span>
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className={`flex-shrink-0 ${
                              task.priority === 1 ? "text-red-500" :
                              task.priority === 2 ? "text-amber-500" :
                              "text-green-500"
                            }`}>
                              {task.priority === 1 ? "🔴" : task.priority === 2 ? "🟡" : "🟢"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 md:py-8 text-theme-muted border-2 border-dashed border-theme-border rounded-lg">
                    <p className="text-xs md:text-sm">暂无任务</p>
                    <p className="text-xs mt-1 opacity-60">拖拽任务到此处</p>
                  </div>
                )}

                {/* 添加任务按钮 */}
                <button
                  onClick={() => openCreateModal(status)}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-theme-border hover:border-theme-accent hover:bg-theme-accent/5 transition-all flex items-center justify-center gap-2 text-theme-muted hover:text-theme-accent"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">新任务</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 任务模态框 */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={editTask ? handleUpdateTask : handleCreateTask}
        onDelete={editTask ? handleDeleteTask : undefined}
        projectId={projectId}
        defaultStatus={defaultStatus}
        task={editTask}
        mode={editTask ? "edit" : "create"}
      />
    </>
  );
}
