import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("Fetching employee sales with date range:", { startDate, endDate })

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate) as any
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate + 'T23:59:59.999Z') as any
    }

    // Fetch sales grouped by user
    const sales = await prisma.sale.findMany({
      where: dateFilter.saleDate ? { saleDate: dateFilter } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    }) as any[]

    console.log("Fetched sales:", sales.length)

    // Group sales by employee
    const employeeSalesMap = new Map<string, {
      employeeId: string
      employeeName: string
      employeeEmail: string
      totalQuantity: number
      totalRevenue: number
    }>()

    sales.forEach(sale => {
      const userId = sale.userId
      const userName = sale.user?.name || 'Unknown'
      const userEmail = sale.user?.email || ''

      if (!employeeSalesMap.has(userId)) {
        employeeSalesMap.set(userId, {
          employeeId: userId,
          employeeName: userName,
          employeeEmail: userEmail,
          totalQuantity: 0,
          totalRevenue: 0
        })
      }

      const empData = employeeSalesMap.get(userId)!
      empData.totalQuantity += sale.quantity || 0
      empData.totalRevenue += sale.totalPrice || 0
    })

    // Convert to array and sort by revenue descending
    const employeeSales = Array.from(employeeSalesMap.values())
      .map(emp => ({
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        employeeEmail: emp.employeeEmail,
        totalQuantity: emp.totalQuantity,
        totalRevenue: emp.totalRevenue
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    console.log("Employee sales grouped:", employeeSales.length)

    return NextResponse.json({
      employeeSales
    })
  } catch (error) {
    console.error("Error fetching employee sales data:", error)
    return NextResponse.json(
      { error: "Failed to fetch employee sales data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
