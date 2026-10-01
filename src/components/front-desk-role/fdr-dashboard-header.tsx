"use client"

import FDRProfileDropdown from "@/components/front-desk-role/fdr-profile-dropdown"
import { FDRThemeToggle } from "@/components/front-desk-role/fdr-theme-toggle"
import { DashboardGlobalSearch } from "@/components/dashboard-global-search"

export function FdrDashboardHeader() {
  return (
    <header className="h-20 shrink-0 flex items-center justify-between px-6 gap-4 border-b border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-black">
      <DashboardGlobalSearch context="front-desk" />
      <div className="flex items-center gap-3">
        <FDRThemeToggle />
        <FDRProfileDropdown />
      </div>
    </header>
  )
}
