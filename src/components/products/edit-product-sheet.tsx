"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Package2, DollarSign, Sparkles, Wallet } from "lucide-react"

interface EditProductSheetProps {
  product: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated?: () => void
  toast?: (message: string, options?: { type?: string }) => void
}

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  size: "",
  color: "",
  stock: "0",
  price: "",
  description: "",
  materialCost: "0",
  laborCost: "0",
  shippingCost: "0",
  overheadCost: "0",
  otherCost: "0",
  supplier: "",
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description?: string
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 font-archivo">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-[#668e2b]" />}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {description && <p className="text-xs text-muted-foreground -mt-2">{description}</p>}
      {children}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 font-archivo ${className || ""}`}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground/70">
        {label}
        {required && <span className="text-[#668e2b] ml-1">*</span>}
      </Label>
      {children}
    </div>
  )
}

export function EditProductSheet({ product, open, onOpenChange, onProductUpdated, toast }: EditProductSheetProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // Fetch suppliers when sheet opens
  useEffect(() => {
    if (open) {
      fetchSuppliers()
    }
  }, [open])

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoadingSuppliers(false)
    }
  }

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        size: product.size || "",
        color: product.color || "",
        stock: String(product.stock || 0),
        price: String(product.sellingPrice || product.price || 0),
        description: product.description || "",
        materialCost: String(product.materialCost || 0),
        laborCost: String(product.laborCost || 0),
        shippingCost: String(product.shippingCost || 0),
        overheadCost: String(product.overheadCost || 0),
        otherCost: String(product.otherCost || 0),
        supplier: product.supplier || "",
      })
    } else {
      setFormData(emptyForm)
    }
  }, [product])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    // Validate numeric fields
    const priceNum = parseFloat(formData.price)
    const stockNum = parseInt(formData.stock)
    const materialCostNum = parseFloat(formData.materialCost || "0")
    const laborCostNum = parseFloat(formData.laborCost || "0")
    const shippingCostNum = parseFloat(formData.shippingCost || "0")
    const overheadCostNum = parseFloat(formData.overheadCost || "0")
    const otherCostNum = parseFloat(formData.otherCost || "0")

    if (isNaN(priceNum) || priceNum < 0) {
      if (toast) {
        toast("Please enter a valid price", { type: "error" })
      }
      return
    }

    if (isNaN(stockNum) || stockNum < 0) {
      if (toast) {
        toast("Please enter a valid stock quantity", { type: "error" })
      }
      return
    }

    if (isNaN(materialCostNum) || materialCostNum < 0) {
      if (toast) {
        toast("Please enter a valid material cost", { type: "error" })
      }
      return
    }

    if (isNaN(laborCostNum) || laborCostNum < 0) {
      if (toast) {
        toast("Please enter a valid labor cost", { type: "error" })
      }
      return
    }

    if (isNaN(shippingCostNum) || shippingCostNum < 0) {
      if (toast) {
        toast("Please enter a valid shipping cost", { type: "error" })
      }
      return
    }

    if (isNaN(overheadCostNum) || overheadCostNum < 0) {
      if (toast) {
        toast("Please enter a valid overhead cost", { type: "error" })
      }
      return
    }

    if (isNaN(otherCostNum) || otherCostNum < 0) {
      if (toast) {
        toast("Please enter a valid other cost", { type: "error" })
      }
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          size: formData.size,
          color: formData.color,
          stock: stockNum,
          price: priceNum,
          description: formData.description,
          materialCost: materialCostNum,
          laborCost: laborCostNum,
          shippingCost: shippingCostNum,
          overheadCost: overheadCostNum,
          otherCost: otherCostNum,
          supplier: formData.supplier,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update product")
      }

      if (toast) {
        toast("Product updated successfully", { type: "success" })
      }
      onOpenChange(false)
      onProductUpdated?.()
    } catch (error) {
      console.error("Error updating product:", error)
      if (toast) {
        toast("Failed to update product", { type: "error" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview("")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-100 lg:w-135 overflow-y-auto bg-background font-archivo p-0"
      >
        <SheetHeader className="p-6 pb-5 border-b bg-linear-to-r from-[#668e2b]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#668e2b]/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-[#668e2b]" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold">Edit product</SheetTitle>
              <SheetDescription className="text-sm">
                Update product information.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col font-archivo">
          <div className="flex-1 space-y-5 p-6">
            <FormSection title="Basic information" icon={Package2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-archivo">
                <Field label="Product name" htmlFor="name" required>
                  <Input
                    id="name"
                    placeholder="e.g., Classic Tee"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="h-9"
                  />
                </Field>

                <Field label="SKU" htmlFor="sku" required>
                  <Input
                    id="sku"
                    placeholder="e.g., PROD-001"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    required
                    className="h-9"
                  />
                </Field>

                <Field label="Category" htmlFor="category" required>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                    required
                  >
                    <SelectTrigger id="category" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BURN_BOX">Burn Box</SelectItem>
                      <SelectItem value="APPAREL">Apparel</SelectItem>
                      <SelectItem value="WOMENS_APPAREL">Women's apparel</SelectItem>
                      <SelectItem value="MENS_APPAREL">Men's apparel</SelectItem>
                      <SelectItem value="DRINKS">Drinks</SelectItem>
                      <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Supplier" htmlFor="supplier">
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => handleInputChange("supplier", value)}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger id="supplier" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSuppliers ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading suppliers...</div>
                      ) : suppliers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No suppliers available</div>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Size" htmlFor="size">
                  <Input
                    id="size"
                    placeholder="S, M, L…"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    className="h-9"
                  />
                </Field>

                <Field label="Color" htmlFor="color">
                  <Input
                    id="color"
                    placeholder="Black, Red…"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="h-9"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Pricing" icon={DollarSign}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Selling price" htmlFor="price" required>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                    className="h-9 font-medium"
                  />
                </Field>

                <Field label="Stock quantity" htmlFor="stock" required>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    required
                    className="h-9"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Cost breakdown" icon={Wallet}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Material cost" htmlFor="materialCost">
                  <Input
                    id="materialCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.materialCost}
                    onChange={(e) => handleInputChange("materialCost", e.target.value)}
                    className="h-9"
                  />
                </Field>

                <Field label="Labor cost" htmlFor="laborCost">
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.laborCost}
                    onChange={(e) => handleInputChange("laborCost", e.target.value)}
                    className="h-9"
                  />
                </Field>

                <Field label="Shipping cost" htmlFor="shippingCost">
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.shippingCost}
                    onChange={(e) => handleInputChange("shippingCost", e.target.value)}
                    className="h-9"
                  />
                </Field>

                <Field label="Overhead cost" htmlFor="overheadCost">
                  <Input
                    id="overheadCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.overheadCost}
                    onChange={(e) => handleInputChange("overheadCost", e.target.value)}
                    className="h-9"
                  />
                </Field>

                <Field label="Other cost" htmlFor="otherCost">
                  <Input
                    id="otherCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.otherCost}
                    onChange={(e) => handleInputChange("otherCost", e.target.value)}
                    className="h-9"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Description" icon={Sparkles}>
              <Field label="Notes (optional)" htmlFor="description">
                <Textarea
                  id="description"
                  placeholder="Anything worth noting about this product…"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </Field>
            </FormSection>
          </div>

          <SheetFooter className="p-6 pt-4 border-t sticky bottom-0 bg-background">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
              {loading ? "Updating…" : "Update product"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}