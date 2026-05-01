"use client";

import { useState, useEffect } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface Task {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  due_date?: string;
  sort_order?: number;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  projectId: string;
  defaultStatus?: string;
  task?: Task | null;
  mode: "create" | "edit";
}

const PRIORITIES = [
  { value: 1, label: "高", color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20", border: "border-l-red-500" },
  { value: 2, label: "中", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20", border: "border-l-amber-500" },
  { value: 3, label: "低", color: "text-green-500", bg: "bg-green-100 dark:bg-green-500/20", border: "border-l-green-500" },
];

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  projectId,
  defaultStatus = "todo",
  task,
  mode,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || 2);
      setDueDate(task.due_date || "");
      setStatus(task.status || defaultStatus);
    } else {
      setTitle("");
      setDescription("");
      setPriority(2);
      setDueDate("");
      setStatus(defaultStatus);
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [task, defaultStatus, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrors({ title: "标题不能为空" });
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        status,
        project_id: projectId,
      });
      onClose();
    } catch (error) {
      console.error("保存任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (error) {
      console.error("删除任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框 */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl glass-card p-4 md:p-6 animate-modal-enter">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-theme-list-item transition-colors"
        >
          <X className="w-5 h-5 text-theme-muted" />
        </button>

        {showDeleteConfirm ? (
          /* 删除确认 */
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">确认删除</h2>
            </div>
            <p className="text-theme-secondary">
              确定要删除任务「{task?.title}」吗？此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-theme-border text-theme-primary hover:bg-theme-list-item transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "确认删除"}
              </button>
            </div>
          </div>
        ) : (
          /* 表单 */
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-theme-primary pr-8">
              {mode === "create" ? "新建任务" : "编辑任务"}
            </h2>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({});
                }}
                placeholder="输入任务标题"
                className={`w-full px-3 py-2.5 rounded-lg bg-theme-list-item border ${
                  errors.title ? "border-red-500" : "border-theme-border"
                } text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50`}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加任务描述..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-theme-list-item border border-theme-border text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50 resize-none"
              />
            </div>

            {/* 优先级 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                优先级
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                      priority === p.value
                        ? `${p.bg} ${p.color} border-current`
                        : "bg-theme-list-item border-theme-border text-theme-secondary hover:border-theme-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 截止日期 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-theme-list-item border border-theme-border text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/50"
              />
            </div>

            {/* 状态 */}
            {mode === "edit" && (
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                  状态
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-theme-list-item border border-theme-border text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/50"
                >
                  <option value="todo">📋 待办</option>
                  <option value="in_progress">🔨 进行中</option>
                  <option value="testing">🔍 测试中</option>
                  <option value="done">✅ 已完成</option>
                </select>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
              <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-theme-border text-theme-primary hover:bg-theme-list-item transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-theme-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "create" ? "创建" : "保存"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
