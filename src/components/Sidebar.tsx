"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderKanban, Sparkles } from "lucide-react";
import RealtimeIndicator from "./RealtimeIndicator";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", icon: Home, label: "仪表盘" },
    { href: "/projects", icon: FolderKanban, label: "所有项目" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // 移动端遮罩层
  const Overlay = () => (
    <div
      className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />
  );

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobile && <Overlay />}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 glass-sidebar z-50
          transition-transform duration-300 ease-in-out
          ${isMobile 
            ? isOpen 
              ? "translate-x-0" 
              : "-translate-x-full"
            : "translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo区域 */}
          <div className="p-4 md:p-6 border-b border-slate-200/30 dark:border-white/10">
            {/* 头像 */}
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="relative">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-sky-300 dark:border-blue-400 avatar-glow">
                  <img
                    src="/avatar.webp"
                    alt="蓝的头像"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 md:space-x-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-400 dark:from-blue-500 dark:to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-400/30 dark:shadow-blue-500/30">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-theme-primary">
                  蓝的工作台
                </h1>
                <p className="text-xs text-theme-accent">Blue Workbench</p>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-3 md:p-4">
            <ul className="space-y-1 md:space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`nav-link min-h-[44px] ${
                        isActive(link.href) ? "active" : ""
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 底部信息 */}
          <div className="p-3 md:p-4 border-t border-slate-200/30 dark:border-white/10">
            <div className="flex items-center justify-between">
              <RealtimeIndicator />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
