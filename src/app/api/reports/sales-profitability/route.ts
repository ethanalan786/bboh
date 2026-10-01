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
    end.setHours(23, 59, 59, 999) // Include end date fully

    // Calculate previous period for comparison
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = new Date(start.getTime() - daysDiff * 24 * 60 * 60 * 1000)
    const previousEnd = new Date(start.getTime() - 1)

    // Fetch sales for current period
    const currentSales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        product: true
      }
    }) as any[]

    // Fetch sales for previous period
    const previousSales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: previousStart,
          lte: previousEnd
        }
      },
      include: {
        product: true
      }
    }) as any[]

    // Calculate metrics for current period
    const currentTotalSales = currentSales.reduce((sum, sale) => {
      const total = sale.totalAmount || sale.lineTotal || (sale.quantity * (sale.unitPrice || 0))
      return sum + total
    }, 0)

    const currentCOGS = currentSales.reduce((sum, sale) => {
      const costPerUnit = sale.product?.costPrice || 0
      return sum + (sale.quantity * costPerUnit)
    }, 0)

    const currentGrossProfit = currentTotalSales - currentCOGS
    const currentGrossMargin = currentTotalSales > 0 ? (currentGrossProfit / currentTotalSales) * 100 : 0

    // Calculate metrics for previous period
    const previousTotalSales = previousSales.reduce((sum, sale) => {
      const total = sale.totalAmount || sale.lineTotal || (sale.quantity * (sale.unitPrice || 0))
      return sum + total
    }, 0)

    const previousCOGS = previousSales.reduce((sum, sale) => {
      const costPerUnit = sale.product?.costPrice || 0
      return sum + (sale.quantity * costPerUnit)
    }, 0)

    const previousGrossProfit = previousTotalSales - previousCOGS
    const previousGrossMargin = previousTotalSales > 0 ? (previousGrossProfit / previousTotalSales) * 100 : 0

    // Calculate percentage changes
    const salesChange = previousTotalSales > 0 
      ? ((currentTotalSales - previousTotalSales) / previousTotalSales) * 100 
      : 0

    const cogsChange = previousCOGS > 0 
      ? ((currentCOGS - previousCOGS) / previousCOGS) * 100 
      : 0

    const profitChange = previousGrossProfit > 0 
      ? ((currentGrossProfit - previousGrossProfit) / previousGrossProfit) * 100 
      : 0

    const marginChange = previousGrossMargin > 0 
      ? currentGrossMargin - previousGrossMargin 
      : 0

    return NextResponse.json({
      current: {
        totalSales: currentTotalSales,
        cogs: currentCOGS,
        grossProfit: currentGrossProfit,
        grossMargin: currentGrossMargin
      },
      previous: {
        totalSales: previousTotalSales,
        cogs: previousCOGS,
        grossProfit: previousGrossProfit,
        grossMargin: previousGrossMargin
      },
      changes: {
        salesChange,
        cogsChange,
        profitChange,
        marginChange
      },
      comparison: {
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      }
    })
  } catch (error) {
    console.error("Error fetching sales profitability data:", error)
    return NextResponse.json(
      { error: "Failed to fetch sales profitability data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
