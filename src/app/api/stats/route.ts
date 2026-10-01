import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all products
    const allProducts = await prisma.product.findMany()

    // Fetch settings to get low stock threshold
    const settings = await (prisma as any).settings.findFirst()
    const lowStockThreshold = settings?.lowStockThreshold || 10

    // Calculate stats
    const totalProducts = allProducts.length
    const totalStockValue = allProducts.reduce((sum, p) => sum + ((p.sellingPrice || 0) * p.stock), 0)
    const lowStockItems = allProducts.filter(p => p.stock < lowStockThreshold).length

    // Get total sales for current month
    let totalSales = 0
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const sales = await prisma.sale.findMany({
        where: {
          saleDate: { gte: firstDayOfMonth } as any
        }
      })
      totalSales = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0)
    } catch (error) {
      console.error("Error fetching sales data:", error)
      // Continue with totalSales = 0 if sales data is corrupted
    }

    return NextResponse.json({
      totalProducts,
      totalStockValue,
      lowStockItems,
      totalSales
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}