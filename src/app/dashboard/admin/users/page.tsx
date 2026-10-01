'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Badge
} from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MoreHorizontal, 
  UserPlus, 
  Shield, 
  ShieldCheck,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Edit
} from "lucide-react"
import { UserEditDialog } from "@/components/users/user-edit-dialog"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { format } from "date-fns"

interface User {
  id: string
  email: string
  name: string
  role: string
  image?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  createdAt: string
  updatedAt: string
}

const UsersPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  
  // Edit dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users || [])
        setFilteredUsers(data.users || [])
      } else {
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...users]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, roleFilter, users])

  const handleDeleteUser = (user: User) => {
    // Prevent users from deleting themselves
    if (user.id === session?.user?.id) {
      alert("You cannot delete your own account.")
      return
    }
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        await fetchUsers()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditDialogOpen(true)
  }

  const handleUserUpdate = async (data: any) => {
    if (!editingUser) return

    try {
      setIsUpdating(true)
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...data
        })
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditingUser(null)
        await fetchUsers()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case 'FRONT_DESK':
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case 'INVENTORY':
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case 'CUSTOMER':
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin'
      case 'FRONT_DESK':
        return 'Front Desk'
      case 'INVENTORY':
        return 'Inventory'
      case 'CUSTOMER':
        return 'Customer'
      default:
        return role
    }
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Users</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchUsers}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex rounded-lg border bg-muted p-1">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      roleFilter === "all"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRoleFilter("ADMIN")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      roleFilter === "ADMIN"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => setRoleFilter("FRONT_DESK")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      roleFilter === "FRONT_DESK"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Front Desk
                  </button>
                  <button
                    onClick={() => setRoleFilter("INVENTORY")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      roleFilter === "INVENTORY"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setRoleFilter("CUSTOMER")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      roleFilter === "CUSTOMER"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Customer
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Users List</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${filteredUsers.length} users`}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchQuery || roleFilter !== "all" ? "No users match your filters" : "No users yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                              {user.image ? (
                                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-500 text-white text-xs font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.city && user.state ? `${user.city}, ${user.state}` : user.city || user.state || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {user.id !== session?.user?.id && (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
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

      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={editingUser}
        onSubmit={handleUserUpdate}
        isLoading={isUpdating}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={userToDelete?.name || ""}
        itemType="User"
        onConfirm={confirmDeleteUser}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default UsersPage