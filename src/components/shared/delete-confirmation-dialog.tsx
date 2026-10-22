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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType: string
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("")
  const [error, setError] = useState("")

  const isConfirmed = confirmationText === itemName

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm()
      setConfirmationText("")
      setError("")
    } else {
      setError("Please type the name correctly to confirm deletion")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setConfirmationText("")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {itemType}</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please type <strong>{itemName}</strong> to confirm deletion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">Type "{itemName}" to confirm</Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value)
                setError("")
              }}
              placeholder={`Type ${itemName}...`}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
          >
            {isLoading ? "Deleting..." : `Delete ${itemType}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
