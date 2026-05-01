"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Sidebar from "./Sidebar";
import HamburgerMenu from "./HamburgerMenu";
import NotificationCenter from "./NotificationCenter";
import ShortcutHelp from "./ShortcutHelp";
import ThemeToggle from "./ThemeToggle";
import Search from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isOpen, isMobile, close, toggle } = useSidebar();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // 键盘快捷键
  useKeyboardShortcuts({
    onSearch: () => setShowSearch(true),
    onToggleHelp: () => setShowShortcuts(true),
  });

  return (
    <div className="flex min-h-screen relative z-10">
      {/* 汉堡菜单按钮 */}
      <HamburgerMenu isOpen={isOpen} onClick={toggle} />
      
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* 移动端占位 */}
          <div className="w-10 md:hidden" />
        </div>
        
        <div className="flex items-center gap-2">
          {/* 快捷键提示 */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-theme-muted hover:text-theme-secondary hover:bg-theme-list-item rounded-lg transition-colors"
            title="键盘快捷键 (?)"
          >
            <kbd className="px-1.5 py-0.5 bg-theme-list-item rounded text-theme-secondary">?</kbd>
            <span>快捷键</span>
          </button>

          {/* 搜索按钮 */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-theme-muted hover:text-theme-secondary hover:bg-theme-list-item rounded-lg transition-colors md:w-40"
            title="搜索 (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">搜索...</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 bg-theme-list-item rounded text-theme-secondary ml-auto">
              ⌘K
            </kbd>
          </button>

          {/* 主题切换 */}
          <ThemeToggle />

          {/* 通知中心 */}
          <NotificationCenter />
        </div>
      </header>
      
      {/* 侧边栏 */}
      <Sidebar isOpen={isOpen} isMobile={isMobile} onClose={close} />
      
      {/* 主内容区 - 移动端ml-0，桌面端ml-64 */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isMobile ? "ml-0" : "ml-64"
        } p-4 md:p-6 lg:p-8 pt-20 md:pt-20`}
      >
        {children}
      </main>

      {/* 快捷键帮助面板 */}
      <ShortcutHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* 搜索面板（简化版，可后续扩展） */}
      {showSearch && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowSearch(false)}
          />
          <div className="fixed inset-x-4 top-20 max-w-xl mx-auto glass-card rounded-xl shadow-2xl z-50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-theme-accent" />
              <input
                type="text"
                placeholder="搜索任务、项目..."
                className="flex-1 bg-transparent text-theme-primary placeholder:text-theme-muted outline-none text-lg"
                autoFocus
              />
              <kbd className="px-2 py-1 text-xs bg-theme-list-item rounded text-theme-muted">Esc</kbd>
            </div>
            <p className="text-xs text-theme-muted text-center">搜索功能开发中，敬请期待...</p>
          </div>
        </>
      )}

      {/* 底部快捷键提示 */}
      <footer className="fixed bottom-4 right-4 hidden lg:flex items-center gap-2 px-3 py-2 glass-card rounded-lg text-xs text-theme-muted">
        <span>按</span>
        <kbd className="px-1.5 py-0.5 bg-theme-list-item rounded">?</kbd>
        <span>查看快捷键</span>
      </footer>
    </div>
  );
}
