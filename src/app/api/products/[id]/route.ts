import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog, formatProductChange } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || product.category,
      categoryId: product.categoryId,
      size: product.size || "",
      color: product.color || "",
      variant: product.variant || "",
      supplier: product.supplierId || "",
      stock: product.stock,
      price: product.sellingPrice,
      status: product.stock === 0 ? "Out of Stock" : product.stock < 10 ? "Low Stock" : "In Stock",
      imageUrl: product.imageUrl,
      description: product.description,
      materialCost: product.materialCost,
      laborCost: product.laborCost,
      shippingCost: product.shippingCost,
      overheadCost: product.overheadCost,
      otherCost: product.otherCost,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, sku, category, categoryId, size, color, variant, stock, price, description, materialCost, laborCost, shippingCost, overheadCost, otherCost, supplier } = body

    // Support both old category name and new categoryId
    let finalCategoryId = categoryId
    if (!finalCategoryId && category) {
      // Legacy support - find category by name
      const categoryRecord = await prisma.productCategory.findFirst({
        where: { name: category }
      })
      if (categoryRecord) {
        finalCategoryId = categoryRecord.id
      }
    }

    // Get user info for audit log
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/session`)
    const sessionData = await sessionResponse.json()
    const userId = sessionData.user?.id
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get previous product state for audit log
    const previousProduct = await prisma.product.findUnique({
      where: { id }
    })

    // Check if SKU is being changed and if it already exists
    if (sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku,
          NOT: { id }
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 400 }
        )
      }
    }

    // Auto-calculate variant if not provided
    const finalVariant = variant || ((size || color) ? `${size || ""} / ${color || ""}`.trim() : null)

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        categoryId: finalCategoryId,
        size: size || null,
        color: color || null,
        variant: finalVariant,
        supplierId: supplier && supplier !== "N/A" ? supplier : undefined,
        sellingPrice: parseFloat(price),
        stock: parseInt(stock),
        description,
        materialCost: materialCost ? parseFloat(materialCost) : 0,
        laborCost: laborCost ? parseFloat(laborCost) : 0,
        shippingCost: shippingCost ? parseFloat(shippingCost) : 0,
        overheadCost: overheadCost ? parseFloat(overheadCost) : 0,
        otherCost: otherCost ? parseFloat(otherCost) : 0,
      }
    })

    // Create audit log for product update
    await createAuditLog({
      userId,
      actionType: AuditAction.PRODUCT_UPDATED,
      entityType: "Product",
      entityId: product.id,
      description: `Updated product: ${name} (SKU: ${sku})`,
      previousValue: JSON.stringify(previousProduct),
      newValue: JSON.stringify(product),
      ipAddress,
      userAgent,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user info for audit log
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/session`)
    const sessionData = await sessionResponse.json()
    const userId = sessionData.user?.id
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get product info before deletion for audit log
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Check if product has any sales
    const salesCount = await prisma.sale.count({
      where: { productId: id }
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with sales history" },
        { status: 400 }
      )
    }

    // Check if product has any stock history
    const stockHistoryCount = await prisma.stockHistory.count({
      where: { productId: id }
    })

    if (stockHistoryCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with stock history" },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    // Create audit log for product deletion
    await createAuditLog({
      userId,
      actionType: AuditAction.PRODUCT_DELETED,
      entityType: "Product",
      entityId: id,
      description: `Deleted product: ${product.name} (SKU: ${product.sku})`,
      previousValue: JSON.stringify(product),
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}