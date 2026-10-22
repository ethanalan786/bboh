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
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Package,
  DollarSign,
  Calendar,
  Eye,
  Upload,
  Plus,
  ArrowUpDown,
  X,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type PurchaseOrderStatus = "PENDING" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED"

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplier: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  status: PurchaseOrderStatus
  orderDate: Date
  expectedDate: Date | null
  receivedDate: Date | null
  totalAmount: number
  notes: string | null
  items: any
  invoiceCount: number
  createdAt: Date
  updatedAt: Date
}

interface Stats {
  totalOrders: number
  pendingOrders: number
  orderedOrders: number
  receivedOrders: number
  totalValue: number
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const styles: Record<PurchaseOrderStatus, { bg: string; text: string; border: string; icon: React.ElementType }> = {
    PENDING: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      icon: Clock
    },
    ORDERED: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
      icon: Package
    },
    PARTIALLY_RECEIVED: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20",
      icon: AlertCircle
    },
    RECEIVED: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      icon: CheckCircle
    },
    CANCELLED: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      icon: XCircle
    }
  }

  const { bg, text, border, icon: Icon } = styles[status]

  return (
    <Badge variant="outline" className={`font-normal ${bg} ${text} ${border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status.replace('_', ' ')}
    </Badge>
  )
}

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

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    orderedOrders: 0,
    receivedOrders: 0,
    totalValue: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("orderDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/purchase-orders`)
      const data = await response.json()

      if (response.ok) {
        setPurchaseOrders(data.purchaseOrders || [])
        setFilteredOrders(data.purchaseOrders || [])
        setStats({
          totalOrders: data.stats?.totalOrders || 0,
          pendingOrders: data.stats?.pendingOrders || 0,
          orderedOrders: data.stats?.orderedOrders || 0,
          receivedOrders: data.stats?.receivedOrders || 0,
          totalValue: data.stats?.totalValue || 0,
        })
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...purchaseOrders]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          (order.orderNumber?.toLowerCase() || "").includes(query) ||
          (order.supplier?.name?.toLowerCase() || "").includes(query) ||
          (order.supplier?.email?.toLowerCase() || "").includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "orderNumber":
          comparison = a.orderNumber.localeCompare(b.orderNumber)
          break
        case "orderDate":
          comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          break
        case "expectedDate":
          comparison = new Date(a.expectedDate || 0).getTime() - new Date(b.expectedDate || 0).getTime()
          break
        case "totalAmount":
          comparison = a.totalAmount - b.totalAmount
          break
        case "supplier":
          comparison = a.supplier.name.localeCompare(b.supplier.name)
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, sortBy, sortOrder, purchaseOrders])

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortBy("orderDate")
    setSortOrder("desc")
  }

  const exportToCSV = () => {
    if (filteredOrders.length === 0) return

    const headers = [
      "Order Number",
      "Supplier",
      "Status",
      "Order Date",
      "Expected Date",
      "Received Date",
      "Total Amount",
      "Invoice Count",
      "Notes"
    ]

    const rows = filteredOrders.map(order => [
      order.orderNumber,
      order.supplier.name,
      order.status,
      format(new Date(order.orderDate), "MMM d, yyyy"),
      order.expectedDate ? format(new Date(order.expectedDate), "MMM d, yyyy") : "",
      order.receivedDate ? format(new Date(order.receivedDate), "MMM d, yyyy") : "",
      order.totalAmount.toFixed(2),
      order.invoiceCount.toString(),
      order.notes || ""
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `purchase-orders-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all"

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/admin/purchases/invoices/${orderId}`)
  }

  return (
    <div className="font-archivo">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard/admin">Purchases</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Invoices</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Purchase Orders & Invoices</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage purchase orders, upload invoices, and track inventory receipts.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search orders..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="icon" className={hasActiveFilters ? "bg-accent" : ""}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-4" align="end">
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
                        <label className="text-xs font-medium">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="ORDERED">Ordered</SelectItem>
                            <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                            <SelectItem value="RECEIVED">Received</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Sort by</label>
                        <div className="flex gap-2">
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="orderNumber">Order Number</SelectItem>
                              <SelectItem value="orderDate">Order Date</SelectItem>
                              <SelectItem value="expectedDate">Expected Date</SelectItem>
                              <SelectItem value="totalAmount">Total Amount</SelectItem>
                              <SelectItem value="supplier">Supplier</SelectItem>
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
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={exportToCSV}
                  disabled={filteredOrders.length === 0}
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button className="flex-1 sm:flex-none" onClick={() => router.push('/dashboard/admin/purchases/invoices/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Button>
                </div>

              </div>
            </div>

            {/* Stats strip */}
            <Card className="grid grid-cols-2 divide-x divide-y divide-border p-0 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
              <StatCell icon={FileText} label="Total Orders" value={loading ? "—" : String(stats.totalOrders)} />
              <StatCell icon={Clock} label="Pending" value={loading ? "—" : String(stats.pendingOrders)} tone="warning" />
              <StatCell icon={Package} label="Ordered" value={loading ? "—" : String(stats.orderedOrders)} />
              <StatCell icon={CheckCircle} label="Received" value={loading ? "—" : String(stats.receivedOrders)} tone="positive" />
              <StatCell icon={DollarSign} label="Total Value" value={loading ? "—" : currency(stats.totalValue)} tone="positive" />
            </Card>

            {/* Purchase Orders Table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Purchase Orders</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredOrders.length} of ${stats.totalOrders} orders`}
                  </p>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {filteredOrders.length} filtered
                    </Badge>
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
                    <TableHead>Order Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading purchase orders...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {hasActiveFilters ? "No orders match your filters" : "No purchase orders yet — create your first one to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.supplier.name}</p>
                            {order.supplier.email && (
                              <p className="text-xs text-muted-foreground">{order.supplier.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.orderDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {order.expectedDate ? format(new Date(order.expectedDate), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {currency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {order.invoiceCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/purchases/invoices/${order.id}/upload`)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Invoice
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
    </div>
  )
}