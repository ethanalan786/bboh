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

    // Calculate KPIs
    const totalSales = burnboxSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0) +
                      apparelSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.totalPrice || 0), 0)

    const quantitySold = burnboxSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0) +
                        apparelSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0)

    const totalTransactions = burnboxSales.length + apparelSales.length

    const avgSaleValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Calculate discounts (difference between original price and actual price)
    const discounts = burnboxSales.reduce((sum, sale) => {
      const originalPrice = sale.unitPrice * sale.quantity
      return sum + (originalPrice - sale.totalPrice)
    }, 0) + apparelSales.reduce((sum, sale) => {
      const originalPrice = (sale.unitPrice || 0) * (sale.quantity || 0)
      const actualPrice = sale.totalAmount || sale.totalPrice || 0
      return sum + (originalPrice - actualPrice)
    }, 0)

    // Count unique customers
    const uniqueCustomers = new Set([
      ...burnboxSales.map(sale => sale.customerId).filter(Boolean),
      ...apparelSales.map(sale => sale.customerId).filter(Boolean)
    ]).size

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

        const prevTotalSales = prevBurnboxSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0) +
                             prevApparelSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.totalPrice || 0), 0)

        const prevQuantitySold = prevBurnboxSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0) +
                               prevApparelSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0)

        const prevTotalTransactions = prevBurnboxSales.length + prevApparelSales.length

        const prevAvgSaleValue = prevTotalTransactions > 0 ? prevTotalSales / prevTotalTransactions : 0

        const prevUniqueCustomers = new Set([
          ...prevBurnboxSales.map(sale => sale.customerId).filter(Boolean),
          ...prevApparelSales.map(sale => sale.customerId).filter(Boolean)
        ]).size

        const prevDiscounts = prevBurnboxSales.reduce((sum, sale) => {
          const originalPrice = sale.unitPrice * sale.quantity
          return sum + (originalPrice - sale.totalPrice)
        }, 0) + prevApparelSales.reduce((sum, sale) => {
          const originalPrice = (sale.unitPrice || 0) * (sale.quantity || 0)
          const actualPrice = sale.totalAmount || sale.totalPrice || 0
          return sum + (originalPrice - actualPrice)
        }, 0)

        // Calculate percentage changes
        const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0
        const quantityChange = prevQuantitySold > 0 ? ((quantitySold - prevQuantitySold) / prevQuantitySold) * 100 : 0
        const avgValueChange = prevAvgSaleValue > 0 ? ((avgSaleValue - prevAvgSaleValue) / prevAvgSaleValue) * 100 : 0
        const transactionsChange = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0
        const customersChange = prevUniqueCustomers > 0 ? ((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers) * 100 : 0
        const discountsChange = prevDiscounts > 0 ? ((discounts - prevDiscounts) / prevDiscounts) * 100 : 0

        comparison = {
          salesChange,
          quantityChange,
          avgValueChange,
          transactionsChange,
          customersChange,
          discountsChange
        }
      }
    }

    return NextResponse.json({
      totalSales,
      quantitySold,
      avgSaleValue,
      totalTransactions,
      uniqueCustomers,
      discounts,
      comparison
    })
  } catch (error) {
    console.error('Error fetching sales dashboard KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales dashboard KPIs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}