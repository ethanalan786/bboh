import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
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
      receivedItems,
      notes,
      status = 'RECEIVED',
      assignedTo
    } = body

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Update purchase order status and received date
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        receivedDate: new Date(),
        notes: notes || existingOrder.notes,
        items: receivedItems || existingOrder.items,
        assignedTo: assignedTo || existingOrder.assignedTo
      }
    })

    // Update inventory for each received item based on assignment
    if (receivedItems && Array.isArray(receivedItems) && assignedTo) {
      for (const item of receivedItems) {
        if (item.productId && item.receivedQuantity > 0) {
          // Get the product to check its category
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              category: true
            }
          })

          if (!product) {
            console.error(`Product not found: ${item.productId}`)
            continue
          }

          // Check if product category matches the assignment
          const productCategory = product.category?.name || ''
          const isBurnBox = productCategory === 'BURN_BOX' || productCategory === 'DRINKS' || productCategory === 'ACCESSORIES'
          const isApparel = productCategory === 'APPAREL' || productCategory === 'WOMENS_APPAREL' || productCategory === 'MENS_APPAREL'

          const shouldUpdate = 
            (assignedTo === 'BURN_BOX' && isBurnBox) ||
            (assignedTo === 'APPAREL' && isApparel)

          if (shouldUpdate) {
            // Get current stock for history
            const currentStock = product.stock || 0

            // Update product stock
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.receivedQuantity
                }
              }
            })

            // Create stock history entry
            await prisma.stockHistory.create({
              data: {
                productId: item.productId,
                stockLevel: currentStock + item.receivedQuantity,
                date: new Date(),
                userId: session.user.id,
                reason: `Purchase Order ${existingOrder.orderNumber} received - Assigned to ${assignedTo}`,
                transactionType: 'STOCK_ADDED',
                previousStock: currentStock,
                newStock: currentStock + item.receivedQuantity
              }
            })
          } else {
            console.log(`Skipping inventory update for product ${product.name} - category ${product.category?.name} doesn't match assignment ${assignedTo}`)
          }
        }
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'PURCHASE_ORDER_RECEIVED',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        description: `Received inventory for purchase order: ${purchaseOrder.orderNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      purchaseOrder,
      message: 'Inventory received successfully'
    })
  } catch (error) {
    console.error('Error receiving inventory:', error)
    return NextResponse.json({ error: 'Failed to receive inventory' }, { status: 500 })
  }
}