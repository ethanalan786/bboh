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
import { Checkbox } from "@/components/ui/checkbox"
import { AnimatedNumberInput } from "@/components/ui/animated-number-input"
import { Settings, Package, AlertTriangle, TrendingUp } from "lucide-react"

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onStockAdjusted?: () => void
  toast?: (message: string, options?: { type?: string }) => void
}

export function AdjustStockDialog({ open, onOpenChange, product, onStockAdjusted, toast }: AdjustStockDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newStock, setNewStock] = useState(product?.stock || 0)
  const [reason, setReason] = useState("")
  const [isOpeningStock, setIsOpeningStock] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (newStock < 0) {
      setError("Please enter a valid stock quantity")
      return
    }

    if (newStock < product.stock) {
      setError(`Cannot decrease stock below current level (${product.stock}). Use stock addition instead.`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          newStock: newStock,
          reason: reason || (isOpeningStock ? "Opening stock entry" : "Stock adjustment"),
          transactionType: isOpeningStock ? "OPENING_STOCK" : "STOCK_ADJUSTED",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to adjust stock")
        if (toast) {
          toast(errorData.error || "Failed to adjust stock", { type: "error" })
        }
        return
      }

      if (toast) {
        const actionType = isOpeningStock ? "Opening stock" : "Stock"
        toast(`Successfully set ${actionType.toLowerCase()} for ${product.name} to ${newStock}`, { type: "success" })
      }
      setNewStock(product?.stock || 0)
      setReason("")
      setIsOpeningStock(false)
      onOpenChange(false)
      onStockAdjusted?.()
    } catch (error) {
      console.error("Error adjusting stock:", error)
      setError("Failed to adjust stock. Please try again.")
      if (toast) {
        toast("Failed to adjust stock. Please try again.", { type: "error" })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewStock(product?.stock || 0)
    setReason("")
    setIsOpeningStock(false)
    setError("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  // Update newStock when product changes
  React.useEffect(() => {
    if (product) {
      setNewStock(product.stock)
    }
  }, [product])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md font-archivo">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#668e2b]/10 rounded-lg">
              {isOpeningStock ? (
                <TrendingUp className="h-5 w-5 text-[#668e2b]" />
              ) : (
                <Settings className="h-5 w-5 text-[#668e2b]" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {isOpeningStock ? "Set Opening Stock" : "Adjust Stock"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {isOpeningStock 
                  ? `Set opening stock level for ${product?.name}`
                  : `Set stock level for ${product?.name}`
                }
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="openingStock"
                checked={isOpeningStock}
                onCheckedChange={(checked) => setIsOpeningStock(checked as boolean)}
              />
              <Label
                htmlFor="openingStock"
                className="text-sm font-medium cursor-pointer"
              >
                This is an opening stock entry
              </Label>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium text-amber-500">Important</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Stock cannot be decreased below current level ({product?.stock || 0}). To add stock incrementally, use the "Add Stock" option instead.
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                New Stock Level <span className="text-[#668e2b] ml-1">*</span>
              </Label>
              <div className="flex justify-center py-2">
                <AnimatedNumberInput
                  value={newStock}
                  onChange={(value) => {
                    setNewStock(value)
                    setError("")
                  }}
                  min={product?.stock || 0}
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder={isOpeningStock ? "e.g., Initial inventory setup, New product launch" : "e.g., Inventory count correction, Physical count"}
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
              {loading ? "Processing..." : isOpeningStock ? "Set Opening Stock" : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}