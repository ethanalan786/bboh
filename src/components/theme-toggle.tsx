"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <HugeiconsIcon icon={Sun} className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
      ) : (
        <HugeiconsIcon icon={Moon} className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
      )}
    </button>
  )
}