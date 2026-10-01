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

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        invoices: {
          orderBy: { invoiceDate: 'desc' }
        }
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error("Error fetching purchase order:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchase order", details: error instanceof Error ? error.message : "Unknown error" },
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
      expectedDate,
      receivedDate,
      totalAmount,
      notes,
      items
    } = body

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null
    if (receivedDate !== undefined) updateData.receivedDate = receivedDate ? new Date(receivedDate) : null
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount
    if (notes !== undefined) updateData.notes = notes
    if (items !== undefined) updateData.items = items

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'PURCHASE_ORDER_UPDATED',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        description: `Updated purchase order: ${purchaseOrder.orderNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      purchaseOrder,
      message: 'Purchase order updated successfully'
    })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
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

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'PURCHASE_ORDER_UPDATED',
        entityType: 'PurchaseOrder',
        entityId: id,
        description: `Deleted purchase order: ${existingOrder.orderNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Purchase order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}