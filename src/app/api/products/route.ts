import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog, formatProductChange } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Support both legacy and shadcn dynamic search parameters
    const search = searchParams.get("search") || searchParams.get("q") || ""
    const category = searchParams.get("category")
    const categoryId = searchParams.get("categoryId")
    const types = searchParams.get("type")?.split(",")
    
    // Pagination parameters - support both formats
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    // Use offset if provided, otherwise calculate from page
    const skip = offset > 0 ? offset : (page - 1) * limit

    // Build where clause for MongoDB
    const where: any = {}
    
    if (search) {
      // For MongoDB, use raw query for case-insensitive search
      where.OR = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } }
      ]
    }
    
    // Support both old category name and new categoryId
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId
    } else if (category && category !== "All Categories") {
      // Legacy support - try to find category by name
      const categoryRecord = await prisma.productCategory.findFirst({
        where: { name: category }
      })
      if (categoryRecord) {
        where.categoryId = categoryRecord.id
      }
    }
    
    // Filter by type if provided (for shadcn dynamic search)
    if (types && types.length > 0) {
      const categoryNames = types.map(t => {
        // Map shadcn types to our categories
        if (t.includes('burn') || t.includes('box')) return 'BURN_BOX'
        if (t.includes('apparel')) return 'APPAREL'
        if (t.includes('drink')) return 'DRINKS'
        if (t.includes('accessor')) return 'ACCESSORIES'
        return t.toUpperCase()
      })
      const categoryRecords = await prisma.productCategory.findMany({
        where: { name: { in: categoryNames } } as any
      })
      const categoryIds = categoryRecords.map(c => c.id)
      if (categoryIds.length > 0) {
        where.categoryId = { $in: categoryIds } as any
      }
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get products with pagination - include category relation
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true
      }
    }) as any

    // Calculate stats
    const allProducts = await prisma.product.findMany()
    const totalProducts = allProducts.length
    const totalStockValue = allProducts.reduce((sum, p) => {
      const price = p.sellingPrice || 0
      return sum + (price * p.stock)
    }, 0)

    // Fetch settings to get low stock threshold
    const settings = await (prisma as any).settings.findFirst()
    const lowStockThreshold = settings?.lowStockThreshold || 10
    const lowStockItems = allProducts.filter(p => p.stock < lowStockThreshold).length

    // Get total sales for current month
    let totalSales = 0
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const sales = await prisma.sale.findMany({
        where: {
          saleDate: { gte: firstDayOfMonth } as any,
          paymentMethodId: { not: null } as any // Filter out records with null paymentMethodId
        }
      }) as any[]
      totalSales = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0)
    } catch (error) {
      console.error("Error fetching sales data:", error)
      // Continue with totalSales = 0 if sales data is corrupted
    }

    return NextResponse.json({
      products: products.map((p: any) => {
        const costPrice = p.costPrice || 0
        const sellingPrice = p.sellingPrice || 0
        const profitPerUnit = sellingPrice - costPrice
        const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0
        
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name || p.category,
          categoryId: p.categoryId,
          size: p.size || "N/A",
          color: p.color || "N/A",
          variant: p.variant || "N/A",
          supplier: p.supplierId || "N/A",
          stock: p.stock,
          costPrice: costPrice,
          sellingPrice: sellingPrice,
          price: sellingPrice,
          // Cost breakdown
          materialCost: p.materialCost || 0,
          laborCost: p.laborCost || 0,
          shippingCost: p.shippingCost || 0,
          overheadCost: p.overheadCost || 0,
          otherCost: p.otherCost || 0,
          // Profitability metrics
          profitPerUnit: profitPerUnit,
          profitMargin: profitMargin,
          totalSales: p.totalSales || 0,
          totalRevenue: p.totalRevenue || 0,
          totalCost: p.totalCost || 0,
          totalProfit: p.totalProfit || 0,
          status: p.stock === 0 ? "Out of Stock" : p.stock < 10 ? "Low Stock" : "In Stock",
          imageUrl: p.imageUrl
        }
      }),
      stats: {
        totalProducts: totalProducts || 0,
        totalStockValue: allProducts.reduce((sum, p) => {
          const price = p.sellingPrice || 0
          return sum + (price * p.stock)
        }, 0),
        totalCostValue: allProducts.reduce((sum, p) => {
          const cost = p.costPrice || 0
          return sum + (cost * p.stock)
        }, 0),
        totalProfitValue: allProducts.reduce((sum, p) => {
          const price = p.sellingPrice || 0
          const cost = p.costPrice || 0
          return sum + ((price - cost) * p.stock)
        }, 0),
        lowStockItems: lowStockItems || 0,
        totalSales: totalSales || 0
      },
      // Shadcn dynamic search pagination format
      pagination: {
        total,
        offset: skip,
        limit,
        hasMore: skip + limit < total,
        // Legacy pagination fields for backward compatibility
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity, reason, adjustmentDate } = body

    if (!productId || quantity === undefined || quantity < 0) {
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
      where: { id: productId as string }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const previousStock = product.stock
    const newStock = quantity

    // Validate that stock is not being decreased
    if (newStock < previousStock) {
      return NextResponse.json(
        { error: `Cannot decrease stock below current level (${previousStock}). Use stock addition instead.` },
        { status: 400 }
      )
    }

    // Determine transaction type - if previous stock was 0, it's opening stock
    const autoTransactionType = previousStock === 0 ? "OPENING_STOCK" : "STOCK_ADJUSTED"
    const finalTransactionType = autoTransactionType

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    // Create stock history record
    if (userId) {
      const adjustmentDateObj = adjustmentDate ? new Date(adjustmentDate) : new Date()
      await prisma.stockHistory.create({
        data: {
          productId,
          stockLevel: newStock,
          date: adjustmentDateObj,
          userId,
          reason: reason || (finalTransactionType === "OPENING_STOCK" ? "Opening stock" : `Stock adjusted from ${previousStock} to ${newStock}`),
          transactionType: finalTransactionType,
          previousStock,
          newStock,
        }
      })
    }

    // Create audit log
    await createAuditLog({
      userId,
      actionType: AuditAction.ADJUSTMENT_MADE,
      entityType: "Stock",
      entityId: productId,
      description: `${finalTransactionType === "OPENING_STOCK" ? "Set opening stock" : "Adjusted stock"} for ${product.name} (SKU: ${product.sku}) from ${previousStock} to ${newStock}`,
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
    console.error("Error adjusting stock:", error)
    return NextResponse.json(
      { error: "Failed to adjust stock", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const name = formData.get("name") as string
    const sku = formData.get("sku") as string
    const category = formData.get("category") as string
    const categoryId = formData.get("categoryId") as string
    const size = formData.get("size") as string || ""
    const color = formData.get("color") as string || ""
    const variant = formData.get("variant") as string || ""
    const supplier = formData.get("supplier") as string || ""
    const materialCost = parseFloat((formData.get("materialCost") as string) || "0") || 0
    const laborCost = parseFloat((formData.get("laborCost") as string) || "0") || 0
    const shippingCost = parseFloat((formData.get("shippingCost") as string) || "0") || 0
    const overheadCost = parseFloat((formData.get("overheadCost") as string) || "0") || 0
    const otherCost = parseFloat((formData.get("otherCost") as string) || "0") || 0
    const sellingPrice = parseFloat((formData.get("sellingPrice") as string) || "0") || 0
    const stock = parseInt((formData.get("stock") as string) || "0") || 0
    const description = formData.get("description") as string || ""
    const imageFile = formData.get("image") as File | null
    let imageUrl: string | null = null

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
          { status: 400 }
        )
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (imageFile.size > maxSize) {
        return NextResponse.json(
          { error: 'File size exceeds 10MB limit' },
          { status: 400 }
        )
      }

      // Convert file to base64
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      imageUrl = `data:${imageFile.type};base64,${base64}`
    }

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

    // Validate required fields
    if (!name || !sku || !finalCategoryId || !sellingPrice) {
      return NextResponse.json(
        { error: "Missing required fields: name, sku, categoryId, and sellingPrice are required" },
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

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 400 }
      )
    }

    // Calculate total cost from breakdown components
    const totalCostValue = materialCost + laborCost + shippingCost + overheadCost + otherCost

    // Auto-calculate variant if not provided
    const finalVariant = variant || ((size || color) ? `${size || ""} / ${color || ""}`.trim() : null)

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId: finalCategoryId,
        size: size || null,
        color: color || null,
        variant: finalVariant,
        supplierId: supplier && supplier !== "N/A" ? supplier : undefined,
        costPrice: totalCostValue,
        materialCost: materialCost,
        laborCost: laborCost,
        shippingCost: shippingCost,
        overheadCost: overheadCost,
        otherCost: otherCost,
        sellingPrice: sellingPrice,
        stock: stock,
        description: description || null,
        imageUrl: imageUrl
      }
    })

    // Create stock history record for initial stock if stock > 0 and userId is available
    if (stock && stock > 0 && userId) {
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          stockLevel: stock,
          date: new Date(),
          userId,
          reason: "Opening stock for new product",
          transactionType: "OPENING_STOCK",
          previousStock: 0,
          newStock: stock,
        }
      })
    }

    // Create audit log for product creation if userId is available
    if (userId) {
      await createAuditLog({
        userId,
        actionType: AuditAction.PRODUCT_ADDED,
        entityType: "Product",
        entityId: product.id,
        description: `Added new product: ${name} (SKU: ${sku})`,
        newValue: JSON.stringify({
          name,
          sku,
          categoryId: finalCategoryId,
          sellingPrice,
          stock,
          materialCost,
          laborCost,
          shippingCost,
          overheadCost,
          otherCost,
        }),
        ipAddress,
        userAgent,
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}