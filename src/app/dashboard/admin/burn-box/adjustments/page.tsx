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
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  X,
  Trash2,
  Eye,
  Download,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { IngredientAdjustment, AdjustmentStats, AdjustmentType, ADJUSTMENT_TYPE_LABELS, ADJUSTMENT_TYPE_COLORS } from "@/types/adjustment-types"
import { AdjustmentDialog } from "@/components/adjustments/adjustment-dialog"
import { AdjustmentViewDialog } from "@/components/adjustments/adjustment-view-dialog"
import { currency } from "@/lib/utils"

function AdjustmentTypeBadge({ type }: { type: AdjustmentType }) {
  return (
    <Badge variant="outline" className={`font-normal ${ADJUSTMENT_TYPE_COLORS[type]}`}>
      {ADJUSTMENT_TYPE_LABELS[type]}
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

export default function AdjustmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [adjustments, setAdjustments] = useState<IngredientAdjustment[]>([])
  const [filteredAdjustments, setFilteredAdjustments] = useState<IngredientAdjustment[]>([])
  const [stats, setStats] = useState<AdjustmentStats>({
    totalAdjustments: 0,
    totalWastage: 0,
    totalDamage: 0,
    totalExpiry: 0,
    totalDiscrepancies: 0,
    unresolvedDiscrepancies: 0,
    totalCostImpact: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<AdjustmentType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "resolved" | "unresolved">("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<IngredientAdjustment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const fetchAdjustments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/ingredient-adjustments")
      const data = await response.json()

      if (response.ok) {
        setAdjustments(data.adjustments || [])
        setFilteredAdjustments(data.adjustments || [])
        setStats(data.stats || {
          totalAdjustments: 0,
          totalWastage: 0,
          totalDamage: 0,
          totalExpiry: 0,
          totalDiscrepancies: 0,
          unresolvedDiscrepancies: 0,
          totalCostImpact: 0,
        })
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching adjustments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdjustments()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...adjustments]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          (a.ingredientName?.toLowerCase() || "").includes(query) ||
          (a.ingredientSku?.toLowerCase() || "").includes(query) ||
          (a.reason?.toLowerCase() || "").includes(query) ||
          (a.userName?.toLowerCase() || "").includes(query)
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.adjustmentType === typeFilter)
    }

    // Status filter
    if (statusFilter === "resolved") {
      filtered = filtered.filter((a) => a.resolved)
    } else if (statusFilter === "unresolved") {
      filtered = filtered.filter((a) => !a.resolved)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "ingredient":
          comparison = a.ingredientName.localeCompare(b.ingredientName)
          break
        case "quantity":
          comparison = a.quantity - b.quantity
          break
        case "cost":
          comparison = a.costImpact - b.costImpact
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredAdjustments(filtered)
  }, [searchQuery, typeFilter, statusFilter, sortBy, sortOrder, adjustments])

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setStatusFilter("all")
    setSortBy("date")
    setSortOrder("desc")
  }

  const hasActiveFilters = searchQuery || typeFilter !== "all" || statusFilter !== "all"

  const fetchIngredients = async () => {
    try {
      const response = await fetch("/api/ingredients")
      const data = await response.json()
      if (response.ok) {
        setAvailableIngredients(data.ingredients || [])
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error)
    }
  }

  const handleRecordAdjustment = () => {
    fetchIngredients()
    setIsDialogOpen(true)
  }

  const handleAdjustmentSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      // Get user info
      const sessionResponse = await fetch("/api/auth/session")
      const sessionData = await sessionResponse.json()
      const userId = sessionData.user?.id
      const userName = sessionData.user?.name

      const response = await fetch("/api/ingredient-adjustments", {
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
        await fetchAdjustments()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to record adjustment")
      }
    } catch (error) {
      console.error("Error recording adjustment:", error)
      alert("Failed to record adjustment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAdjustment = async (adjustmentId: string) => {
    if (!confirm("Are you sure you want to delete this adjustment? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/ingredient-adjustments?id=${adjustmentId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchAdjustments()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete adjustment")
      }
    } catch (error) {
      console.error("Error deleting adjustment:", error)
      alert("Failed to delete adjustment")
    }
  }

  const handleViewDetails = (adjustment: IngredientAdjustment) => {
    setSelectedAdjustment(adjustment)
    setIsViewDialogOpen(true)
  }

  const handleMarkResolved = async (adjustmentId: string) => {
    try {
      const response = await fetch("/api/ingredient-adjustments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: adjustmentId,
          resolved: true,
        }),
      })

      if (response.ok) {
        await fetchAdjustments()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to mark as resolved")
      }
    } catch (error) {
      console.error("Error marking as resolved:", error)
      alert("Failed to mark as resolved")
    }
  }

  const exportToCSV = () => {
    if (filteredAdjustments.length === 0) return

    const headers = [
      "Date",
      "Ingredient",
      "SKU",
      "Type",
      "Previous Stock",
      "New Stock",
      "Quantity",
      "Unit",
      "Cost Impact",
      "Reason",
      "User",
      "Discrepancy",
      "Resolved"
    ]

    const rows = filteredAdjustments.map(adjustment => [
      format(new Date(adjustment.date), "MMM d, yyyy HH:mm"),
      `"${adjustment.ingredientName.replace(/"/g, '""')}"`,
      adjustment.ingredientSku,
      ADJUSTMENT_TYPE_LABELS[adjustment.adjustmentType],
      adjustment.previousStock.toString(),
      adjustment.newStock.toString(),
      adjustment.quantity.toString(),
      adjustment.unit,
      adjustment.costImpact.toFixed(2),
      `"${adjustment.reason.replace(/"/g, '""')}"`,
      adjustment.userName,
      adjustment.isDiscrepancy ? "Yes" : "No",
      adjustment.resolved ? "Yes" : "No"
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `ingredient-adjustments-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
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
                  <BreadcrumbPage>Adjustments</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Ingredient Adjustments</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage wastage, damage, expiry, physical count adjustments, and stock discrepancies
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search adjustments..." 
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
                        <label className="text-xs font-medium">Adjustment Type</label>
                        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AdjustmentType | "all")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Resolution Status</label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "resolved" | "unresolved")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="unresolved">Unresolved</SelectItem>
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
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="ingredient">Ingredient</SelectItem>
                              <SelectItem value="quantity">Quantity</SelectItem>
                              <SelectItem value="cost">Cost Impact</SelectItem>
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
                  onClick={fetchAdjustments}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={exportToCSV}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button onClick={handleRecordAdjustment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Adjustment
                </Button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card>
                <StatCell
                  icon={AlertTriangle}
                  label="Total Adjustments"
                  value={stats.totalAdjustments.toString()}
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingDown}
                  label="Total Wastage"
                  value={currency(stats.totalWastage)}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={AlertTriangle}
                  label="Total Damage"
                  value={currency(stats.totalDamage)}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={AlertTriangle}
                  label="Total Expiry"
                  value={currency(stats.totalExpiry)}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={XCircle}
                  label="Discrepancies"
                  value={stats.totalDiscrepancies.toString()}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={XCircle}
                  label="Unresolved"
                  value={stats.unresolvedDiscrepancies.toString()}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingDown}
                  label="Cost Impact"
                  value={currency(stats.totalCostImpact)}
                  tone="warning"
                />
              </Card>
            </div>

            {/* Adjustments table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Adjustment History</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredAdjustments.length} adjustments`}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Previous Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Discrepancy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        Loading adjustments...
                      </TableCell>
                    </TableRow>
                  ) : filteredAdjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        {hasActiveFilters ? "No adjustments match your filters" : "No adjustments recorded"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="text-sm">
                          {format(new Date(adjustment.date), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{adjustment.ingredientName}</div>
                          <div className="text-xs text-muted-foreground">{adjustment.ingredientSku}</div>
                        </TableCell>
                        <TableCell>
                          <AdjustmentTypeBadge type={adjustment.adjustmentType} />
                        </TableCell>
                        <TableCell className="text-sm">{adjustment.previousStock}</TableCell>
                        <TableCell className="text-sm font-medium">{adjustment.newStock}</TableCell>
                        <TableCell className="text-sm">{adjustment.quantity} {adjustment.unit}</TableCell>
                        <TableCell className="text-sm font-medium text-red-400">
                          {currency(adjustment.costImpact)}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={adjustment.reason}>
                          {adjustment.reason}
                        </TableCell>
                        <TableCell className="text-sm">{adjustment.userName}</TableCell>
                        <TableCell>
                          {adjustment.isDiscrepancy ? (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {adjustment.resolved ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unresolved
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onSelect={() => handleViewDetails(adjustment)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!adjustment.resolved && adjustment.isDiscrepancy && (
                                <DropdownMenuItem onClick={() => handleMarkResolved(adjustment.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAdjustment(adjustment.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
      
      <AdjustmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAdjustmentSubmit}
        isLoading={isSubmitting}
        availableIngredients={availableIngredients}
      />
      
      <AdjustmentViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        adjustment={selectedAdjustment}
      />
    </div>
  )
}