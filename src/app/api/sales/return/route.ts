import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { saleId, quantity, reason, returnReason } = body

    if (!saleId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    // Get user info for audit log
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/session`)
    const sessionData = await sessionResponse.json()
    const userId = sessionData.user?.id
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get the sale
    const sale = await (prisma as any).sale.findUnique({
      where: { id: saleId },
      include: {
        product: true,
        customer: true
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      )
    }

    const orderId = sale.orderId || "N/A"

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      )
    }

    const maxReturnable = sale.quantity - sale.returnedQuantity

    if (quantity > maxReturnable) {
      return NextResponse.json(
        { error: `Cannot return more than ${maxReturnable} units (${sale.returnedQuantity} already returned)` },
        { status: 400 }
      )
    }

    const newReturnedQuantity = sale.returnedQuantity + quantity

    // Update sale with returned quantity
    const updatedSale = await (prisma as any).sale.update({
      where: { id: saleId },
      data: { 
        returnedQuantity: newReturnedQuantity,
        updatedAt: new Date()
      }
    })

    // Update product stock (add back the returned items)
    const previousStock = sale.product.stock
    const newStock = previousStock + quantity

    await (prisma as any).product.update({
      where: { id: sale.productId },
      data: { stock: newStock }
    })

    // Create stock history record
    if (userId) {
      await (prisma as any).stockHistory.create({
        data: {
          productId: sale.productId,
          stockLevel: newStock,
          date: new Date(),
          userId,
          reason: reason || `Return: ${quantity} units from sale #${sale.id}${returnReason ? ` (${returnReason})` : ''}`,
          transactionType: "STOCK_RETURN",
          previousStock,
          newStock,
        }
      })
    }

    // Create audit log
    await createAuditLog({
      userId,
      actionType: AuditAction.INVENTORY_UPDATED,
      entityType: "Sale",
      entityId: saleId,
      description: `Processed return of ${quantity} units from order ${orderId} (sale #${sale.id}) for ${sale.product.name} (SKU: ${sale.product.sku})${sale.customer ? ` - Customer: ${sale.customer.name}` : ''}${returnReason ? ` - ${returnReason}` : ''}. Previous: ${previousStock}, New: ${newStock}`,
      previousValue: String(previousStock),
      newValue: String(newStock),
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ 
      success: true, 
      sale: updatedSale,
      orderId,
      productStock: newStock,
      previousStock,
      newStock 
    })
  } catch (error) {
    console.error("Error processing return:", error)
    return NextResponse.json(
      { error: "Failed to process return", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}