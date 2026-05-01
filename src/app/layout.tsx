import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Home, FolderKanban, Activity, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "💙 蓝的工作台",
  description: "可视化项目管理与任务追踪",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* 粒子背景 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="particles"></div>
        </div>
        
        <div className="flex min-h-screen relative z-10">
          {/* 侧边栏 */}
          <aside className="fixed left-0 top-0 h-full w-64 glass-sidebar">
            <div className="flex flex-col h-full">
              {/* Logo区域 */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">蓝的工作台</h1>
                    <p className="text-xs text-blue-300/70">Blue Workbench</p>
                  </div>
                </div>
              </div>
              
              {/* 导航菜单 */}
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="nav-link">
                      <Home className="w-5 h-5" />
                      <span>仪表盘</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects" className="nav-link">
                      <FolderKanban className="w-5 h-5" />
                      <span>所有项目</span>
                    </Link>
                  </li>
                </ul>
              </nav>
              
              {/* 底部信息 */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center space-x-2 text-blue-300/50 text-xs">
                  <Activity className="w-4 h-4" />
                  <span>实时同步中</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              </div>
            </div>
          </aside>
          
          {/* 主内容区 */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
