import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  generateWeeklyReport,
  startWeeklyReportScheduler,
  stopWeeklyReportScheduler,
  restartWeeklyReportScheduler 
} from "@/lib/weekly-report-scheduler"

export async function POST(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, schedule } = body

    switch (action) {
      case 'generate':
        // Manually trigger report generation
        const report = await generateWeeklyReport()
        return NextResponse.json({
          success: true,
          message: "Weekly report generated successfully",
          report
        })
      
      case 'start':
        startWeeklyReportScheduler()
        return NextResponse.json({
          success: true,
          message: "Weekly report scheduler started"
        })
      
      case 'stop':
        stopWeeklyReportScheduler()
        return NextResponse.json({
          success: true,
          message: "Weekly report scheduler stopped"
        })
      
      case 'restart':
        restartWeeklyReportScheduler(schedule)
        return NextResponse.json({
          success: true,
          message: "Weekly report scheduler restarted",
          schedule: schedule || "default"
        })
      
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'generate', 'start', 'stop', or 'restart'." },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error managing weekly report scheduler:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

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

    // Return current scheduler status
    const { prisma } = await import("@/lib/prisma")
    const settings = await (prisma as any).settings.findFirst()

    return NextResponse.json({
      enabled: settings?.weeklyReportEnabled || false,
      schedule: settings?.weeklyReportSchedule || "0 9 * * 1",
      recipients: settings?.weeklyReportRecipients || "[]"
    })
  } catch (error) {
    console.error("Error fetching scheduler status:", error)
    return NextResponse.json(
      { error: "Failed to fetch scheduler status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}