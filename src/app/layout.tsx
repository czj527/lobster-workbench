import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Home, FolderKanban, Activity, Sparkles } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import RealtimeIndicator from "@/components/RealtimeIndicator";
import ThemeToggle from "@/components/ThemeToggle";

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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-colors duration-500">
        {/* 粒子背景 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="particles"></div>
        </div>
        
        <ThemeProvider>
          <RealtimeProvider>
            <div className="flex min-h-screen relative z-10">
              {/* 侧边栏 */}
              <aside className="fixed left-0 top-0 h-full w-64 glass-sidebar">
                <div className="flex flex-col h-full">
                  {/* Logo区域 */}
                  <div className="p-6 border-b border-white/10 dark:border-white/10 border-sky-200/30">
                    {/* 头像 */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-sky-300 dark:border-blue-400 avatar-glow">
                          <img 
                            src="/avatar.webp" 
                            alt="蓝的头像" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-400 dark:from-blue-500 dark:to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-400/30 dark:shadow-blue-500/30">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-slate-700 dark:text-white">蓝的工作台</h1>
                        <p className="text-xs text-sky-600 dark:text-blue-300/70">Blue Workbench</p>
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
                  <div className="p-4 border-t border-white/10 dark:border-white/10 border-sky-200/30">
                    <div className="flex items-center justify-between">
                      <RealtimeIndicator />
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </aside>
              
              {/* 主内容区 */}
              <main className="flex-1 ml-64 p-8">
                {children}
              </main>
            </div>
          </RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
