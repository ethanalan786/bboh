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
import { Recipe } from "@/types/recipe-types"

interface SaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SaleFormData) => void
  isLoading?: boolean
  availableRecipes?: Recipe[]
}

interface SaleFormData {
  recipeId: string
  recipeName: string
  quantity: number
  customerId?: string
  customerName?: string
  paymentMethod?: string
  notes?: string
}

export function SaleDialog({ open, onOpenChange, onSubmit, isLoading, availableRecipes = [] }: SaleDialogProps) {
  const [formData, setFormData] = useState<SaleFormData>({
    recipeId: "",
    recipeName: "",
    quantity: 1,
    customerId: undefined,
    customerName: "",
    paymentMethod: "",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setFormData({
        recipeId: "",
        recipeName: "",
        quantity: 1,
        customerId: undefined,
        customerName: "",
        paymentMethod: "",
        notes: "",
      })
      setErrors({})
    }
  }, [open])

  const handleRecipeChange = (recipeId: string) => {
    const recipe = availableRecipes.find(r => r.id === recipeId)
    if (recipe) {
      setFormData({
        ...formData,
        recipeId,
        recipeName: recipe.name,
      })
    }
  }

  const calculateTotal = () => {
    const recipe = availableRecipes.find(r => r.id === formData.recipeId)
    if (!recipe) return 0
    return recipe.sellingPrice * formData.quantity
  }

  const calculateIngredientCost = () => {
    const recipe = availableRecipes.find(r => r.id === formData.recipeId)
    if (!recipe) return 0
    return recipe.totalCost * formData.quantity
  }

  const calculateProfit = () => {
    const recipe = availableRecipes.find(r => r.id === formData.recipeId)
    if (!recipe) return 0
    const total = recipe.sellingPrice * formData.quantity
    const cost = recipe.totalCost * formData.quantity
    return total - cost
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.recipeId) newErrors.recipeId = "Recipe is required"
    if (formData.quantity <= 0) newErrors.quantity = "Quantity must be positive"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const total = calculateTotal()
  const ingredientCost = calculateIngredientCost()
  const profit = calculateProfit()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Burn Box Sale</DialogTitle>
          <DialogDescription>
            Record a recipe sale with automatic ingredient deduction from inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipe">Recipe *</Label>
            <Select 
              value={formData.recipeId} 
              onValueChange={handleRecipeChange}
            >
              <SelectTrigger className={errors.recipeId ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRecipes
                  .filter(r => r.isActive)
                  .map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name} (${recipe.sellingPrice.toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.recipeId && <p className="text-sm text-red-500">{errors.recipeId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className={errors.quantity ? "border-red-500" : ""}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this sale"
              rows={2}
            />
          </div>

          {formData.recipeId && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Sale Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">${total.toFixed(2)}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Ingredient Cost</p>
                  <p className="text-lg font-bold">${ingredientCost.toFixed(2)}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={`text-lg font-bold ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ${profit.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm font-medium text-amber-400">
                  <span className="font-bold">⚠️ Automatic Deduction:</span> 
                  Ingredients will be automatically deducted from inventory when this sale is recorded.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.recipeId}>
              {isLoading ? "Recording..." : "Record Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}