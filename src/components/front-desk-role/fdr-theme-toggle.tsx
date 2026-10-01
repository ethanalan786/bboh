"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function FDRThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-[#f2f1ec] dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] hover:bg-[#f7f6f1] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-[#668e2b]" />
      ) : (
        <Moon size={18} className="text-gray-600" />
      )}
    </button>
  );
}