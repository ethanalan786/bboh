import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to parse MongoDB date format
function parseMongoDate(date: any): Date {
  if (!date) return new Date()
  
  // Handle MongoDB date object format: { $date: "ISO-string" }
  if (typeof date === 'object' && date.$date) {
    return new Date(date.$date)
  }
  
  // Handle regular Date object or string
  return new Date(date)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const productId = searchParams.get("productId")

    // Build base where clause
    const whereClause: any = {}
    
    // Add product filter if provided
    if (productId) {
      whereClause.productId = productId
    }

    // Build date filter for stock history if provided
    const stockDateFilter = dateFrom && dateTo ? {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo + 'T23:59:59.999Z')
      }
    } : undefined

    // Combine filters for stock history
    const stockWhereClause = {
      ...whereClause,
      ...stockDateFilter
    }

    // Fetch StockHistory using Prisma
    const stockHistory = await prisma.stockHistory.findMany({
      where: stockWhereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, sku: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // Build date filter for sales if provided
    const salesDateFilter: any = dateFrom && dateTo ? {
      saleDate: {
        $gte: new Date(dateFrom),
        lte: new Date(dateTo + 'T23:59:59.999Z')
      }
    } : {}

    // Add product filter to sales if provided
    if (productId) {
      salesDateFilter.productId = productId
    }

    // Fetch Sales using raw MongoDB to handle missing paymentMethodId
    const salesResults = await prisma.$runCommandRaw({
      find: 'Sale',
      filter: salesDateFilter,
      sort: { saleDate: -1 },
      limit: limit
    }) as any

    const sales = salesResults.cursor?.firstBatch || []

    // Transform StockHistory records
    const stockTransactions = stockHistory.map((history) => {
      const previousStock = history.previousStock ?? (history.stockLevel - 1) >= 0 ? history.stockLevel - 1 : 0
      const newStock = history.newStock ?? history.stockLevel

      return {
        id: history.id,
        productId: history.productId,
        productName: history.product?.name || "Unknown Product",
        productSku: history.product?.sku || "Unknown SKU",
        stockLevel: history.stockLevel,
        date: history.date,
        userId: history.userId,
        userName: history.user?.name || history.user?.email || "Unknown User",
        reason: history.reason || "",
        transactionType: history.transactionType || "STOCK_ADDED",
        previousStock: previousStock,
        newStock: newStock,
        createdAt: history.createdAt,
      }
    })

    // Transform Sale records to transaction format
    const saleTransactions = await Promise.all(
      sales.map(async (sale: any) => {
        const saleProductId = typeof sale.productId === 'object' && sale.productId?.$oid 
          ? sale.productId.$oid 
          : sale.productId
        
        const userId = typeof sale.userId === 'object' && sale.userId?.$oid 
          ? sale.userId.$oid 
          : sale.userId

        // Skip if this sale doesn't match the requested product (when filtering)
        if (productId && saleProductId !== productId) {
          return null
        }

        // Fetch product and user info
        let product = null
        let user = null

        if (saleProductId) {
          try {
            product = await prisma.product.findUnique({
              where: { id: saleProductId },
              select: { name: true, sku: true }
            })
          } catch (e) {
            console.error('Error fetching product:', e)
          }
        }

        if (userId) {
          try {
            user = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true }
            })
          } catch (e) {
            console.error('Error fetching user:', e)
          }
        }

        const quantitySold = sale.quantity || 0
        const totalPrice = sale.totalPrice || 0

        return {
          id: sale._id?.$oid || sale._id,
          productId: saleProductId,
          productName: product?.name || "Unknown Product",
          productSku: product?.sku || "Unknown SKU",
          stockLevel: -quantitySold, // Negative to indicate stock decrease
          date: parseMongoDate(sale.saleDate),
          userId: userId,
          userName: user?.name || user?.email || "Unknown User",
          reason: `Sale of ${quantitySold} unit(s) - $${totalPrice.toFixed(2)}`,
          transactionType: "SALE",
          previousStock: quantitySold,
          newStock: 0,
          createdAt: parseMongoDate(sale.createdAt),
        }
      })
    )

    // Filter out null entries and combine with stock transactions
    const validSaleTransactions = saleTransactions.filter(t => t !== null)
    const allTransactions = [...stockTransactions, ...validSaleTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Limit the total results
    const limitedTransactions = allTransactions.slice(0, limit)

    return NextResponse.json({
      transactions: limitedTransactions,
      total: limitedTransactions.length
    })
  } catch (error) {
    console.error("Error fetching stock transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}