import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Fetch all purchase orders with supplier details within the date range
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            taxAmount: true,
            discountAmount: true,
            status: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    })

    // Group purchases by supplier
    const supplierMap = new Map<string, any>()

    purchaseOrders.forEach((order) => {
      const supplierId = order.supplier.id
      const supplierName = order.supplier.name

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName,
          supplierEmail: order.supplier.email,
          supplierPhone: order.supplier.phone,
          supplierCity: order.supplier.city,
          supplierState: order.supplier.state,
          totalPurchases: 0,
          totalQuantity: 0,
          totalBaseCost: 0,
          totalFreight: 0,
          totalCustoms: 0,
          totalDuties: 0,
          totalTaxes: 0,
          totalLandedCost: 0,
          totalInvoiceAmount: 0,
          invoiceCount: 0,
          orders: [],
        })
      }

      const supplierData = supplierMap.get(supplierId)
      const items = order.items as any[] || []
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      
      // Calculate landed cost components
      const baseCost = order.totalAmount || 0
      const freight = items.reduce((sum, item) => sum + (item.freight || 0), 0)
      const customs = items.reduce((sum, item) => sum + (item.customs || 0), 0)
      const duties = items.reduce((sum, item) => sum + (item.duties || 0), 0)
      const taxes = items.reduce((sum, item) => sum + (item.taxes || 0), 0)
      const totalLandedCost = baseCost + freight + customs + duties + taxes

      // Calculate invoice totals
      const invoiceTotal = order.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

      supplierData.totalPurchases += 1
      supplierData.totalQuantity += totalQuantity
      supplierData.totalBaseCost += baseCost
      supplierData.totalFreight += freight
      supplierData.totalCustoms += customs
      supplierData.totalDuties += duties
      supplierData.totalTaxes += taxes
      supplierData.totalLandedCost += totalLandedCost
      supplierData.totalInvoiceAmount += invoiceTotal
      supplierData.invoiceCount += order.invoices.length

      supplierData.orders.push({
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        quantity: totalQuantity,
        baseCost,
        freight,
        customs,
        duties,
        taxes,
        totalLandedCost,
        invoiceAmount: invoiceTotal,
        invoiceCount: order.invoices.length,
      })
    })

    // Convert map to array and calculate percentages
    const suppliersData = Array.from(supplierMap.values())
    const grandTotalLandedCost = suppliersData.reduce((sum, s) => sum + s.totalLandedCost, 0)
    const grandTotalInvoiceAmount = suppliersData.reduce((sum, s) => sum + s.totalInvoiceAmount, 0)

    suppliersData.forEach((supplier) => {
      supplier.percentageOfTotal = grandTotalLandedCost > 0 
        ? (supplier.totalLandedCost / grandTotalLandedCost) * 100 
        : 0
      supplier.averageOrderValue = supplier.totalPurchases > 0 
        ? supplier.totalLandedCost / supplier.totalPurchases 
        : 0
      supplier.averageCostPerUnit = supplier.totalQuantity > 0 
        ? supplier.totalLandedCost / supplier.totalQuantity 
        : 0
    })

    // Sort by total landed cost descending
    suppliersData.sort((a, b) => b.totalLandedCost - a.totalLandedCost)

    return NextResponse.json({
      suppliers: suppliersData,
      summary: {
        totalSuppliers: suppliersData.length,
        grandTotalLandedCost,
        grandTotalInvoiceAmount,
        totalPurchases: suppliersData.reduce((sum, s) => sum + s.totalPurchases, 0),
        totalQuantity: suppliersData.reduce((sum, s) => sum + s.totalQuantity, 0),
        topSupplier: suppliersData.length > 0 ? suppliersData[0].supplierName : null,
      },
    })
  } catch (error) {
    console.error("Error fetching supplier purchases:", error)
    return NextResponse.json(
      { error: "Failed to fetch supplier purchases", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
