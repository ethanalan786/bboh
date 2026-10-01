import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build date filter
    const dateFilter: any = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }

    // Fetch BurnBox sales
    const burnboxSales = await prisma.burnBoxSale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
    }) as any[]

    // Fetch apparel sales with product data
    const apparelSales = await prisma.sale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
      include: {
        product: {
          select: {
            category: true
          }
        }
      }
    }) as any[]

    // Calculate sales by category
    const categorySales = new Map<string, number>()
    
    // Add BurnBox sales to "Smoothies" category
    const burnboxTotal = burnboxSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
    categorySales.set("Smoothies", (categorySales.get("Smoothies") || 0) + burnboxTotal)

    // Add apparel sales by their categories
    apparelSales.forEach(sale => {
      const category = sale.product?.category || "Other"
      const sales = sale.totalAmount || sale.totalPrice || 0
      categorySales.set(category, (categorySales.get(category) || 0) + sales)
    })

    const totalSales = Array.from(categorySales.values()).reduce((sum, val) => sum + val, 0)

    const categories = Array.from(categorySales.entries())
      .map(([name, sales]) => ({
        name,
        sales,
        percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0,
        color: name === "Smoothies" ? "#10b981" : 
              name === "APPAREL" ? "#3b82f6" :
              name === "SUPPLEMENTS" ? "#8b5cf6" :
              name === "MERCHANDISE" ? "#f97316" : "#ec4899"
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching top categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}