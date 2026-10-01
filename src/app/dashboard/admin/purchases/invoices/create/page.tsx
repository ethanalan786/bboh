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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectItem,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Loader2,
  Package,
  Upload,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { UploadInvoiceDialog } from "@/components/invoices/upload-invoice-dialog"

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CreatePurchaseOrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Invoice upload state
  const [showInvoiceUpload, setShowInvoiceUpload] = useState(false)
  const [uploadedInvoiceData, setUploadedInvoiceData] = useState<any>(null)

  // Form state
  const [supplierId, setSupplierId] = useState("")
  const [expectedDate, setExpectedDate] = useState<Date>()
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', name: '', quantity: 1, unitPrice: 0, total: 0 }
  ])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers')
      const data = await response.json()

      if (response.ok) {
        setSuppliers(data.suppliers || [])
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

  const addItem = () => {
    const newId = String(items.length + 1)
    setItems([...items, { id: newId, name: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice
        }
        return updated
      }
      return item
    }))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!supplierId) {
      setError("Please select a supplier")
      return
    }

    const validItems = items.filter(item => item.name && item.quantity > 0 && item.unitPrice > 0)
    if (validItems.length === 0) {
      setError("Please add at least one valid item")
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId,
          expectedDate: expectedDate?.toISOString(),
          totalAmount,
          notes: notes || null,
          items: validItems,
          invoiceData: uploadedInvoiceData || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/dashboard/admin/purchases/invoices/${data.purchaseOrder.id}`)
      } else {
        setError(data.error || 'Failed to create purchase order')
      }
    } catch (err) {
      setError('Failed to create purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInvoiceUploaded = (invoiceData: any) => {
    setUploadedInvoiceData(invoiceData)
    
    // Auto-populate form fields from extracted invoice data
    if (invoiceData) {
      // Set supplier if matched
      if (invoiceData.supplier && suppliers.length > 0) {
        const matchedSupplier = suppliers.find(s => s.id === invoiceData.supplier)
        if (matchedSupplier) {
          setSupplierId(matchedSupplier.id)
        }
      }
      
      // Populate items from invoice
      if (invoiceData.items && invoiceData.items.length > 0) {
        const extractedItems = invoiceData.items.map((item: any, index: number) => ({
          id: String(index + 1),
          name: item.name || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          total: item.total || (item.quantity * item.unitPrice) || 0
        }))
        setItems(extractedItems)
      }
      
      // Set notes if available
      if (invoiceData.notes) {
        setNotes(invoiceData.notes)
      }
    }
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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard/admin/purchases/invoices">Invoices</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>New Purchase Order</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">New Purchase Order</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Create a new purchase order for inventory
                  </p>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInvoiceUpload(true)}
                disabled={submitting}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Invoice
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Supplier Selection */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-4">Supplier Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select value={supplierId} onValueChange={setSupplierId} disabled={loading}>
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Delivery Date</Label>
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expectedDate && "text-muted-foreground"
                          )}
                          disabled={loading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expectedDate ? format(expectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expectedDate}
                          onSelect={setExpectedDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </Card>

              {/* Order Items */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold">Order Items</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid gap-3 md:grid-cols-12 items-end">
                      <div className="md:col-span-5 space-y-2">
                        <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                        <Input
                          id={`item-name-${item.id}`}
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="Product or item name"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`item-qty-${item.id}`}>Quantity</Label>
                        <Input
                          id={`item-qty-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`item-price-${item.id}`}>Unit Price</Label>
                        <Input
                          id={`item-price-${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Total</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                          {currency(item.total)}
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-lg font-bold">{currency(totalAmount)}</span>
                </div>
              </Card>

              {/* Notes */}
              <Card className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this purchase order..."
                    rows={3}
                  />
                </div>
              </Card>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Create Purchase Order
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
      {/* Invoice Upload Dialog */}
      <UploadInvoiceDialog
        open={showInvoiceUpload}
        onOpenChange={setShowInvoiceUpload}
        purchaseOrderId="" // Empty since we're creating the PO
        onInvoiceUploaded={handleInvoiceUploaded}
      />
    </div>
  )
}