import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json()
    const {
      status,
      dueDate,
      totalAmount,
      taxAmount,
      discountAmount,
      notes
    } = body

    const existingInvoice = await (prisma as any).invoice.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount
    if (taxAmount !== undefined) updateData.taxAmount = taxAmount
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount
    if (notes !== undefined) updateData.notes = notes

    const invoice = await (prisma as any).invoice.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'INVOICE_UPLOADED',
        entityType: 'Invoice',
        entityId: invoice.id,
        description: `Updated invoice: ${invoice.invoiceNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      invoice,
      message: 'Invoice updated successfully'
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingInvoice = await (prisma as any).invoice.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await (prisma as any).invoice.delete({
      where: { id }
    })

    // Create audit log
    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'INVOICE_UPLOADED',
        entityType: 'Invoice',
        entityId: id,
        description: `Deleted invoice: ${existingInvoice.invoiceNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}