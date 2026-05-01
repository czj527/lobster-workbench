"use client";

import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "./Sidebar";
import HamburgerMenu from "./HamburgerMenu";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, isMobile, close, toggle } = useSidebar();

  return (
    <div className="flex min-h-screen relative z-10">
      {/* 汉堡菜单按钮 */}
      <HamburgerMenu isOpen={isOpen} onClick={toggle} />
      
      {/* 侧边栏 */}
      <Sidebar isOpen={isOpen} isMobile={isMobile} onClose={close} />
      
      {/* 主内容区 - 移动端ml-0，桌面端ml-64 */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isMobile ? "ml-0" : "ml-64"
        } p-4 md:p-6 lg:p-8 pt-16 md:pt-8`}
      >
        {children}
      </main>
    </div>
  );
}
