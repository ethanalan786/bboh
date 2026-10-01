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
    }) as any[]

    // Calculate daily sales
    const dailySalesMap = new Map<string, number>()
    
    // Process BurnBox sales by date
    burnboxSales.forEach(sale => {
      const date = new Date(sale.saleDate)
      const dateKey = date.toISOString().split('T')[0]
      const existing = dailySalesMap.get(dateKey)
      if (existing) {
        dailySalesMap.set(dateKey, existing + (sale.totalPrice || 0))
      } else {
        dailySalesMap.set(dateKey, sale.totalPrice || 0)
      }
    })

    // Process apparel sales by date
    apparelSales.forEach(sale => {
      const date = new Date(sale.saleDate)
      const dateKey = date.toISOString().split('T')[0]
      const existing = dailySalesMap.get(dateKey)
      if (existing) {
        dailySalesMap.set(dateKey, existing + (sale.totalAmount || sale.totalPrice || 0))
      } else {
        dailySalesMap.set(dateKey, sale.totalAmount || sale.totalPrice || 0)
      }
    })

    // Convert to array and sort by date
    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, sales]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({ dailySales })
  } catch (error) {
    console.error('Error fetching sales dashboard chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales dashboard chart data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}