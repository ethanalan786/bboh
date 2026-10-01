import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
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

    // Get BurnBox sales by recipe
    const burnboxSales = await prisma.burnBoxSale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
      select: {
        recipeId: true,
        recipeName: true,
        quantity: true,
        totalPrice: true,
      }
    }) as any[]

    // Get apparel sales by product
    const apparelSales = await prisma.sale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
      include: {
        product: {
          select: {
            name: true,
          }
        }
      }
    }) as any[]

    // Aggregate BurnBox sales by recipe
    const burnboxAggregated = new Map<string, { name: string; quantity: number; revenue: number }>()
    burnboxSales.forEach(sale => {
      const existing = burnboxAggregated.get(sale.recipeId)
      if (existing) {
        existing.quantity += sale.quantity
        existing.revenue += sale.totalPrice
      } else {
        burnboxAggregated.set(sale.recipeId, {
          name: sale.recipeName,
          quantity: sale.quantity,
          revenue: sale.totalPrice
        })
      }
    })

    // Aggregate apparel sales by product
    const apparelAggregated = new Map<string, { name: string; quantity: number; revenue: number }>()
    apparelSales.forEach(sale => {
      const productId = sale.productId
      if (productId) {
        const existing = apparelAggregated.get(productId)
        const productName = sale.product?.name || 'Unknown Product'
        const revenue = sale.totalAmount || sale.totalPrice || 0
        
        if (existing) {
          existing.quantity += sale.quantity
          existing.revenue += revenue
        } else {
          apparelAggregated.set(productId, {
            name: productName,
            quantity: sale.quantity,
            revenue: revenue
          })
        }
      }
    })

    // Combine and sort by quantity
    const allProducts = [
      ...Array.from(burnboxAggregated.values()),
      ...Array.from(apparelAggregated.values())
    ].sort((a, b) => b.quantity - a.quantity)

    // Calculate total visitors (total quantity sold)
    const totalVisitors = allProducts.reduce((sum, product) => sum + product.quantity, 0)

    // Format visitors as K notation
    const formatVisitors = (num: number) => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
      }
      return num.toString()
    }

    // Get top products
    const popularProducts = allProducts.slice(0, limit).map((product, index) => ({
      id: `product-${index}`,
      name: product.name,
      price: `$${product.revenue.toLocaleString()}`,
      visitors: formatVisitors(product.quantity),
      swatch: ['#e8e5df', '#d9d3c7', '#dfe6ea', '#e4d9d0', '#eceae6'][index % 5] // Default colors
    }))

    return NextResponse.json({
      products: popularProducts,
      totalVisitors: formatVisitors(totalVisitors)
    })
  } catch (error) {
    console.error('Error fetching popular products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}