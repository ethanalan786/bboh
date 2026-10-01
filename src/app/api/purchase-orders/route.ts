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
    const supplierId = searchParams.get('supplierId')

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (supplierId) {
      where.supplierId = supplierId
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: { invoices: true }
        }
      }
    })

    const transformedOrders = purchaseOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplier: order.supplier,
      status: order.status,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      receivedDate: order.receivedDate,
      totalAmount: order.totalAmount,
      notes: order.notes,
      items: order.items,
      invoiceCount: order._count.invoices,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    const stats = {
      totalOrders: purchaseOrders.length,
      pendingOrders: purchaseOrders.filter((o: any) => o.status === 'PENDING').length,
      orderedOrders: purchaseOrders.filter((o: any) => o.status === 'ORDERED').length,
      receivedOrders: purchaseOrders.filter((o: any) => o.status === 'RECEIVED').length,
      totalValue: purchaseOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
    }

    return NextResponse.json({
      purchaseOrders: transformedOrders,
      stats
    })
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchase orders", details: error instanceof Error ? error.message : "Unknown error" },
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
      supplierId,
      status = 'PENDING',
      expectedDate,
      totalAmount = 0,
      notes,
      items = []
    } = body

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    // Generate order number
    const orderCount = await prisma.purchaseOrder.count()
    const orderNumber = `PO-${String(orderCount + 1).padStart(6, '0')}`

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        status,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalAmount,
        notes,
        items
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'PURCHASE_ORDER_CREATED',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        description: `Created purchase order: ${orderNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      purchaseOrder,
      message: 'Purchase order created successfully'
    })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}