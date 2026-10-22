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
  BookOpen,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  X,
  Trash2,
  Edit,
  Copy,
  Eye,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Recipe, RecipeStats, RECIPE_CATEGORIES } from "@/types/recipe-types"
import { UNIT_LABELS } from "@/types/ingredient-types"
import { RecipeDialog } from "@/components/recipes/recipe-dialog"

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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

export default function RecipesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [stats, setStats] = useState<RecipeStats>({
    totalRecipes: 0,
    activeRecipes: 0,
    averageCost: 0,
    averageProfitMargin: 0,
    totalRecipesValue: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([])
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/recipes")
      const data = await response.json()

      if (response.ok) {
        setRecipes(data.recipes || [])
        setFilteredRecipes(data.recipes || [])
        setStats(data.stats || {
          totalRecipes: 0,
          activeRecipes: 0,
          averageCost: 0,
          averageProfitMargin: 0,
          totalRecipesValue: 0,
        })
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...recipes]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          (r.name?.toLowerCase() || "").includes(query) ||
          (r.sku?.toLowerCase() || "").includes(query) ||
          (r.category?.toLowerCase() || "").includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => 
        statusFilter === "active" ? r.isActive : !r.isActive
      )
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
        case "cost":
          comparison = a.totalCost - b.totalCost
          break
        case "price":
          comparison = a.sellingPrice - b.sellingPrice
          break
        case "profit":
          comparison = a.profitPerUnit - b.profitPerUnit
          break
        case "margin":
          comparison = a.profitMargin - b.profitMargin
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredRecipes(filtered)
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder, recipes])

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setSortBy("name")
    setSortOrder("asc")
  }

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

  const handleAddRecipe = () => {
    setEditingRecipe(null)
    setIsDuplicate(false)
    fetchIngredients()
    setIsDialogOpen(true)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setIsDuplicate(false)
    fetchIngredients()
    setIsDialogOpen(true)
  }

  const handleDuplicateRecipe = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return
    
    setEditingRecipe(recipe)
    setIsDuplicate(true)
    fetchIngredients()
    setIsDialogOpen(true)
  }

  const handleDeleteRecipe = (recipe: Recipe) => {
    setRecipeToDelete(recipe)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/recipes?id=${recipeToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setRecipeToDelete(null)
        await fetchRecipes()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete recipe")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)
      alert("Failed to delete recipe")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRecipeSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      let url = "/api/recipes"
      let method = "POST"
      let body = data
      
      if (isDuplicate) {
        // For duplication, send the original recipe ID
        body = { duplicateId: editingRecipe?.id }
      } else if (editingRecipe) {
        // For editing, use PUT method
        method = "PUT"
        body = { ...data, id: editingRecipe.id }
      }
      // For new recipes, use POST with the form data

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        await fetchRecipes()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to save recipe")
      }
    } catch (error) {
      console.error("Error saving recipe:", error)
      alert("Failed to save recipe")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || statusFilter !== "all"

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
                  <BreadcrumbPage>Recipes</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Recipes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage smoothie recipes, ingredient quantities, and recipe costing
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search recipes..." 
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
                            {RECIPE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Status</label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
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
                              <SelectItem value="cost">Total Cost</SelectItem>
                              <SelectItem value="price">Selling Price</SelectItem>
                              <SelectItem value="profit">Profit per Unit</SelectItem>
                              <SelectItem value="margin">Profit Margin</SelectItem>
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
                  onClick={fetchRecipes}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleAddRecipe} className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Button>
                                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <StatCell
                  icon={BookOpen}
                  label="Total Recipes"
                  value={stats.totalRecipes.toString()}
                />
              </Card>
              <Card>
                <StatCell
                  icon={BookOpen}
                  label="Active Recipes"
                  value={stats.activeRecipes.toString()}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={DollarSign}
                  label="Average Cost"
                  value={currency(stats.averageCost)}
                />
              </Card>
              <Card>
                <StatCell
                  icon={TrendingUp}
                  label="Avg Profit Margin"
                  value={percent(stats.averageProfitMargin)}
                  tone="positive"
                />
              </Card>
              <Card>
                <StatCell
                  icon={DollarSign}
                  label="Total Value"
                  value={currency(stats.totalRecipesValue)}
                  tone="positive"
                />
              </Card>
            </div>

            {/* Recipes table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Recipe Collection</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredRecipes.length} recipes`}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Ingredients</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Profit/Unit</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Loading recipes...
                      </TableCell>
                    </TableRow>
                  ) : filteredRecipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        {hasActiveFilters ? "No recipes match your filters" : "No recipes yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipes.map((recipe) => (
                      <TableRow key={recipe.id}>
                        <TableCell>
                          <div className="font-medium">{recipe.name}</div>
                          {recipe.description && (
                            <div className="text-xs text-muted-foreground">{recipe.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{recipe.sku}</TableCell>
                        <TableCell className="text-sm">{recipe.category}</TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} items</div>
                          <div className="text-xs text-muted-foreground">
                            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
                              ? recipe.ingredients.slice(0, 2).map((i: any) => i.ingredientName || i.name).join(", ")
                              : "No ingredients"
                            }
                            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 2 && "..."}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{currency(recipe.totalCost)}</TableCell>
                        <TableCell className="text-sm font-medium">{currency(recipe.sellingPrice)}</TableCell>
                        <TableCell className="text-sm font-medium text-emerald-400">
                          {currency(recipe.profitPerUnit)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={recipe.profitMargin >= 20 ? "text-emerald-400" : recipe.profitMargin >= 10 ? "text-amber-400" : "text-red-400"}>
                            {percent(recipe.profitMargin)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={recipe.isActive ? "default" : "secondary"} className={recipe.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}>
                            {recipe.isActive ? "Active" : "Inactive"}
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
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditRecipe(recipe)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateRecipe(recipe.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteRecipe(recipe)}>
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
      
      <RecipeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleRecipeSubmit}
        editData={editingRecipe}
        isLoading={isSubmitting}
        availableIngredients={availableIngredients}
        isDuplicate={isDuplicate}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={recipeToDelete?.name || ""}
        itemType="Recipe"
        onConfirm={confirmDeleteRecipe}
        isLoading={isDeleting}
      />
    </div>
  )
}