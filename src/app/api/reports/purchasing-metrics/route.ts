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

    // Calculate previous period for comparison
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = new Date(start.getTime() - daysDiff * 24 * 60 * 60 * 1000)
    const previousEnd = new Date(start.getTime() - 1)

    // Get current metrics from database
    const currentPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: start,
          lte: end
        }
      }
    }) as any[]

    const currentPurchases = currentPurchaseOrders.length
    const currentTotalSpend = currentPurchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
    
    const currentPendingInvoices = await prisma.invoice.count({
      where: {
        invoiceDate: {
          gte: start,
          lte: end
        },
        status: 'PENDING_REVIEW'
      }
    }) as number

    const currentActiveSuppliers = await prisma.supplier.count({
      where: {
        isActive: true
      }
    }) as number

    // Previous period metrics
    const previousPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: previousStart,
          lte: previousEnd
        }
      }
    }) as any[]

    const previousPurchases = previousPurchaseOrders.length
    const previousTotalSpend = previousPurchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
    
    const previousPendingInvoices = await prisma.invoice.count({
      where: {
        invoiceDate: {
          gte: previousStart,
          lte: previousEnd
        },
        status: 'PENDING_REVIEW'
      }
    }) as number

    // For active suppliers in previous period, count suppliers who had orders
    const previousPeriodSupplierIds = new Set(previousPurchaseOrders.map(po => po.supplierId))
    const previousActiveSuppliers = previousPeriodSupplierIds.size

    // Handle edge cases for calculations
    const purchasesChange = previousPurchases > 0 
      ? ((currentPurchases - previousPurchases) / previousPurchases) * 100 
      : (currentPurchases > 0 ? 100 : 0)

    const spendChange = previousTotalSpend > 0 
      ? ((currentTotalSpend - previousTotalSpend) / previousTotalSpend) * 100 
      : (currentTotalSpend > 0 ? 100 : 0)

    const invoicesChange = currentPendingInvoices - previousPendingInvoices
    const suppliersChange = previousActiveSuppliers > 0 
      ? ((currentActiveSuppliers - previousActiveSuppliers) / previousActiveSuppliers) * 100 
      : (currentActiveSuppliers > 0 ? 100 : 0)

    return NextResponse.json({
      current: {
        purchases: currentPurchases,
        totalSpend: currentTotalSpend,
        pendingInvoices: currentPendingInvoices,
        activeSuppliers: currentActiveSuppliers
      },
      previous: {
        purchases: previousPurchases,
        totalSpend: previousTotalSpend,
        pendingInvoices: previousPendingInvoices,
        activeSuppliers: previousActiveSuppliers
      },
      changes: {
        purchasesChange,
        spendChange,
        invoicesChange,
        suppliersChange
      },
      comparison: {
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      }
    })
  } catch (error) {
    console.error("Error fetching purchasing metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchasing metrics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
