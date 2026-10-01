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
  SheetTrigger,
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
import { Plus, Package2, DollarSign, TrendingUp, Sparkles } from "lucide-react"

interface CreateProductSheetProps {
  onProductCreated?: () => void
}

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  size: "",
  color: "",
  variant: "",
  supplier: "",
  materialCost: "",
  laborCost: "",
  shippingCost: "",
  overheadCost: "",
  otherCost: "",
  sellingPrice: "",
  stock: "0",
  description: "",
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

export function CreateProductSheet({ onProductCreated }: CreateProductSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const materialCost = parseFloat(formData.materialCost) || 0
  const laborCost = parseFloat(formData.laborCost) || 0
  const shippingCost = parseFloat(formData.shippingCost) || 0
  const overheadCost = parseFloat(formData.overheadCost) || 0
  const otherCost = parseFloat(formData.otherCost) || 0
  const totalCost = materialCost + laborCost + shippingCost + overheadCost + otherCost
  const sellingPrice = parseFloat(formData.sellingPrice) || 0
  const profitPerUnit = sellingPrice - totalCost
  const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("sku", formData.sku)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("size", formData.size)
      formDataToSend.append("color", formData.color)
      formDataToSend.append("variant", formData.variant)
      formDataToSend.append("supplier", formData.supplier)
      formDataToSend.append("materialCost", String(materialCost))
      formDataToSend.append("laborCost", String(laborCost))
      formDataToSend.append("shippingCost", String(shippingCost))
      formDataToSend.append("overheadCost", String(overheadCost))
      formDataToSend.append("otherCost", String(otherCost))
      formDataToSend.append("sellingPrice", formData.sellingPrice)
      formDataToSend.append("stock", formData.stock)
      formDataToSend.append("description", formData.description)
      
      if (imageFile) {
        formDataToSend.append("image", imageFile)
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) throw new Error("Failed to create product")

      setOpen(false)
      setFormData(emptyForm)
      setImageFile(null)
      setImagePreview("")
      onProductCreated?.()
    } catch (error) {
      console.error("Error creating product:", error)
      alert("Failed to create product. Please try again.")
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button className="gap-1.5 bg-[#668e2b] text-white hover:bg-[#668e2b]/90">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add product</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </SheetTrigger>

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
              <SheetTitle className="text-lg font-semibold">New product</SheetTitle>
              <SheetDescription className="text-sm">
                Add a product to your inventory.
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
              </div>
            </FormSection>

            <FormSection title="Product variants" icon={Package2}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <Field label="Variant label" htmlFor="variant">
                  <Input
                    id="variant"
                    placeholder="S / Black"
                    value={formData.variant}
                    onChange={(e) => handleInputChange("variant", e.target.value)}
                    className="h-9"
                  />
                </Field>
              </div>

              <Field label="Product image" htmlFor="image">
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[#668e2b]/30 rounded-lg p-6 text-center hover:border-[#668e2b]/50 transition-colors">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="p-2 bg-[#668e2b]/10 rounded-full">
                          <svg className="w-6 h-6 text-[#668e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm text-muted-foreground">Click to upload image</span>
                        <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                      </label>
                    </div>
                  )}
                </div>
              </Field>
            </FormSection>

            <FormSection
              title="Cost & pricing"
              description="Used to calculate profit per unit automatically."
              icon={DollarSign}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Material" htmlFor="materialCost">
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

                <Field label="Labor" htmlFor="laborCost">
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

                <Field label="Shipping" htmlFor="shippingCost">
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

                <Field label="Overhead" htmlFor="overheadCost">
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

                <Field label="Other" htmlFor="otherCost">
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

                <Field label="Selling price" htmlFor="sellingPrice" required>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                    required
                    className="h-9 font-medium"
                  />
                </Field>
              </div>

              {/* Live summary */}
              <div className="rounded-xl border border-[#668e2b]/20 bg-[#668e2b]/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-[#668e2b]" />
                  <span className="text-xs font-semibold text-[#668e2b]">Live summary</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Total cost</span>
                  <span className="text-sm font-semibold tabular-nums">${totalCost.toFixed(2)}</span>
                </div>

                {formData.sellingPrice && (
                  <div className="mt-4 pt-4 border-t border-[#668e2b]/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Profit per unit</p>
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          profitPerUnit >= 0 ? "text-[#668e2b]" : "text-red-500"
                        }`}
                      >
                        ${profitPerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Margin</p>
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          profitMargin >= 0 ? "text-[#668e2b]" : "text-red-500"
                        }`}
                      >
                        {profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="Inventory" icon={Package2}>
              <Field label="Initial stock quantity" htmlFor="stock" required className="sm:w-1/2">
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
              onClick={() => setOpen(false)}
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
              {loading ? "Creating…" : "Create product"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}