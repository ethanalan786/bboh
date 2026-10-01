import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const productId = searchParams.get("productId")
    const transactionType = searchParams.get("transactionType")

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Fetch stock history with filters
    const whereClause: any = {
      date: {
        gte: start,
        lte: end
      }
    }

    if (productId) {
      whereClause.productId = productId
    }

    if (transactionType && transactionType !== 'all') {
      whereClause.transactionType = transactionType
    }

    const stockHistory = await prisma.stockHistory.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }) as any[]

    // Also fetch ingredient adjustments
    const ingredientAdjustments = await prisma.ingredientAdjustment.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
        ...(productId ? { ingredientId: productId } : {})
      },
      orderBy: { date: 'desc' }
    }) as any[]

    // Process stock history data
    const processedMovements = stockHistory.map(history => {
      const quantityChange = history.newStock !== null && history.previousStock !== null 
        ? history.newStock - history.previousStock 
        : 0

      return {
        id: history.id,
        date: history.date,
        productId: history.productId,
        productName: history.product?.name || 'Unknown',
        productSku: history.product?.sku || 'N/A',
        category: history.product?.category || 'Unknown',
        transactionType: history.transactionType || 'STOCK_ADJUSTED',
        previousStock: history.previousStock,
        newStock: history.newStock,
        quantityChange,
        userId: history.userId,
        userName: history.user?.name || 'Unknown',
        userEmail: history.user?.email || 'Unknown',
        reason: history.reason
      }
    })

    // Process ingredient adjustments
    const processedIngredientMovements = ingredientAdjustments.map(adj => {
      return {
        id: adj.id,
        date: adj.date,
        productId: adj.ingredientId,
        productName: adj.ingredientName,
        productSku: adj.ingredientSku,
        category: 'Ingredient',
        transactionType: adj.adjustmentType,
        previousStock: adj.previousStock,
        newStock: adj.newStock,
        quantityChange: adj.quantity,
        userId: adj.userId,
        userName: adj.userName,
        userEmail: adj.userEmail,
        reason: adj.reason,
        isDiscrepancy: adj.isDiscrepancy,
        resolved: adj.resolved
      }
    })

    // Combine and sort by date
    const allMovements = [...processedMovements, ...processedIngredientMovements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate summary statistics
    const totalMovements = allMovements.length
    const purchasesReceived = allMovements.filter(m => m.transactionType === 'STOCK_ADDED').length
    const salesDeductions = allMovements.filter(m => m.transactionType === 'SALE').length
    const adjustments = allMovements.filter(m => m.transactionType === 'STOCK_ADJUSTED').length
    const wastage = allMovements.filter(m => ['WASTAGE', 'DAMAGE', 'EXPIRY', 'THEFT'].includes(m.transactionType)).length

    return NextResponse.json({
      movements: allMovements,
      summary: {
        totalMovements,
        purchasesReceived,
        salesDeductions,
        adjustments,
        wastage
      }
    })
  } catch (error) {
    console.error("Error fetching inventory movement data:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory movement data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
