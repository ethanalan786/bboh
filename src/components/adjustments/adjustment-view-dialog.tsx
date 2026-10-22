"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Calendar, Package, DollarSign, User, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { IngredientAdjustment, ADJUSTMENT_TYPE_LABELS, ADJUSTMENT_TYPE_COLORS } from "@/types/adjustment-types"
import { currency } from "@/lib/utils"

interface AdjustmentViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adjustment: IngredientAdjustment | null
}

export function AdjustmentViewDialog({ open, onOpenChange, adjustment }: AdjustmentViewDialogProps) {
  if (!adjustment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjustment Details</DialogTitle>
          <DialogDescription>
            View detailed information about this ingredient adjustment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{adjustment.ingredientName}</h3>
              <p className="text-sm text-muted-foreground">{adjustment.ingredientSku}</p>
            </div>
            <Badge variant="outline" className={`font-normal ${ADJUSTMENT_TYPE_COLORS[adjustment.adjustmentType]}`}>
              {ADJUSTMENT_TYPE_LABELS[adjustment.adjustmentType]}
            </Badge>
          </div>

          <Separator />

          {/* Stock Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Previous Stock</span>
              </div>
              <p className="text-2xl font-bold">{adjustment.previousStock} {adjustment.unit}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>New Stock</span>
              </div>
              <p className="text-2xl font-bold">{adjustment.newStock} {adjustment.unit}</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-500" />
                <span className="font-medium">Cost Impact</span>
              </div>
              <span className="text-2xl font-bold text-red-500">{currency(adjustment.costImpact)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Quantity adjusted: {adjustment.quantity} {adjustment.unit}
            </p>
          </div>

          <Separator />

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(adjustment.date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Recorded By</p>
                <p className="text-sm text-muted-foreground">{adjustment.userName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reason</p>
                <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Discrepancy:</span>
              {adjustment.isDiscrepancy ? (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                  Yes
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                  No
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              {adjustment.resolved ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  Unresolved
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
