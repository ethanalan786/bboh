import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Fetch weekly reports with pagination
    const weeklyReports = await (prisma as any).weeklyReport.findMany({
      orderBy: { weekStart: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await (prisma as any).weeklyReport.count()

    // Transform reports for response
    const transformedReports = weeklyReports.map((report: any) => {
      const reportData = report.reportData as any
      
      // Handle both old and new data structures
      const summary = {
        businessName: reportData?.metadata?.businessName || reportData?.businessName || 'Burn Box',
        totalRevenue: reportData?.sales?.combined?.netRevenue || reportData?.totalRevenue || 0,
        grossProfit: reportData?.grossProfit?.total || reportData?.grossProfit || 0,
        grossMargin: reportData?.grossProfit?.margin || reportData?.grossMargin || 0,
        beginningInventory: reportData?.beginningInventory?.totalValue || reportData?.beginningInventory || 0,
        endingInventory: reportData?.endingInventory?.totalValue || reportData?.endingInventory || 0,
        totalPurchases: reportData?.purchases?.totalSpend || reportData?.totalPurchases || 0,
        totalWastage: reportData?.wastage?.costImpact || reportData?.totalWastage || 0,
        unresolvedDiscrepancies: reportData?.discrepancies?.unresolvedDiscrepancies || reportData?.unresolvedDiscrepancies || 0
      }
      
      return {
        id: report.id,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        generatedAt: report.generatedAt,
        sentAt: report.sentAt,
        status: report.status,
        recipients: report.recipients,
        summary
      }
    })

    return NextResponse.json({
      reports: transformedReports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Error fetching weekly report history:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly report history", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}