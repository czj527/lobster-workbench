"use client";

import { useState, useEffect } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface Project {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: string;
  progress?: number;
  current_phase?: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => Promise<void>;
  onDelete?: (projectId: string) => Promise<void>;
  project?: Project | null;
  mode: "create" | "edit";
}

const EMOJIS = ["📦", "🚀", "💡", "🎯", "📝", "🎨", "⚡", "🔥", "💎", "🌟", "🎮", "📱", "🖥️", "🤖", "🔮", "💼"];

const COLORS = [
  { value: "sky", label: "天蓝色", class: "bg-sky-500" },
  { value: "blue", label: "蓝色", class: "bg-blue-500" },
  { value: "purple", label: "紫色", class: "bg-purple-500" },
  { value: "green", label: "绿色", class: "bg-green-500" },
  { value: "amber", label: "琥珀", class: "bg-amber-500" },
  { value: "red", label: "红色", class: "bg-red-500" },
  { value: "pink", label: "粉色", class: "bg-pink-500" },
  { value: "cyan", label: "青色", class: "bg-cyan-500" },
];

const STATUSES = [
  { value: "planning", label: "规划中" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "paused", label: "已暂停" },
];

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  project,
  mode,
}: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("sky");
  const [status, setStatus] = useState("planning");
  const [currentPhase, setCurrentPhase] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setIcon(project.icon || "📦");
      setColor(project.color || "sky");
      setStatus(project.status || "planning");
      setCurrentPhase(project.current_phase || "");
    } else {
      setName("");
      setDescription("");
      setIcon("📦");
      setColor("sky");
      setStatus("planning");
      setCurrentPhase("");
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrors({ name: "名称不能为空" });
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        status,
        current_phase: currentPhase.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("保存项目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (error) {
      console.error("删除项目失败:", error);
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
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl glass-card p-4 md:p-6 animate-modal-enter">
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
              确定要删除项目「{project?.name}」吗？<br/>
              <span className="text-red-500 font-medium">警告：所有关联的任务也将被删除！</span>
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
              {mode === "create" ? "新建项目" : "编辑项目"}
            </h2>

            {/* 名称 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({});
                }}
                placeholder="输入项目名称"
                className={`w-full px-3 py-2.5 rounded-lg bg-theme-list-item border ${
                  errors.name ? "border-red-500" : "border-theme-border"
                } text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50`}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
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
                placeholder="添加项目描述..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-theme-list-item border border-theme-border text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50 resize-none"
              />
            </div>

            {/* 图标选择 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                图标
              </label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === emoji
                        ? "bg-theme-accent/20 ring-2 ring-theme-accent"
                        : "bg-theme-list-item hover:bg-theme-list-item-hover"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                颜色
              </label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      c.class
                    } ${
                      color === c.value ? "ring-2 ring-offset-2 ring-offset-theme-bg ring-white" : ""
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* 状态 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-theme-list-item border border-theme-border text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/50"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* 当前阶段 */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                当前阶段
              </label>
              <input
                type="text"
                value={currentPhase}
                onChange={(e) => setCurrentPhase(e.target.value)}
                placeholder="例如：需求分析、设计、开发..."
                className="w-full px-3 py-2.5 rounded-lg bg-theme-list-item border border-theme-border text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50"
              />
            </div>

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
