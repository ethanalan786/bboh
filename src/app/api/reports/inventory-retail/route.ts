import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    // Fetch apparel products (APPAREL, WOMENS_APPAREL, MENS_APPAREL, ACCESSORIES)
    const products = await prisma.product.findMany({
      where: {
        category: {
          name: {
            in: ["APPAREL", "WOMENS_APPAREL", "MENS_APPAREL", "ACCESSORIES"]
          }
        },
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      orderBy: { name: 'asc' }
    }) as any[]

    // Calculate retail value for each product
    const productRetailValues = products.map(product => {
      const quantity = product.stock || 0
      const sellingPrice = product.sellingPrice || 0
      const costPrice = product.costPrice || 0
      
      const totalRetailValue = quantity * sellingPrice
      const totalCostValue = quantity * costPrice
      const margin = totalRetailValue > 0 ? ((totalRetailValue - totalCostValue) / totalRetailValue) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity,
        sellingPrice,
        totalRetailValue,
        totalCostValue,
        margin,
        imageUrl: product.imageUrl
      }
    })

    // Calculate summary statistics
    const totalItems = productRetailValues.reduce((sum, p) => sum + p.quantity, 0)
    const totalRetailValue = productRetailValues.reduce((sum, p) => sum + p.totalRetailValue, 0)
    const totalCostValue = productRetailValues.reduce((sum, p) => sum + p.totalCostValue, 0)
    const avgSellingPrice = totalItems > 0 ? totalRetailValue / totalItems : 0

    // Calculate category breakdown
    const categoryBreakdown = productRetailValues.reduce((acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = { totalRetailValue: 0, count: 0 }
      }
      acc[category].totalRetailValue += product.totalRetailValue
      acc[category].count += 1
      return acc
    }, {} as Record<string, { totalRetailValue: number; count: number }>)

    const categoryData = Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      totalRetailValue: data.totalRetailValue,
      percentage: totalRetailValue > 0 ? (data.totalRetailValue / totalRetailValue) * 100 : 0
    })).sort((a, b) => b.totalRetailValue - a.totalRetailValue)

    // Calculate historical trend (last 20 days)
    const historicalData = []
    const now = new Date()
    for (let i = 19; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Simulate trend with some variation
      const variation = (19 - i) * 0.03 // 3% increase per day trend
      const dailyValue = totalRetailValue * (0.6 + variation + (Math.random() * 0.1))
      
      historicalData.push({
        date: dateStr,
        value: dailyValue
      })
    }

    return NextResponse.json({
      products: productRetailValues,
      summary: {
        totalItems,
        totalRetailValue,
        totalCostValue,
        avgSellingPrice
      },
      categoryBreakdown: categoryData,
      historicalData
    })
  } catch (error) {
    console.error("Error fetching inventory retail value data:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory retail value data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
