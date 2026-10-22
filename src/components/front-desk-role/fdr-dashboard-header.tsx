"use client"

import FDRProfileDropdown from "@/components/front-desk-role/fdr-profile-dropdown"
import { FDRThemeToggle } from "@/components/front-desk-role/fdr-theme-toggle"
import { DashboardGlobalSearch } from "@/components/dashboard-global-search"
import { GooeyInput } from "@/components/ui/gooey-input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export interface FdrDashboardHeaderProps {
  /** Custom placeholder for the search input */
  placeholder?: string
  /** Use the advanced DashboardGlobalSearch component instead of basic GooeyInput */
  useGlobalSearch?: boolean
  /** Show mobile sidebar trigger button */
  showSidebarTrigger?: boolean
  /** Comma-separated types for /api/search `type` param (only when useGlobalSearch=true) */
  apiTypes?: string
  /** Search limit (only when useGlobalSearch=true) */
  searchLimit?: number
  /** Custom className for the header */
  className?: string
  /** Search value for controlled input (only when useGlobalSearch=false) */
  searchValue?: string
  /** onChange handler for controlled input (only when useGlobalSearch=false) */
  onSearchChange?: (value: string) => void
  /** onServerSearch handler for GooeyInput (only when useGlobalSearch=false) */
  onServerSearch?: (query: string) => Promise<any[]>
  /** searchResults for GooeyInput (only when useGlobalSearch=false) */
  searchResults?: any[]
  /** onResultSelect handler for GooeyInput (only when useGlobalSearch=false) */
  onResultSelect?: (result: any) => void
  /** renderResult handler for GooeyInput (only when useGlobalSearch=false) */
  renderResult?: (result: any) => React.ReactNode
  /** filterFunction for GooeyInput (only when useGlobalSearch=false) */
  filterFunction?: (result: any, query: string) => boolean
  /** searchDebounce for GooeyInput (only when useGlobalSearch=false) */
  searchDebounce?: number
  /** minSearchLength for GooeyInput (only when useGlobalSearch=false) */
  minSearchLength?: number
  /** Custom left section content (replaces sidebar trigger if provided) */
  leftContent?: React.ReactNode
}

export function FdrDashboardHeader({
  placeholder = "Search pages, products, recipes, sales, customers...",
  useGlobalSearch = false,
  showSidebarTrigger = false,
  apiTypes,
  searchLimit = 10,
  className,
  searchValue,
  onSearchChange,
  onServerSearch,
  searchResults,
  onResultSelect,
  renderResult,
  filterFunction,
  searchDebounce,
  minSearchLength,
  leftContent,
}: FdrDashboardHeaderProps) {
  return (
    <header
      className={cn(
        "shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-0 sm:h-16 lg:h-20 border-b border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-black",
        className
      )}
    >
      {leftContent ? (
        <div className="order-1 shrink-0">{leftContent}</div>
      ) : showSidebarTrigger ? (
        <SidebarTrigger className="md:hidden order-1 shrink-0" />
      ) : null}

      <div className={cn("w-full sm:w-auto sm:flex-1 min-w-0", showSidebarTrigger || leftContent ? "order-3 sm:order-2" : "")}>
        {useGlobalSearch ? (
          <DashboardGlobalSearch
            context="front-desk"
            placeholder={placeholder}
            apiTypes={apiTypes}
            limit={searchLimit}
          />
        ) : (
          <GooeyInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={onSearchChange}
            onServerSearch={onServerSearch}
            searchResults={searchResults}
            onResultSelect={onResultSelect}
            renderResult={renderResult}
            filterFunction={filterFunction}
            searchDebounce={searchDebounce}
            minSearchLength={minSearchLength}
          />
        )}
      </div>

      <div className={cn("ml-auto flex items-center gap-2 sm:gap-3 shrink-0", showSidebarTrigger || leftContent ? "order-2 sm:order-3" : "")}>
        <FDRThemeToggle />
        <FDRProfileDropdown />
      </div>
    </header>
  )
}
