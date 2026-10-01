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

    // Fetch approved purchase orders with their invoices and supplier details
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: start,
          lte: end,
        },
        status: {
          in: ["RECEIVED"],
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
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
            invoiceDate: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    })

    // Process the data to include landed cost breakdown
    const processedPurchases = purchaseOrders.map((order) => {
      const items = order.items as any[] || []
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      
      // Calculate landed cost components
      // Note: These fields might need to be extracted from items JSON or added to schema
      const baseCost = order.totalAmount || 0
      const freight = items.reduce((sum, item) => sum + (item.freight || 0), 0)
      const customs = items.reduce((sum, item) => sum + (item.customs || 0), 0)
      const duties = items.reduce((sum, item) => sum + (item.duties || 0), 0)
      const taxes = items.reduce((sum, item) => sum + (item.taxes || 0), 0)
      
      const totalLandedCost = baseCost + freight + customs + duties + taxes
      const costPerUnit = totalQuantity > 0 ? totalLandedCost / totalQuantity : 0

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        supplier: order.supplier,
        status: order.status,
        expectedDate: order.expectedDate,
        receivedDate: order.receivedDate,
        items: items,
        totalQuantity: totalQuantity,
        landedCost: {
          baseCost,
          freight,
          customs,
          duties,
          taxes,
          totalLandedCost,
          costPerUnit,
        },
        invoices: order.invoices,
        assignedTo: order.assignedTo,
        notes: order.notes,
      }
    })

    // Calculate summary statistics
    const totalPurchases = processedPurchases.length
    const totalBaseCost = processedPurchases.reduce((sum, p) => sum + p.landedCost.baseCost, 0)
    const totalFreight = processedPurchases.reduce((sum, p) => sum + p.landedCost.freight, 0)
    const totalCustoms = processedPurchases.reduce((sum, p) => sum + p.landedCost.customs, 0)
    const totalDuties = processedPurchases.reduce((sum, p) => sum + p.landedCost.duties, 0)
    const totalTaxes = processedPurchases.reduce((sum, p) => sum + p.landedCost.taxes, 0)
    const totalLandedCost = processedPurchases.reduce((sum, p) => sum + p.landedCost.totalLandedCost, 0)
    const totalQuantity = processedPurchases.reduce((sum, p) => sum + p.totalQuantity, 0)

    return NextResponse.json({
      purchases: processedPurchases,
      summary: {
        totalPurchases,
        totalBaseCost,
        totalFreight,
        totalCustoms,
        totalDuties,
        totalTaxes,
        totalLandedCost,
        totalQuantity,
        averageCostPerUnit: totalQuantity > 0 ? totalLandedCost / totalQuantity : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching purchase history:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchase history", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
