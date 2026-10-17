"use client";

import FDRProfileDropdown from '@/components/front-desk-role/fdr-profile-dropdown';
import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FDRThemeToggle } from '@/components/front-desk-role/fdr-theme-toggle';
import { Calendar } from "@/components/ui/calendar";
import { GooeyInput, SearchResult } from '@/components/ui/gooey-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import {
  ArrowRight,
  Beer,
  Box,
  Clock,
  Package,
  PackageSearch,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';

type SaleType = "Burn Box" | "Apparel";

interface StockProduct {
  id: string;
  name: string;
  quantity: number;
  soldOnDate?: number;
  bgColor: string;
  textColor: string;
  imageUrl?: string;
  visual: React.ReactNode;
}

interface Sale {
  time: string;
  product: string;
  type: SaleType;
  qty: number;
  total: string;
  visual: React.ReactNode;
}

type ProductResponse = {
  id: string;
  name: string;
  stock: number;
  category?: string;
  imageUrl?: string;
};

type SaleResponse = {
  saleDate: string;
  quantity: number;
  totalPrice: number;
  product?: {
    category?: string;
    name?: string;
    imageUrl?: string;
  };
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SaleBadge({ type }: { type: SaleType }) {
  if (type === "Burn Box") {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40">
        Burn Box
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 border border-violet-300 dark:bg-[#1e1e2e] dark:text-violet-300 dark:border-violet-900/40">
      Apparel
    </span>
  );
}

const FrontDeskRoleDashboard = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [greeting, setGreeting] = useState("Good Morning")
  const [currentTime, setCurrentTime] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [stockItems, setStockItems] = useState<StockProduct[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Role-based access control
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    // Update greeting based on time
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) {
        setGreeting("Good Morning")
      } else if (hour < 17) {
        setGreeting("Good Afternoon")
      } else {
        setGreeting("Good Evening")
      }
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Update current time
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      const dateString = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      setCurrentTime(`${dateString} • ${timeString}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000) // Update every second
    return () => clearInterval(interval)
  }, [])

  // Helper function to get product visual
  const getProductVisual = (name: string, category: string, size: 'large' | 'small' = 'large'): React.ReactNode => {
    const lowerName = name?.toLowerCase() || ""

    if (category === 'BURN_BOX') {
      if (lowerName.includes('protein')) {
        if (size === 'small') {
          return (
            <div className="w-3 h-5 rounded-full bg-linear-to-b from-pink-400 to-pink-600" />
          )
        }
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-12 rounded-full bg-linear-to-b from-pink-400 to-pink-600 flex items-end justify-center pb-1 shadow-lg">
              <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>
        )
      }
      if (lowerName.includes('green')) {
        if (size === 'small') {
          return (
            <div className="w-3 h-5 rounded-full bg-linear-to-b from-green-400 to-green-600" />
          )
        }
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-12 rounded-full bg-linear-to-b from-green-400 to-green-600 flex items-end justify-center pb-1 shadow-lg">
              <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>
        )
      }
      if (size === 'small') {
        return (
          <div className="w-3 h-5 rounded-full bg-linear-to-b from-pink-400 to-pink-600" />
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-12 rounded-full bg-linear-to-b from-pink-400 to-pink-600 flex items-end justify-center pb-1 shadow-lg">
            <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
          </div>
        </div>
      )
    }

    // Apparel
    if (lowerName.includes('t-shirt') || lowerName.includes('tee')) {
      if (size === 'small') {
        return (
          <div className="relative w-5 h-4">
            <div className="absolute inset-0 bg-neutral-500 rounded-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-neutral-200 dark:bg-[#1e1e1e] rounded-b-full" />
          </div>
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-10 h-9">
            <div className="absolute inset-0 bg-neutral-300 dark:bg-[#2a2a2a] rounded-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-neutral-100 dark:bg-[#1e1e1e] rounded-b-full" />
            <div className="absolute top-0 left-0 w-2.5 h-3 bg-neutral-200 dark:bg-[#333] rounded-l-sm -translate-x-1" />
            <div className="absolute top-0 right-0 w-2.5 h-3 bg-neutral-200 dark:bg-[#333] rounded-r-sm translate-x-1" />
          </div>
        </div>
      )
    }
    if (lowerName.includes('legging')) {
      if (size === 'small') {
        return (
          <div className="flex gap-0.5 h-4 items-end">
            <div className="w-1 h-4 bg-neutral-400 dark:bg-[#3a3a3a] rounded-b-sm" />
            <div className="w-1 h-4 bg-neutral-400 dark:bg-[#3a3a3a] rounded-b-sm" />
          </div>
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex gap-1 h-12 items-end">
            <div className="w-3 h-10 bg-neutral-300 dark:bg-[#333] rounded-b-sm rounded-t-lg" />
            <div className="w-3 h-10 bg-neutral-300 dark:bg-[#333] rounded-b-sm rounded-t-lg" />
          </div>
        </div>
      )
    }
    if (lowerName.includes('cap')) {
      if (size === 'small') {
        return (
          <div className="relative w-5 h-3">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-neutral-400 dark:bg-[#3a3a3a] rounded-t-full" />
            <div className="absolute bottom-0 left-0 w-5 h-0.5 bg-neutral-500 dark:bg-[#4a4a4a] rounded-sm" />
          </div>
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-12 h-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-5 bg-neutral-300 dark:bg-[#2a2a2a] rounded-t-full" />
            <div className="absolute bottom-0 left-0 w-12 h-2 bg-neutral-200 dark:bg-[#333] rounded-sm" />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-5 h-3 bg-neutral-200 dark:bg-[#242424] rounded-t-sm" />
          </div>
        </div>
      )
    }
    // Default
    if (size === 'small') {
      return (
        <div className="relative w-5 h-4">
          <div className="absolute inset-0 bg-neutral-500 rounded-sm" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-neutral-200 dark:bg-[#1e1e1e] rounded-b-full" />
        </div>
      )
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-10 h-9">
          <div className="absolute inset-0 bg-neutral-300 dark:bg-[#2a2a2a] rounded-sm" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-neutral-100 dark:bg-[#1e1e1e] rounded-b-full" />
          <div className="absolute top-0 left-0 w-2.5 h-3 bg-neutral-200 dark:bg-[#333] rounded-l-sm -translate-x-1" />
          <div className="absolute top-0 right-0 w-2.5 h-3 bg-neutral-200 dark:bg-[#333] rounded-r-sm translate-x-1" />
        </div>
      </div>
    )
  }

  // Fetch stock items from API
  useEffect(() => {
    async function fetchStockItems() {
      try {
        const response = await fetch(`/api/products/fdr`)
        if (response.ok) {
          const data = await response.json()
          const items: StockProduct[] = (data.products || []).slice(0, 5).map((product: any) => {
            const category = product.category || 'APPAREL'
            return {
              id: product.id,
              name: product.name,
              quantity: product.stock,
              imageUrl: product.imageUrl,
              bgColor: category === 'BURN_BOX'
                ? "bg-emerald-950/60"
                : "bg-neutral-100 dark:bg-[#1a1a1a]",
              textColor: category === 'BURN_BOX'
                ? "text-green-700 dark:text-green-400"
                : "text-neutral-700 dark:text-neutral-300",
              visual: product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : getProductVisual(product.name, category, 'large')
            }
          })
          setStockItems(items)
        } else {
          console.error('Failed to fetch stock items:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch stock items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStockItems()
  }, [date])

  // Fetch recent sales from API
  useEffect(() => {
    async function fetchRecentSales() {
      try {
        // Format the selected date for API filtering (YYYY-MM-DD format)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const selectedDateStr = `${year}-${month}-${day}`
        
        // Fetch both regular sales and burn box sales
        const [salesResponse, burnBoxResponse] = await Promise.all([
          fetch(`/api/sales/user?date=${selectedDateStr}`),
          fetch(`/api/burnbox-sales?date=${selectedDateStr}`)
        ])
        
        const sales: Sale[] = []
        
        // Process regular sales
        if (salesResponse.ok) {
          const data = await salesResponse.json()
          const regularSales = (data || []).slice(0, 5).map((sale: any) => {
            const category = sale.product?.category || 'APPAREL'
            return {
              time: new Date(sale.saleDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              product: sale.product?.name || 'Unknown',
              type: category === 'BURN_BOX' ? 'Burn Box' : 'Apparel',
              qty: sale.quantity,
              total: `$${(sale.totalPrice || 0).toFixed(2)}`,
              visual: sale.product?.imageUrl ? (
                <img 
                  src={sale.product.imageUrl} 
                  alt={sale.product?.name || 'Unknown'}
                  className="w-7 h-7 rounded object-cover"
                />
              ) : (
                <div className={`w-7 h-7 rounded flex items-center justify-center ${category === 'BURN_BOX' ? 'bg-emerald-950/60' : 'bg-neutral-100 dark:bg-[#1a1a1a]'}`}>
                  {getProductVisual(sale.product?.name || '', category, 'small')}
                </div>
              )
            }
          })
          sales.push(...regularSales)
        }
        
        // Process burn box sales
        if (burnBoxResponse.ok) {
          const burnBoxData = await burnBoxResponse.json()
          const burnBoxSales = (burnBoxData.sales || []).slice(0, 5).map((sale: any) => {
            return {
              time: new Date(sale.saleDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              product: sale.recipeName || 'Unknown',
              type: 'Burn Box',
              qty: sale.quantity,
              total: `$${(sale.totalPrice || 0).toFixed(2)}`,
              visual: (
                <div className="w-7 h-7 rounded flex items-center justify-center bg-emerald-950/60">
                  {getProductVisual(sale.recipeName || '', 'BURN_BOX', 'small')}
                </div>
              )
            }
          })
          sales.push(...burnBoxSales)
        }
        
        // Sort by time and take top 5
        const sortedSales = sales.sort((a, b) => {
          const timeA = new Date(`1970-01-01T${a.time.replace(/(AM|PM)/, '')}`).getTime()
          const timeB = new Date(`1970-01-01T${b.time.replace(/(AM|PM)/, '')}`).getTime()
          return timeB - timeA
        }).slice(0, 5)
        
        setRecentSales(sortedSales)
      } catch (error) {
        console.error('Failed to fetch recent sales:', error)
      }
    }
    fetchRecentSales()
  }, [date])

  // Server-side search function for products, recipes, sales, and customers
  const handleServerSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      // Transform search results into SearchResult format
      return (data.items || []).map((item: any) => ({
        id: item.id,
        label: item.name,
        data: {
          type: item.type,
          description: item.description,
          metadata: item.metadata
        }
      }))
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }, [])

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    const data = result.data as any
    const type = data?.type || 'item'
    
    // Navigate based on type
    switch(type) {
      case 'product':
        router.push(`/dashboard/front-desk-role/record-sale?productId=${result.id}`)
        break
      case 'recipe':
        router.push(`/dashboard/front-desk-role/record-sale?recipeId=${result.id}`)
        break
      case 'sale':
        // Navigate to sales page with sale ID filter
        router.push(`/dashboard/front-desk-role/sales?saleId=${result.id}`)
        break
      case 'customer':
        // Navigate to customers page with customer ID filter
        router.push(`/dashboard/front-desk-role/customers?customerId=${result.id}`)
        break
      default:
        console.log('Selected item:', result)
    }
  }, [router])

  // Custom render function for search results
  const renderSearchResult = useCallback((result: SearchResult) => {
    const data = result.data as any
    const type = data?.type || 'item'
    
    // Get icon based on type
    const getIcon = () => {
      switch(type) {
        case 'product':
          return <Package className="w-4 h-4 text-neutral-500" />
        case 'recipe':
          return <Beer className="w-4 h-4 text-neutral-500" />
        case 'sale':
          return <ShoppingCart className="w-4 h-4 text-neutral-500" />
        case 'customer':
          return <Box className="w-4 h-4 text-neutral-500" />
        default:
          return <PackageSearch className="w-4 h-4 text-neutral-500" />
      }
    }
    
    // Get type badge color
    const getTypeBadge = () => {
      switch(type) {
        case 'product':
          return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">Product</span>
        case 'recipe':
          return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">Recipe</span>
        case 'sale':
          return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">Sale</span>
        case 'customer':
          return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">Customer</span>
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
            {data?.description || 'No details'}
          </div>
        </div>
      </div>
    )
  }, [])

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center dark:bg-black dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden font-saprona dark:bg-black dark:text-neutral-100 font-sans">
      <FdrSidebar />
      {/* ── Main area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-20 shrink-0 flex items-center justify-between px-6 gap-4 border-b border-neutral-200 dark:border-[#1a1a1a] dark:bg-black">
          {/* Search */}
          <GooeyInput 
            placeholder="Search products, recipes, sales, customers..." 
            onServerSearch={handleServerSearch}
            onResultSelect={handleSearchResultSelect}
            renderResult={renderSearchResult}
            searchDebounce={300}
            minSearchLength={2}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <FDRThemeToggle />
            <FDRProfileDropdown />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ── Page header ──────────────────────── */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[28px] font-saprona-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {greeting}, {session?.user?.name?.split(' ')[0] || "John"}!
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                Here&apos;s your quick overview for today.
              </p>
            </div>

            {/* Date card */}
            <Popover>
              <PopoverTrigger>
                <button 
                  type="button" 
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors cursor-pointer ${
                    date.toDateString() === new Date().toDateString()
                      ? 'bg-neutral-100 dark:bg-[#141414] border border-gray-200 dark:border-[#1e1e1e] hover:bg-neutral-200 dark:hover:bg-[#1a1a1a]'
                      : 'bg-[#c8f135]/10 dark:bg-[#c8f135]/10 border border-[#c8f135]/40 dark:border-[#c8f135]/30 hover:bg-[#c8f135]/20 dark:hover:bg-[#c8f135]/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    date.toDateString() === new Date().toDateString()
                      ? 'bg-neutral-200 dark:bg-[#1e1e1e]'
                      : 'bg-[#c8f135]/20'
                  }`}>
                    <Clock 
                      size={15} 
                      className={
                        date.toDateString() === new Date().toDateString()
                          ? 'text-neutral-500 dark:text-neutral-400'
                          : 'text-[#c8f135]'
                      } 
                    />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${
                      date.toDateString() === new Date().toDateString()
                        ? 'text-neutral-900 dark:text-neutral-100'
                        : 'text-[#c8f135]'
                    }`}>
                      {date.toDateString() === new Date().toDateString() ? 'Today' : 'Filter Date'}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {format(date, 'PPP')}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark:bg-[#0b0c0d] dark:border-[#1e1e1e]" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                />
                {date.toDateString() !== new Date().toDateString() && (
                  <div className="p-3 border-t border-gray-200 dark:border-[#1e1e1e]">
                    <button
                      onClick={() => setDate(new Date())}
                      className="w-full py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100 dark:bg-[#141414] hover:bg-neutral-200 dark:hover:bg-[#252525] rounded-lg transition-colors"
                    >
                      Reset to Today
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Action cards ─────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Burn Box Sale */}
            <ActionCard
              iconBg="bg-emerald-950/60"
              icon={<Beer size={35} className="text-green-400" />}
              title="Record Burn Box Sale"
              subtitle="Smoothies, drinks & recipes"
              visual={
                <div className="absolute right-2 top-4 w-38 max-h-full">
                  <Image src="/limedrink.png" alt="Lemon Drink Photo" width={150} height={150} />
                </div>
              }
              href="/dashboard/front-desk-role/record-sale"
            />

            {/* Apparel Sale */}
            <ActionCard
              iconBg="bg-purple-100 dark:bg-purple-950/50"
              icon={<Package size={35} className="text-purple-600 dark:text-purple-300" />}
              title="Record Apparel Sale"
              subtitle="Clothing & accessories"
              visual={
                <div className="absolute -right-12 top-1 w-56 max-h-full">
                  <Image src="/apparelproducts.png" alt="Apparel Products Photo" width={200} height={220} />
                </div>
              }
              href="/dashboard/front-desk-role/record-sale"
            />

            {/* Stock Availability */}
            <ActionCard
              iconBg="bg-neutral-100 dark:bg-[#1a1a1a]"
              icon={<Box size={35} className="text-neutral-600 dark:text-neutral-300" />}
              title="Check Stock Availability"
              subtitle="View current inventory levels"
              visual={
                <div className="absolute -right-8 top-5 w-53.75 max-h-full">
                  <Image src="/burnboxinventory.png" alt="Burn Box Inventory Photo" width={250} height={250} />
                </div>
              }
              href="/dashboard/front-desk-role/stock"
            />
          </div>

          {/* ── Lower grid ───────────────────────── */}
          <div className="grid grid-cols-[3fr_2fr] gap-4">
            <div className="flex flex-col gap-5">
              {/* Stock overview */}
              <div className="bg-white dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1e1e1e] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Box size={15} className="text-neutral-400 dark:text-neutral-500" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Quick Stock Overview
                    </span>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/front-desk-role/stock')}
                    className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    View All <ArrowRight size={12} />
                  </button>
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-600 mb-4">
                  {date.toDateString() === new Date().toDateString() 
                    ? 'Current available stock (selected items)' 
                    : `Stock overview for ${format(date, 'PPP')} (items sold on this date)`}
                </p>

                <div className="grid grid-cols-5 gap-3">
                  {loading ? (
                    <div className="col-span-5 flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : stockItems.length === 0 ? (
                    <div className="col-span-5 border border-dashed border-neutral-300 dark:border-[#1e1e1e] bg-neutral-50 dark:bg-[#0d0d0d] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-200 dark:bg-[#1e1e1e] text-neutral-400 dark:text-neutral-500 mb-2">
                        <PackageSearch size={20} />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                        {date.toDateString() === new Date().toDateString() 
                          ? 'No Stock Data' 
                          : 'No Sales on This Date'}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                        {date.toDateString() === new Date().toDateString()
                          ? 'No products found in the database. Add products to see stock availability.'
                          : 'No products were sold on the selected date. Try a different date or reset to today.'}
                      </p>
                      {date.toDateString() !== new Date().toDateString() && (
                        <button
                          onClick={() => setDate(new Date())}
                          className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100 dark:bg-[#141414] hover:bg-neutral-200 dark:hover:bg-[#252525] rounded-lg transition-colors"
                        >
                          Reset to Today
                        </button>
                      )}
                    </div>
                  ) : (
                    stockItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-neutral-50 dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-3 flex flex-col items-center text-center"
                      >
                        <div
                          className={cn(
                            "w-full h-25 rounded-lg mb-4 overflow-hidden",
                            item.bgColor
                          )}
                        >
                          {item.visual}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mb-2">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                          <Box size={9} />
                          <span>{item.quantity} left</span>
                          {item.soldOnDate !== undefined && (
                            <span className="text-neutral-300 dark:text-neutral-600">
                              ({item.soldOnDate} sold)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* ── Bottom banner ────────────────────── */}
              <div className="bg-white dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1e1e1e] rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-neutral-100 dark:bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                    <TrendingUp size={16} className="text-neutral-600 dark:text-neutral-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Quick. Easy. Keep it moving.
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Record sales, track stock, and stay on top of your day — all
                      from here.
                    </p>
                  </div>
                </div>

                {/* Wave SVG */}
                <svg
                  width="200"
                  height="36"
                  viewBox="0 0 200 36"
                  fill="none"
                  className="shrink-0"
                >
                  <polyline
                    points="0,28 25,20 50,24 75,12 100,18 130,10 160,16 185,6 200,9"
                    className="stroke-gray-300 dark:stroke-[#333]"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="200" cy="9" r="3" className="fill-gray-700 dark:fill-white" />
                </svg>
              </div>
            </div>
            {/* Recent sales */}
            <div className="bg-white dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1e1e1e] rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-neutral-400 dark:text-neutral-500" />
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">My Recent Sales</span>
                    {date.toDateString() !== new Date().toDateString() && (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">
                        for {format(date, 'PPP')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/front-desk-role/sales')}
                  className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[56px_1fr_70px_24px_48px] gap-x-2 text-[11px] text-neutral-400 dark:text-neutral-600 mb-2 px-0.5">
                <span>Time</span>
                <span>Product</span>
                <span>Type</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
              </div>

              {/* Rows */}
              <div className="flex-1 space-y-px">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : recentSales.length === 0 ? (
                  <div className="border border-dashed border-neutral-300 dark:border-[#1e1e1e] bg-neutral-50 dark:bg-[#0d0d0d] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-200 dark:bg-[#1e1e1e] text-neutral-400 dark:text-neutral-500 mb-2">
                      <ShoppingCart size={20} />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                      {date.toDateString() === new Date().toDateString() 
                        ? 'No Recent Sales' 
                        : 'No Sales on This Date'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {date.toDateString() === new Date().toDateString()
                        ? 'Start recording sales to see your recent transactions here.'
                        : 'No sales were recorded on the selected date. Try a different date or reset to today.'}
                    </p>
                  </div>
                ) : (
                  recentSales.map((sale, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[56px_1fr_70px_24px_48px] gap-x-2 items-center py-2 border-b border-gray-100 dark:border-[#1a1a1a] last:border-0"
                    >
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                        {sale.time}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {sale.visual}
                        <span className="text-[11px] text-neutral-700 dark:text-neutral-200 truncate">
                          {sale.product}
                        </span>
                      </div>
                      <SaleBadge type={sale.type} />
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center tabular-nums">
                        {sale.qty}
                      </span>
                      <span className="text-[11px] text-neutral-900 dark:text-neutral-100 font-medium text-right tabular-nums">
                        {sale.total}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push('/dashboard/front-desk-role/sales')}
                className="mt-4 w-full py-2.5 bg-neutral-50 dark:bg-[#0d0d0d] hover:bg-neutral-100 dark:hover:bg-[#161616] border border-neutral-200 dark:border-[#1e1e1e] rounded-xl text-[13px] text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-2 transition-colors"
              >
                View All Recent Sales <ArrowRight size={13} />
              </button>
            </div>
          </div>


        </main>
      </div>
    </div>
  );
}

export default FrontDeskRoleDashboard


// ─────────────────────────────────────────────
// ActionCard component
// ─────────────────────────────────────────────

interface ActionCardProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  visual: React.ReactNode;
  href: string;
}

function ActionCard({ iconBg, icon, title, subtitle, visual, href }: ActionCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(href)}
      className="relative bg-neutral-50 dark:bg-[#0b0c0d] border border-gray-200 dark:border-[#1e1e1e] hover:border-gray-300 dark:hover:border-[#2a2a2a] rounded-2xl p-5 overflow-hidden cursor-pointer transition-colors group"
    >
      <div
        className={cn(
          "w-18 h-18 rounded-full flex items-center justify-center mb-4",
          iconBg
        )}
      >
        {icon}
      </div>
      <p className="text-[22px] font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
      <p className="text-md text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
      <button className="mt-4 w-10 h-10 bg-neutral-100 dark:bg-[#1a1a1a] hover:bg-neutral-200 dark:hover:bg-[#252525] border border-neutral-200 dark:border-[#1e1e1e] rounded-full flex items-center justify-center transition-colors">
        <ArrowRight size={18} className="text-neutral-600 dark:text-neutral-300" />
      </button>
      {visual}
    </div>
  );
}