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
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertTriangle,
  MoreHorizontal,
  Package,
  Pencil,
  Search,
  Wallet,
  Wallet2,
  TrendingUp,
  Filter,
  ArrowUpDown,
  X,
  Plus,
  Settings,
  Copy,
  Trash2,
  Download,
} from "lucide-react"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CreateProductSheet } from "@/components/products/create-product-sheet"
import { ProductDetailDialog } from "@/components/products/product-detail-dialog"
import { EditProductSheet } from "@/components/products/edit-product-sheet"
import { DeleteConfirmationDialog } from "@/components/products/delete-confirmation-dialog"
import { AddStockDialog } from "@/components/inventory/add-stock-dialog"
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog"
import { toast, Toaster } from "@/components/ui/toast"

type Status = "In Stock" | "Low Stock" | "Out of Stock"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  categoryId: string
  size: string
  color: string
  variant: string
  supplier: string
  stock: number
  costPrice: number | null
  sellingPrice: number | null
  price: number | null
  materialCost: number
  laborCost: number
  shippingCost: number
  overheadCost: number
  otherCost: number
  profitPerUnit: number
  profitMargin: number
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  status: Status
  imageUrl?: string
}

interface ProductCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface Stats {
  totalProducts: number
  totalStockValue: number
  totalCostValue: number
  totalProfitValue: number
  lowStockItems: number
  totalSales: number
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
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

export default function ProductsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalStockValue: 0,
    totalCostValue: 0,
    totalProfitValue: 0,
    lowStockItems: 0,
    totalSales: 0,
  })
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  
  // Edit and Delete states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Stock management states
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null)
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false)
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?page=1&limit=100`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setFilteredProducts(data.products)
        setStats({
          totalProducts: data.stats.totalProducts || 0,
          totalStockValue: data.stats.totalStockValue || 0,
          totalCostValue: data.stats.totalCostValue || 0,
          totalProfitValue: data.stats.totalProfitValue || 0,
          lowStockItems: data.stats.lowStockItems || 0,
          totalSales: data.stats.totalSales || 0,
        })
        setTotalPages(Math.ceil(data.products.length / 10))
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
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
    fetchProducts()
    fetchProductCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          (p.name?.toLowerCase() || "").includes(query) ||
          (p.sku?.toLowerCase() || "").includes(query) ||
          (p.category?.toLowerCase() || "").includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.categoryId === categoryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
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
          comparison = a.stock - b.stock
          break
        case "price":
          comparison = (a.sellingPrice || 0) - (b.sellingPrice || 0)
          break
        case "profit":
          comparison = (a.profitPerUnit || 0) - (b.profitPerUnit || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredProducts(filtered)
    setTotalPages(Math.ceil(filtered.length / 10))
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder, products])

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handleProductCreated = () => fetchProducts()
  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setSortBy("name")
    setSortOrder("asc")
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(currentProducts.map(p => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      return
    }

    // CSV headers
    const headers = [
      "Name",
      "SKU",
      "Category",
      "Size",
      "Color",
      "Variant",
      "Supplier",
      "Stock",
      "Cost Price",
      "Selling Price",
      "Material Cost",
      "Labor Cost",
      "Shipping Cost",
      "Overhead Cost",
      "Other Cost",
      "Profit Per Unit",
      "Profit Margin",
      "Total Sales",
      "Total Revenue",
      "Total Cost",
      "Total Profit",
      "Status"
    ]

    // CSV rows
    const rows = filteredProducts.map(product => [
      `"${product.name.replace(/"/g, '""')}"`,
      product.sku,
      product.category,
      product.size || "",
      product.color || "",
      product.variant || "",
      product.supplier || "",
      product.stock.toString(),
      (product.costPrice || 0).toFixed(2),
      (product.sellingPrice || 0).toFixed(2),
      product.materialCost.toFixed(2),
      product.laborCost.toFixed(2),
      product.shippingCost.toFixed(2),
      product.overheadCost.toFixed(2),
      product.otherCost.toFixed(2),
      (product.profitPerUnit || 0).toFixed(2),
      (product.profitMargin || 0).toFixed(2),
      product.totalSales.toString(),
      product.totalRevenue.toFixed(2),
      product.totalCost.toFixed(2),
      product.totalProfit.toFixed(2),
      product.status
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `products-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) {
      return
    }

    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          productIds: Array.from(selectedProducts),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete products")
      }

      const data = await response.json()
      toast.add({ 
        title: `${data.count} product(s) deleted successfully`, 
        type: "success" 
      })
      setSelectedProducts(new Set())
      fetchProducts()
    } catch (error) {
      console.error("Error deleting products:", error)
      toast.add({ title: "Failed to delete products", type: "error" })
    }
  }

  const handleBulkDuplicate = async () => {
    if (selectedProducts.size === 0) return

    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "duplicate",
          productIds: Array.from(selectedProducts),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate products")
      }

      const data = await response.json()
      toast.add({ 
        title: `${data.count} product(s) duplicated successfully`, 
        type: "success" 
      })
      setSelectedProducts(new Set())
      fetchProducts()
    } catch (error) {
      console.error("Error duplicating products:", error)
      toast.add({ title: "Failed to duplicate products", type: "error" })
    }
  }

  const handleBulkEdit = () => {
    if (selectedProducts.size === 0) return
    toast.add({ title: "Bulk edit feature coming soon", type: "info" })
  }

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    setDeletingProduct({ id: productId, name: product.name })
    setIsDeleteDialogOpen(true)
  }

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    setEditingProduct(product)
    setIsEditSheetOpen(true)
  }

  const handleDuplicateProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "duplicate",
          productIds: [productId],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate product")
      }
      toast.add({ title: "Product duplicated successfully", type: "success" })
      fetchProducts()
    } catch (error) {
      console.error("Error duplicating product:", error)
      toast.add({ title: "Failed to duplicate product", type: "error" })
    }
  }

  const handleAddStock = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setSelectedProductForStock(product)
    setIsAddStockDialogOpen(true)
  }

  const handleAdjustStock = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setSelectedProductForStock(product)
    setIsAdjustStockDialogOpen(true)
  }

  const rangeStart = filteredProducts.length > 0 ? (currentPage - 1) * 10 + 1 : 0
  const rangeEnd = Math.min(currentPage * 10, filteredProducts.length)
  const currentProducts = filteredProducts.slice((currentPage - 1) * 10, currentPage * 10)
  const hasActiveFilters = searchQuery || categoryFilter !== "all" || statusFilter !== "all"

  return (
    <div className="font-archivo">
      <Toaster />
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
                    <BreadcrumbLink href="/">Box Apparel</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Products</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Products</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your catalog, stock levels and pricing.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search products..." 
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
                  <PopoverContent className="w-72 p-4" align="end">
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
                        <label className="text-xs font-medium">Stock Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                              <SelectItem value="stock">Stock</SelectItem>
                              <SelectItem value="price">Price</SelectItem>
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
                  onClick={exportToCSV}
                  disabled={filteredProducts.length === 0}
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <CreateProductSheet onProductCreated={handleProductCreated} />
                </div>

              </div>
            </div>

            {/* Stats strip */}
            <Card className="grid grid-cols-2 divide-x divide-y divide-border p-0 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              <StatCell icon={Package} label="Products" value={loading ? "—" : String(stats.totalProducts)} />
              <StatCell icon={Wallet} label="Stock value" value={loading ? "—" : currency(stats.totalStockValue)} />
              <StatCell icon={Wallet2} label="Cost value" value={loading ? "—" : currency(stats.totalCostValue)} />
              <StatCell
                icon={TrendingUp}
                label="Profit value"
                value={loading ? "—" : currency(stats.totalProfitValue)}
                tone="positive"
              />
              <StatCell
                icon={AlertTriangle}
                label="Low stock"
                value={loading ? "—" : String(stats.lowStockItems)}
                tone={stats.lowStockItems > 0 ? "warning" : "default"}
              />
              <StatCell icon={TrendingUp} label="Sales (month)" value={loading ? "—" : currency(stats.totalSales)} />
            </Card>

            {/* Products List */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Products list</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredProducts.length} of ${stats.totalProducts} products`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProducts.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedProducts.size} selected
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleBulkEdit}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {filteredProducts.length} filtered
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-3 w-3 mr-1" />
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop / tablet: table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={currentProducts.length > 0 && selectedProducts.size === currentProducts.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-50">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="hidden lg:table-cell">Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Size / color</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead className="hidden lg:table-cell">Margin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                          Loading products…
                        </TableCell>
                      </TableRow>
                    ) : currentProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                          {hasActiveFilters ? "No products match your filters" : "No products yet — create your first one to get started."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedProducts.has(p.id)}
                              onCheckedChange={() => handleSelectProduct(p.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                                {p.imageUrl && (
                                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground truncate lg:hidden">{p.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {p.category}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {p.variant || `${p.size || ""} / ${p.color || ""}`}
                          </TableCell>
                          <TableCell className="tabular-nums">{p.stock}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {currency(p.costPrice || 0)}
                          </TableCell>
                          <TableCell className="tabular-nums">{currency(p.sellingPrice || 0)}</TableCell>
                          <TableCell
                            className={`tabular-nums ${
                              p.profitPerUnit >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {currency(p.profitPerUnit || 0)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell tabular-nums">
                            <span className={p.profitMargin >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {(p.profitMargin || 0).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <ProductDetailDialog product={p} />
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(p.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditProduct(p.id)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit product
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAddStock(p.id)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAdjustStock(p.id)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Adjust Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateProduct(p.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(p.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: stacked cards, no horizontal scrolling */}
              <div className="md:hidden divide-y">
                {loading ? (
                  <p className="text-center py-10 text-sm text-muted-foreground">Loading products…</p>
                ) : currentProducts.length === 0 ? (
                  <p className="text-center py-10 text-sm text-muted-foreground">
                    {hasActiveFilters ? "No products match your filters" : "No products yet — create your first one to get started."}
                  </p>
                ) : (
                  currentProducts.map((p) => (
                    <div key={p.id} className="p-4 space-y-4 bg-linear-to-br from-background to-muted/20">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedProducts.has(p.id)}
                          onCheckedChange={() => handleSelectProduct(p.id)}
                          className="mt-1"
                        />
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {p.sku} · {p.category}
                              </p>
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Stock</p>
                          <p className="text-lg font-bold tabular-nums">{p.stock}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <p className="text-lg font-bold tabular-nums">{currency(p.sellingPrice || 0)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Cost</p>
                          <p className="text-sm font-medium tabular-nums text-muted-foreground">{currency(p.costPrice || 0)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Profit</p>
                          <p
                            className={`text-sm font-bold tabular-nums ${
                              p.profitPerUnit >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {currency(p.profitPerUnit || 0)}
                          </p>
                        </div>
                      </div>

                      {p.variant || p.size || p.color ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                          <span>Variant: {p.variant || `${p.size || ""} / ${p.color || ""}`}</span>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-end gap-1 pt-2 border-t">
                        <ProductDetailDialog product={p} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(p.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(p.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddStock(p.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAdjustStock(p.id)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateProduct(p.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(p.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : `Showing ${rangeStart}–${rangeEnd} of ${filteredProducts.length}`}
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
      
      {/* Edit Product Sheet */}
      <EditProductSheet
        product={editingProduct}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onProductUpdated={fetchProducts}
        toast={(message, options) => toast.add({ title: message, type: options?.type })}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        productName={deletingProduct?.name || ""}
        productId={deletingProduct?.id || ""}
        onProductDeleted={fetchProducts}
      />
      
      {/* Add Stock Dialog */}
      <AddStockDialog
        product={selectedProductForStock}
        open={isAddStockDialogOpen}
        onOpenChange={setIsAddStockDialogOpen}
        onStockAdded={fetchProducts}
        toast={(message, options) => toast.add({ title: message, type: options?.type })}
      />
      
      {/* Adjust Stock Dialog */}
      <AdjustStockDialog
        product={selectedProductForStock}
        open={isAdjustStockDialogOpen}
        onOpenChange={setIsAdjustStockDialogOpen}
        onStockAdjusted={fetchProducts}
        toast={(message, options) => toast.add({ title: message, type: options?.type })}
      />
    </div>
  )
}