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
      status,
      notes,
      updateInventory = false,
      landedCosts
    }: {
      status: string
      notes?: string
      updateInventory?: boolean
      landedCosts?: {
        baseCost: number
        freight: number
        customs: number
        duties: number
        taxes: number
      }
    } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be APPROVED or REJECTED' }, { status: 400 })
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        }
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: status as "PENDING_REVIEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        notes: notes || existingInvoice.notes,
        verifiedAt: status === 'APPROVED' ? new Date() : null
      }
    })

    // Update purchase order with landed cost breakdown if provided
    if (status === 'APPROVED' && landedCosts && existingInvoice.purchaseOrder) {
      const currentItems = (existingInvoice.purchaseOrder.items as any[] || []).filter((item): item is object => item !== null)
      const totalQuantity = currentItems.reduce((sum, item) => sum + ((item as any).quantity || 0), 0)
      
      // Calculate per-unit landed costs
      const perUnitFreight = totalQuantity > 0 ? landedCosts.freight / totalQuantity : 0
      const perUnitCustoms = totalQuantity > 0 ? landedCosts.customs / totalQuantity : 0
      const perUnitDuties = totalQuantity > 0 ? landedCosts.duties / totalQuantity : 0
      const perUnitTaxes = totalQuantity > 0 ? landedCosts.taxes / totalQuantity : 0
      
      // Update items with landed cost breakdown (per-unit values)
      const updatedItems = currentItems.map((item) => {
        const typedItem = item as any
        const itemQuantity = typedItem.quantity || 0
        const unitPrice = typedItem.unitPrice || 0
        return {
          ...typedItem,
          freight: perUnitFreight * itemQuantity,
          customs: perUnitCustoms * itemQuantity,
          duties: perUnitDuties * itemQuantity,
          taxes: perUnitTaxes * itemQuantity,
          totalLandedCost: (unitPrice * itemQuantity) + (perUnitFreight * itemQuantity) + (perUnitCustoms * itemQuantity) + (perUnitDuties * itemQuantity) + (perUnitTaxes * itemQuantity)
        }
      })

      await prisma.purchaseOrder.update({
        where: { id: existingInvoice.purchaseOrderId },
        data: {
          items: updatedItems,
          totalAmount: landedCosts.baseCost + landedCosts.freight + landedCosts.customs + landedCosts.duties + landedCosts.taxes
        }
      })
    }

    // Create audit log
    const actionType = status === 'APPROVED' ? 'INVOICE_APPROVED' : 'INVOICE_REJECTED'
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType,
        entityType: 'Invoice',
        entityId: invoice.id,
        description: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} invoice: ${invoice.invoiceNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // If approved and user requested inventory update, update inventory
    if (status === 'APPROVED' && updateInventory && existingInvoice.purchaseOrder) {
      const purchaseOrder = existingInvoice.purchaseOrder
      
      // Check if purchase order has items and is assigned
      if (purchaseOrder.items && Array.isArray(purchaseOrder.items) && purchaseOrder.assignedTo) {
        const items = purchaseOrder.items as any[]
        for (const item of items) {
          if (item && item.productId && item.quantity > 0) {
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
              (purchaseOrder.assignedTo === 'BURN_BOX' && isBurnBox) ||
              (purchaseOrder.assignedTo === 'APPAREL' && isApparel)

            if (shouldUpdate) {
              // Get current stock for history
              const currentStock = product.stock || 0

              // Update product stock
              await (prisma as any).product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity
                  }
                }
              })

              // Create stock history entry
              await (prisma as any).stockHistory.create({
                data: {
                  productId: item.productId,
                  stockLevel: currentStock + item.quantity,
                  date: new Date(),
                  userId: session.user.id,
                  reason: `Invoice ${invoice.invoiceNumber} approved - Purchase Order ${purchaseOrder.orderNumber}`,
                  transactionType: 'STOCK_ADDED',
                  previousStock: currentStock,
                  newStock: currentStock + item.quantity
                }
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      invoice,
      message: `Invoice ${status.toLowerCase()} successfully`
    })
  } catch (error) {
    console.error('Error reviewing invoice:', error)
    return NextResponse.json({ error: 'Failed to review invoice' }, { status: 500 })
  }
}