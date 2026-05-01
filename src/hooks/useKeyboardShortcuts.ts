"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onSearch?: () => void;
  onNewTask?: () => void;
  onExport?: () => void;
  onToggleHelp?: () => void;
}

interface ShortcutConfig {
  key: string;
  description: string;
  macDescription: string;
}

export const SHORTCUTS: ShortcutConfig[] = [
  { key: "⌘K / Ctrl+K", description: "Ctrl+K", macDescription: "⌘K", },
  { key: "⌘N / Ctrl+N", description: "Ctrl+N", macDescription: "⌘N", },
  { key: "⌘E / Ctrl+E", description: "Ctrl+E", macDescription: "⌘E", },
  { key: "?", description: "?", macDescription: "?", },
];

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + K: 打开搜索
      if (cmdKey && event.key === "k") {
        event.preventDefault();
        handlers.onSearch?.();
      }

      // Ctrl/Cmd + N: 新建任务
      if (cmdKey && event.key === "n") {
        event.preventDefault();
        handlers.onNewTask?.();
      }

      // Ctrl/Cmd + E: 导出报告
      if (cmdKey && event.key === "e") {
        event.preventDefault();
        handlers.onExport?.();
      }

      // ?: 显示快捷键帮助
      if (event.key === "?" && !event.target?.toString().includes("Input")) {
        event.preventDefault();
        handlers.onToggleHelp?.();
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
