// This file is meant to be imported in a server-side context
// to initialize background services when the server starts

import { startWeeklyReportScheduler } from './weekly-report-scheduler'
import { prisma } from './prisma'

export async function initializeServerServices() {
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
  } catch (error) {
    console.error('Error initializing server services:', error)
  }
}