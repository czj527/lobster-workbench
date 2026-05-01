"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban, Clock, CheckCircle2, Pencil, Loader2, Search, Filter, X, Download, FileText } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import ProjectModal from "./ProjectModal";
import { showToast, ToastContainer } from "./Toast";
import StatsWidgets from "./StatsWidgets";
import AISummary from './AISummary';
import TaskSuggestions from './TaskSuggestions';
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: string;
  progress: number;
  current_phase?: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  due_date?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ProjectDetailClientProps {
  project: Project;
  initialTasks: Task[];
}

const statusMap: Record<string, string> = {
  planning: "规划中",
  in_progress: "进行中",
  completed: "已完成",
  paused: "已暂停",
};

const priorityFilters = [
  { value: "all", label: "全部优先级" },
  { value: "1", label: "🔴 高优先级" },
  { value: "2", label: "🟡 中优先级" },
  { value: "3", label: "🟢 低优先级" },
];

export default function ProjectDetailClient({ project: initialProject, initialTasks }: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wotpzpegbgpqzxesqcas.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JGFZUvYJ3I7PB1n-bAD8Qw_AFBRVPVK";

  // 导出报告
  const handleExportReport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/reports?project_id=${project.id}`);
      if (!response.ok) throw new Error("导出失败");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${project.name}-report.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast("报告导出成功", "success");
    } catch (error) {
      console.error("导出报告失败:", error);
      showToast("导出失败，请重试", "error");
    } finally {
      setExporting(false);
    }
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    onExport: handleExportReport,
  });

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

  // 计算进度
  const calculateProgress = (taskList: Task[]) => {
    if (taskList.length === 0) return 0;
    const doneCount = taskList.filter((t) => t.status === "done").length;
    return Math.round((doneCount / taskList.length) * 100);
  };

  // 更新项目进度
  const updateProjectProgress = async (taskList: Task[]) => {
    const newProgress = calculateProgress(taskList);
    if (newProgress !== project.progress) {
      try {
        await apiCall("PATCH", `projects?id=eq.${project.id}`, { progress: newProgress });
        setProject((prev) => ({ ...prev, progress: newProgress }));
      } catch (error) {
        console.error("更新进度失败:", error);
      }
    }
  };

  // 监听 tasks 变化更新进度
  useEffect(() => {
    updateProjectProgress(tasks);
  }, [tasks]);

  // 创建项目
  const handleCreateProject = async (projectData: Partial<Project>) => {
    const result = await apiCall("POST", "projects", projectData);
    if (result && result.length > 0) {
      showToast("项目创建成功", "success");
      window.location.href = `/projects/${result[0].id}`;
    }
  };

  // 更新项目
  const handleUpdateProject = async (projectData: Partial<Project>) => {
    const result = await apiCall("PATCH", `projects?id=eq.${project.id}`, projectData);
    if (result && result.length > 0) {
      setProject((prev) => ({ ...prev, ...result[0] }));
      showToast("项目已更新", "success");
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    setLoading(true);
    try {
      // 先删除所有关联任务
      await apiCall("DELETE", `tasks?project_id=eq.${projectId}`);
      // 再删除项目
      await apiCall("DELETE", `projects?id=eq.${projectId}`);
      showToast("项目已删除", "success");
      window.location.href = "/projects";
    } catch (error) {
      console.error("删除项目失败:", error);
      showToast("删除失败，请重试", "error");
    } finally {
      setLoading(false);
    }
  };

  // 筛选后的任务
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesPriority = priorityFilter === "all" || task.priority.toString() === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // 清除筛选
  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || priorityFilter !== "all";

  // 进度环计算
  const progressAngle = (project.progress / 100) * 360;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progressAngle / 360) * circumference;

  // 优先级标签
  const priorityLabels: Record<number, { label: string; color: string }> = {
    1: { label: "高", color: "text-red-500 bg-red-500/20" },
    2: { label: "中", color: "text-amber-500 bg-amber-500/20" },
    3: { label: "低", color: "text-green-500 bg-green-500/20" },
  };

  // 状态图标
  const statusIcons: Record<string, React.ReactNode> = {
    todo: <Clock className="w-4 h-4 text-slate-500" />,
    in_progress: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    testing: <Clock className="w-4 h-4 text-amber-500" />,
    done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  };

  return (
    <>
      <div className="space-y-6 md:space-y-8 page-enter">
        {/* 返回链接和标题 */}
        <div>
          <Link href="/projects" className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary mb-3 md:mb-4 transition-colors text-sm md:text-base">
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </Link>
          
          <div className="glass-card p-4 md:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-sky-400/30 to-cyan-400/30 dark:from-blue-500/30 dark:to-purple-500/30 flex items-center justify-center text-3xl md:text-5xl backdrop-blur-sm">
                  {project.icon || "📦"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-theme-primary">{project.name}</h1>
                    {/* 编辑按钮 */}
                    <button
                      onClick={() => setProjectModalOpen(true)}
                      className="p-2 rounded-lg hover:bg-theme-list-item transition-colors text-theme-muted hover:text-theme-primary"
                      title="编辑项目"
                    >
                      <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                  <p className="text-sm md:text-base text-theme-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {project.current_phase || "未开始"}
                  </p>
                  <span className={`inline-block mt-2 md:mt-3 text-xs md:text-sm px-3 md:px-4 py-1 rounded-full ${
                    project.status === "in_progress" 
                      ? "tag-success status-active" 
                      : project.status === "planning"
                      ? "tag-info"
                      : project.status === "completed"
                      ? "tag-success"
                      : "tag-warning"
                  }`}>
                    {statusMap[project.status] || project.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* 导出报告按钮 */}
                <button
                  onClick={handleExportReport}
                  disabled={exporting}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent rounded-lg transition-colors disabled:opacity-50"
                  title="导出报告 (Ctrl+E)"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">导出报告</span>
                </button>

                {/* 进度环 */}
                <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0">
                  <svg className="progress-ring w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="rgba(148,163,184,0.2)"
                      strokeWidth="5"
                      className="md:hidden"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      fill="none"
                      stroke="rgba(148,163,184,0.2)"
                      strokeWidth="6"
                      className="hidden md:block"
                    />
                    <circle
                      className="progress-ring-circle"
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 35}
                      strokeDashoffset={2 * Math.PI * 35 - (progressAngle / 360) * 2 * Math.PI * 35}
                      style={{ display: "none" }}
                    />
                    <circle
                      className="progress-ring-circle hidden md:block"
                      cx="56"
                      cy="56"
                      r="50"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--progress-start)" />
                        <stop offset="50%" stopColor="var(--progress-mid)" />
                        <stop offset="100%" stopColor="var(--progress-end)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold gradient-text">{project.progress}%</div>
                      <div className="text-[10px] md:text-xs text-theme-muted hidden md:block">完成度</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计和图表 */}
        <StatsWidgets projectId={project.id} />

        {/* 任务看板/列表 */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-theme-primary flex items-center gap-2">
              <FolderKanban className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
              任务列表
              <span className="text-sm font-normal text-theme-muted">({filteredTasks.length})</span>
            </h2>
            
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-muted" />
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 sm:w-40 pl-8 pr-3 py-1.5 text-xs bg-theme-list-item border border-theme-border rounded-lg text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-accent/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-theme-list-item-hover rounded"
                  >
                    <X className="w-3 h-3 text-theme-muted" />
                  </button>
                )}
              </div>
              
              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  showFilters || priorityFilter !== "all"
                    ? "bg-theme-accent/20 border-theme-accent text-theme-accent"
                    : "bg-theme-list-item border-theme-border text-theme-secondary hover:text-theme-primary"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-2 py-1.5 text-xs text-theme-muted hover:text-theme-primary flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 筛选标签 */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 glass-card">
              {priorityFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setPriorityFilter(filter.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    priorityFilter === filter.value
                      ? "bg-theme-accent text-white"
                      : "bg-theme-list-item text-theme-secondary hover:text-theme-primary"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
          
          <KanbanBoard
            projectId={project.id}
            initialTasks={filteredTasks}
          />
        </div>

        {/* AI 摘要和智能建议 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AISummary projectId={project.id} projectName={project.name} />
          <TaskSuggestions projectId={project.id} />
        </div>

        {/* 项目描述 */}
        {project.description && (
          <div className="glass-card p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-theme-primary mb-3 md:mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-theme-accent" />
              项目描述
            </h2>
            <p className="text-sm md:text-base text-theme-secondary whitespace-pre-wrap leading-relaxed break-words">{project.description}</p>
          </div>
        )}
        
        {/* 更新时间 */}
        <div className="text-center text-xs md:text-sm text-theme-muted">
          最后更新: {new Date(project.updated_at).toLocaleString("zh-CN")}
        </div>
      </div>

      {/* 项目编辑模态框 */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleUpdateProject}
        onDelete={handleDeleteProject}
        project={project}
        mode="edit"
      />

      {/* Toast 通知 */}
      <ToastContainer />
    </>
  );
}
