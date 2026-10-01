import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await params

    // Fetch the specific weekly report
    const weeklyReport = await (prisma as any).weeklyReport.findUnique({
      where: { id }
    })

    if (!weeklyReport) {
      return NextResponse.json(
        { error: "Weekly report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      report: weeklyReport
    })
  } catch (error) {
    console.error("Error fetching weekly report details:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly report details", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}