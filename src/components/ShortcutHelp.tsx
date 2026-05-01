"use client";

import { X, Search, FileText, Download, Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcutActions = [
  { icon: Search, label: "打开搜索", keys: ["Ctrl+K", "⌘K"] },
  { icon: FileText, label: "新建任务", keys: ["Ctrl+N", "⌘N"] },
  { icon: Download, label: "导出项目报告", keys: ["Ctrl+E", "⌘E"] },
  { icon: Keyboard, label: "显示快捷键帮助", keys: ["?"] },
];

export default function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  if (!isOpen) return null;

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-theme-border">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-theme-accent" />
              <h2 className="text-lg font-semibold text-theme-primary">键盘快捷键</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-theme-list-item rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-theme-muted" />
            </button>
          </div>

          {/* 快捷键列表 */}
          <div className="p-4 space-y-2">
            {shortcutActions.map((action, index) => {
              const Icon = action.icon;
              const displayKeys = isMac ? action.keys : action.keys.slice(0, 1);
              const isSingle = displayKeys.length === 1;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-theme-list-item hover:bg-theme-list-item-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-theme-accent" />
                    <span className="text-sm text-theme-primary">{action.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {displayKeys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          isSingle
                            ? "bg-theme-accent/20 text-theme-accent"
                            : "bg-theme-bg text-theme-secondary"
                        } border border-theme-border`}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div className="px-4 pb-4">
            <p className="text-xs text-theme-muted text-center">
              按 <kbd className="px-1.5 py-0.5 bg-theme-list-item rounded text-theme-secondary">Esc</kbd> 关闭
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal {
          animation: modal 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
