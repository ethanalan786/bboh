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
import { Input } from "@/components/ui/input"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  productId: string
  onProductDeleted?: () => void
  toast?: (message: string, options?: { type?: string }) => void
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  productName,
  productId,
  onProductDeleted,
  toast,
}: DeleteConfirmationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")

  const resetForm = () => {
    setConfirmation("")
    setError("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const isConfirmed = confirmation.trim() === productName.trim()

  const handleDelete = async () => {
    if (!isConfirmed) return

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete product")
        setConfirmation("") // Clear confirmation so user must type again
        if (toast) {
          toast(errorData.error || "Failed to delete product", { type: "error" })
        }
        return
      }

      if (toast) {
        toast("Product deleted successfully", { type: "success" })
      }
      handleOpenChange(false)
      onProductDeleted?.()
    } catch (error) {
      console.error("Error deleting product:", error)
      setError("Failed to delete product. Please try again.")
      setConfirmation("") // Clear confirmation so user must type again
      if (toast) {
        toast("Failed to delete product. Please try again.", { type: "error" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md font-archivo">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${error ? "bg-amber-500/10" : "bg-red-500/10"}`}>
              <AlertTriangle className={`h-5 w-5 ${error ? "text-amber-500" : "text-red-500"}`} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {error ? "Cannot Delete Product" : "Delete Product"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {error ? "Please review the error below." : "This action cannot be undone."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-sm font-medium text-red-500 mb-2">Warning</p>
            <p className="text-xs text-muted-foreground">
              You are about to delete <span className="font-semibold text-foreground">{productName}</span>. This action is permanent and cannot be undone.
            </p>
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-sm font-medium text-amber-500 mb-2">Important</p>
            <p className="text-xs text-muted-foreground">
              All associated data including sales history, inventory records, and analytics will be permanently removed.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm font-medium text-red-500 mb-1">Cannot Delete Product</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">
                Type the product name <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{productName}</span> to confirm
              </label>
              <Input
                value={confirmation}
                onChange={(e) => {
                  setConfirmation(e.target.value)
                  setError("") // Clear error when user starts typing
                }}
                placeholder={`Type "${productName}"`}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="h-9"
          >
            {loading ? "Deleting..." : error ? "Retry" : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}