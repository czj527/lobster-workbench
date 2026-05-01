"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban, Clock, TrendingUp, Plus, Pencil, Trash2, Search, Filter, X } from "lucide-react";
import ProjectModal from "./ProjectModal";
import { showToast, ToastContainer } from "./Toast";
import ProjectHealthBadge from "./ProjectHealthBadge";

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

interface ProjectsListClientProps {
  initialProjects: Project[];
}

const statusMap: Record<string, string> = {
  planning: "规划中",
  in_progress: "进行中",
  completed: "已完成",
  paused: "已暂停",
};

const statusFilters = [
  { value: "all", label: "全部" },
  { value: "in_progress", label: "进行中" },
  { value: "planning", label: "规划中" },
  { value: "paused", label: "已暂停" },
  { value: "completed", label: "已完成" },
];

export default function ProjectsListClient({ initialProjects }: ProjectsListClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // 计算统计数据
  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
      : 0,
  };

  // 过滤项目
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 创建项目
  const handleCreateProject = async (projectData: Partial<Project>) => {
    const result = await apiCall("POST", "projects", {
      ...projectData,
      progress: 0,
    });
    if (result && result.length > 0) {
      setProjects((prev) => [result[0], ...prev]);
      showToast("项目创建成功", "success");
      setProjectModalOpen(false);
    }
  };

  // 更新项目
  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!editingProject) return;
    const result = await apiCall("PATCH", `projects?id=eq.${editingProject.id}`, projectData);
    if (result && result.length > 0) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, ...result[0] } : p))
      );
      showToast("项目已更新", "success");
      setEditingProject(null);
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    try {
      // 先删除所有关联任务
      await apiCall("DELETE", `tasks?project_id=eq.${projectId}`);
      // 再删除项目
      await apiCall("DELETE", `projects?id=eq.${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast("项目已删除", "success");
      setEditingProject(null);
    } catch (error) {
      console.error("删除项目失败:", error);
      showToast("删除失败，请重试", "error");
    }
  };

  // 打开编辑模态框
  const openEditModal = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
  };

  // 清除筛选
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  return (
    <>
      <div className="space-y-6 md:space-y-8 page-enter">
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary mb-3 md:mb-4 transition-colors text-sm md:text-base">
              <ArrowLeft className="w-4 h-4" />
              返回仪表盘
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-theme-primary flex items-center gap-2 md:gap-3">
              <FolderKanban className="w-6 h-6 md:w-8 md:h-8 text-theme-accent" />
              所有项目
            </h1>
            <p className="text-sm md:text-base text-theme-secondary mt-1">
              共 {stats.total} 个项目，平均进度 {stats.avgProgress}%
            </p>
          </div>
          
          {/* 新建项目按钮 */}
          <button
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-theme-accent text-white hover:opacity-90 transition-opacity flex items-center gap-2 self-start"
          >
            <Plus className="w-5 h-5" />
            新建项目
          </button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="glass-card p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-sky-500/20 dark:bg-blue-500/20 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 md:w-5 md:h-5 text-theme-accent" />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold stat-number">{stats.total}</div>
              <div className="text-xs text-theme-secondary">项目总数</div>
            </div>
          </div>
          
          <div className="glass-card p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-green-500 dark:text-green-400">{stats.inProgress}</div>
              <div className="text-xs text-theme-secondary">进行中</div>
            </div>
          </div>
          
          <div className="col-span-2 md:col-span-1 glass-card p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-emerald-500 dark:text-emerald-400">{stats.completed}</div>
              <div className="text-xs text-theme-secondary">已完成</div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="glass-card p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="搜索项目名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-theme-list-item border border-theme-border rounded-lg text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-theme-list-item-hover rounded"
                >
                  <X className="w-3 h-3 text-theme-muted" />
                </button>
              )}
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${
                  showFilters || statusFilter !== "all"
                    ? "bg-theme-accent/20 border-theme-accent text-theme-accent"
                    : "bg-theme-list-item border-theme-border text-theme-secondary hover:text-theme-primary"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs text-theme-muted hover:text-theme-primary flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 筛选标签 */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-theme-border">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    statusFilter === filter.value
                      ? "bg-theme-accent text-white"
                      : "bg-theme-list-item text-theme-secondary hover:text-theme-primary"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 项目数量提示 */}
        <div className="text-sm text-theme-secondary">
          显示 {filteredProjects.length} 个项目
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <div key={project.id} className="relative group">
                <Link href={`/projects/${project.id}`}>
                  <div 
                    className="glass-card p-4 md:p-6 cursor-pointer card-glow h-full"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 md:mb-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-sky-400/30 to-cyan-400/30 dark:from-blue-500/30 dark:to-purple-500/30 flex items-center justify-center text-2xl md:text-3xl backdrop-blur-sm">
                          {project.icon || "📦"}
                        </div>
                        <div>
                          <h2 className="font-semibold text-base md:text-lg text-theme-primary">{project.name}</h2>
                          <p className="text-xs md:text-sm text-theme-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {project.current_phase || "未开始"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProjectHealthBadge projectId={project.id} updatedAt={project.updated_at} />
                        <span className={`text-xs px-2 md:px-3 py-1 rounded-full self-start ${
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
                    
                    <p className="text-sm text-theme-secondary mb-4 md:mb-5 line-clamp-2">
                      {project.description || "暂无描述"}
                    </p>
                    
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-theme-muted">进度</span>
                        <span className="text-theme-primary font-medium">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 md:h-3 bg-[var(--list-item-bg)] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full progress-gradient"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* 编辑按钮 */}
                <button
                  onClick={(e) => openEditModal(project, e)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-theme-list-item transition-colors text-theme-muted hover:text-theme-primary opacity-0 group-hover:opacity-100"
                  title="编辑项目"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full glass-card p-10 md:p-16 text-center">
              <div className="text-5xl md:text-6xl mb-3 md:mb-4">💙</div>
              <p className="text-lg md:text-xl text-theme-primary mb-2">
                {hasActiveFilters ? "未找到匹配的项目" : "暂无项目"}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-theme-accent hover:underline"
                >
                  清除筛选条件
                </button>
              ) : (
                <p className="text-sm md:text-base text-theme-muted mb-4">点击上方按钮创建第一个项目</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 项目模态框 */}
      <ProjectModal
        isOpen={projectModalOpen || editingProject !== null}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={editingProject ? handleUpdateProject : handleCreateProject}
        onDelete={editingProject ? handleDeleteProject : undefined}
        project={editingProject}
        mode={editingProject ? "edit" : "create"}
      />

      {/* Toast 通知 */}
      <ToastContainer />
    </>
  );
}
