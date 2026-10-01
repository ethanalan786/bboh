import { NextResponse } from "next/server"
import { startWeeklyReportScheduler } from "@/lib/weekly-report-scheduler"
import { prisma } from "@/lib/prisma"

// This endpoint is called to initialize server-side services
// It should be called when the server starts up
export async function GET() {
  try {
    // Check if weekly reports are enabled in settings
    const settings = await (prisma as any).settings.findFirst()
    
    if (settings?.weeklyReportEnabled) {
      // Start the weekly report scheduler
      startWeeklyReportScheduler()
      console.log('Weekly report scheduler initialized')
    } else {
      console.log('Weekly reports are disabled in settings')
    }
    
    return NextResponse.json({
      success: true,
      message: "Server services initialized successfully"
    })
  } catch (error) {
    console.error("Error initializing server services:", error)
    return NextResponse.json(
      { error: "Failed to initialize services", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}