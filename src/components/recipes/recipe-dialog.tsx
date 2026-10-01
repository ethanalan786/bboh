"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Badge } from "@/components/ui/badge"
import { X, Plus, Trash2 } from "lucide-react"
import { Recipe, RECIPE_CATEGORIES } from "@/types/recipe-types"
import { UnitOfMeasurement, UNIT_LABELS } from "@/types/ingredient-types"

interface RecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RecipeFormData) => void
  editData?: Recipe | null
  isLoading?: boolean
  availableIngredients?: Ingredient[]
  isDuplicate?: boolean
}

interface Ingredient {
  id: string
  name: string
  sku: string
  unit: UnitOfMeasurement
  costPerUnit: number
  currentStock: number
}

interface RecipeIngredient {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: UnitOfMeasurement
  costPerUnit: number
}

interface RecipeFormData {
  name: string
  sku: string
  category: string
  description?: string
  ingredients: RecipeIngredient[]
  sellingPrice: number
  preparationTime?: number
  servings?: number
  instructions?: string[]
  imageUrl?: string
  isActive: boolean
}

export function RecipeDialog({ open, onOpenChange, onSubmit, editData, isLoading, availableIngredients = [], isDuplicate }: RecipeDialogProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    sku: "",
    category: "Smoothies",
    description: "",
    ingredients: [],
    sellingPrice: 0,
    preparationTime: undefined,
    servings: undefined,
    instructions: [],
    imageUrl: "",
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentInstruction, setCurrentInstruction] = useState("")
  const [showIngredientSelector, setShowIngredientSelector] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState("")
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [newIngredientQuantity, setNewIngredientQuantity] = useState(1)

  useEffect(() => {
    if (editData) {
      setFormData({
        name: isDuplicate ? `${editData.name} (Copy)` : editData.name,
        sku: isDuplicate ? `${editData.sku}-COPY` : editData.sku,
        category: editData.category,
        description: editData.description || "",
        ingredients: editData.ingredients.map(ing => ({
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
        })),
        sellingPrice: editData.sellingPrice,
        preparationTime: editData.preparationTime,
        servings: editData.servings,
        instructions: (editData.instructions || []).map((inst) => inst),
        imageUrl: editData.imageUrl || "",
        isActive: isDuplicate ? false : editData.isActive,
      })
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "Smoothies",
        description: "",
        ingredients: [],
        sellingPrice: 0,
        preparationTime: undefined,
        servings: undefined,
        instructions: [],
        imageUrl: "",
        isActive: true,
      })
    }
    setErrors({})
    setCurrentInstruction("")
  }, [editData, open, isDuplicate])

  const calculateTotalCost = () => {
    return formData.ingredients.reduce((sum, ing) => {
      return sum + (ing.quantity * ing.costPerUnit)
    }, 0)
  }

  const calculateProfit = () => {
    const totalCost = calculateTotalCost()
    return formData.sellingPrice - totalCost
  }

  const calculateProfitMargin = () => {
    const totalCost = calculateTotalCost()
    if (formData.sellingPrice === 0) return 0
    return ((formData.sellingPrice - totalCost) / formData.sellingPrice) * 100
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.sku.trim()) newErrors.sku = "SKU is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (formData.ingredients.length === 0) newErrors.ingredients = "At least one ingredient is required"
    if (formData.sellingPrice < 0) newErrors.sellingPrice = "Selling price cannot be negative"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const addIngredient = () => {
    if (availableIngredients.length === 0) {
      alert("No ingredients available. Please add ingredients first.")
      return
    }
    setShowIngredientSelector(true)
    setSelectedIngredient(null)
    setIngredientSearch("")
    setNewIngredientQuantity(1)
  }

  const confirmAddIngredient = () => {
    if (!selectedIngredient) return
    
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        {
          ingredientId: selectedIngredient.id,
          ingredientName: selectedIngredient.name,
          quantity: newIngredientQuantity,
          unit: selectedIngredient.unit,
          costPerUnit: selectedIngredient.costPerUnit,
        }
      ]
    })
    setShowIngredientSelector(false)
    setSelectedIngredient(null)
    setIngredientSearch("")
    setNewIngredientQuantity(1)
  }

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
    ingredient.sku.toLowerCase().includes(ingredientSearch.toLowerCase())
  )

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    })
  }

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updatedIngredients = [...formData.ingredients]
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: Math.max(0, quantity)
    }
    setFormData({ ...formData, ingredients: updatedIngredients })
  }

  const addInstruction = () => {
    if (currentInstruction.trim()) {
      setFormData({
        ...formData,
        instructions: [...(formData.instructions || []), currentInstruction.trim()]
      })
      setCurrentInstruction("")
    }
  }

  const removeInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: (formData.instructions || []).filter((_, i) => i !== index)
    })
  }

  const totalCost = calculateTotalCost()
  const profit = calculateProfit()
  const profitMargin = calculateProfitMargin()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0" showCloseButton={false}>
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>
              {isDuplicate ? "Duplicate Recipe" : (editData ? "Edit Recipe" : "Create New Recipe")}
            </SheetTitle>
            <SheetDescription>
              {isDuplicate
                ? "Create a copy of this recipe. Name and SKU are auto-generated but can be edited. Recipe starts as inactive."
                : (editData
                  ? "Update recipe details and ingredient information."
                  : "Create a new recipe with ingredients and cost calculation.")
              }
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Recipe name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              {isDuplicate && <p className="text-xs text-muted-foreground">Auto-generated from original recipe</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="REC-001"
                className={errors.sku ? "border-red-500" : ""}
              />
              {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
              {isDuplicate && <p className="text-xs text-muted-foreground">Auto-generated with -COPY suffix</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECIPE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price ($) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className={errors.sellingPrice ? "border-red-500" : ""}
              />
              {errors.sellingPrice && <p className="text-sm text-red-500">{errors.sellingPrice}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Recipe description"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Ingredients *</h3>
              <Button type="button" size="sm" onClick={addIngredient}>
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
            
            {errors.ingredients && <p className="text-sm text-red-500 mb-2">{errors.ingredients}</p>}
            
            {showIngredientSelector && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Select Ingredient</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowIngredientSelector(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder="Search ingredients..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredIngredients.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No ingredients found matching your search.
                      </div>
                    ) : (
                      filteredIngredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedIngredient?.id === ingredient.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedIngredient(ingredient)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{ingredient.name}</p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {ingredient.sku} • {UNIT_LABELS[ingredient.unit]} • Stock: {ingredient.currentStock}
                              </p>
                            </div>
                            <p className="text-sm font-medium">${ingredient.costPerUnit.toFixed(2)}/{UNIT_LABELS[ingredient.unit]}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {selectedIngredient && (
                    <div className="flex items-center gap-3 pt-3 border-t">
                      <div className="flex-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newIngredientQuantity}
                          onChange={(e) => setNewIngredientQuantity(parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                      <Button type="button" onClick={confirmAddIngredient} className="mt-4">
                        Add to Recipe
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {formData.ingredients.length === 0 && !showIngredientSelector ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No ingredients added yet. Click "Add Ingredient" to start.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ingredient.ingredientName}</p>
                      <p className="text-xs text-muted-foreground">{UNIT_LABELS[ingredient.unit]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredientQuantity(index, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8"
                      />
                      <span className="text-sm text-muted-foreground">× ${ingredient.costPerUnit.toFixed(2)}</span>
                      <span className="text-sm font-medium">= ${(ingredient.quantity * ingredient.costPerUnit).toFixed(2)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Cost Analysis</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-lg font-bold">${totalCost.toFixed(2)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-lg font-bold">${formData.sellingPrice.toFixed(2)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className={`text-lg font-bold ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  ${profit.toFixed(2)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Margin</p>
                <p className={`text-lg font-bold ${profitMargin >= 20 ? "text-emerald-500" : profitMargin >= 10 ? "text-amber-500" : "text-red-500"}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preparationTime">Prep Time (min)</Label>
              <Input
                id="preparationTime"
                type="number"
                value={formData.preparationTime || ""}
                onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                value={formData.servings || ""}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <div className="flex gap-2">
              <Input
                value={currentInstruction}
                onChange={(e) => setCurrentInstruction(e.target.value)}
                placeholder="Add instruction step"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInstruction())}
              />
              <Button type="button" size="icon" onClick={addInstruction}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.instructions && formData.instructions.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="flex-1 text-sm">{instruction}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstruction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive" className="cursor-pointer">Active (available for sale)</Label>
          </div>

          <SheetFooter className="p-6 pt-0">
            <SheetClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (isDuplicate ? "Duplicate Recipe" : (editData ? "Update Recipe" : "Create Recipe"))}
            </Button>
          </SheetFooter>
        </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}