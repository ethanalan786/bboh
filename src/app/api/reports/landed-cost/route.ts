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

    // Fetch purchase orders with supplier and invoice details
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
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            taxAmount: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    })

    // Process each purchase order to calculate detailed landed cost breakdown
    const processedData = purchaseOrders.map((order) => {
      const items = order.items as any[] || []
      
      // Process each item in the purchase order
      const itemBreakdowns = items.map((item) => {
        const quantity = item.quantity || 0
        const unitPrice = item.unitPrice || 0
        const baseCost = quantity * unitPrice
        
        // Additional cost components (these would come from the items JSON)
        const freight = item.freight || 0
        const customs = item.customs || 0
        const duties = item.duties || 0
        const taxes = item.taxes || 0
        const other = item.other || 0
        
        const totalLandedCost = baseCost + freight + customs + duties + taxes + other
        const costPerUnit = quantity > 0 ? totalLandedCost / quantity : 0
        
        // Calculate percentage contribution of each component
        const percentageBreakdown = totalLandedCost > 0 ? {
          baseCost: (baseCost / totalLandedCost) * 100,
          freight: (freight / totalLandedCost) * 100,
          customs: (customs / totalLandedCost) * 100,
          duties: (duties / totalLandedCost) * 100,
          taxes: (taxes / totalLandedCost) * 100,
          other: (other / totalLandedCost) * 100,
        } : {
          baseCost: 0,
          freight: 0,
          customs: 0,
          duties: 0,
          taxes: 0,
          other: 0,
        }
        
        return {
          itemName: item.name || 'Unknown Item',
          itemSku: item.sku || 'N/A',
          quantity,
          unitPrice,
          baseCost,
          freight,
          customs,
          duties,
          taxes,
          other,
          totalLandedCost,
          costPerUnit,
          percentageBreakdown,
        }
      })
      
      // Calculate totals for the entire purchase order
      const totalQuantity = itemBreakdowns.reduce((sum, item) => sum + item.quantity, 0)
      const totalBaseCost = itemBreakdowns.reduce((sum, item) => sum + item.baseCost, 0)
      const totalFreight = itemBreakdowns.reduce((sum, item) => sum + item.freight, 0)
      const totalCustoms = itemBreakdowns.reduce((sum, item) => sum + item.customs, 0)
      const totalDuties = itemBreakdowns.reduce((sum, item) => sum + item.duties, 0)
      const totalTaxes = itemBreakdowns.reduce((sum, item) => sum + item.taxes, 0)
      const totalOther = itemBreakdowns.reduce((sum, item) => sum + item.other, 0)
      const totalLandedCost = itemBreakdowns.reduce((sum, item) => sum + item.totalLandedCost, 0)
      const averageCostPerUnit = totalQuantity > 0 ? totalLandedCost / totalQuantity : 0
      
      return {
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        supplier: order.supplier,
        status: order.status,
        items: itemBreakdowns,
        totals: {
          totalQuantity,
          totalBaseCost,
          totalFreight,
          totalCustoms,
          totalDuties,
          totalTaxes,
          totalOther,
          totalLandedCost,
          averageCostPerUnit,
        },
        invoices: order.invoices,
      }
    })

    // Calculate overall summary statistics
    const grandTotals = processedData.reduce((acc, order) => {
      acc.totalOrders += 1
      acc.totalQuantity += order.totals.totalQuantity
      acc.totalBaseCost += order.totals.totalBaseCost
      acc.totalFreight += order.totals.totalFreight
      acc.totalCustoms += order.totals.totalCustoms
      acc.totalDuties += order.totals.totalDuties
      acc.totalTaxes += order.totals.totalTaxes
      acc.totalOther += order.totals.totalOther
      acc.totalLandedCost += order.totals.totalLandedCost
      return acc
    }, {
      totalOrders: 0,
      totalQuantity: 0,
      totalBaseCost: 0,
      totalFreight: 0,
      totalCustoms: 0,
      totalDuties: 0,
      totalTaxes: 0,
      totalOther: 0,
      totalLandedCost: 0,
    })

    const averageCostPerUnit = grandTotals.totalQuantity > 0 
      ? grandTotals.totalLandedCost / grandTotals.totalQuantity 
      : 0

    const percentageBreakdown = grandTotals.totalLandedCost > 0 ? {
      baseCost: (grandTotals.totalBaseCost / grandTotals.totalLandedCost) * 100,
      freight: (grandTotals.totalFreight / grandTotals.totalLandedCost) * 100,
      customs: (grandTotals.totalCustoms / grandTotals.totalLandedCost) * 100,
      duties: (grandTotals.totalDuties / grandTotals.totalLandedCost) * 100,
      taxes: (grandTotals.totalTaxes / grandTotals.totalLandedCost) * 100,
      other: (grandTotals.totalOther / grandTotals.totalLandedCost) * 100,
    } : {
      baseCost: 0,
      freight: 0,
      customs: 0,
      duties: 0,
      taxes: 0,
      other: 0,
    }

    return NextResponse.json({
      purchases: processedData,
      summary: {
        ...grandTotals,
        averageCostPerUnit,
        percentageBreakdown,
      },
    })
  } catch (error) {
    console.error("Error fetching landed cost breakdown:", error)
    return NextResponse.json(
      { error: "Failed to fetch landed cost breakdown", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
