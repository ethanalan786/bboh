import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session check:', session?.user?.id, session?.user?.role)
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Build where clause
    const whereClause: any = {
      userId: session.user.id
    }

    // Add date filter if provided
    if (dateParam) {
      // Parse the date and set it to start of day (UTC)
      const startDate = new Date(dateParam + 'T00:00:00.000Z')
      const endDate = new Date(dateParam + 'T23:59:59.999Z')
      
      whereClause.saleDate = {
        gte: startDate,
        lte: endDate
      }
    }

    console.log('Fetching sales for user:', session.user.id, 'with date filter:', dateParam)

    // Get user's sales with product information
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        product: true
      },
      orderBy: {
        saleDate: 'desc'
      },
      take: 50 // Limit to recent 50 sales
    })

    console.log('Found sales:', sales.length)

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching user sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}