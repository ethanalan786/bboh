"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AdjustmentType, ADJUSTMENT_TYPE_LABELS, ADJUSTMENT_TYPE_COLORS } from "@/types/adjustment-types"
import { UnitOfMeasurement, UNIT_LABELS } from "@/types/ingredient-types"
import { currency } from "@/lib/utils"

interface AdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AdjustmentFormData) => void
  isLoading?: boolean
  availableIngredients?: Ingredient[]
}

interface Ingredient {
  id: string
  name: string
  sku: string
  unit: UnitOfMeasurement
  currentStock: number
  costPerUnit: number
}

interface AdjustmentFormData {
  ingredientId: string
  ingredientName: string
  ingredientSku: string
  adjustmentType: AdjustmentType
  previousStock: number
  newStock: number
  quantity: number
  unit: string
  reason: string
  isDiscrepancy: boolean
}

export function AdjustmentDialog({ open, onOpenChange, onSubmit, isLoading, availableIngredients = [] }: AdjustmentDialogProps) {
  const [formData, setFormData] = useState<AdjustmentFormData>({
    ingredientId: "",
    ingredientName: "",
    ingredientSku: "",
    adjustmentType: "WASTAGE",
    previousStock: 0,
    newStock: 0,
    quantity: 0,
    unit: "",
    reason: "",
    isDiscrepancy: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setFormData({
        ingredientId: "",
        ingredientName: "",
        ingredientSku: "",
        adjustmentType: "WASTAGE",
        previousStock: 0,
        newStock: 0,
        quantity: 0,
        unit: "",
        reason: "",
        isDiscrepancy: false,
      })
      setErrors({})
    }
  }, [open])

  const handleIngredientChange = (ingredientId: string) => {
    const ingredient = availableIngredients.find(i => i.id === ingredientId)
    if (ingredient) {
      setFormData({
        ...formData,
        ingredientId,
        ingredientName: ingredient.name,
        ingredientSku: ingredient.sku,
        previousStock: ingredient.currentStock,
        newStock: ingredient.currentStock,
        unit: ingredient.unit,
      })
    }
  }

  const handleQuantityChange = (quantity: number) => {
    const previousStock = formData.previousStock
    let newStock = previousStock

    // For WASTAGE, DAMAGE, EXPIRY, THEFT - reduce stock
    if (["WASTAGE", "DAMAGE", "EXPIRY", "THEFT"].includes(formData.adjustmentType)) {
      newStock = Math.max(0, previousStock - quantity)
    }
    // For PHYSICAL_COUNT - set to exact value
    else if (formData.adjustmentType === "PHYSICAL_COUNT") {
      newStock = quantity
    }
    // For OTHER - could be either, default to reduction
    else {
      newStock = Math.max(0, previousStock - quantity)
    }

    setFormData({
      ...formData,
      quantity,
      newStock,
    })
  }

  const handleNewStockChange = (newStock: number) => {
    const previousStock = formData.previousStock
    const quantity = Math.abs(newStock - previousStock)

    setFormData({
      ...formData,
      newStock,
      quantity,
    })
  }

  const calculateCostImpact = () => {
    const ingredient = availableIngredients.find(i => i.id === formData.ingredientId)
    if (!ingredient) return 0
    return Math.abs(formData.quantity) * ingredient.costPerUnit
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.ingredientId) newErrors.ingredientId = "Ingredient is required"
    if (!formData.adjustmentType) newErrors.adjustmentType = "Adjustment type is required"
    if (formData.quantity < 0) newErrors.quantity = "Quantity cannot be negative"
    if (formData.newStock < 0) newErrors.newStock = "New stock cannot be negative"
    if (!formData.reason.trim()) newErrors.reason = "Reason is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const costImpact = calculateCostImpact()
  const isReduction = formData.newStock < formData.previousStock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Ingredient Adjustment</DialogTitle>
          <DialogDescription>
            Record wastage, damage, expiry, or physical count adjustments for ingredient inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient">Ingredient *</Label>
            <Select 
              value={formData.ingredientId} 
              onValueChange={handleIngredientChange}
            >
              <SelectTrigger className={errors.ingredientId ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableIngredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.sku}) - {ingredient.currentStock} {UNIT_LABELS[ingredient.unit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ingredientId && <p className="text-sm text-red-500">{errors.ingredientId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Adjustment Type *</Label>
            <Select 
              value={formData.adjustmentType} 
              onValueChange={(value) => setFormData({ ...formData, adjustmentType: value as AdjustmentType })}
            >
              <SelectTrigger className={errors.adjustmentType ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.adjustmentType && <p className="text-sm text-red-500">{errors.adjustmentType}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="previousStock">Previous Stock</Label>
              <Input
                id="previousStock"
                type="number"
                step="0.01"
                value={formData.previousStock}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStock">New Stock *</Label>
              <Input
                id="newStock"
                type="number"
                step="0.01"
                value={formData.newStock}
                onChange={(e) => handleNewStockChange(parseFloat(e.target.value) || 0)}
                className={errors.newStock ? "border-red-500" : ""}
              />
              {errors.newStock && <p className="text-sm text-red-500">{errors.newStock}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Adjustment *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className={errors.quantity ? "border-red-500" : ""}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            <p className="text-xs text-muted-foreground">
              {isReduction ? "Stock will be reduced" : "Stock will be increased"} by {formData.quantity} {formData.unit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide detailed reason for this adjustment"
              rows={3}
              className={errors.reason ? "border-red-500" : ""}
            />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
          </div>

          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cost Impact:</span>
              <span className={`text-lg font-bold ${isReduction ? "text-red-500" : "text-emerald-500"}`}>
                {currency(costImpact)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isReduction ? "This represents a loss/cost" : "This represents a gain/recovery"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDiscrepancy"
              checked={formData.isDiscrepancy}
              onChange={(e) => setFormData({ ...formData, isDiscrepancy: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="isDiscrepancy" className="cursor-pointer">
              Mark as stock discrepancy (requires investigation)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Recording..." : "Record Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}