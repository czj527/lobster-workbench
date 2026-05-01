"use client";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function HamburgerMenu({ isOpen, onClick }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-[60] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl glass-card hover:bg-theme-list-item-hover transition-colors"
      aria-label={isOpen ? "关闭菜单" : "打开菜单"}
    >
      <div className="w-5 h-5 flex flex-col justify-center items-center space-y-1.5">
        <span
          className={`block w-5 h-0.5 bg-theme-primary transition-all duration-300 origin-center ${
            isOpen ? "rotate-45 translate-y-[4px]" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-theme-primary transition-all duration-300 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-theme-primary transition-all duration-300 origin-center ${
            isOpen ? "-rotate-45 -translate-y-[4px]" : ""
          }`}
        />
      </div>
    </button>
  );
}
