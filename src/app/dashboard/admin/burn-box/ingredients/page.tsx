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
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
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
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpDown,
  X,
  Trash2,
  Edit,
  Calculator,
  Copy,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Ingredient, IngredientStats, UnitOfMeasurement, UNIT_LABELS, UNIT_CONVERSIONS } from "@/types/ingredient-types"
import { IngredientDialog } from "@/components/ingredients/ingredient-dialog"

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock"

function StockStatusBadge({ status }: { status: StockStatus }) {
  const styles: Record<StockStatus, string> = {
    "In Stock": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Low Stock": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Out of Stock": "bg-red-500/10 text-red-400 border-red-500/20",
  }
  return (
    <Badge variant="outline" className={`font-normal ${styles[status]}`}>
      {status}
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

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function IngredientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState<IngredientStats>({
    totalIngredients: 0,
    totalInventoryValue: 0,
    lowStockItems: 0,
    expiringSoonItems: 0,
    outOfStockItems: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState<UnitOfMeasurement | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const fetchIngredients = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/ingredients")
      const data = await response.json()

      if (response.ok) {
        setIngredients(data.ingredients || [])
        setFilteredIngredients(data.ingredients || [])
        setStats(data.stats || {
          totalIngredients: 0,
          totalInventoryValue: 0,
          lowStockItems: 0,
          expiringSoonItems: 0,
          outOfStockItems: 0,
        })
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/ingredient-categories?activeOnly=true")
      const data = await response.json()
      if (response.ok) {
        setCategories(data.map((cat: any) => cat.name))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  useEffect(() => {
    fetchIngredients()
    fetchCategories()
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

    // Unit filter
    if (unitFilter !== "all") {
      filtered = filtered.filter((i) => i.unit === unitFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((i) => {
        const status = i.currentStock === 0 ? "Out of Stock" : i.currentStock < i.minStockLevel ? "Low Stock" : "In Stock"
        return status === statusFilter
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "sku":
          comparison = a.sku.localeCompare(b.sku)
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
  }, [searchQuery, categoryFilter, unitFilter, statusFilter, sortBy, sortOrder, ingredients])

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setUnitFilter("all")
    setStatusFilter("all")
    setSortBy("name")
    setSortOrder("asc")
  }

  const handleAddIngredient = () => {
    setEditingIngredient(null)
    setIsDialogOpen(true)
  }

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsDialogOpen(true)
  }

  const handleDeleteIngredient = (ingredient: Ingredient) => {
    setIngredientToDelete(ingredient)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteIngredient = async () => {
    if (!ingredientToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/ingredients?id=${ingredientToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setIngredientToDelete(null)
        await fetchIngredients()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete ingredient")
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error)
      alert("Failed to delete ingredient")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicateIngredient = async (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    if (!ingredient) return
    
    setEditingIngredient(ingredient)
    setIsDuplicate(true)
    setIsDialogOpen(true)
  }

  const handleIngredientSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      let url = "/api/ingredients"
      let method = "POST"
      let body = data
      
      if (isDuplicate) {
        // For duplication, use the dialog data but mark it as a duplicate
        body = { ...data, duplicateId: editingIngredient?.id }
      } else if (editingIngredient) {
        // For editing, use PUT method
        method = "PUT"
        body = { ...data, id: editingIngredient.id }
      }
      // For new ingredients, use POST with the form data

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        await fetchIngredients()
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

  const getStockStatus = (ingredient: Ingredient): StockStatus => {
    if (ingredient.currentStock === 0) return "Out of Stock"
    if (ingredient.currentStock < ingredient.minStockLevel) return "Low Stock"
    return "In Stock"
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || unitFilter !== "all" || statusFilter !== "all"

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
                  <BreadcrumbPage>Ingredients</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Ingredients</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage ingredient inventory and bulk tracking
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search ingredients..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
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
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium">Unit of Measurement</label>
                          <Select value={unitFilter} onValueChange={(value) => setUnitFilter(value as UnitOfMeasurement | "all")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All units</SelectItem>
                              {Object.entries(UNIT_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium">Stock Status</label>
                          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StockStatus | "all")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All statuses</SelectItem>
                              <SelectItem value="In Stock">In Stock</SelectItem>
                              <SelectItem value="Low Stock">Low Stock</SelectItem>
                              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
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
                                <SelectItem value="sku">SKU</SelectItem>
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
                    onClick={fetchIngredients}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={handleAddIngredient} className="flex-1 sm:flex-none">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Ingredient</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div> 
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                  label="Total Value"
                  value={currency(stats.totalInventoryValue)}
                  tone="positive"
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
                  icon={AlertTriangle}
                  label="Expiring Soon"
                  value={stats.expiringSoonItems.toString()}
                  tone="warning"
                />
              </Card>
              <Card>
                <StatCell
                  icon={AlertTriangle}
                  label="Out of Stock"
                  value={stats.outOfStockItems.toString()}
                  tone="warning"
                />
              </Card>
            </div>

            {/* Ingredients table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Ingredients Inventory</h2>
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
                        Loading ingredients...
                      </TableCell>
                    </TableRow>
                  ) : filteredIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        {hasActiveFilters ? "No ingredients match your filters" : "No ingredients yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIngredients.map((ingredient) => (
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
                        <TableCell className="text-sm font-medium">
                          {ingredient.currentStock} {ingredient.unit}
                          {ingredient.bulkQuantity && ingredient.bulkUnit && (
                            <div className="text-xs text-muted-foreground">
                              ({ingredient.bulkQuantity} {UNIT_LABELS[ingredient.bulkUnit]})
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{ingredient.minStockLevel}</TableCell>
                        <TableCell className="text-sm">{currency(ingredient.costPerUnit)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {currency(ingredient.currentStock * ingredient.costPerUnit)}
                        </TableCell>
                        <TableCell>
                          <StockStatusBadge status={getStockStatus(ingredient)} />
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
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateIngredient(ingredient.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calculator className="h-4 w-4 mr-2" />
                                Unit Conversion
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteIngredient(ingredient)}>
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
      
      <IngredientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleIngredientSubmit}
        editData={editingIngredient}
        isLoading={isSubmitting}
        isDuplicate={isDuplicate}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={ingredientToDelete?.name || ""}
        itemType="Ingredient"
        onConfirm={confirmDeleteIngredient}
        isLoading={isDeleting}
      />
    </div>
  )
}