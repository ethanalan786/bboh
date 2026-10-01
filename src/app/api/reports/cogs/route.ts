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

    // Fetch BurnBox sales with ingredient costs
    const burnboxSales = await prisma.burnBoxSale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
      orderBy: { saleDate: 'desc' }
    }) as any[]

    // Fetch apparel sales
    const apparelSales = await prisma.sale.findMany({
      where: dateFilter ? { saleDate: dateFilter } : undefined,
      orderBy: { saleDate: 'desc' }
    }) as any[]

    // Calculate COGS for BurnBox sales (ingredientCost is already calculated)
    const burnboxCOGS = burnboxSales.reduce((sum: number, sale: any) => {
      return sum + (sale.ingredientCost || 0)
    }, 0)

    const burnboxRevenue = burnboxSales.reduce((sum: number, sale: any) => {
      return sum + (sale.totalPrice || 0)
    }, 0)

    // Calculate COGS for apparel sales (need to fetch product costPrice)
    let apparelCOGS = 0
    let apparelRevenue = 0
    const apparelCOGSByProduct = new Map<string, { name: string; cogs: number; revenue: number; quantity: number }>()

    for (const sale of apparelSales) {
      const productId = sale.productId

      if (productId) {
        try {
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { name: true, costPrice: true, category: true }
          })

          if (product) {
            const cost = (product.costPrice || 0) * (sale.quantity || 1)
            const revenue = sale.totalAmount || sale.totalPrice || 0
            apparelCOGS += cost
            apparelRevenue += revenue

            // Track by product for breakdown
            const existing = apparelCOGSByProduct.get(productId)
            if (existing) {
              existing.cogs += cost
              existing.revenue += revenue
              existing.quantity += sale.quantity || 1
            } else {
              apparelCOGSByProduct.set(productId, {
                name: product.name,
                cogs: cost,
                revenue: revenue,
                quantity: sale.quantity || 1
              })
            }
          }
        } catch (e) {
          console.error('Error fetching product for COGS:', e)
        }
      }
    }

    // Calculate total COGS
    const totalCOGS = burnboxCOGS + apparelCOGS
    const totalRevenue = burnboxRevenue + apparelRevenue

    // Calculate COGS by category
    const burnboxCOGSByRecipe = new Map<string, { name: string; cogs: number; revenue: number; quantity: number }>()
    burnboxSales.forEach((sale: any) => {
      const existing = burnboxCOGSByRecipe.get(sale.recipeId)
      if (existing) {
        existing.cogs += sale.ingredientCost || 0
        existing.revenue += sale.totalPrice || 0
        existing.quantity += sale.quantity || 1
      } else {
        burnboxCOGSByRecipe.set(sale.recipeId, {
          name: sale.recipeName,
          cogs: sale.ingredientCost || 0,
          revenue: sale.totalPrice || 0,
          quantity: sale.quantity || 1
        })
      }
    })

    // Calculate daily COGS over time
    const dailyCOGSMap = new Map<string, { date: string; cogs: number; revenue: number; sortDate: Date }>()
    
    // Process BurnBox sales by date
    burnboxSales.forEach((sale: any) => {
      const date = new Date(sale.saleDate)
      const dateKey = date.toISOString().split('T')[0]
      const existing = dailyCOGSMap.get(dateKey)
      if (existing) {
        existing.cogs += sale.ingredientCost || 0
        existing.revenue += sale.totalPrice || 0
      } else {
        dailyCOGSMap.set(dateKey, {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cogs: sale.ingredientCost || 0,
          revenue: sale.totalPrice || 0,
          sortDate: date
        })
      }
    })

    // Process apparel sales by date
    for (const sale of apparelSales) {
      const productId = sale.productId

      if (productId) {
        try {
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { costPrice: true }
          })

          if (product) {
            const date = new Date(sale.saleDate)
            const dateKey = date.toISOString().split('T')[0]
            const cost = (product.costPrice || 0) * (sale.quantity || 1)
            const revenue = sale.totalAmount || sale.totalPrice || 0
            
            const existing = dailyCOGSMap.get(dateKey)
            if (existing) {
              existing.cogs += cost
              existing.revenue += revenue
            } else {
              dailyCOGSMap.set(dateKey, {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                cogs: cost,
                revenue: revenue,
                sortDate: date
              })
            }
          }
        } catch (e) {
          console.error('Error fetching product for daily COGS:', e)
        }
      }
    }

    // Convert dailyCOGS to array and sort by date
    const dailyCOGSArray = Array.from(dailyCOGSMap.values())
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ sortDate, ...rest }) => rest)

    // Calculate COGS by category
    const categoryBreakdown = [
      {
        category: 'BurnBox',
        cogs: burnboxCOGS,
        revenue: burnboxRevenue,
        percentage: totalCOGS > 0 ? (burnboxCOGS / totalCOGS) * 100 : 0
      },
      {
        category: 'Apparel',
        cogs: apparelCOGS,
        revenue: apparelRevenue,
        percentage: totalCOGS > 0 ? (apparelCOGS / totalCOGS) * 100 : 0
      }
    ]

    // Calculate comparison with previous period
    let comparison = null
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff > 0) {
        const prevFromDate = new Date(fromDate)
        prevFromDate.setDate(prevFromDate.getDate() - daysDiff)
        const prevToDate = new Date(toDate)
        prevToDate.setDate(prevToDate.getDate() - daysDiff)

        const prevDateFilter: any = {
          gte: prevFromDate,
          lte: prevToDate
        }

        // Fetch previous period data
        const prevBurnboxSales = await prisma.burnBoxSale.findMany({
          where: { saleDate: prevDateFilter }
        }) as any[]

        const prevApparelSales = await prisma.sale.findMany({
          where: { saleDate: prevDateFilter }
        }) as any[]

        const prevBurnboxCOGS = prevBurnboxSales.reduce((sum: number, sale: any) => sum + (sale.ingredientCost || 0), 0)
        
        let prevApparelCOGS = 0
        for (const sale of prevApparelSales) {
          const productId = sale.productId
          if (productId) {
            try {
              const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { costPrice: true }
              })
              if (product) {
                prevApparelCOGS += (product.costPrice || 0) * (sale.quantity || 1)
              }
            } catch (e) {
              console.error('Error fetching product for previous COGS:', e)
            }
          }
        }

        const prevTotalCOGS = prevBurnboxCOGS + prevApparelCOGS
        const change = prevTotalCOGS > 0 ? ((totalCOGS - prevTotalCOGS) / prevTotalCOGS) * 100 : 0
        
        comparison = {
          previousCOGS: prevTotalCOGS,
          change: change,
          trend: change >= 0 ? 'up' : 'down'
        }
      }
    }

    return NextResponse.json({
      totalCOGS,
      totalRevenue,
      grossProfit: totalRevenue - totalCOGS,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
      burnboxCOGS,
      apparelCOGS,
      categoryBreakdown,
      dailyCOGS: dailyCOGSArray,
      burnboxBreakdown: Array.from(burnboxCOGSByRecipe.values()),
      apparelBreakdown: Array.from(apparelCOGSByProduct.values()),
      comparison,
      period: {
        from: dateFrom,
        to: dateTo
      }
    })
  } catch (error) {
    console.error('Error fetching COGS data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch COGS data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
