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
import { Plus, Package } from "lucide-react"

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onStockAdded?: () => void
  toast?: (message: string, options?: { type?: string }) => void
}

export function AddStockDialog({ open, onOpenChange, product, onStockAdded, toast }: AddStockDialogProps) {
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (quantity <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          reason: reason || `Stock addition`,
          transactionType: "STOCK_ADDED",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add stock")
        if (toast) {
          toast(errorData.error || "Failed to add stock", { type: "error" })
        }
        return
      }

      if (toast) {
        toast(`Successfully added ${quantity} units to ${product.name}`, { type: "success" })
      }
      setQuantity(1)
      setReason("")
      onOpenChange(false)
      onStockAdded?.()
    } catch (error) {
      console.error("Error adding stock:", error)
      setError("Failed to add stock. Please try again.")
      if (toast) {
        toast("Failed to add stock. Please try again.", { type: "error" })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setQuantity(1)
    setReason("")
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
            <div className="p-2 bg-[#668e2b]/10 rounded-lg">
              <Plus className="h-5 w-5 text-[#668e2b]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Add Stock</DialogTitle>
              <DialogDescription className="text-sm">
                Add inventory to {product?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col font-archivo">
          <div className="space-y-4 py-4">
            <div className="p-4 bg-[#668e2b]/5 border border-[#668e2b]/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-[#668e2b]" />
                <p className="text-sm font-medium text-[#668e2b]">Current Stock</p>
              </div>
              <p className="text-2xl font-bold">{product?.stock || 0} units</p>
            </div>

            <div className="space-y-2">
              <Label>
                Quantity to Add <span className="text-[#668e2b] ml-1">*</span>
              </Label>
              <div className="flex justify-center py-2">
                <AnimatedNumberInput
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., New shipment received, Restock order #123"
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
              className="bg-[#668e2b] text-white hover:bg-[#668e2b]/90 h-9"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}