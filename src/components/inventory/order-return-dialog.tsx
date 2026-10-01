"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AnimatedNumberInput } from "@/components/ui/animated-number-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { RotateCcw, Package, User, Calendar, ShoppingCart, AlertCircle } from "lucide-react"

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  returnedQuantity: number
  unitPrice: number
  lineTotal: number
  totalPrice: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
}

interface OrderData {
  orderId: string
  sales: OrderItem[]
  customerName: string | null
  userName: string
  saleDate: Date
}

interface OrderReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReturnProcessed?: () => void
  toast?: (message: string, options?: { type?: string }) => void
  preSelectedOrderId?: string
}

export function OrderReturnDialog({ open, onOpenChange, onReturnProcessed, toast, preSelectedOrderId }: OrderReturnDialogProps) {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<string[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [returnItems, setReturnItems] = useState<Record<string, number>>({})
  const [returnReason, setReturnReason] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [error, setError] = useState("")
  const [loadingOrders, setLoadingOrders] = useState(false)

  const returnReasons = [
    "Customer return - damaged",
    "Customer return - wrong item",
    "Customer return - unwanted",
    "Quality issue",
    "Expiration",
    "Supplier recall",
    "Other"
  ]

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const response = await fetch("/api/sales?limit=100")
      const data = await response.json()
      
      if (response.ok && data.sales) {
        // Get unique order IDs that have items available to return
        const uniqueOrderIds = Array.from(new Set(
          data.sales
            .filter((sale: any) => sale.orderId && sale.quantity > sale.returnedQuantity)
            .map((sale: any) => sale.orderId)
        )) as string[]
        setOrders(uniqueOrderIds)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const fetchOrderData = async (orderId: string) => {
    try {
      setLoadingOrder(true)
      const response = await fetch(`/api/sales/order/${orderId}`)
      const data = await response.json()
      
      if (response.ok && data.sales) {
        setOrderData({
          orderId: data.orderId,
          sales: data.sales.filter((sale: OrderItem) => sale.quantity > sale.returnedQuantity),
          customerName: data.sales[0]?.customerName || null,
          userName: data.sales[0]?.userName || "",
          saleDate: new Date(data.sales[0]?.saleDate)
        })
        // Initialize return items with 0 for each item
        const initialReturns: Record<string, number> = {}
        data.sales.forEach((sale: OrderItem) => {
          if (sale.quantity > sale.returnedQuantity) {
            initialReturns[sale.id] = 0
          }
        })
        setReturnItems(initialReturns)
      }
    } catch (error) {
      console.error("Error fetching order data:", error)
      setError("Failed to load order details")
    } finally {
      setLoadingOrder(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchOrders()
    }
  }, [open])

  useEffect(() => {
    if (preSelectedOrderId && orders.length > 0) {
      setSelectedOrderId(preSelectedOrderId)
    }
  }, [preSelectedOrderId, orders])

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderData(selectedOrderId)
    } else {
      setOrderData(null)
      setReturnItems({})
    }
  }, [selectedOrderId])

  const handleQuantityChange = (saleId: string, quantity: number) => {
    setReturnItems(prev => ({
      ...prev,
      [saleId]: quantity
    }))
    setError("")
  }

  const getMaxReturnable = (saleId: string) => {
    const sale = orderData?.sales.find(s => s.id === saleId)
    if (!sale) return 0
    return sale.quantity - sale.returnedQuantity
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderData) return

    // Validate return items
    const validReturns = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([saleId, qty]) => ({
        saleId,
        quantity: qty,
        returnReason: returnReason
      }))

    if (validReturns.length === 0) {
      setError("Please select at least one item to return")
      return
    }

    // Validate quantities
    for (const returnItem of validReturns) {
      const maxReturnable = getMaxReturnable(returnItem.saleId)
      if (returnItem.quantity > maxReturnable) {
        setError(`Cannot return more than ${maxReturnable} units for one of the items`)
        return
      }
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/sales/order/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          returns: validReturns,
          additionalNotes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to process return")
        if (toast) {
          toast(errorData.error || "Failed to process return", { type: "error" })
        }
        return
      }

      if (toast) {
        toast(`Successfully processed return from order ${orderData.orderId}`, { type: "success" })
      }
      setSelectedOrderId("")
      setOrderData(null)
      setReturnItems({})
      setReturnReason("")
      setAdditionalNotes("")
      onOpenChange(false)
      onReturnProcessed?.()
    } catch (error) {
      console.error("Error processing return:", error)
      setError("Failed to process return. Please try again.")
      if (toast) {
        toast("Failed to process return. Please try again.", { type: "error" })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedOrderId("")
    setOrderData(null)
    setReturnItems({})
    setReturnReason("")
    setAdditionalNotes("")
    setError("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalReturnQuantity = Object.values(returnItems).reduce((sum, qty) => sum + qty, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl font-archivo max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <RotateCcw className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Process Return</DialogTitle>
              <DialogDescription className="text-sm">
                Select an order and items to return
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col font-archivo">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderSelect">
                Select Order <span className="text-orange-500 ml-1">*</span>
              </Label>
              {loadingOrders ? (
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders available for return</p>
              ) : (
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    {selectedOrderId ? (
                      <span className="font-mono text-xs">{selectedOrderId}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Select an order...</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((orderId) => (
                      <SelectItem key={orderId} value={orderId}>
                        <span className="font-mono text-xs">{orderId}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {orderData && (
              <>
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium text-orange-500">Order Details</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order ID</p>
                      <p className="font-mono text-xs font-medium">{orderData.orderId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{orderData.customerName || "Walk-in"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order Date</p>
                      <p className="font-medium">{formatDate(orderData.saleDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processed By</p>
                      <p className="font-medium">{orderData.userName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Items Available for Return</Label>
                  {orderData.sales.map((sale) => {
                    const maxReturnable = sale.quantity - sale.returnedQuantity
                    return (
                      <div key={sale.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{sale.productName}</p>
                            <p className="text-xs text-muted-foreground">{sale.productSku}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              Unit Price: ${sale.unitPrice.toFixed(2)} | Line Total: ${sale.lineTotal.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Original: {sale.quantity}</p>
                            <p className="text-sm text-muted-foreground">Returned: {sale.returnedQuantity}</p>
                            <p className="text-sm font-bold text-orange-500">Available: {maxReturnable}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-sm">Quantity to Return</Label>
                            <div className="flex justify-center py-2">
                              <AnimatedNumberInput
                                value={returnItems[sale.id] || 0}
                                onChange={(value) => handleQuantityChange(sale.id, value)}
                                min={0}
                                max={maxReturnable}
                                step={1}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {totalReturnQuantity > 0 && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium text-blue-500">
                        Total items to return: {totalReturnQuantity}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="returnReason">Return Reason <span className="text-orange-500 ml-1">*</span></Label>
                  <select
                    id="returnReason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  >
                    <option value="">Select reason...</option>
                    {returnReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Additional details about the return"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 text-white hover:bg-orange-500/90 h-9"
              disabled={loading || !orderData || totalReturnQuantity === 0}
            >
              {loading ? "Processing..." : `Process Return (${totalReturnQuantity} items)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}