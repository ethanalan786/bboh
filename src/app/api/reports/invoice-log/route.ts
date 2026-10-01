import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status") // Optional filter by status

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Build where clause
    const whereClause: any = {
      invoiceDate: {
        gte: start,
        lte: end,
      },
    }

    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    // Fetch invoices with related data
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        purchaseOrder: {
          select: {
            orderNumber: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        invoiceDate: "desc",
      },
    })

    // Fetch user information for uploaders and reviewers
    const userIds = new Set<string>()
    invoices.forEach((invoice) => {
      // Note: We'd need to add uploaderId and reviewerId fields to the Invoice model
      // For now, we'll use placeholder data
    })

    // Process invoice data
    const processedInvoices = invoices.map((invoice) => {
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        status: invoice.status,
        fileName: invoice.fileName,
        fileType: invoice.fileType,
        fileSize: invoice.fileSize,
        fileUrl: invoice.fileUrl,
        purchaseOrder: {
          orderNumber: invoice.purchaseOrder.orderNumber,
          supplierName: invoice.purchaseOrder.supplier.name,
        },
        // Placeholder for user information - would need schema updates
        uploadedBy: {
          id: "placeholder",
          name: "System",
          email: "system@burnbox.com",
        },
        uploadedAt: invoice.createdAt,
        reviewedBy: invoice.reviewedBy ? {
          id: invoice.reviewedBy,
          name: "Admin User", // Would need to fetch from User table
        } : null,
        reviewedAt: invoice.reviewedAt,
        verifiedAt: invoice.verifiedAt,
        notes: invoice.notes,
        extractedData: invoice.extractedData,
      }
    })

    // Calculate summary statistics
    const totalInvoices = processedInvoices.length
    const totalAmount = processedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalTax = processedInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0)
    const totalDiscount = processedInvoices.reduce((sum, inv) => sum + inv.discountAmount, 0)

    const statusCounts = {
      PENDING_REVIEW: processedInvoices.filter(inv => inv.status === 'PENDING_REVIEW').length,
      UNDER_REVIEW: processedInvoices.filter(inv => inv.status === 'UNDER_REVIEW').length,
      APPROVED: processedInvoices.filter(inv => inv.status === 'APPROVED').length,
      REJECTED: processedInvoices.filter(inv => inv.status === 'REJECTED').length,
      PAID: processedInvoices.filter(inv => inv.status === 'PAID').length,
    }

    // Update status filter to match schema enum
    const validStatuses = ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']
    if (status && status !== 'ALL' && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invoices: processedInvoices,
      summary: {
        totalInvoices,
        totalAmount,
        totalTax,
        totalDiscount,
        statusCounts,
        pendingReview: statusCounts.PENDING_REVIEW + statusCounts.UNDER_REVIEW,
        approved: statusCounts.APPROVED,
        rejected: statusCounts.REJECTED,
        paid: statusCounts.PAID,
      },
    })
  } catch (error) {
    console.error("Error fetching invoice log:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice log", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
