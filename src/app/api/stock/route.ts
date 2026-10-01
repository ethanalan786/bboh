import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity, reason, transactionType } = body

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
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const previousStock = product.stock
    const newStock = previousStock + quantity

    // Determine transaction type - if previous stock was 0, it's opening stock
    const autoTransactionType = previousStock === 0 ? "OPENING_STOCK" : "STOCK_ADDED"
    const finalTransactionType = transactionType || autoTransactionType

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    // Create stock history record
    if (userId) {
      await prisma.stockHistory.create({
        data: {
          productId,
          stockLevel: newStock,
          date: new Date(),
          userId,
          reason: reason || (finalTransactionType === "OPENING_STOCK" ? "Opening stock" : `Stock added: ${quantity} units`),
          transactionType: finalTransactionType,
          previousStock,
          newStock,
        }
      })
    }

    // Create audit log
    await createAuditLog({
      userId,
      actionType: finalTransactionType === "OPENING_STOCK" ? AuditAction.ADJUSTMENT_MADE : AuditAction.INVENTORY_UPDATED,
      entityType: "Stock",
      entityId: productId,
      description: `Added ${quantity} units to ${product.name} (SKU: ${product.sku}). Previous: ${previousStock}, New: ${newStock}`,
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
    console.error("Error adding stock:", error)
    return NextResponse.json(
      { error: "Failed to add stock", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}