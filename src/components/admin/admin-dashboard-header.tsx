"use client"

import { DashboardGlobalSearch } from "@/components/dashboard-global-search"
import { cn } from "@/lib/utils"

interface AdminDashboardHeaderProps {
  children: React.ReactNode
  className?: string
  trailing?: React.ReactNode
}

export function AdminDashboardHeader({
  children,
  className,
  trailing,
}: AdminDashboardHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      <div className="flex shrink-0 items-center gap-2 pr-4">
        <DashboardGlobalSearch
          context="admin"
          collapsedWidth={260}
          expandedWidth={380}
        />
        {trailing}
      </div>
    </header>
  )
}
