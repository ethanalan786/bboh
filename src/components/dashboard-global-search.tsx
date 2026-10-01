"use client"

import { GooeyInput, type SearchResult } from "@/components/ui/gooey-input"
import { searchPages, type SearchContext } from "@/lib/searchable-pages"
import { cn } from "@/lib/utils"
import {
  Beer,
  Box,
  FileText,
  LayoutGrid,
  Package,
  ShoppingCart,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export type GlobalSearchEntityType =
  | "product"
  | "recipe"
  | "sale"
  | "customer"
  | "page"

export interface DashboardGlobalSearchProps {
  context: SearchContext
  className?: string
  placeholder?: string
  /** Comma-separated types for /api/search `type` param */
  apiTypes?: string
  limit?: number
  collapsedWidth?: number
  expandedWidth?: number
}

export function DashboardGlobalSearch({
  context,
  className,
  placeholder = "Search pages, products, recipes, sales, customers...",
  apiTypes,
  limit = 10,
  collapsedWidth = 350,
  expandedWidth = 500,
}: DashboardGlobalSearchProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const handleServerSearch = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      const pageResults: SearchResult[] = searchPages(query, context, userRole).map(
        (page) => ({
          id: page.id,
          label: page.title,
          data: {
            type: "page" as const,
            description: page.section,
            url: page.url,
          },
        }),
      )

      const typeParam = apiTypes ? `&type=${encodeURIComponent(apiTypes)}` : ""
      let entityResults: SearchResult[] = []

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=${limit}${typeParam}`,
        )
        if (response.ok) {
          const data = await response.json()
          entityResults = (data.items || []).map(
            (item: {
              id: string
              name: string
              type: string
              description?: string
              metadata?: Record<string, unknown>
            }) => ({
              id: item.id,
              label: item.name,
              data: {
                type: item.type,
                description: item.description,
                metadata: item.metadata,
              },
            }),
          )
        }
      } catch (error) {
        console.error("Search error:", error)
      }

      const combined = [...pageResults, ...entityResults]
      const seen = new Set<string>()
      const deduped: SearchResult[] = []
      for (const result of combined) {
        const key = `${result.data?.type}:${result.id}`
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(result)
        if (deduped.length >= limit) break
      }
      return deduped
    },
    [apiTypes, context, limit, userRole],
  )

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const data = result.data as {
        type?: GlobalSearchEntityType | string
        url?: string
      }
      const type = data?.type

      if (type === "page" && data.url) {
        router.push(data.url)
        return
      }

      const isFrontDesk = context === "front-desk"

      switch (type) {
        case "product":
          router.push(
            isFrontDesk
              ? `/dashboard/front-desk-role/record-sale?productId=${result.id}`
              : "/dashboard/admin/box-apparel/products",
          )
          break
        case "recipe":
          router.push(
            isFrontDesk
              ? `/dashboard/front-desk-role/record-sale?recipeId=${result.id}`
              : "/dashboard/admin/burn-box/recipes",
          )
          break
        case "sale":
          router.push(
            isFrontDesk
              ? `/dashboard/front-desk-role/sales?saleId=${result.id}`
              : "/dashboard/admin/burn-box/sales",
          )
          break
        case "customer":
          router.push(
            isFrontDesk
              ? `/dashboard/front-desk-role/customers?customerId=${result.id}`
              : `/dashboard/front-desk-role/customers?customerId=${result.id}`,
          )
          break
        default:
          break
      }
    },
    [context, router],
  )

  const renderSearchResult = useCallback((result: SearchResult) => {
    const data = result.data as { type?: string; description?: string }
    const type = data?.type || "item"

    const getIcon = () => {
      switch (type) {
        case "product":
          return <Package className="w-4 h-4 text-neutral-500" />
        case "recipe":
          return <Beer className="w-4 h-4 text-neutral-500" />
        case "sale":
          return <ShoppingCart className="w-4 h-4 text-neutral-500" />
        case "customer":
          return <Box className="w-4 h-4 text-neutral-500" />
        case "page":
          return <LayoutGrid className="w-4 h-4 text-neutral-500" />
        default:
          return <FileText className="w-4 h-4 text-neutral-500" />
      }
    }

    const getTypeBadge = () => {
      switch (type) {
        case "product":
          return (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
              Product
            </span>
          )
        case "recipe":
          return (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">
              Recipe
            </span>
          )
        case "sale":
          return (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
              Sale
            </span>
          )
        case "customer":
          return (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
              Customer
            </span>
          )
        case "page":
          return (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-500/20 text-slate-400">
              Page
            </span>
          )
        default:
          return null
      }
    }

    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm truncate">{result.label}</div>
            {getTypeBadge()}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {data?.description || "No details"}
          </div>
        </div>
      </div>
    )
  }, [])

  return (
    <GooeyInput
      className={cn(className)}
      placeholder={placeholder}
      onServerSearch={handleServerSearch}
      onResultSelect={handleSearchResultSelect}
      renderResult={renderSearchResult}
      searchDebounce={300}
      minSearchLength={2}
      collapsedWidth={collapsedWidth}
      expandedWidth={expandedWidth}
    />
  )
}
