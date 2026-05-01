'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 防止 hydration mismatch - 在客户端挂载前显示占位符
  if (!mounted) {
    return (
      <div className="p-2 rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px]">
        <div className="w-5 h-5" />
      </div>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-300 hover:bg-theme-list-item-hover flex items-center justify-center min-w-[44px] min-h-[44px]"
      style={{ color: 'var(--nav-text)' }}
      title={theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'}
      aria-label={theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  )
}
