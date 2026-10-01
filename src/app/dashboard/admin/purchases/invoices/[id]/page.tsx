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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectItem,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  ArrowLeft,
  Package,
  Building,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Truck,
  Edit,
  Eye,
  Download,
  Loader2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UploadInvoiceDialog } from "@/components/invoices/upload-invoice-dialog"
import { ReviewInvoiceDialog } from "@/components/invoices/review-invoice-dialog"
import { cn } from "@/lib/utils"

type PurchaseOrderStatus = "PENDING" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED"
type InvoiceStatus = "PENDING_REVIEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID"

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplier: {
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
  }
  status: PurchaseOrderStatus
  orderDate: Date
  expectedDate: Date | null
  receivedDate: Date | null
  totalAmount: number
  notes: string | null
  items: any
  assignedTo: string | null
  createdAt: Date
  updatedAt: Date
  invoices: Invoice[]
}

interface Invoice {
  id: string
  invoiceNumber: string
  purchaseOrderId: string
  status: InvoiceStatus
  invoiceDate: Date
  dueDate: Date | null
  totalAmount: number
  taxAmount: number
  discountAmount: number
  fileUrl: string | null
  fileName: string | null
  fileType: string | null
  fileSize: number | null
  reviewedBy: string | null
  reviewedAt: Date | null
  notes: string | null
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusBadge({ status }: { status: PurchaseOrderStatus | InvoiceStatus }) {
  const styles: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
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
    },
    PENDING_REVIEW: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      icon: Clock
    },
    UNDER_REVIEW: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
      icon: Eye
    },
    APPROVED: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      icon: CheckCircle
    },
    REJECTED: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      icon: XCircle
    },
    PAID: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      border: "border-green-500/20",
      icon: DollarSign
    }
  }

  const { bg, text, border, icon: Icon } = styles[status] || styles.PENDING

  return (
    <Badge variant="outline" className={`font-normal ${bg} ${text} ${border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status.replace('_', ' ')}
    </Badge>
  )
}

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [receiving, setReceiving] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [assignedTo, setAssignedTo] = useState<"BURN_BOX" | "APPAREL" | "">("")

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role")
    }
  }, [status, session, router])

  const fetchPurchaseOrder = async () => {
    if (!resolvedParams) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/purchase-orders/${resolvedParams.id}`)
      const data = await response.json()

      if (response.ok && data.purchaseOrder) {
        setPurchaseOrder(data.purchaseOrder)
      } else {
        console.error("API Error:", data)
        setPurchaseOrder(null)
      }
    } catch (error) {
      console.error("Error fetching purchase order:", error)
      setPurchaseOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedParams) {
      fetchPurchaseOrder()
    }
  }, [resolvedParams])

  const handleReceiveInventory = async () => {
    if (!resolvedParams) return
    
    if (!assignedTo) {
      alert('Please assign this purchase to either Burn Box or Box Apparel')
      return
    }

    if (!purchaseOrder) {
      alert('Purchase order not found')
      return
    }
    
    try {
      setReceiving(true)
      const response = await fetch(`/api/purchase-orders/${resolvedParams.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receivedItems: purchaseOrder.items,
          notes: null,
          status: 'RECEIVED',
          assignedTo
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsReceiveDialogOpen(false)
        setAssignedTo("")
        await fetchPurchaseOrder()
      } else {
        alert(data.error || 'Failed to receive inventory')
      }
    } catch (error) {
      console.error('Error receiving inventory:', error)
      alert('Failed to receive inventory')
    } finally {
      setReceiving(false)
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.fileUrl) {
      const link = document.createElement('a')
      link.href = invoice.fileUrl
      link.download = invoice.fileName || `invoice-${invoice.invoiceNumber}`
      link.click()
    }
  }

  const handleReviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsReviewDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="font-archivo">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div className="font-archivo">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Purchase order not found</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    )
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
                    <BreadcrumbPage>{purchaseOrder.orderNumber}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">{purchaseOrder.orderNumber}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Purchase Order Details
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={purchaseOrder.status} />
                {purchaseOrder.status !== 'RECEIVED' && purchaseOrder.status !== 'CANCELLED' && (
                  <Button onClick={() => setIsReceiveDialogOpen(true)}>
                    <Truck className="h-4 w-4 mr-2" />
                    Receive Inventory
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Invoice
                </Button>
              </div>
            </div>

            {/* Order Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="font-medium">{purchaseOrder.supplier.name}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Order Date</p>
                    <p className="font-medium">{format(new Date(purchaseOrder.orderDate), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Date</p>
                    <p className="font-medium">
                      {purchaseOrder.expectedDate 
                        ? format(new Date(purchaseOrder.expectedDate), "MMM d, yyyy") 
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-medium">{currency(purchaseOrder.totalAmount)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Items */}
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-4">Order Items</h2>
              {purchaseOrder.items && Array.isArray(purchaseOrder.items) && purchaseOrder.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name || item.productName || 'Item'}</TableCell>
                        <TableCell>{item.quantity || 0}</TableCell>
                        <TableCell>{currency(item.unitPrice || item.price || 0)}</TableCell>
                        <TableCell>{currency((item.quantity || 0) * (item.unitPrice || item.price || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No items in this order</p>
              )}
            </Card>

            {/* Invoices */}
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-4">Invoices ({purchaseOrder.invoices.length})</h2>
              {purchaseOrder.invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.invoiceDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{currency(invoice.totalAmount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {invoice.fileUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {invoice.status === 'PENDING_REVIEW' || invoice.status === 'UNDER_REVIEW' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReviewInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No invoices uploaded yet</p>
              )}
            </Card>

            {/* Notes */}
            {purchaseOrder.notes && (
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-2">Notes</h2>
                <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
              </Card>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Upload Invoice Dialog */}
      {purchaseOrder && (
        <UploadInvoiceDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          purchaseOrderId={purchaseOrder.id}
          onInvoiceUploaded={fetchPurchaseOrder}
        />
      )}

      {/* Review Invoice Dialog */}
      <ReviewInvoiceDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        invoice={selectedInvoice}
        onInvoiceReviewed={fetchPurchaseOrder}
      />

      {/* Receive Inventory Confirmation Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark this purchase order as received? This will update inventory levels based on the order items.
            </p>
            {purchaseOrder && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium">Order: {purchaseOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">Supplier: {purchaseOrder.supplier.name}</p>
                <p className="text-sm text-muted-foreground">Total: {currency(purchaseOrder.totalAmount)}</p>
              </div>
            )}    
            
            <div className="space-y-2">
              <Label htmlFor="assignment">Assign to *</Label>
              <Select value={assignedTo} onValueChange={(value: string) => setAssignedTo(value as "BURN_BOX" | "APPAREL")}>
                <option value="">Select assignment</option>
                <SelectItem value="BURN_BOX">Burn Box</SelectItem>
                <SelectItem value="APPAREL">Box Apparel</SelectItem>
              </Select>
              {!assignedTo && (
                <p className="text-xs text-destructive">Please assign this purchase to either Burn Box or Box Apparel</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReceiveDialogOpen(false)
                setAssignedTo("")
              }}
              disabled={receiving}
            >
              Cancel
            </Button>
            <Button onClick={handleReceiveInventory} disabled={receiving || !assignedTo}>
              {receiving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Receiving...
                </>
              ) : (
                "Confirm Receipt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}