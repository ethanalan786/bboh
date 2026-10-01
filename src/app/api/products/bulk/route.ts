import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createBulkAuditLog } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, productIds, updates } = body

    // Get user info for audit log
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/session`)
    const sessionData = await sessionResponse.json()
    const userId = sessionData.user?.id
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (action === 'duplicate') {
      const duplicatedProducts = []
      const previousProducts = []

      for (const productId of productIds) {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (!product) continue

        previousProducts.push(product)

        const newProduct = await prisma.product.create({
          data: {
            name: `${product.name} (Copy)`,
            sku: `${product.sku}-COPY-${Date.now()}`,
            categoryId: product.categoryId,
            size: product.size,
            color: product.color,
            variant: product.variant,
            supplierId: product.supplierId,
            costPrice: product.costPrice,
            materialCost: product.materialCost,
            laborCost: product.laborCost,
            shippingCost: product.shippingCost,
            overheadCost: product.overheadCost,
            otherCost: product.otherCost,
            sellingPrice: product.sellingPrice,
            stock: 0,
            description: product.description,
            imageUrl: product.imageUrl,
          }
        })

        duplicatedProducts.push(newProduct)
      }

      // Create audit log for bulk duplication
      await createBulkAuditLog(
        userId,
        AuditAction.PRODUCT_BULK_DUPLICATED,
        "Product",
        duplicatedProducts.map(p => p.id),
        `Bulk duplicated ${duplicatedProducts.length} product(s)`,
        previousProducts,
        duplicatedProducts,
        ipAddress,
        userAgent
      )

      return NextResponse.json({ 
        success: true, 
        count: duplicatedProducts.length,
        products: duplicatedProducts 
      })
    }

    if (action === 'delete') {
      const deletedProducts = []

      for (const productId of productIds) {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (!product) continue

        // Check if product has sales
        const salesCount = await prisma.sale.count({
          where: { productId }
        })

        if (salesCount > 0) {
          continue // Skip products with sales
        }

        // Check if product has stock history
        const stockHistoryCount = await prisma.stockHistory.count({
          where: { productId }
        })

        if (stockHistoryCount > 0) {
          continue // Skip products with stock history
        }

        deletedProducts.push(product)

        await prisma.product.delete({
          where: { id: productId }
        })
      }

      // Create audit log for bulk deletion
      await createBulkAuditLog(
        userId,
        AuditAction.PRODUCT_BULK_DELETED,
        "Product",
        deletedProducts.map(p => p.id),
        `Bulk deleted ${deletedProducts.length} product(s)`,
        deletedProducts,
        undefined,
        ipAddress,
        userAgent
      )

      return NextResponse.json({ 
        success: true, 
        count: deletedProducts.length,
        deletedIds: deletedProducts.map(p => p.id)
      })
    }

    if (action === 'edit' && updates) {
      const updatedProducts = []
      const previousProducts = []

      for (const productId of productIds) {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (!product) continue

        previousProducts.push(product)

        const updatedProduct = await prisma.product.update({
          where: { id: productId },
          data: updates
        })

        updatedProducts.push(updatedProduct)
      }

      // Create audit log for bulk edit
      await createBulkAuditLog(
        userId,
        AuditAction.PRODUCT_BULK_EDITED,
        "Product",
        updatedProducts.map(p => p.id),
        `Bulk edited ${updatedProducts.length} product(s)`,
        previousProducts,
        updatedProducts,
        ipAddress,
        userAgent
      )

      return NextResponse.json({ 
        success: true, 
        count: updatedProducts.length,
        products: updatedProducts 
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error in bulk operation:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk operation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}