"use client"

import * as React from "react"
import { useState } from "react"
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
import { RotateCcw, Package, User } from "lucide-react"

interface ReturnStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onStockReturned?: () => void
  toast?: (message: string, options?: { type?: string }) => void
}

export function ReturnStockDialog({ open, onOpenChange, product, onStockReturned, toast }: ReturnStockDialogProps) {
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [returnReason, setReturnReason] = useState("")
  const [error, setError] = useState("")

  const returnReasons = [
    "Customer return - damaged",
    "Customer return - wrong item",
    "Customer return - unwanted",
    "Quality issue",
    "Expiration",
    "Supplier recall",
    "Other"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (quantity <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    if (quantity > (product.stock || 0)) {
      setError(`Cannot return more than current stock (${product.stock || 0})`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/stock/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          reason: reason || `Return: ${quantity} units returned`,
          transactionType: "STOCK_RETURN",
          customerName: customerName,
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
        toast(`Successfully processed return of ${quantity} units for ${product.name}`, { type: "success" })
      }
      setQuantity(1)
      setReason("")
      setCustomerName("")
      setReturnReason("")
      onOpenChange(false)
      onStockReturned?.()
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
    setQuantity(1)
    setReason("")
    setCustomerName("")
    setReturnReason("")
    setError("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full sm:max-w-md font-archivo">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <RotateCcw className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Process Return</DialogTitle>
              <DialogDescription className="text-sm">
                Process returned inventory for {product?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col font-archivo">
          <div className="space-y-4 py-4">
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-medium text-orange-500">Current Stock</p>
              </div>
              <p className="text-2xl font-bold">{product?.stock || 0} units</p>
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
                  max={product?.stock || 0}
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (optional)</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  id="customerName"
                  type="text"
                  placeholder="Customer who returned the item"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background"
                />
              </div>
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
              disabled={loading}
            >
              {loading ? "Processing..." : "Process Return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}