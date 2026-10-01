import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity, reason, transactionType, customerName, returnReason } = body

    if (!productId || !quantity || quantity <= 0) {
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

    // Get current product
    const product = await (prisma as any).product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const previousStock = product.stock

    if (quantity > previousStock) {
      return NextResponse.json(
        { error: `Cannot return more than current stock (${previousStock})` },
        { status: 400 }
      )
    }

    const newStock = previousStock - quantity

    // Update product stock
    const updatedProduct = await (prisma as any).product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    // Create stock history record
    if (userId) {
      await (prisma as any).stockHistory.create({
        data: {
          productId,
          stockLevel: newStock,
          date: new Date(),
          userId,
          reason: reason || `Return: ${quantity} units returned${customerName ? ` by ${customerName}` : ''}${returnReason ? ` (${returnReason})` : ''}`,
          transactionType: transactionType || "STOCK_RETURN",
          previousStock,
          newStock,
        }
      })
    }

    // Create audit log
    await createAuditLog({
      userId,
      actionType: AuditAction.INVENTORY_UPDATED,
      entityType: "Stock",
      entityId: productId,
      description: `Processed return of ${quantity} units for ${product.name} (SKU: ${product.sku})${customerName ? ` from ${customerName}` : ''}${returnReason ? ` - ${returnReason}` : ''}. Previous: ${previousStock}, New: ${newStock}`,
      previousValue: String(previousStock),
      newValue: String(newStock),
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ 
      success: true, 
      product: updatedProduct,
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