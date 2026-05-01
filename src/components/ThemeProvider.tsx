'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取主题偏好
    // 使用 try-catch 处理 Safari 隐私模式
    let savedTheme: Theme | null = null
    try {
      savedTheme = localStorage.getItem('blue-workbench-theme') as Theme
    } catch (e) {
      // Safari 隐私模式会抛出异常，忽略
      console.warn('localStorage not available:', e)
    }
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme)
    } else {
      // 默认使用亮色主题
      setTheme('light')
    }
    
    // 立即设置 data-theme 属性避免闪烁
    const root = document.documentElement
    const themeToApply = savedTheme && (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light'
    root.setAttribute('data-theme', themeToApply)
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme)
      try {
        localStorage.setItem('blue-workbench-theme', theme)
      } catch (e) {
        // Safari 隐私模式会抛出异常，忽略
        console.warn('localStorage write failed:', e)
      }
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
