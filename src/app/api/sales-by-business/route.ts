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

    // Calculate sales by business
    const burnboxTotal = burnboxSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
    const apparelTotal = apparelSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.totalPrice || 0), 0)
    const totalSales = burnboxTotal + apparelTotal

    const businessData = [
      {
        business: "Burn Box",
        sales: burnboxTotal,
        percentage: totalSales > 0 ? (burnboxTotal / totalSales) * 100 : 0,
        fill: "#f97316"
      },
      {
        business: "Box Apparel",
        sales: apparelTotal,
        percentage: totalSales > 0 ? (apparelTotal / totalSales) * 100 : 0,
        fill: "#10b981"
      }
    ]

    return NextResponse.json({ businessData })
  } catch (error) {
    console.error('Error fetching sales by business:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales by business', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}