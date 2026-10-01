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

    // Fetch apparel sales
    const apparelSales = await prisma.sale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    }) as any[]

    // Aggregate BurnBox sales by recipe
    const burnboxProductSales = new Map<string, { name: string; quantity: number; sales: number }>()
    burnboxSales.forEach(sale => {
      const existing = burnboxProductSales.get(sale.recipeId)
      if (existing) {
        existing.quantity += sale.quantity || 0
        existing.sales += sale.totalPrice || 0
      } else {
        burnboxProductSales.set(sale.recipeId, {
          name: sale.recipeName,
          quantity: sale.quantity || 0,
          sales: sale.totalPrice || 0
        })
      }
    })

    // Aggregate apparel sales by product
    const apparelProductSales = new Map<string, { name: string; quantity: number; sales: number }>()
    apparelSales.forEach(sale => {
      const productId = sale.productId
      if (productId) {
        const existing = apparelProductSales.get(productId)
        const productName = sale.product?.name || 'Unknown Product'
        const sales = sale.totalAmount || sale.totalPrice || 0
        
        if (existing) {
          existing.quantity += sale.quantity || 0
          existing.sales += sales
        } else {
          apparelProductSales.set(productId, {
            name: productName,
            quantity: sale.quantity || 0,
            sales: sales
          })
        }
      }
    })

    // Combine and sort by sales
    const allProducts = [
      ...Array.from(burnboxProductSales.values()),
      ...Array.from(apparelProductSales.values())
    ].sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    return NextResponse.json({ products: allProducts })
  } catch (error) {
    console.error('Error fetching top products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}