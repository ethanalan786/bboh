"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierName: string
  supplierId: string
  onSupplierDeleted: () => void
}

export function DeleteConfirmationDialog({ 
  open, 
  onOpenChange, 
  supplierName, 
  supplierId,
  onSupplierDeleted 
}: DeleteConfirmationDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete supplier")
      }

      onSupplierDeleted()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting supplier:", error)
      alert(error instanceof Error ? error.message : "Failed to delete supplier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Supplier
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{supplierName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}