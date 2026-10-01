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

    // Fetch apparel products (APPAREL, WOMENS_APPAREL, MENS_APPAREL, ACCESSORIES)
    const apparelProducts = await prisma.product.findMany({
      where: {
        category: {
          name: {
            in: ["APPAREL", "WOMENS_APPAREL", "MENS_APPAREL", "ACCESSORIES"]
          }
        }
      },
      orderBy: { name: "asc" }
    }) as any[]

    // Fetch sales for the period
    const sales = await prisma.sale.findMany({
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

    // Calculate profitability per product
    const productProfitability = apparelProducts.map(product => {
      const productSales = sales.filter(sale => sale.productId === product.id)
      
      const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0)
      const totalRevenue = productSales.reduce((sum, sale) => {
        const price = sale.unitPrice || sale.product?.sellingPrice || 0
        return sum + (sale.quantity * price)
      }, 0)
      
      const totalCOGS = productSales.reduce((sum, sale) => {
        const cost = sale.product?.costPrice || 0
        return sum + (sale.quantity * cost)
      }, 0)
      
      const grossProfit = totalRevenue - totalCOGS
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        totalQuantity,
        totalRevenue,
        totalCOGS,
        grossProfit,
        profitMargin,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice
      }
    })

    // Sort by gross profit descending
    productProfitability.sort((a, b) => b.grossProfit - a.grossProfit)

    // Calculate summary statistics
    const totalRevenue = productProfitability.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalCOGS = productProfitability.reduce((sum, p) => sum + p.totalCOGS, 0)
    const totalGrossProfit = productProfitability.reduce((sum, p) => sum + p.grossProfit, 0)
    const avgProfitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

    const mostProfitable = productProfitability[0] || null
    const leastProfitable = productProfitability[productProfitability.length - 1] || null

    return NextResponse.json({
      products: productProfitability,
      summary: {
        totalRevenue,
        totalCOGS,
        totalGrossProfit,
        avgProfitMargin,
        mostProfitable,
        leastProfitable
      }
    })
  } catch (error) {
    console.error("Error fetching product profitability data:", error)
    return NextResponse.json(
      { error: "Failed to fetch product profitability data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
