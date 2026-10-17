"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Plus,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  ArrowUpDown,
  X,
  Eye,
  Download,
  Package,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BurnBoxSale, BurnBoxSalesStats } from "@/types/burnbox-sales-types"
import { SaleDialog } from "@/components/sales/sale-dialog"
import { TopSellingRecipeCard } from "@/components/sales/top-selling-recipe-card"
import { currency } from "@/lib/utils"

const percent = (n: number) =>
  `${(n || 0).toFixed(1)}%`

function StatCell({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: string
  tone?: "default" | "warning" | "positive"
}) {
  const toneClasses =
    tone === "warning"
      ? "text-amber-400"
      : tone === "positive"
      ? "text-emerald-400"
      : "text-muted-foreground"

  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <Icon className={`h-4 w-4 shrink-0 ${toneClasses}`} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold tabular-nums truncate">{value}</p>
      </div>
    </div>
  )
}

export default function BurnBoxSalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sales, setSales] = useState<BurnBoxSale[]>([])
  const [filteredSales, setFilteredSales] = useState<BurnBoxSale[]>([])
  const [stats, setStats] = useState<BurnBoxSalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalIngredientCost: 0,
    totalProfit: 0,
    averageProfitMargin: 0,
    totalRecipesSold: 0,
    topSellingRecipe: null,
    todaySales: 0,
    todayRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableRecipes, setAvailableRecipes] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/burnbox-sales?allSales=true")
      const data = await response.json()

      if (response.ok) {
        setSales(data.sales || [])
        setFilteredSales(data.sales || [])
        setStats(data.stats || {
          totalSales: 0,
          totalRevenue: 0,
          totalIngredientCost: 0,
          totalProfit: 0,
          averageProfitMargin: 0,
          totalRecipesSold: 0,
          topSellingRecipe: null,
          todaySales: 0,
          todayRevenue: 0,
        })
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...sales]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          (s.recipeName?.toLowerCase() || "").includes(query) ||
          (s.recipeSku?.toLowerCase() || "").includes(query) ||
          (s.userName?.toLowerCase() || "").includes(query) ||
          (s.customerName?.toLowerCase() || "").includes(query) ||
          (s.orderId?.toLowerCase() || "").includes(query)
      )
    }

    // Date filters
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter)
      filtered = filtered.filter((s) => new Date(s.saleDate) >= fromDate)
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((s) => new Date(s.saleDate) <= toDate)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()
          break
        case "recipe":
          comparison = a.recipeName.localeCompare(b.recipeName)
          break
        case "quantity":
          comparison = a.quantity - b.quantity
          break
        case "revenue":
          comparison = a.totalPrice - b.totalPrice
          break
        case "profit":
          comparison = a.profit - b.profit
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredSales(filtered)
  }, [searchQuery, dateFromFilter, dateToFilter, sortBy, sortOrder, sales])

  const clearFilters = () => {
    setSearchQuery("")
    setDateFromFilter("")
    setDateToFilter("")
    setSortBy("date")
    setSortOrder("desc")
  }

  const hasActiveFilters = searchQuery || dateFromFilter || dateToFilter

  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      const data = await response.json()
      if (response.ok) {
        setAvailableRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error("Error fetching recipes:", error)
    }
  }

  const handleRecordSale = () => {
    fetchRecipes()
    setIsDialogOpen(true)
  }

  const handleSaleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      // Get user info
      const sessionResponse = await fetch("/api/auth/session")
      const sessionData = await sessionResponse.json()
      const userId = sessionData.user?.id
      const userName = sessionData.user?.name

      const response = await fetch("/api/burnbox-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId,
          userName,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        await fetchSales()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to record sale")
      }
    } catch (error) {
      console.error("Error recording sale:", error)
      alert("Failed to record sale")
    } finally {
      setIsSubmitting(false)
    }
  }

  const exportToCSV = () => {
    if (filteredSales.length === 0) return

    const headers = [
      "Date",
      "Order ID",
      "Recipe",
      "SKU",
      "Quantity",
      "Unit Price",
      "Total Price",
      "Ingredient Cost",
      "Profit",
      "Profit Margin",
      "User",
      "Customer",
      "Payment Method",
      "Notes"
    ]

    const rows = filteredSales.map(sale => [
      format(new Date(sale.saleDate), "MMM d, yyyy HH:mm"),
      sale.orderId || "",
      `"${sale.recipeName.replace(/"/g, '""')}"`,
      sale.recipeSku,
      sale.quantity.toString(),
      sale.unitPrice.toFixed(2),
      sale.totalPrice.toFixed(2),
      sale.ingredientCost.toFixed(2),
      sale.profit.toFixed(2),
      sale.profitMargin.toFixed(1) + "%",
      sale.userName,
      sale.customerName || "",
      sale.paymentMethod || "",
      `"${(sale.notes || "").replace(/"/g, '""')}"`
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `burnbox-sales-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="font-archivo">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/admin/burn-box">Burn Box</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sales</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Burn Box Sales</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Track recipe sales with automatic ingredient deduction
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search sales..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger>
                    <Button variant="outline" size="icon" className={hasActiveFilters ? "bg-accent" : ""}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Filters</h3>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">From</label>
                            <Input
                              type="date"
                              value={dateFromFilter}
                              onChange={(e) => setDateFromFilter(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">To</label>
                            <Input
                              type="date"
                              value={dateToFilter}
                              onChange={(e) => setDateToFilter(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Sort by</label>
                        <div className="flex gap-2">
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="recipe">Recipe</SelectItem>
                              <SelectItem value="quantity">Quantity</SelectItem>
                              <SelectItem value="revenue">Revenue</SelectItem>
                              <SelectItem value="profit">Profit</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchSales}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={exportToCSV}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button onClick={handleRecordSale}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
              <Card>
                <StatCell
                  icon={ShoppingCart}
                  label="Total Sales"
                  value={stats.totalSales.toString()}
                />
              </Card>
              <Card>
                <StatCell
                  icon={DollarSign}
                  label="Total Revenue"
                  value={currency(stats.totalRevenue)}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={Package}
                  label="Ingredient Cost"
                  value={currency(stats.totalIngredientCost)}
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingUp}
                  label="Total Profit"
                  value={currency(stats.totalProfit)}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingUp}
                  label="Avg Margin"
                  value={percent(stats.averageProfitMargin)}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={Package}
                  label="Recipes Sold"
                  value={stats.totalRecipesSold.toString()}
                />
              </Card>
              <Card>
                <StatCell
                  icon={Calendar}
                  label="Today Sales"
                  value={stats.todaySales.toString()}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={DollarSign}
                  label="Today Revenue"
                  value={currency(stats.todayRevenue)}
                  tone="positive"
                />
              </Card>
            </div>

            {/* Top selling recipe card */}
            {stats.topSellingRecipe && (
              <TopSellingRecipeCard recipe={stats.topSellingRecipe} />
            )}

            {/* Sales table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Sales History</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredSales.length} sales`}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Recipe</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Ingredient Cost</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        Loading sales...
                      </TableCell>
                    </TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        {hasActiveFilters ? "No sales match your filters" : "No sales recorded"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-sm">
                          {format(new Date(sale.saleDate), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{sale.orderId || "N/A"}</TableCell>
                        <TableCell>
                          <div className="font-medium">{sale.recipeName}</div>
                          <div className="text-xs text-muted-foreground">{sale.recipeSku}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{sale.quantity}</TableCell>
                        <TableCell className="text-sm">{currency(sale.unitPrice)}</TableCell>
                        <TableCell className="text-sm font-medium">{currency(sale.totalPrice)}</TableCell>
                        <TableCell className="text-sm">{currency(sale.ingredientCost)}</TableCell>
                        <TableCell className="text-sm font-medium text-emerald-400">
                          {currency(sale.profit)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={sale.profitMargin >= 20 ? "text-emerald-400" : sale.profitMargin >= 10 ? "text-amber-400" : "text-red-400"}>
                            {percent(sale.profitMargin)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{sale.userName}</TableCell>
                        <TableCell className="text-sm">{sale.customerName || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Package className="h-4 w-4 mr-2" />
                                View Ingredients Deducted
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
      <SaleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSaleSubmit}
        isLoading={isSubmitting}
        availableRecipes={availableRecipes}
      />
    </div>
  )
}