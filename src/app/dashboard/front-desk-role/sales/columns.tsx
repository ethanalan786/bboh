"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { type DataTableFeatures } from "./data-table-features"

// This type is used to define the shape of our data.
export type Sale = {
  id: string
  orderId: string | null
  productId: string
  product?: {
    id: string
    name: string
    sku: string
    category: string
    price: number
  }
  userId: string
  quantity: number
  totalPrice: number
  saleDate: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Sale>()

export const columns = columnHelper.columns([
  columnHelper.accessor("orderId", {
    header: "Order ID",
    cell: ({ row }: any) => {
      const orderId = row.getValue("orderId") as string | null
      return (
        <div className="text-xs font-mono text-neutral-400">
          {orderId || "N/A"}
        </div>
      )
    },
  }),
  columnHelper.accessor("id", {
    header: "Sale ID",
    cell: ({ row }: any) => {
      const id = row.getValue("id") as string
      return (
        <div className="text-sm font-mono text-neutral-400">
          #{id.slice(0, 8)}
        </div>
      )
    },
  }),
  columnHelper.accessor("saleDate", {
    header: "Date",
    cell: ({ row }: any) => {
      const date = new Date(row.getValue("saleDate"))
      return (
        <div className="text-sm text-neutral-300">
          {date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          })}
        </div>
      )
    },
  }),
  columnHelper.display({
    id: "product",
    header: "Product",
    cell: ({ row }: any) => {
      const product = row.original.product
      return (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-white">{product?.name || 'Unknown'}</div>
          <div className="text-xs text-neutral-500">{product?.sku || ''}</div>
        </div>
      )
    },
  }),
  columnHelper.display({
    id: "category",
    header: "Category",
    cell: ({ row }: any) => {
      const category = row.original.product?.category
      return (
        <Badge 
          variant="outline" 
          className={
            category === 'BURN_BOX' 
              ? "bg-emerald-900/60 text-emerald-400 border-emerald-800/40"
              : "bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-800/40"
          }
        >
          {category === 'BURN_BOX' ? 'Burn Box' : 'Apparel'}
        </Badge>
      )
    },
  }),
  columnHelper.accessor("quantity", {
    header: "Quantity",
    cell: ({ row }: any) => {
      const quantity = row.getValue("quantity") as number
      return <div className="text-sm text-neutral-300">{quantity}</div>
    },
  }),
  columnHelper.accessor("totalPrice", {
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }: any) => {
      const amount = parseFloat(row.getValue("totalPrice"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium text-white">{formatted}</div>
    },
  }),
])
