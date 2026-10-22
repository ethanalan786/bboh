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
import { UnitOfMeasurement, UNIT_LABELS, UNIT_CONVERSIONS } from "@/types/ingredient-types"
import { Plus } from "lucide-react"

interface IngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: IngredientFormData) => void
  editData?: Ingredient | null
  isLoading?: boolean
  isDuplicate?: boolean
}

interface Ingredient {
  id: string
  name: string
  sku: string
  category: string
  description?: string
  unit: UnitOfMeasurement
  quantity: number
  costPerUnit: number
  supplier?: string
  minStockLevel: number
  currentStock: number
  bulkQuantity?: number
  bulkUnit?: UnitOfMeasurement
  conversionFactor?: number
  expiryDate?: Date
  location?: string
  imageUrl?: string
}

interface IngredientFormData {
  name: string
  sku: string
  category: string
  description?: string
  unit: UnitOfMeasurement
  quantity: number
  costPerUnit: number
  supplier?: string
  minStockLevel: number
  bulkQuantity?: number
  bulkUnit?: UnitOfMeasurement
  conversionFactor?: number
  expiryDate?: string
  location?: string
  imageUrl?: string
}

interface IngredientCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export function IngredientDialog({ open, onOpenChange, onSubmit, editData, isLoading, isDuplicate }: IngredientDialogProps) {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: "",
    sku: "",
    category: "Other",
    description: "",
    unit: "GRAM",
    quantity: 0,
    costPerUnit: 0,
    supplier: "",
    minStockLevel: 10,
    bulkQuantity: undefined,
    bulkUnit: undefined,
    conversionFactor: undefined,
    expiryDate: undefined,
    location: "",
    imageUrl: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<IngredientCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  useEffect(() => {
    if (editData) {
      setFormData({
        name: isDuplicate ? `${editData.name} (Copy)` : editData.name,
        sku: isDuplicate ? `${editData.sku}-COPY` : editData.sku,
        category: editData.category,
        description: editData.description || "",
        unit: editData.unit,
        quantity: editData.quantity,
        costPerUnit: editData.costPerUnit,
        supplier: editData.supplier || "",
        minStockLevel: editData.minStockLevel,
        bulkQuantity: editData.bulkQuantity || undefined,
        bulkUnit: editData.bulkUnit || undefined,
        conversionFactor: editData.conversionFactor || undefined,
        expiryDate: editData.expiryDate ? editData.expiryDate.toISOString().split('T')[0] : undefined,
        location: editData.location || "",
        imageUrl: editData.imageUrl || "",
      })
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "Other",
        description: "",
        unit: "GRAM",
        quantity: 0,
        costPerUnit: 0,
        supplier: "",
        minStockLevel: 10,
        bulkQuantity: undefined,
        bulkUnit: undefined,
        conversionFactor: undefined,
        expiryDate: undefined,
        location: "",
        imageUrl: "",
      })
    }
    setErrors({})
  }, [editData, open, isDuplicate])

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await fetch("/api/ingredient-categories?activeOnly=true")
      const data = await response.json()
      if (response.ok) {
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name is required")
      return
    }

    try {
      setIsAddingCategory(true)
      const response = await fetch("/api/ingredient-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined
        })
      })

      if (response.ok) {
        const newCategory = await response.json()
        setCategories([...categories, newCategory])
        setFormData({ ...formData, category: newCategory.name })
        setIsCategoryDialogOpen(false)
        setNewCategoryName("")
        setNewCategoryDescription("")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to add category")
      }
    } catch (error) {
      console.error("Error adding category:", error)
      alert("Failed to add category")
    } finally {
      setIsAddingCategory(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.sku.trim()) newErrors.sku = "SKU is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (formData.quantity < 0) newErrors.quantity = "Quantity cannot be negative"
    if (formData.costPerUnit < 0) newErrors.costPerUnit = "Cost cannot be negative"
    if (formData.minStockLevel < 0) newErrors.minStockLevel = "Min stock level cannot be negative"
    if (formData.bulkQuantity !== undefined && formData.bulkQuantity < 0) {
      newErrors.bulkQuantity = "Bulk quantity cannot be negative"
    }
    if (formData.conversionFactor !== undefined && formData.conversionFactor <= 0) {
      newErrors.conversionFactor = "Conversion factor must be positive"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const calculateBaseUnit = () => {
    if (formData.bulkQuantity && formData.conversionFactor) {
      return (formData.bulkQuantity * formData.conversionFactor).toFixed(2)
    }
    return "0"
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isDuplicate ? "Duplicate Ingredient" : (editData ? "Edit Ingredient" : "Add New Ingredient")}
          </DialogTitle>
          <DialogDescription>
            {isDuplicate 
              ? "Create a copy of this ingredient. Name and SKU are auto-generated but can be edited. Stock starts at 0."
              : (editData 
                ? "Update ingredient details and inventory information." 
                : "Add a new ingredient to your inventory with units and conversion factors.")
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ingredient name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              {isDuplicate && <p className="text-xs text-muted-foreground">Auto-generated from original ingredient</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="ING-001"
                className={errors.sku ? "border-red-500" : ""}
              />
              {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
              {isDuplicate && <p className="text-xs text-muted-foreground">Auto-generated with -COPY suffix</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Category *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCategoryDialogOpen(true)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Category
                </Button>
              </div>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} disabled={isLoadingCategories}>
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading categories...</div>
                  ) : categories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available</div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measurement *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value as UnitOfMeasurement })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit ($) *</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                className={errors.costPerUnit ? "border-red-500" : ""}
              />
              {errors.costPerUnit && <p className="text-sm text-red-500">{errors.costPerUnit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min Stock Level *</Label>
              <Input
                id="minStockLevel"
                type="number"
                step="0.01"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                className={errors.minStockLevel ? "border-red-500" : ""}
              />
              {errors.minStockLevel && <p className="text-sm text-red-500">{errors.minStockLevel}</p>}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Bulk Tracking & Unit Conversions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulkQuantity">Bulk Quantity</Label>
                <Input
                  id="bulkQuantity"
                  type="number"
                  step="0.01"
                  value={formData.bulkQuantity || ""}
                  onChange={(e) => setFormData({ ...formData, bulkQuantity: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkUnit">Bulk Unit</Label>
                <Select 
                  value={formData.bulkUnit || ""} 
                  onValueChange={(value) => setFormData({ ...formData, bulkUnit: value as UnitOfMeasurement })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversionFactor">Conversion Factor</Label>
                <Input
                  id="conversionFactor"
                  type="number"
                  step="0.01"
                  value={formData.conversionFactor || ""}
                  onChange={(e) => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., 453.6 for lb to g"
                />
                <p className="text-xs text-muted-foreground">
                  Base units: {formData.bulkQuantity && formData.conversionFactor ? calculateBaseUnit() : "0"} {formData.unit}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Shelf A, Fridge 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (isDuplicate ? "Duplicate Ingredient" : (editData ? "Update Ingredient" : "Add Ingredient"))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Add Category Dialog */}
    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new ingredient category to organize your inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Spices"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryDescription">Description</Label>
            <Input
              id="categoryDescription"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddCategory} disabled={isAddingCategory}>
            {isAddingCategory ? "Adding..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}