import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "🦞 龙虾工作台",
  description: "可视化项目管理与任务追踪",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl mr-8">🦞</span>
                <div className="flex space-x-8">
                  <Link href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-indigo-500">
                    首页
                  </Link>
                  <Link href="/projects" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">
                    项目
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        {/* 主内容 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
