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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
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
import { Calendar as CalendarIcon, Download, Filter, RefreshCw, Search, X, DollarSign, ShoppingCart, TrendingUp, Users, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { type DateRange } from "react-day-picker"
import { CalendarRange } from "@/components/calendar-range"
import { OrderReturnDialog } from "@/components/inventory/order-return-dialog"
import { toast, Toaster } from "@/components/ui/toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Sale {
  id: string
  orderId: string | null
  productId: string
  productName: string
  productSku: string
  productCategory: string
  productCategoryId: string
  quantity: number
  returnedQuantity: number
  unitPrice: number
  lineTotal: number
  totalPrice: number
  discountPercentage: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  costPrice: number
  grossProfit: number
  saleDate: Date
  userId: string
  userName: string
  customerName?: string
  paymentMethod?: string
  createdAt: Date
}

interface ProductCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface Stats {
  totalSales: number
  totalRevenue: number
  totalDiscount: number
  totalGrossProfit: number
  averageOrderValue: number
  uniqueProducts: number
  totalTransactions: number
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatCell({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: string
  tone?: "default" | "warning" | "positive" | "negative"
}) {
  const toneClasses =
    tone === "warning"
      ? "text-amber-400"
      : tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
      ? "text-red-400"
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

export default function SalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router]);

  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    totalGrossProfit: 0,
    averageOrderValue: 0,
    uniqueProducts: 0,
    totalTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>(undefined)
  const [isExportCalendarOpen, setIsExportCalendarOpen] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [minQuantityFilter, setMinQuantityFilter] = useState("")
  const [maxQuantityFilter, setMaxQuantityFilter] = useState("")
  const [minPriceFilter, setMinPriceFilter] = useState("")
  const [maxPriceFilter, setMaxPriceFilter] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  
  // Return dialog state
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [preSelectedOrderId, setPreSelectedOrderId] = useState("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales`)
      const data = await response.json()

      if (response.ok) {
        setSales(data.sales || [])
        setFilteredSales(data.sales || [])
        setStats(data.stats || {
          totalSales: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          totalGrossProfit: 0,
          averageOrderValue: 0,
          uniqueProducts: 0,
          totalTransactions: 0,
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

  const fetchProductCategories = async () => {
    try {
      const response = await fetch('/api/product-categories')
      const data = await response.json()
      if (response.ok) {
        setProductCategories(data.productCategories || [])
      }
    } catch (error) {
      console.error("Error fetching product categories:", error)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchProductCategories()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...sales]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          (s.productName?.toLowerCase() || "").includes(query) ||
          (s.productSku?.toLowerCase() || "").includes(query) ||
          (s.userName?.toLowerCase() || "").includes(query) ||
          (s.customerName?.toLowerCase() || "").includes(query)
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((s) => s.productCategoryId === categoryFilter)
    }

    if (productFilter !== "all") {
      filtered = filtered.filter((s) => s.productId === productFilter)
    }

    if (userFilter !== "all") {
      filtered = filtered.filter((s) => s.userId === userFilter)
    }

    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((s) => s.paymentMethod === paymentMethodFilter)
    }

    if (minQuantityFilter) {
      const minQty = parseInt(minQuantityFilter)
      filtered = filtered.filter((s) => s.quantity >= minQty)
    }

    if (maxQuantityFilter) {
      const maxQty = parseInt(maxQuantityFilter)
      filtered = filtered.filter((s) => s.quantity <= maxQty)
    }

    if (minPriceFilter) {
      const minPrice = parseFloat(minPriceFilter)
      const discountAmount = (s: Sale) => s.totalPrice * (s.discountPercentage / 100)
      const finalPrice = (s: Sale) => s.totalPrice - discountAmount(s)
      filtered = filtered.filter((s) => finalPrice(s) >= minPrice)
    }

    if (maxPriceFilter) {
      const maxPrice = parseFloat(maxPriceFilter)
      const discountAmount = (s: Sale) => s.totalPrice * (s.discountPercentage / 100)
      const finalPrice = (s: Sale) => s.totalPrice - discountAmount(s)
      filtered = filtered.filter((s) => finalPrice(s) <= maxPrice)
    }

    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter)
      filtered = filtered.filter((s) => new Date(s.saleDate) >= fromDate)
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((s) => new Date(s.saleDate) <= toDate)
    }

    // Sort by date (latest first)
    filtered.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())

    setFilteredSales(filtered)
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, productFilter, userFilter, paymentMethodFilter, minQuantityFilter, maxQuantityFilter, minPriceFilter, maxPriceFilter, dateFromFilter, dateToFilter, sales])

  const handlePageChange = (page: number) => setCurrentPage(page)
  
  const handleProcessReturn = (orderId?: string) => {
    if (orderId) {
      setPreSelectedOrderId(orderId)
    } else {
      setPreSelectedOrderId("")
    }
    setIsReturnDialogOpen(true)
  }
  
  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setProductFilter("all")
    setUserFilter("all")
    setPaymentMethodFilter("all")
    setMinQuantityFilter("")
    setMaxQuantityFilter("")
    setMinPriceFilter("")
    setMaxPriceFilter("")
    setDateFromFilter("")
    setDateToFilter("")
  }

  const exportToCSV = async () => {
    if (!exportDateRange?.from || !exportDateRange?.to) {
      setIsExportCalendarOpen(true)
      return
    }

    try {
      setLoading(true)
      const dateFrom = format(exportDateRange.from, 'yyyy-MM-dd')
      const dateTo = format(exportDateRange.to, 'yyyy-MM-dd')
      const response = await fetch(`/api/sales?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const data = await response.json()

      if (response.ok && data.sales && data.sales.length > 0) {
        const salesToExport = data.sales
        
        // CSV headers
        const headers = [
          "Date",
          "Product Name",
          "Product SKU",
          "Category",
          "Quantity",
          "Total Price",
          "Discount %",
          "Final Price",
          "Cost",
          "Gross Profit",
          "User",
          "Customer",
          "Payment Method"
        ]

        // CSV rows
        const rows = salesToExport.map((sale: Sale) => {
          const dateObj = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate)
          const discountAmount = sale.totalPrice * (sale.discountPercentage / 100)
          const finalPrice = sale.totalPrice - discountAmount
          const totalCost = sale.costPrice * sale.quantity
          
          return [
            format(dateObj, "MMM d, yyyy HH:mm"),
            sale.productName,
            sale.productSku,
            sale.productCategory,
            sale.quantity.toString(),
            sale.totalPrice.toFixed(2),
            sale.discountPercentage.toString(),
            finalPrice.toFixed(2),
            totalCost.toFixed(2),
            sale.grossProfit.toFixed(2),
            sale.userName,
            sale.customerName || "N/A",
            sale.paymentMethod || "N/A"
          ]
        })

        // Combine headers and rows
        const csvContent = [
          headers.join(","),
          ...rows.map((row: string[]) => row.join(","))
        ].join("\n")

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        
        link.setAttribute("href", url)
        link.setAttribute("download", `sales-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setIsExportCalendarOpen(false)
      } else {
        alert("No sales data found for the selected date range")
      }
    } catch (error) {
      console.error("Error exporting sales:", error)
      alert("Failed to export sales data")
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const currentSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Get unique values for filters
  const uniqueProducts = Array.from(new Set(sales.map(s => s.productId)))
    .map(id => sales.find(s => s.productId === id))
    .filter((product): product is Sale => product !== undefined)
  
  const uniqueUsers = Array.from(new Set(sales.map(s => s.userId)))
    .map(id => sales.find(s => s.userId === id))
    .filter((user): user is Sale => user !== undefined)
  
  const uniquePaymentMethods = Array.from(new Set(sales.map(s => s.paymentMethod).filter(Boolean)))
  
  const hasActiveFilters = searchQuery || categoryFilter !== "all" || productFilter !== "all" || userFilter !== "all" || paymentMethodFilter !== "all" || minQuantityFilter || maxQuantityFilter || minPriceFilter || maxPriceFilter || dateFromFilter || dateToFilter

  return (
    <div className="font-archivo">
      <Toaster />
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
                    <BreadcrumbLink href="/dashboard/admin">Box Apparel</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Sales</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Sales</h1>
                <p className="text-sm text-muted-foreground">View and manage sales transactions</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleProcessReturn()}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Return
                </Button>
                <Popover open={isExportCalendarOpen} onOpenChange={setIsExportCalendarOpen}>
                  <PopoverTrigger>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      disabled={loading}
                      title="Export to CSV (select date range)"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarRange 
                      dateRange={exportDateRange}
                      setDateRange={setExportDateRange}
                      onApply={() => {
                        setIsExportCalendarOpen(false)
                        exportToCSV()
                      }}
                    />
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
              </div>
            </div>

            {/* Stats Strip */}
            <Card className="grid grid-cols-2 divide-x divide-y divide-border p-0 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              <StatCell icon={ShoppingCart} label="Transactions" value={loading ? "—" : String(stats.totalTransactions)} />
              <StatCell icon={DollarSign} label="Total Revenue" value={loading ? "—" : currency(stats.totalRevenue)} tone="positive" />
              <StatCell 
                icon={TrendingUp} 
                label="Gross Profit" 
                value={loading ? "—" : currency(stats.totalGrossProfit)} 
                tone={stats.totalGrossProfit >= 0 ? "positive" : "negative"} 
              />
              <StatCell icon={DollarSign} label="Avg Order Value" value={loading ? "—" : currency(stats.averageOrderValue)} />
              <StatCell icon={Users} label="Unique Products" value={loading ? "—" : String(stats.uniqueProducts)} />
              <StatCell icon={DollarSign} label="Total Discount" value={loading ? "—" : currency(stats.totalDiscount)} tone="warning" />
            </Card>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search sales..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger>
                    <Button variant="outline" size="icon" className={hasActiveFilters ? "bg-accent" : ""}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-4 max-h-[80vh] overflow-y-auto" align="end">
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
                        <label className="text-xs font-medium">Category</label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {productCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Product</label>
                        <Select value={productFilter} onValueChange={setProductFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All products</SelectItem>
                            {uniqueProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.productName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">User</label>
                        <Select value={userFilter} onValueChange={setUserFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All users</SelectItem>
                            {uniqueUsers.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.userName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Payment Method</label>
                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All payment methods</SelectItem>
                            {uniquePaymentMethods.map(method => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Quantity Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={minQuantityFilter}
                              onChange={(e) => setMinQuantityFilter(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                            <Input
                              type="number"
                              placeholder="No limit"
                              min="0"
                              value={maxQuantityFilter}
                              onChange={(e) => setMaxQuantityFilter(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Price Range (Final Price)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              step="0.01"
                              value={minPriceFilter}
                              onChange={(e) => setMinPriceFilter(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                            <Input
                              type="number"
                              placeholder="No limit"
                              min="0"
                              step="0.01"
                              value={maxPriceFilter}
                              onChange={(e) => setMaxPriceFilter(e.target.value)}
                            />
                          </div>
                        </div>
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
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sales Table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Sales History</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredSales.length} of ${stats.totalTransactions} transactions`}
                  </p>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Line Total</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        Loading sales...
                      </TableCell>
                    </TableRow>
                  ) : currentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8">
                        {hasActiveFilters ? "No sales match your filters" : "No sales yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentSales.map((sale) => {
                      const discountAmount = sale.totalPrice * (sale.discountPercentage / 100)
                      const finalPrice = sale.totalPrice - discountAmount
                      const dateObj = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate)
                      
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div className="font-mono text-xs font-medium text-muted-foreground">
                              {sale.orderId || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{format(dateObj, "MMM d, yyyy HH:mm")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.productName}</div>
                              <div className="text-xs text-muted-foreground">{sale.productSku}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{sale.productCategory}</TableCell>
                          <TableCell className="tabular-nums">{sale.quantity}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{currency(sale.unitPrice)}</TableCell>
                          <TableCell className="tabular-nums">{currency(sale.lineTotal)}</TableCell>
                          <TableCell className="tabular-nums">
                            {sale.discountPercentage > 0 ? (
                              <span className="text-amber-500">{sale.discountPercentage}%</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{currency(sale.taxAmount)}</TableCell>
                          <TableCell className="tabular-nums font-medium">{currency(sale.totalAmount)}</TableCell>
                          <TableCell>{sale.userName}</TableCell>
                          <TableCell className="text-muted-foreground">{sale.customerName || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            {sale.quantity > (sale.returnedQuantity || 0) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => sale.orderId ? handleProcessReturn(sale.orderId) : handleProcessReturn()}
                                className="h-8 w-8 p-0"
                                title="Process Return"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredSales.length)} of ${filteredSales.length}`}
                </p>
                <Pagination
                  currentPage={currentPage}  
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  className="w-full sm:w-auto justify-start sm:justify-end"
                />
              </div>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
      {/* Order Return Dialog */}
      <OrderReturnDialog
        open={isReturnDialogOpen}
        onOpenChange={setIsReturnDialogOpen}
        onReturnProcessed={fetchSales}
        toast={(message, options) => toast.add({ title: message, type: options?.type })}
        preSelectedOrderId={preSelectedOrderId}
      />
    </div>
  )
}