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
  Package,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  X,
  Calculator,
  AlertTriangle,
  Download,
  Plus,
  Edit,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Ingredient } from "@/types/ingredient-types"
import { UNIT_LABELS } from "@/types/ingredient-types"
import { IngredientDialog } from "@/components/ingredients/ingredient-dialog"

interface IngredientUsage {
  ingredientId: string
  ingredientName: string
  ingredientSku: string
  unit: string
  totalUsed: number
  totalCost: number
  recipeCount: number
  lastUsed: Date
}

interface InventoryStats {
  totalIngredients: number
  totalInventoryValue: number
  totalIngredientCost: number
  lowStockItems: number
  highUsageItems: number
  monthlyUsage: number
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

export default function BurnBoxInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([])
  const [ingredientUsage, setIngredientUsage] = useState<IngredientUsage[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalIngredients: 0,
    totalInventoryValue: 0,
    totalIngredientCost: 0,
    lowStockItems: 0,
    highUsageItems: 0,
    monthlyUsage: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const [ingredientsResponse, usageResponse] = await Promise.all([
        fetch("/api/ingredients"),
        fetch("/api/ingredient-usage")
      ])

      const ingredientsData = await ingredientsResponse.json()
      const usageData = await usageResponse.json()

      if (ingredientsResponse.ok) {
        setIngredients(ingredientsData.ingredients || [])
        setFilteredIngredients(ingredientsData.ingredients || [])
        setStats(prev => ({
          ...prev,
          totalIngredients: ingredientsData.stats?.totalIngredients || 0,
          totalInventoryValue: ingredientsData.stats?.totalInventoryValue || 0,
          lowStockItems: ingredientsData.stats?.lowStockItems || 0,
        }))
      }

      if (usageResponse.ok) {
        setIngredientUsage(usageData.usage || [])
        setStats(prev => ({
          ...prev,
          totalIngredientCost: usageData.stats?.totalIngredientCost || 0,
          highUsageItems: usageData.stats?.highUsageItems || 0,
          monthlyUsage: usageData.stats?.monthlyUsage || 0,
        }))
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventoryData()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...ingredients]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          (i.name?.toLowerCase() || "").includes(query) ||
          (i.sku?.toLowerCase() || "").includes(query) ||
          (i.category?.toLowerCase() || "").includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((i) => i.category === categoryFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "stock":
          comparison = a.currentStock - b.currentStock
          break
        case "cost":
          comparison = a.costPerUnit - b.costPerUnit
          break
        case "value":
          comparison = (a.currentStock * a.costPerUnit) - (b.currentStock * b.costPerUnit)
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredIngredients(filtered)
  }, [searchQuery, categoryFilter, sortBy, sortOrder, ingredients])

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setSortBy("name")
    setSortOrder("asc")
  }

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock === 0) return { status: "Out of Stock", color: "text-red-400" }
    if (ingredient.currentStock < ingredient.minStockLevel) return { status: "Low Stock", color: "text-amber-400" }
    return { status: "In Stock", color: "text-emerald-400" }
  }

  const getCategories = () => {
    const categories = new Set(ingredients.map(i => i.category))
    return Array.from(categories)
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all"

  const handleAddIngredient = () => {
    setEditingIngredient(null)
    setIsDialogOpen(true)
  }

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsDialogOpen(true)
  }

  const handleIngredientSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      const url = "/api/ingredients"
      const method = editingIngredient ? "PUT" : "POST"
      
      const body = editingIngredient ? { ...data, id: editingIngredient.id } : data

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        await fetchInventoryData()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to save ingredient")
      }
    } catch (error) {
      console.error("Error saving ingredient:", error)
      alert("Failed to save ingredient")
    } finally {
      setIsSubmitting(false)
    }
  }

  const exportToCSV = () => {
    if (filteredIngredients.length === 0) return

    const headers = [
      "Name",
      "SKU",
      "Category",
      "Unit",
      "Current Stock",
      "Min Stock Level",
      "Cost Per Unit",
      "Total Value",
      "Status"
    ]

    const rows = filteredIngredients.map(ingredient => {
      const stockStatus = getStockStatus(ingredient)
      return [
        `"${ingredient.name.replace(/"/g, '""')}"`,
        ingredient.sku,
        ingredient.category,
        UNIT_LABELS[ingredient.unit],
        ingredient.currentStock.toString(),
        ingredient.minStockLevel.toString(),
        ingredient.costPerUnit.toFixed(2),
        (ingredient.currentStock * ingredient.costPerUnit).toFixed(2),
        stockStatus.status
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `burnbox-inventory-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
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
                  <BreadcrumbPage>Inventory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Burn Box Inventory</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Track ingredient costs, automatic deductions, and usage patterns
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search inventory..." 
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
                        <label className="text-xs font-medium">Category</label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {getCategories().map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
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
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="stock">Stock Level</SelectItem>
                              <SelectItem value="cost">Cost per Unit</SelectItem>
                              <SelectItem value="value">Total Value</SelectItem>
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
                  onClick={fetchInventoryData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={exportToCSV}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button onClick={handleAddIngredient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card>
                <StatCell
                  icon={Package}
                  label="Total Ingredients"
                  value={stats.totalIngredients.toString()}
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingUp}
                  label="Inventory Value"
                  value={currency(stats.totalInventoryValue)}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={Calculator}
                  label="Total Cost"
                  value={currency(stats.totalIngredientCost)}
                />
              </Card>
              <Card>
                <StatCell
                  icon={AlertTriangle}
                  label="Low Stock"
                  value={stats.lowStockItems.toString()}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingDown}
                  label="High Usage"
                  value={stats.highUsageItems.toString()}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingUp}
                  label="Monthly Usage"
                  value={currency(stats.monthlyUsage)}
                  tone="positive"
                />
              </Card>
            </div>

            {/* Ingredients inventory table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Ingredient Inventory</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredIngredients.length} ingredients`}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Loading inventory...
                      </TableCell>
                    </TableRow>
                  ) : filteredIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        {hasActiveFilters ? "No ingredients match your filters" : "No ingredients in inventory"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIngredients.map((ingredient) => {
                      const stockStatus = getStockStatus(ingredient)
                      return (
                        <TableRow key={ingredient.id}>
                          <TableCell>
                            <div className="font-medium">{ingredient.name}</div>
                            {ingredient.description && (
                              <div className="text-xs text-muted-foreground">{ingredient.description}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{ingredient.sku}</TableCell>
                          <TableCell className="text-sm">{ingredient.category}</TableCell>
                          <TableCell className="text-sm">{UNIT_LABELS[ingredient.unit]}</TableCell>
                          <TableCell className="text-sm font-medium">{ingredient.currentStock}</TableCell>
                          <TableCell className="text-sm">{ingredient.minStockLevel}</TableCell>
                          <TableCell className="text-sm">{currency(ingredient.costPerUnit)}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {currency(ingredient.currentStock * ingredient.costPerUnit)}
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditIngredient(ingredient)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Ingredient
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calculator className="h-4 w-4 mr-2" />
                                  View Cost Analysis
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <TrendingDown className="h-4 w-4 mr-2" />
                                  View Usage History
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Ingredient usage tracking */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Ingredient Usage Tracking</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track automatic deductions and ingredient consumption
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Total Used</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Recipe Count</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading usage data...
                      </TableCell>
                    </TableRow>
                  ) : ingredientUsage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No usage data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingredientUsage.map((usage) => (
                      <TableRow key={usage.ingredientId}>
                        <TableCell className="font-medium">{usage.ingredientName}</TableCell>
                        <TableCell className="text-sm">{usage.ingredientSku}</TableCell>
                        <TableCell className="text-sm">{usage.unit}</TableCell>
                        <TableCell className="text-sm font-medium">{usage.totalUsed.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{currency(usage.totalCost)}</TableCell>
                        <TableCell className="text-sm">{usage.recipeCount}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(usage.lastUsed), "MMM d, yyyy")}
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
      
      <IngredientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleIngredientSubmit}
        editData={editingIngredient}
        isLoading={isSubmitting}
      />
    </div>
  )
}