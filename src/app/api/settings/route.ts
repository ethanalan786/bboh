import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch settings (there should only be one settings document)
export async function GET(request: Request) {
  try {
    // Fetch the first (and only) settings document
    let settings = await prisma.settings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          businessName: 'Burn Box',
          businessCountry: 'USA',
          gymMasterSyncEnabled: false,
          quickBooksSyncEnabled: false,
          emailNotificationsEnabled: true,
          lowStockAlertsEnabled: true,
          lowStockThreshold: 10,
          salesReportsEnabled: true,
          inventoryAlertsEnabled: true,
          weeklyReportEnabled: false,
          weeklyReportSchedule: '0 9 * * 1', // Monday 9 AM
          weeklyReportRecipients: '[]',
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - Update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Get the first settings document
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.settings.create({
        data: body
      })
    } else {
      // Update existing - exclude readonly fields from the data
      const { id, createdAt, updatedAt, ...updateData } = body
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}