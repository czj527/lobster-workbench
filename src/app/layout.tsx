import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import AppShell from "@/components/AppShell";

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
            <AppShell>{children}</AppShell>
          </RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
