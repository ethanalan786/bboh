import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const saleId = resolvedParams.id
    
    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 })
    }
    
    const body = await request.json()
    const { quantity, reason } = body
    const nextQuantity = Number(quantity)

    if (!Number.isFinite(nextQuantity) || nextQuantity < 0 || !Number.isInteger(nextQuantity)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    if (nextQuantity === 0 && !reason) {
      return NextResponse.json({ error: 'Please provide a reason before setting quantity to zero.' }, { status: 400 })
    }

    // Get the original sale
    const originalSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { product: true }
    })

    if (!originalSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Check if user owns this sale or is admin
    if (originalSale.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate stock difference
    const quantityDiff = nextQuantity - originalSale.quantity
    const currentStock = originalSale.product.stock

    // Check if there's enough stock for increase
    if (quantityDiff > 0 && currentStock < quantityDiff) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    // Calculate new total price
    const newTotalPrice = (originalSale.product.sellingPrice || 0) * nextQuantity

    // Update sale
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        quantity: nextQuantity,
        totalPrice: newTotalPrice
      },
      include: { product: true }
    })

    // Update product stock
    await prisma.product.update({
      where: { id: originalSale.productId },
      data: {
        stock: {
          decrement: quantityDiff
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'SALE_ADJUSTED',
        entityType: 'Sale',
        entityId: saleId,
        description: `Adjusted sale quantity from ${originalSale.quantity} to ${nextQuantity}${reason ? `. Reason: ${reason}` : ''}`,
        previousValue: JSON.stringify({ 
          quantity: originalSale.quantity, 
          totalPrice: originalSale.totalPrice,
          stock: currentStock 
        }),
        newValue: JSON.stringify({ 
          quantity: nextQuantity, 
          totalPrice: newTotalPrice,
          stock: currentStock - quantityDiff 
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      sale: updatedSale,
      message: 'Sale adjusted successfully'
    })
  } catch (error) {
    console.error('Error adjusting sale:', error)
    return NextResponse.json({ error: 'Failed to adjust sale' }, { status: 500 })
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

    const resolvedParams = await params
    const saleId = resolvedParams.id
    
    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 })
    }

    // Get the original sale
    const originalSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { product: true }
    })

    if (!originalSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Check if user owns this sale or is admin
    if (originalSale.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Restore stock
    await prisma.product.update({
      where: { id: originalSale.productId },
      data: {
        stock: {
          increment: originalSale.quantity
        }
      }
    })

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'SALE_DELETED',
        entityType: 'Sale',
        entityId: saleId,
        description: `Deleted sale of ${originalSale.quantity} x ${originalSale.product.name}`,
        previousValue: JSON.stringify({ 
          quantity: originalSale.quantity, 
          totalPrice: originalSale.totalPrice,
          stock: originalSale.product.stock 
        }),
        newValue: JSON.stringify({ 
          quantity: 0, 
          totalPrice: 0,
          stock: originalSale.product.stock + originalSale.quantity 
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Delete sale
    await prisma.sale.delete({
      where: { id: saleId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Sale deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 })
  }
}