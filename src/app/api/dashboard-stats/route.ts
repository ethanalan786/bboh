import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(2)}`
}

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(0)}%`
}

// Helper function to format large numbers
const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

// Helper function to parse MongoDB date
const parseMongoDate = (date: any): Date => {
  if (!date) return new Date()
  if (typeof date === 'object' && date.$date) {
    return new Date(date.$date)
  }
  return new Date(date)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const now = new Date()

    // Use custom date range if provided, otherwise default to today
    const startDate = dateFrom ? new Date(dateFrom) : (() => {
        const defaultStartDate = new Date(now)
        defaultStartDate.setHours(0, 0, 0, 0)
        return defaultStartDate
    })()

    const endDate = dateTo ? new Date(dateTo) : (() => {
        const defaultEndDate = new Date(now)
        defaultEndDate.setHours(23, 59, 59, 999)
        return defaultEndDate
    })()
    
    // For previous period comparison, we need the same duration before the start date
    const duration = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - duration)
    const previousEndDate = new Date(startDate)
    
    // Fetch sales data for different time periods
    const getSalesData = async (startDate: Date, endDate: Date) => {
      try {
        const salesResults = await prisma.$runCommandRaw({
          find: 'Sale',
          filter: {
            saleDate: {
              $gte: startDate,
              $lte: endDate
            }
          },
          sort: { saleDate: -1 }
        }) as any
        
        const sales = salesResults.cursor?.firstBatch || []
        
        // Transform and calculate metrics
        let totalRevenue = 0
        let totalProfit = 0
        let totalOrders = sales.length
        
        for (const sale of sales) {
          const productId = typeof sale.productId === 'object' && sale.productId?.$oid 
            ? sale.productId.$oid 
            : sale.productId
          
          let product = null
          if (productId) {
            try {
              product = await prisma.product.findUnique({
                where: { id: productId },
                select: { costPrice: true }
              })
            } catch (e) {
              console.error('Error fetching product:', e)
            }
          }
          
          const costPrice = product?.costPrice || 0
          const quantity = sale.quantity || 0
          const discountAmount = (sale.totalPrice || 0) * ((sale.discountPercentage || 0) / 100)
          const finalPrice = (sale.totalPrice || 0) - discountAmount
          const totalCost = costPrice * quantity
          const grossProfit = finalPrice - totalCost
          
          totalRevenue += finalPrice
          totalProfit += grossProfit
        }
        
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
        
        return {
          totalRevenue,
          totalProfit,
          totalOrders,
          avgOrderValue
        }
      } catch (error) {
        console.error("Error fetching sales data:", error)
        return {
          totalRevenue: 0,
          totalProfit: 0,
          totalOrders: 0,
          avgOrderValue: 0
        }
      }
    }

    // Get current period data based on selected range
    const currentPeriodData = await getSalesData(startDate, endDate)
    
    // Get previous period data for trend calculation
    const previousPeriodData = await getSalesData(previousStartDate, previousEndDate)

    // Calculate trends
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    const salesTrend = calculateTrend(currentPeriodData.totalRevenue, previousPeriodData.totalRevenue)
    const profitTrend = calculateTrend(currentPeriodData.totalProfit, previousPeriodData.totalProfit)
    const ordersTrend = calculateTrend(currentPeriodData.totalOrders, previousPeriodData.totalOrders)
    const aovTrend = calculateTrend(currentPeriodData.avgOrderValue, previousPeriodData.avgOrderValue)
    const earningTrend = calculateTrend(currentPeriodData.totalRevenue, previousPeriodData.totalRevenue)

    // Also fetch burn box sales for comprehensive data
    let burnBoxStats = {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalOrders: 0,
      avgOrderValue: 0
    }
    
    try {
      // Build URL with date parameters if available
      const burnBoxParams = new URLSearchParams()
      if (session?.user?.role === 'ADMIN') {
        burnBoxParams.append('allSales', 'true')
      }
      if (dateFrom) burnBoxParams.append('dateFrom', dateFrom)
      if (dateTo) burnBoxParams.append('dateTo', dateTo)
      
      const burnBoxResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/burnbox-sales?${burnBoxParams.toString()}`)
      if (burnBoxResponse.ok) {
        const burnBoxData = await burnBoxResponse.json()
        if (burnBoxData.stats) {
          burnBoxStats = {
            totalSales: burnBoxData.stats.totalSales || 0,
            totalRevenue: burnBoxData.stats.totalRevenue || 0,
            totalProfit: burnBoxData.stats.totalProfit || 0,
            totalOrders: burnBoxData.stats.totalRecipesSold || 0,
            avgOrderValue: burnBoxData.stats.totalSales > 0 
              ? burnBoxData.stats.totalRevenue / burnBoxData.stats.totalSales 
              : 0
          }
        }
      }
    } catch (error) {
      console.error("Error fetching burn box stats:", error)
    }

    // Calculate daily breakdown for the selected date range
    const getDailySales = async (startDate: Date, endDate: Date) => {
      try {
        const dailyData = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          const dayStart = new Date(currentDate)
          dayStart.setHours(0, 0, 0, 0)

          const dayEnd = new Date(currentDate)
          dayEnd.setHours(23, 59, 59, 999)

          const daySales = await getSalesData(dayStart, dayEnd)
          dailyData.push({
            date: new Date(currentDate),
            revenue: daySales.totalRevenue
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

        return dailyData
      } catch (error) {
        console.error("Error fetching daily sales:", error)
        return []
      }
    }

    // Get daily data for the selected range
    const dailyData = await getDailySales(startDate, endDate)

    // For chart data, show all days in the selected range
    // If range is very large (> 30 days), show last 30 days
    // If range is medium (8-30 days), show all days
    // If range is small (< 8 days), show all days
    let chartData = dailyData

    if (dailyData.length > 30) {
      // Show last 30 days for very large ranges
      chartData = dailyData.slice(-30)
    }

    // If no data found, return empty results (no random data generation)
    if (chartData.length === 0 || chartData.every(d => d.revenue === 0)) {
      chartData = []
    }

    // Calculate bottom metrics proportions based on selected range
    const maxMetric = Math.max(
      currentPeriodData.totalRevenue,
      currentPeriodData.totalProfit,
      currentPeriodData.totalRevenue - currentPeriodData.totalProfit // Expense as (Revenue - Profit)
    )
    
    const earningPercentage = maxMetric > 0 ? (currentPeriodData.totalRevenue / maxMetric) * 100 : 30
    const profitPercentage = maxMetric > 0 ? (currentPeriodData.totalProfit / maxMetric) * 100 : 55
    const expenseValue = currentPeriodData.totalRevenue - currentPeriodData.totalProfit
    const expensePercentage = maxMetric > 0 ? (expenseValue / maxMetric) * 100 : 40

    // Combine regular sales and burn box sales
    const combinedStats = {
      totalSales: {
        value: currentPeriodData.totalRevenue + burnBoxStats.totalRevenue,
        change: salesTrend,
        period: dateFrom && dateTo ? "Selected Range" : "Last 6 months"
      },
      totalProfit: {
        value: currentPeriodData.totalProfit + burnBoxStats.totalProfit,
        change: profitTrend,
        period: dateFrom && dateTo ? "Selected Range" : "Last One year"
      },
      totalOrders: {
        value: currentPeriodData.totalOrders + burnBoxStats.totalOrders,
        change: ordersTrend,
        period: dateFrom && dateTo ? "Selected Range" : "Last 4 months"
      },
      avgOrderValue: {
        value: currentPeriodData.avgOrderValue,
        change: aovTrend,
        period: dateFrom && dateTo ? "Selected Range" : "Last 6 months"
      },
      weeklyEarnings: {
        value: currentPeriodData.totalRevenue,
        change: salesTrend,
        earning: currentPeriodData.totalRevenue,
        profit: currentPeriodData.totalProfit,
        expense: expenseValue,
        earningPercentage: earningPercentage,
        profitPercentage: profitPercentage,
        expensePercentage: expensePercentage
      },
      weeklyChartData: chartData.map((day, index) => {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const colors = ["var(--chart-5)", "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)"]
        
        return {
          day: dayNames[day.date.getDay()],
          label: dayLabels[day.date.getDay()],
          value: day.revenue,
          fill: colors[day.date.getDay()]
        }
      })
    }

    return NextResponse.json({
      totalSales: {
        value: formatCurrency(combinedStats.totalSales.value),
        change: formatPercentage(combinedStats.totalSales.change),
        trend: combinedStats.totalSales.change >= 0 ? "up" : "down",
        period: combinedStats.totalSales.period
      },
      totalProfit: {
        value: formatCurrency(combinedStats.totalProfit.value),
        change: formatPercentage(combinedStats.totalProfit.change),
        trend: combinedStats.totalProfit.change >= 0 ? "up" : "down",
        period: combinedStats.totalProfit.period
      },
      totalOrders: {
        value: formatNumber(combinedStats.totalOrders.value),
        change: formatPercentage(combinedStats.totalOrders.change),
        trend: combinedStats.totalOrders.change >= 0 ? "up" : "down",
        period: combinedStats.totalOrders.period
      },
      avgOrderValue: {
        value: formatCurrency(combinedStats.avgOrderValue.value),
        change: formatPercentage(combinedStats.avgOrderValue.change),
        trend: combinedStats.avgOrderValue.change >= 0 ? "up" : "down",
        period: combinedStats.avgOrderValue.period
      },
      weeklyEarnings: {
        value: formatCurrency(combinedStats.weeklyEarnings.value),
        change: formatPercentage(combinedStats.weeklyEarnings.change),
        trend: combinedStats.weeklyEarnings.change >= 0 ? "up" : "down",
        earning: formatCurrency(combinedStats.weeklyEarnings.earning),
        profit: formatCurrency(combinedStats.weeklyEarnings.profit),
        expense: formatCurrency(combinedStats.weeklyEarnings.expense),
        earningPercentage: Math.round(combinedStats.weeklyEarnings.earningPercentage),
        profitPercentage: Math.round(combinedStats.weeklyEarnings.profitPercentage),
        expensePercentage: Math.round(combinedStats.weeklyEarnings.expensePercentage)
      },
      weeklyChartData: chartData.map((day, index: number) => {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const colors = ["var(--chart-5)", "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)"]

        // Format date label (e.g., "Sep 22" or "Sep 22, 2024" for different years)
        const formatDateLabel = (date: Date) => {
          const today = new Date()
          const isSameYear = date.getFullYear() === today.getFullYear()
          if (isSameYear) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }
        }

        return {
          day: dayNames[day.date.getDay()],
          label: formatDateLabel(day.date),
          value: day.revenue,
          fill: colors[day.date.getDay()]
        }
      })
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
