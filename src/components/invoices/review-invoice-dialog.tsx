"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CheckCircle, XCircle, FileText, DollarSign, Calendar, Download, Loader2, AlertCircle, Sparkles, Truck, Package } from "lucide-react"
import { format } from "date-fns"

type InvoiceStatus = "PENDING_REVIEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID"

interface Invoice {
  id: string
  invoiceNumber: string
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
  notes: string | null
  purchaseOrder?: {
    orderNumber: string
    supplier: {
      name: string
    }
    items?: any[]
    totalAmount?: number
  }
  extractedData?: any
}

interface ReviewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onInvoiceReviewed: () => void
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, { bg: string; text: string; border: string; icon: React.ElementType }> = {
    PENDING_REVIEW: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      icon: AlertCircle
    },
    UNDER_REVIEW: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
      icon: FileText
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

  const { bg, text, border, icon: Icon } = styles[status]

  return (
    <Badge variant="outline" className={`font-normal ${bg} ${text} ${border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function ReviewInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onInvoiceReviewed
}: ReviewInvoiceDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [updateInventory, setUpdateInventory] = useState(false)
  
  // Landed cost breakdown fields
  const [landedCosts, setLandedCosts] = useState({
    baseCost: invoice?.totalAmount || 0,
    freight: 0,
    customs: 0,
    duties: 0,
    taxes: 0,
  })

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!invoice) return

    try {
      setSubmitting(true)
      setError("")

      const response = await fetch(`/api/invoices/${invoice.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: reviewNotes || null,
          updateInventory: status === 'APPROVED' ? updateInventory : false,
          landedCosts: status === 'APPROVED' ? landedCosts : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        onOpenChange(false)
        onInvoiceReviewed()
        setReviewNotes("")
        // Reset landed costs
        setLandedCosts({
          baseCost: invoice?.totalAmount || 0,
          freight: 0,
          customs: 0,
          duties: 0,
          taxes: 0,
        })
      } else {
        setError(data.error || 'Failed to review invoice')
      }
    } catch (err) {
      setError('Failed to review invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = () => {
    if (invoice?.fileUrl) {
      const link = document.createElement('a')
      link.href = invoice.fileUrl
      link.download = invoice.fileName || `invoice-${invoice.invoiceNumber}`
      link.click()
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Review Invoice</DialogTitle>
            <StatusBadge status={invoice.status} />
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Extracted Data Comparison */}
          {invoice.extractedData && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Extracted vs Confirmed Data
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-blue-700 dark:text-blue-300 font-medium">Invoice Number</p>
                        <p className="text-muted-foreground">
                          Extracted: {invoice.extractedData.invoiceNumber || 'N/A'}
                        </p>
                        <p className="text-muted-foreground">
                          Confirmed: {invoice.invoiceNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700 dark:text-blue-300 font-medium">Total Amount</p>
                        <p className="text-muted-foreground">
                          Extracted: {invoice.extractedData.totalAmount ? currency(invoice.extractedData.totalAmount) : 'N/A'}
                        </p>
                        <p className="text-muted-foreground">
                          Confirmed: {currency(invoice.totalAmount)}
                        </p>
                      </div>
                    </div>
                    {invoice.extractedData.items && invoice.extractedData.items.length > 0 && (
                      <div>
                        <p className="text-blue-700 dark:text-blue-300 font-medium">Extracted Items</p>
                        <ul className="text-muted-foreground list-disc list-inside">
                          {invoice.extractedData.items.map((item: any, index: number) => (
                            <li key={index}>
                              {item.name} - Qty: {item.quantity} @ {currency(item.unitPrice || 0)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Invoice Details */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Invoice Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Purchase Order</p>
                <p className="font-medium">{invoice.purchaseOrder?.orderNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Supplier</p>
                <p className="font-medium">{invoice.purchaseOrder?.supplier?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoice Date</p>
                <p className="font-medium">{format(new Date(invoice.invoiceDate), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="font-medium">{currency(invoice.totalAmount)}</p>
              </div>
            </div>
          </Card>

          {/* Amount Breakdown */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Amount Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-medium">
                  {currency(invoice.totalAmount - invoice.taxAmount + invoice.discountAmount)}
                </span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <span className="text-sm font-medium">{currency(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="text-sm font-medium text-green-600">
                    -{currency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-semibold">{currency(invoice.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Invoice File */}
          {invoice.fileUrl && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{invoice.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.fileType} • {invoice.fileSize ? `${(invoice.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>
          )}

          {/* Existing Notes */}
          {invoice.notes && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Existing Notes</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </Card>
          )}

          {/* Review Notes */}
          <div className="space-y-2">
            <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
            <Textarea
              id="reviewNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about your review decision..."
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Landed Cost Breakdown */}
          {(invoice.status === 'PENDING_REVIEW' || invoice.status === 'UNDER_REVIEW') && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Landed Cost Breakdown
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="baseCost">Base Cost</Label>
                    <Input
                      id="baseCost"
                      type="number"
                      step="0.01"
                      value={landedCosts.baseCost}
                      onChange={(e) => setLandedCosts({...landedCosts, baseCost: parseFloat(e.target.value) || 0})}
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="freight">Freight</Label>
                    <Input
                      id="freight"
                      type="number"
                      step="0.01"
                      value={landedCosts.freight}
                      onChange={(e) => setLandedCosts({...landedCosts, freight: parseFloat(e.target.value) || 0})}
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customs">Customs</Label>
                    <Input
                      id="customs"
                      type="number"
                      step="0.01"
                      value={landedCosts.customs}
                      onChange={(e) => setLandedCosts({...landedCosts, customs: parseFloat(e.target.value) || 0})}
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duties">Duties</Label>
                    <Input
                      id="duties"
                      type="number"
                      step="0.01"
                      value={landedCosts.duties}
                      onChange={(e) => setLandedCosts({...landedCosts, duties: parseFloat(e.target.value) || 0})}
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxes">Taxes</Label>
                    <Input
                      id="taxes"
                      type="number"
                      step="0.01"
                      value={landedCosts.taxes}
                      onChange={(e) => setLandedCosts({...landedCosts, taxes: parseFloat(e.target.value) || 0})}
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Landed Cost</span>
                    <span className="text-sm font-bold text-emerald-600">
                      ${(
                        landedCosts.baseCost + 
                        landedCosts.freight + 
                        landedCosts.customs + 
                        landedCosts.duties + 
                        landedCosts.taxes
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Inventory Update Option */}
          {invoice.status === 'PENDING_REVIEW' || invoice.status === 'UNDER_REVIEW' ? (
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="updateInventory"
                checked={updateInventory}
                onChange={(e) => setUpdateInventory(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="updateInventory" className="text-sm cursor-pointer">
                Update inventory levels based on this invoice (only if approved)
              </label>
            </div>
          ) : null}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReview("REJECTED")}
              disabled={submitting || invoice.status === "REJECTED" || invoice.status === "APPROVED"}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
            <Button
              onClick={() => handleReview("APPROVED")}
              disabled={submitting || invoice.status === "REJECTED" || invoice.status === "APPROVED"}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}