"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster } from "@/components/ui/toast"
import { format } from "date-fns"
import { Calendar, Download, Filter, RefreshCw, Search, User, X } from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { type DateRange } from "react-day-picker"
import { CalendarRange } from "@/components/calendar-range"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"

interface StockTransaction {
  id: string
  productId: string
  productName: string
  productSku: string
  stockLevel: number
  date: Date
  userId: string
  userName: string
  reason: string
  transactionType: string
  previousStock: number
  newStock: number
  createdAt: Date
}

function TransactionTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    "STOCK_ADDED": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "STOCK_ADJUSTED": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "SALE": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "OPENING_STOCK": "bg-green-500/10 text-green-400 border-green-500/20",
    "STOCK_RETURN": "bg-red-500/10 text-red-400 border-red-500/20",
  }
  const labels: Record<string, string> = {
    "STOCK_ADDED": "Stock Added",
    "STOCK_ADJUSTED": "Stock Adjusted",
    "SALE": "Sale",
    "OPENING_STOCK": "Opening Stock",
    "STOCK_RETURN": "Return",
  }
  return (
    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[type] || styles["STOCK_ADDED"]}`}>
      {labels[type] || type}
    </div>
  )
}

export default function ProductInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router]);

  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>(undefined)
  const [isExportCalendarOpen, setIsExportCalendarOpen] = useState(false)
  
  // Transaction filter states
  const [transactionSearch, setTransactionSearch] = useState("")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stock/transactions`)
      const data = await response.json()

      if (response.ok) {
        setTransactions(data.transactions || [])
        setFilteredTransactions(data.transactions || [])
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...transactions]

    if (transactionSearch) {
      const query = transactionSearch.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.productName.toLowerCase().includes(query) ||
          t.productSku.toLowerCase().includes(query) ||
          t.userName.toLowerCase().includes(query) ||
          t.reason.toLowerCase().includes(query)
      )
    }

    if (transactionTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.transactionType === transactionTypeFilter)
    }

    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter)
      filtered = filtered.filter((t) => new Date(t.date) >= fromDate)
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((t) => new Date(t.date) <= toDate)
    }

    // Sort by date (latest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredTransactions(filtered)
    setTransactionCurrentPage(1)
  }, [transactionSearch, transactionTypeFilter, dateFromFilter, dateToFilter, transactions])

  const handleTransactionPageChange = (page: number) => setTransactionCurrentPage(page)
  const clearTransactionFilters = () => {
    setTransactionSearch("")
    setTransactionTypeFilter("all")
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
      const response = await fetch(`/api/stock/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const data = await response.json()

      if (response.ok && data.transactions && data.transactions.length > 0) {
        const transactionsToExport = data.transactions
        
        // Format transaction type for better readability
        const formatTransactionType = (type: string) => {
          const typeLabels: Record<string, string> = {
            "STOCK_ADDED": "Stock Added",
            "STOCK_ADJUSTED": "Stock Adjusted",
            "SALE": "Sale",
            "OPENING_STOCK": "Opening Stock",
            "STOCK_RETURN": "Return"
          }
          return typeLabels[type] || type
        }

        // CSV headers
        const headers = [
          "Date",
          "Product Name",
          "Product SKU",
          "Transaction Type",
          "Previous Stock",
          "New Stock",
          "Change",
          "User",
          "Reason"
        ]

        // CSV rows
        const rows = transactionsToExport.map((transaction: StockTransaction) => {
          const change = transaction.transactionType === "SALE" 
            ? `-${transaction.previousStock}` 
            : (transaction.newStock > transaction.previousStock ? "+" : "") + (transaction.newStock - transaction.previousStock)
          
          const dateObj = transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
          
          return [
            format(dateObj, "MMM d, yyyy HH:mm"),
            transaction.productName,
            transaction.productSku,
            formatTransactionType(transaction.transactionType),
            transaction.previousStock.toString(),
            transaction.newStock.toString(),
            change,
            transaction.userName,
            `"${transaction.reason.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
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
        link.setAttribute("download", `inventory-transactions-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setIsExportCalendarOpen(false)
      } else {
        alert("No transaction data found for the selected date range")
      }
    } catch (error) {
      console.error("Error exporting transactions:", error)
      alert("Failed to export transaction data")
    } finally {
      setLoading(false)
    }
  }

  const transactionItemsPerPage = 10
  const transactionTotalPages = Math.ceil(filteredTransactions.length / transactionItemsPerPage)
  const currentTransactions = filteredTransactions.slice(
    (transactionCurrentPage - 1) * transactionItemsPerPage,
    transactionCurrentPage * transactionItemsPerPage
  )

  const hasActiveTransactionFilters = transactionSearch || transactionTypeFilter !== "all" || dateFromFilter || dateToFilter

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
                    <BreadcrumbLink href="/dashboard/admin">Box Apparel</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Transaction History</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Transaction History</h1>
                <p className="text-sm text-muted-foreground">View stock adjustments and inventory changes</p>
              </div>
              <div className="flex gap-2">
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
                  onClick={fetchTransactions}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Transactions header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-9"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger>
                    <Button variant="outline" size="icon" className={hasActiveTransactionFilters ? "bg-accent" : ""}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Filters</h3>
                        {hasActiveTransactionFilters && (
                          <Button variant="ghost" size="sm" onClick={clearTransactionFilters}>
                            <X className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Transaction Type</label>
                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="STOCK_ADDED">Stock Added</SelectItem>
                            <SelectItem value="STOCK_ADJUSTED">Stock Adjusted</SelectItem>
                            <SelectItem value="SALE">Sale</SelectItem>
                            <SelectItem value="OPENING_STOCK">Opening Stock</SelectItem>
                            <SelectItem value="STOCK_RETURN">Return</SelectItem>
                          </SelectContent>
                        </Select>
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

            {/* Transactions table */}
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Previous Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : currentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(new Date(transaction.date), "MMM d, yyyy HH:mm")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.productName}</div>
                            <div className="text-xs text-muted-foreground">{transaction.productSku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TransactionTypeBadge type={transaction.transactionType} />
                        </TableCell>
                        <TableCell>{transaction.previousStock}</TableCell>
                        <TableCell className="font-medium">{transaction.newStock}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${transaction.transactionType === "SALE" ? "text-red-500" : transaction.newStock > transaction.previousStock ? "text-green-500" : "text-red-500"}`}>
                            {transaction.transactionType === "SALE" 
                              ? `-${transaction.previousStock}` 
                              : (transaction.newStock > transaction.previousStock ? "+" : "") + (transaction.newStock - transaction.previousStock)
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{transaction.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground truncate" title={transaction.reason}>
                            {transaction.reason}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : `Showing ${(transactionCurrentPage - 1) * transactionItemsPerPage + 1}–${Math.min(transactionCurrentPage * transactionItemsPerPage, filteredTransactions.length)} of ${filteredTransactions.length}`}
                </p>
                <Pagination
                  currentPage={transactionCurrentPage}  
                  totalPages={transactionTotalPages}
                  onPageChange={handleTransactionPageChange}
                  className="w-full sm:w-auto justify-start sm:justify-end"
                />
              </div>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
      <Toaster />
    </div>
  )
}