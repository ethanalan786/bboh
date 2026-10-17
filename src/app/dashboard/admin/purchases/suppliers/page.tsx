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
import { Pagination } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertTriangle,
  MoreHorizontal,
  Package,
  Pencil,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Filter,
  ArrowUpDown,
  X,
  Plus,
  Trash2,
  Download,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreateSupplierDialog } from "@/components/suppliers/create-supplier-dialog"
import { EditSupplierDialog } from "@/components/suppliers/edit-supplier-dialog"
import { DeleteConfirmationDialog } from "@/components/suppliers/delete-confirmation-dialog"

type Status = "Active" | "Inactive"

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  contactPerson: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  productCount?: number
}

interface Stats {
  totalSuppliers: number
  activeSuppliers: number
  inactiveSuppliers: number
  totalProducts: number
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusBadge({ isActive }: { isActive: boolean }) {
  const styles = isActive
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20"
  return (
    <Badge variant="outline" className={`font-normal ${styles}`}>
      {isActive ? "Active" : "Inactive"}
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

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router]);

  const [currentPage, setCurrentPage] = useState(1)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalProducts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Edit and Delete states
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingSupplier, setDeletingSupplier] = useState<{ id: string; name: string } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/suppliers`)
      const data = await response.json()

      if (response.ok) {
        setSuppliers(data.suppliers || [])
        setFilteredSuppliers(data.suppliers || [])
        setStats({
          totalSuppliers: data.stats?.totalSuppliers || 0,
          activeSuppliers: data.stats?.activeSuppliers || 0,
          inactiveSuppliers: data.stats?.inactiveSuppliers || 0,
          totalProducts: data.stats?.totalProducts || 0,
        })
        setTotalPages(Math.ceil((data.suppliers?.length || 0) / 10))
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...suppliers]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          (s.name?.toLowerCase() || "").includes(query) ||
          (s.email?.toLowerCase() || "").includes(query) ||
          (s.phone || "").includes(query) ||
          (s.contactPerson?.toLowerCase() || "").includes(query) ||
          (s.city?.toLowerCase() || "").includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => 
        statusFilter === "active" ? s.isActive : !s.isActive
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "")
          break
        case "city":
          comparison = (a.city || "").localeCompare(b.city || "")
          break
        case "products":
          comparison = (a.productCount || 0) - (b.productCount || 0)
          break
        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredSuppliers(filtered)
    setTotalPages(Math.ceil(filtered.length / 10))
    setCurrentPage(1)
  }, [searchQuery, statusFilter, sortBy, sortOrder, suppliers])

  const handlePageChange = (page: number) => setCurrentPage(page)
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortBy("name")
    setSortOrder("asc")
  }

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) return
    
    setDeletingSupplier({ id: supplierId, name: supplier.name })
    setIsDeleteDialogOpen(true)
  }

  const handleEditSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) return
    
    setEditingSupplier(supplier)
    setIsEditDialogOpen(true)
  }

  const exportToCSV = () => {
    if (filteredSuppliers.length === 0) {
      return
    }

    // CSV headers
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Contact Person",
      "Address",
      "City",
      "State",
      "Zip Code",
      "Country",
      "Status",
      "Notes",
      "Created At",
      "Product Count"
    ]

    // CSV rows
    const rows = filteredSuppliers.map(supplier => [
      `"${supplier.name.replace(/"/g, '""')}"`,
      supplier.email || "",
      supplier.phone || "",
      supplier.contactPerson || "",
      supplier.address || "",
      supplier.city || "",
      supplier.state || "",
      supplier.zipCode || "",
      supplier.country || "",
      supplier.isActive ? "Active" : "Inactive",
      `"${(supplier.notes || "").replace(/"/g, '""')}"`,
      format(new Date(supplier.createdAt), "MMM d, yyyy HH:mm"),
      (supplier.productCount || 0).toString()
    ])

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
    link.setAttribute("download", `suppliers-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const rangeStart = filteredSuppliers.length > 0 ? (currentPage - 1) * 10 + 1 : 0
  const rangeEnd = Math.min(currentPage * 10, filteredSuppliers.length)
  const currentSuppliers = filteredSuppliers.slice((currentPage - 1) * 10, currentPage * 10)
  const hasActiveFilters = searchQuery || statusFilter !== "all"

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
                    <BreadcrumbPage>Suppliers</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Suppliers</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your supplier relationships and contact information.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search suppliers..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="city">City</SelectItem>
                              <SelectItem value="products">Products</SelectItem>
                              <SelectItem value="created">Created Date</SelectItem>
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
                  disabled={filteredSuppliers.length === 0}
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            </div>

            {/* Stats strip */}
            <Card className="grid grid-cols-2 divide-x divide-y divide-border p-0 sm:grid-cols-3 lg:grid-cols-4 lg:divide-y-0">
              <StatCell icon={Building} label="Total Suppliers" value={loading ? "—" : String(stats.totalSuppliers)} />
              <StatCell icon={Package} label="Active Suppliers" value={loading ? "—" : String(stats.activeSuppliers)} tone="positive" />
              <StatCell
                icon={AlertTriangle}
                label="Inactive Suppliers"
                value={loading ? "—" : String(stats.inactiveSuppliers)}
                tone={stats.inactiveSuppliers > 0 ? "warning" : "default"}
              />
              <StatCell icon={Package} label="Total Products" value={loading ? "—" : String(stats.totalProducts)} />
            </Card>

            {/* Suppliers List */}
            <Card className="overflow-hidden p-4">
              <div className="flex flex-col gap-3 border-b pb-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Suppliers list</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredSuppliers.length} of ${stats.totalSuppliers} suppliers`}
                  </p>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {filteredSuppliers.length} filtered
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Grid layout for suppliers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    Loading suppliers…
                  </div>
                ) : currentSuppliers.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    {hasActiveFilters ? "No suppliers match your filters" : "No suppliers yet — create your first one to get started."}
                  </div>
                ) : (
                  currentSuppliers.map((s) => (
                    <div key={s.id} className="border rounded-lg p-4 space-y-4 bg-linear-to-br from-background to-muted/20 hover:border-border/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm flex items-center justify-center">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.contactPerson || "No contact person"}
                              </p>
                            </div>
                            <StatusBadge isActive={s.isActive} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Email</p>
                          <p className="text-sm font-medium truncate">{s.email || "—"}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Phone</p>
                          <p className="text-sm font-medium truncate">{s.phone || "—"}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Location</p>
                          <p className="text-sm font-medium truncate">{[s.city, s.state].filter(Boolean).join(", ") || "—"}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Products</p>
                          <p className="text-lg font-bold tabular-nums">{s.productCount || 0}</p>
                        </div>
                      </div>

                      {s.notes && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                          <span>Notes: {s.notes}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 pt-2 border-t">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSupplier(s.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSupplier(s.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit supplier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSupplier(s.id)}>
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
              
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : `Showing ${rangeStart}–${rangeEnd} of ${filteredSuppliers.length}`}
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
      
      {/* Create Supplier Dialog */}
      <CreateSupplierDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSupplierCreated={fetchSuppliers}
      />
      
      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        supplier={editingSupplier}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSupplierUpdated={fetchSuppliers}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        supplierName={deletingSupplier?.name || ""}
        supplierId={deletingSupplier?.id || ""}
        onSupplierDeleted={fetchSuppliers}
      />
    </div>
  )
}