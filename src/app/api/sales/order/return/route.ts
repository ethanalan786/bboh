import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, returns, additionalNotes } = body

    if (!orderId || !returns || !Array.isArray(returns) || returns.length === 0) {
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

    // Process each return item
    const processedReturns = []
    const auditLogs = []

    for (const returnItem of returns) {
      const { saleId, quantity, returnReason } = returnItem

      if (!saleId || !quantity || quantity <= 0) {
        continue
      }

      // Get the sale
      const sale = await (prisma as any).sale.findUnique({
        where: { id: saleId },
        include: {
          product: true,
          customer: true
        }
      })

      if (!sale) {
        continue
      }

      const maxReturnable = sale.quantity - sale.returnedQuantity

      if (quantity > maxReturnable) {
        continue // Skip if trying to return more than available
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
            reason: `Return: ${quantity} units from order ${orderId} (sale #${sale.id})${returnReason ? ` (${returnReason})` : ''}${additionalNotes ? ` - ${additionalNotes}` : ''}`,
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
        description: `Processed return of ${quantity} units from order ${orderId} (sale #${sale.id}) for ${sale.product.name} (SKU: ${sale.product.sku})${sale.customer ? ` - Customer: ${sale.customer.name}` : ''}${returnReason ? ` - ${returnReason}` : ''}${additionalNotes ? ` - ${additionalNotes}` : ''}. Previous: ${previousStock}, New: ${newStock}`,
        previousValue: String(previousStock),
        newValue: String(newStock),
        ipAddress,
        userAgent,
      })

      processedReturns.push({
        saleId: sale.id,
        productId: sale.productId,
        productName: sale.product.name,
        quantity: quantity,
        previousStock,
        newStock
      })
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      processedReturns,
      message: `Successfully processed ${processedReturns.length} return(s) from order ${orderId}`
    })
  } catch (error) {
    console.error("Error processing order return:", error)
    return NextResponse.json(
      { error: "Failed to process return", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}