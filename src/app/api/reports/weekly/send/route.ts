import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reportId } = body

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      )
    }

    // Fetch the weekly report
    const weeklyReport = await (prisma as any).weeklyReport.findUnique({
      where: { id: reportId }
    })

    if (!weeklyReport) {
      return NextResponse.json(
        { error: "Weekly report not found" },
        { status: 404 }
      )
    }

    // Fetch settings for email configuration
    const settings = await (prisma as any).settings.findFirst()
    
    // Get recipients from settings or use a default
    let recipients: string[] = []
    if (settings?.weeklyReportRecipients) {
      try {
        recipients = JSON.parse(settings.weeklyReportRecipients)
      } catch (e) {
        console.error("Error parsing weeklyReportRecipients:", e)
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No email recipients configured. Please add recipients in settings." },
        { status: 400 }
      )
    }

    const reportData = weeklyReport.reportData as any
    const businessName = reportData?.metadata?.businessName || 'Burn Box'
    const weekStart = new Date(weeklyReport.weekStart).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    })
    const weekEnd = new Date(weeklyReport.weekEnd).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    })

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Format currency
    const formatCurrency = (value: number) => {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    // Format percentage
    const formatPercent = (value: number) => {
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    }

    // Generate HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <header style="background-color: #668E2B; padding: 20px; text-align: center;">
          <h1 style="font-size: 24px; color: white; margin: 0;">Weekly Operations Report</h1>
          <p style="font-size: 16px; color: white; margin: 10px 0 0 0;">${businessName}</p>
        </header>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">
            <strong>Report Period:</strong> ${weekStart} - ${weekEnd}
          </p>
          
          <!-- Key Metrics Section -->
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Key Performance Metrics</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Sales Revenue:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.sales.combined.netRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Cost of Goods Sold:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.sales.combined.totalCOGS)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Gross Profit:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #668E2B; font-weight: bold;">${formatCurrency(reportData.grossProfit.total)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Gross Margin:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reportData.grossProfit.margin.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Beginning Inventory Value:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.beginningInventory.totalValue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Ending Inventory Value:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.endingInventory.totalValue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Purchases:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.purchases.totalSpend)} (${reportData.purchases.totalPurchases} orders)</td>
              </tr>
            </table>
          </div>

          <!-- Sales Breakdown -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Sales Breakdown</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr style="background-color: #668E2B; color: white;">
                <th style="padding: 10px; text-align: left;">Category</th>
                <th style="padding: 10px; text-align: right;">Revenue</th>
                <th style="padding: 10px; text-align: right;">Quantity</th>
              </tr>
              ${Object.entries(reportData.sales.byCategory).map(([category, data]: [string, any]) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px;">${category}</td>
                  <td style="padding: 8px; text-align: right;">${formatCurrency(data.revenue)}</td>
                  <td style="padding: 8px; text-align: right;">${data.quantity}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Inventory Changes -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Inventory Changes</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Inventory Adjustments:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reportData.inventoryAdjustments.totalAdjustments} (Impact: ${formatCurrency(reportData.inventoryAdjustments.costImpact)})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Wastage/Damage:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reportData.wastage.totalWastage.toFixed(2)} units (Cost: ${formatCurrency(reportData.wastage.costImpact)})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Unresolved Discrepancies:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.discrepancies.unresolvedDiscrepancies > 0 ? '#dc2626' : '#668E2B'};">${reportData.discrepancies.unresolvedDiscrepancies}</td>
              </tr>
            </table>
          </div>

          <!-- Previous Week Comparison -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Previous Week Comparison</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Revenue Change:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.grossProfit.previousComparison.revenueChange >= 0 ? '#16a34a' : '#dc2626'};">${formatPercent(reportData.grossProfit.previousComparison.revenueChange)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Profit Change:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.grossProfit.previousComparison.profitChange >= 0 ? '#16a34a' : '#dc2626'};">${formatPercent(reportData.grossProfit.previousComparison.profitChange)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Margin Change:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.grossProfit.previousComparison.marginChange >= 0 ? '#16a34a' : '#dc2626'};">${formatPercent(reportData.grossProfit.previousComparison.marginChange)}pp</td>
              </tr>
            </table>
          </div>

          <!-- GymMaster Comparison -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">GymMaster Comparison</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>GymMaster Revenue:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.gymMasterComparison.gymMasterRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Burn Box Revenue:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.gymMasterComparison.burnBoxRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Revenue Variance:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${Math.abs(reportData.gymMasterComparison.revenueVariancePercent) <= 10 ? '#16a34a' : '#dc2626'};">${formatCurrency(reportData.gymMasterComparison.revenueVariance)} (${formatPercent(reportData.gymMasterComparison.revenueVariancePercent)})</td>
              </tr>
            </table>
          </div>

          <!-- Alerts -->
          ${reportData.discrepancies.unresolvedDiscrepancies > 0 || reportData.discrepancies.largeAdjustments > 0 || reportData.discrepancies.highWastageItems > 0 ? `
            <div style="background-color: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #dc2626; margin: 0 0 10px 0;">⚠️ Alerts & Discrepancies</h2>
              <ul style="margin: 0; padding-left: 20px;">
                ${reportData.discrepancies.unresolvedDiscrepancies > 0 ? `<li style="color: #dc2626;">${reportData.discrepancies.unresolvedDiscrepancies} unresolved discrepancies require attention</li>` : ''}
                ${reportData.discrepancies.largeAdjustments > 0 ? `<li style="color: #dc2626;">${reportData.discrepancies.largeAdjustments} large inventory adjustments detected</li>` : ''}
                ${reportData.discrepancies.highWastageItems > 0 ? `<li style="color: #dc2626;">${reportData.discrepancies.highWastageItems} high wastage items recorded</li>` : ''}
                ${reportData.discrepancies.missingGymMasterSales ? `<li style="color: #dc2626;">Significant variance between Burn Box and GymMaster sales data</li>` : ''}
              </ul>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This report was automatically generated by the Burn Box Operations Hub. 
            For detailed analysis, please log in to the admin dashboard.
          </p>
        </div>
        
        <footer style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
        </footer>
      </div>
    `

    // Send email to all recipients
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(','),
      subject: `Weekly Operations Report - ${weekStart} to ${weekEnd}`,
      html: htmlContent
    }

    try {
      await transporter.sendMail(mailOptions)
      
      // Update report status
      const updatedReport = await (prisma as any).weeklyReport.update({
        where: { id: reportId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          recipients
        }
      })

      return NextResponse.json({
        success: true,
        message: "Weekly report sent successfully",
        report: updatedReport
      })
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      
      // Update report status to failed
      await (prisma as any).weeklyReport.update({
        where: { id: reportId },
        data: {
          status: 'FAILED'
        }
      })

      return NextResponse.json(
        { error: "Failed to send email", details: emailError instanceof Error ? emailError.message : "Unknown error" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error sending weekly report:", error)
    return NextResponse.json(
      { error: "Failed to send weekly report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}