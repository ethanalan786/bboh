import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || 'burn-box'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build filter
    const filter: any = {
      location: location === 'burnbox' ? 'burn-box' : location, // Fix location mapping
    }

    if (dateFrom || dateTo) {
      filter.dateTime = {}
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        filter.dateTime.gte = fromDate
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        filter.dateTime.lte = toDate
      }
    }

    // Use raw MongoDB query for better performance
    console.log('GymMaster sales query filter:', JSON.stringify(filter))
    const salesResults = await prisma.$runCommandRaw({
      find: 'GymMasterSale',
      filter,
      sort: { dateTime: -1 },
      limit: limit
    }) as any

    const sales = salesResults.cursor?.firstBatch || []
    console.log('Raw MongoDB sales count:', sales.length)

    // Transform the data
    const transformedSales = sales.map((sale: any) => {
      const id = sale._id?.$oid || sale._id
      
      // Handle MongoDB date formats
      const parseMongoDate = (dateField: any) => {
        if (!dateField) return null
        if (dateField.$date) return new Date(dateField.$date)
        if (typeof dateField === 'string') return new Date(dateField)
        if (dateField instanceof Date) return dateField
        return null
      }
      
      return {
        id,
        externalId: sale.externalId,
        dateTime: parseMongoDate(sale.dateTime),
        orderNumber: sale.orderNumber,
        product: sale.product,
        type: sale.type,
        amount: sale.amount,
        quantity: sale.quantity,
        location: sale.location,
        lastSyncAt: parseMongoDate(sale.lastSyncAt),
        createdAt: parseMongoDate(sale.createdAt),
      }
    })

    // Calculate statistics
    const totalSales = transformedSales.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0)
    const totalRevenue = transformedSales.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
    const totalTransactions = transformedSales.length

    const stats = {
      totalSales,
      totalRevenue,
      totalTransactions,
    }

    console.log('Returning GymMaster sales:', transformedSales.length, 'Sample:', transformedSales[0])
    return NextResponse.json({
      sales: transformedSales,
      stats,
    })
  } catch (error) {
    console.error('Error fetching GymMaster sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GymMaster sales', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
