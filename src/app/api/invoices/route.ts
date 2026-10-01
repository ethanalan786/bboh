import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const purchaseOrderId = searchParams.get('purchaseOrderId')

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      include: {
        purchaseOrder: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    const transformedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      purchaseOrderId: invoice.purchaseOrderId,
      purchaseOrder: invoice.purchaseOrder,
      status: invoice.status,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      totalAmount: invoice.totalAmount,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      fileUrl: invoice.fileUrl,
      fileName: invoice.fileName,
      fileType: invoice.fileType,
      fileSize: invoice.fileSize,
      reviewedBy: invoice.reviewedBy,
      reviewedAt: invoice.reviewedAt,
      notes: invoice.notes,
      verifiedAt: invoice.verifiedAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }))

    const stats = {
      totalInvoices: invoices.length,
      pendingReview: invoices.filter((i: any) => i.status === 'PENDING_REVIEW').length,
      underReview: invoices.filter((i: any) => i.status === 'UNDER_REVIEW').length,
      approved: invoices.filter((i: any) => i.status === 'APPROVED').length,
      rejected: invoices.filter((i: any) => i.status === 'REJECTED').length,
      totalAmount: invoices.reduce((sum: number, i: any) => sum + i.totalAmount, 0)
    }

    return NextResponse.json({
      invoices: transformedInvoices,
      stats
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      purchaseOrderId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      totalAmount,
      taxAmount = 0,
      discountAmount = 0,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      notes,
      status = 'PENDING_REVIEW',
      extractedData
    } = body

    if (!purchaseOrderId || !invoiceNumber || !invoiceDate || !totalAmount) {
      return NextResponse.json({ 
        error: 'Missing required fields: purchaseOrderId, invoiceNumber, invoiceDate, totalAmount' 
      }, { status: 400 })
    }

    // Check if invoice number already exists
    const existingInvoice = await (prisma as any).invoice.findUnique({
      where: { invoiceNumber }
    })
    if (existingInvoice) {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 })
    }

    // Verify purchase order exists
    const purchaseOrder = await (prisma as any).purchaseOrder.findUnique({
      where: { id: purchaseOrderId }
    })
    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const invoice = await (prisma as any).invoice.create({
      data: {
        purchaseOrderId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        totalAmount,
        taxAmount,
        discountAmount,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        notes,
        status,
        extractedData: extractedData || null
      }
    })

    // Create audit log
    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'INVOICE_UPLOADED',
        entityType: 'Invoice',
        entityId: invoice.id,
        description: `Uploaded invoice: ${invoiceNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      invoice,
      message: 'Invoice uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading invoice:', error)
    return NextResponse.json({ error: 'Failed to upload invoice' }, { status: 500 })
  }
}