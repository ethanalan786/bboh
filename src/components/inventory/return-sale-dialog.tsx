"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AnimatedNumberInput } from "@/components/ui/animated-number-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw, Package, User, Calendar, ShoppingCart } from "lucide-react"

interface Sale {
  id: string
  orderId: string | null
  productName: string
  productSku: string
  quantity: number
  returnedQuantity: number
  saleDate: Date
  customerName: string | null
  totalPrice: number
}

interface ReturnSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReturnProcessed?: () => void
  toast?: (message: string, options?: { type?: string }) => void
}

export function ReturnSaleDialog({ open, onOpenChange, onReturnProcessed, toast }: ReturnSaleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [selectedSaleId, setSelectedSaleId] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [returnReason, setReturnReason] = useState("")
  const [error, setError] = useState("")
  const [loadingSales, setLoadingSales] = useState(false)

  const returnReasons = [
    "Customer return - damaged",
    "Customer return - wrong item",
    "Customer return - unwanted",
    "Quality issue",
    "Expiration",
    "Supplier recall",
    "Other"
  ]

  const fetchSales = async () => {
    try {
      setLoadingSales(true)
      const response = await fetch("/api/sales?limit=100")
      const data = await response.json()
      
      if (response.ok && data.sales) {
        // Filter sales that have items available to return
        const availableSales = data.sales.filter((sale: Sale) => 
          sale.quantity > sale.returnedQuantity
        )
        setSales(availableSales)
      }
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoadingSales(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchSales()
    }
  }, [open])

  useEffect(() => {
    if (selectedSaleId) {
      const sale = sales.find(s => s.id === selectedSaleId)
      setSelectedSale(sale || null)
      if (sale) {
        setQuantity(1)
      }
    } else {
      setSelectedSale(null)
      setQuantity(1)
    }
  }, [selectedSaleId, sales])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSale) return

    const maxReturnable = selectedSale.quantity - selectedSale.returnedQuantity

    if (quantity <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    if (quantity > maxReturnable) {
      setError(`Cannot return more than ${maxReturnable} units (${selectedSale.returnedQuantity} already returned)`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/sales/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: selectedSale.id,
          quantity: quantity,
          reason: reason || `Return: ${quantity} units from sale`,
          returnReason: returnReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to process return")
        if (toast) {
          toast(errorData.error || "Failed to process return", { type: "error" })
        }
        return
      }

      if (toast) {
        const orderInfo = selectedSale.orderId ? ` from order ${selectedSale.orderId}` : ""
        toast(`Successfully processed return of ${quantity} units${orderInfo}`, { type: "success" })
      }
      resetForm()
      onOpenChange(false)
      onReturnProcessed?.()
    } catch (error) {
      console.error("Error processing return:", error)
      setError("Failed to process return. Please try again.")
      if (toast) {
        toast("Failed to process return. Please try again.", { type: "error" })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedSaleId("")
    setSelectedSale(null)
    setQuantity(1)
    setReason("")
    setReturnReason("")
    setError("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full sm:max-w-lg font-archivo max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <RotateCcw className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Process Return</DialogTitle>
              <DialogDescription className="text-sm">
                Select a sale order to process a return
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col font-archivo">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="saleSelect">
                Select Sale Order <span className="text-orange-500 ml-1">*</span>
              </Label>
              {loadingSales ? (
                <p className="text-sm text-muted-foreground">Loading sales...</p>
              ) : sales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales available for return</p>
              ) : (
                <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{sale.productName}</span>
                          <span className="text-xs text-muted-foreground">
                            {sale.orderId ? `Order: ${sale.orderId} • ` : ''}{formatDate(sale.saleDate)} • {sale.quantity} units • 
                            Available: {sale.quantity - sale.returnedQuantity}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedSale && (
              <>
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium text-orange-500">Sale Details</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order ID</p>
                      <p className="font-mono text-xs font-medium">{selectedSale.orderId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{selectedSale.customerName || "Walk-in"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Product</p>
                      <p className="font-medium">{selectedSale.productName}</p>
                      <p className="text-xs text-muted-foreground">{selectedSale.productSku}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sale Date</p>
                      <p className="font-medium">{formatDate(selectedSale.saleDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Original Qty</p>
                      <p className="font-medium">{selectedSale.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Already Returned</p>
                      <p className="font-medium">{selectedSale.returnedQuantity} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available to Return</p>
                      <p className="font-bold text-orange-500">{selectedSale.quantity - selectedSale.returnedQuantity} units</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Quantity to Return <span className="text-orange-500 ml-1">*</span>
                  </Label>
                  <div className="flex justify-center py-2">
                    <AnimatedNumberInput
                      value={quantity}
                      onChange={(value) => {
                        setQuantity(value)
                        setError("")
                      }}
                      min={1}
                      max={selectedSale.quantity - selectedSale.returnedQuantity}
                      step={1}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Max: {selectedSale.quantity - selectedSale.returnedQuantity} units
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnReason">Return Reason <span className="text-orange-500 ml-1">*</span></Label>
                  <select
                    id="returnReason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  >
                    <option value="">Select reason...</option>
                    {returnReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Additional Notes (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Additional details about the return"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 text-white hover:bg-orange-500/90 h-9"
              disabled={loading || !selectedSale}
            >
              {loading ? "Processing..." : "Process Return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}