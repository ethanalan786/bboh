"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface ProductDetailDialogProps {
  product: {
    id: string
    name: string
    sku: string
    category: string
    size: string
    color: string
    variant: string
    supplier: string
    stock: number
    costPrice: number | null
    sellingPrice: number | null
    materialCost: number
    laborCost: number
    shippingCost: number
    overheadCost: number
    otherCost: number
    profitPerUnit: number
    profitMargin: number
    totalSales: number
    totalRevenue: number
    totalCost: number
    totalProfit: number
    imageUrl?: string
    description?: string
  }
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const COST_SEGMENTS = [
  { key: "materialCost", label: "Material", color: "bg-sky-500" },
  { key: "laborCost", label: "Labor", color: "bg-emerald-500" },
  { key: "shippingCost", label: "Shipping", color: "bg-amber-500" },
  { key: "overheadCost", label: "Overhead", color: "bg-violet-500" },
  { key: "otherCost", label: "Other", color: "bg-rose-500" },
] as const

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-red-500" : ""
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold tabular-nums mt-1 ${toneClass}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, emphasis, tone }: { label: string; value: string; emphasis?: boolean; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-red-500" : ""
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${emphasis ? "text-base font-semibold" : "text-sm font-medium"} ${toneClass}`}>
        {value}
      </span>
    </div>
  )
}

export function ProductDetailDialog({ product }: ProductDetailDialogProps) {
  const [open, setOpen] = useState(false)

  const totalCost =
    product.materialCost + product.laborCost + product.shippingCost + product.overheadCost + product.otherCost

  const segments = COST_SEGMENTS.map((s) => ({
    ...s,
    value: product[s.key],
    pct: totalCost > 0 ? (product[s.key] / totalCost) * 100 : 0,
  })).filter((s) => s.value > 0)

  const variants = [
    { label: "Size", value: product.size },
    { label: "Color", value: product.color },
    { label: "Variant", value: product.variant },
  ].filter((v) => v.value)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background font-archivo! p-0">
        <DialogHeader className="p-6 pb-5 border-b">
          <DialogTitle className="text-lg font-semibold">{product.name}</DialogTitle>
          <DialogDescription className="text-sm">
            Cost breakdown and profitability for {product.sku}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted border">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {product.category}
                </Badge>
                {product.supplier && (
                  <span className="text-xs text-muted-foreground">Supplied by {product.supplier}</span>
                )}
              </div>
              {variants.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {variants.map((v) => (
                    <span key={v.label}>
                      {v.label}: <span className="text-foreground font-medium">{v.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="rounded-lg border grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border sm:divide-y-0">
            <Stat label="Stock" value={String(product.stock)} />
            <Stat label="Units sold" value={String(product.totalSales)} />
            <Stat label="Revenue" value={currency(product.totalRevenue)} />
            <Stat
              label="Total profit"
              value={currency(product.totalProfit)}
              tone={product.totalProfit >= 0 ? "positive" : "negative"}
            />
          </div>

          {/* Pricing */}
          <div className="rounded-lg border p-4 space-y-1">
            <Row label="Selling price" value={currency(product.sellingPrice || 0)} emphasis />
            <Row
              label="Profit per unit"
              value={currency(product.profitPerUnit)}
              emphasis
              tone={product.profitPerUnit >= 0 ? "positive" : "negative"}
            />
            <Row
              label="Profit margin"
              value={`${product.profitMargin.toFixed(1)}%`}
              emphasis
              tone={product.profitMargin >= 0 ? "positive" : "negative"}
            />
          </div>

          {/* Cost breakdown */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Cost breakdown</h3>
              <span className="text-sm text-muted-foreground tabular-nums">{currency(totalCost)} total</span>
            </div>

            {segments.length > 0 && (
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {segments.map((s) => (
                  <div
                    key={s.label}
                    className={s.color}
                    style={{ width: `${s.pct}%` }}
                    title={`${s.label}: ${s.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {COST_SEGMENTS.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-1 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  <span className="tabular-nums font-medium">{currency(product[s.key])}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}