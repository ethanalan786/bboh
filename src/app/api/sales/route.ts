import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Helper function to parse MongoDB date
    const parseMongoDate = (date: any): Date => {
      if (!date) return new Date()
      if (typeof date === 'object' && date.$date) {
        return new Date(date.$date)
      }
      return new Date(date)
    }

    // Build date filter if provided
    const dateFilter = dateFrom && dateTo ? {
      saleDate: {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo + 'T23:59:59.999Z')
      }
    } : {}

    // Use raw MongoDB to handle missing paymentMethodId
    const salesResults = await prisma.$runCommandRaw({
      find: 'Sale',
      filter: dateFilter,
      sort: { saleDate: -1 },
      limit: limit
    }) as any

    const sales = salesResults.cursor?.firstBatch || []

    // Transform the data with related information
    const transformedSales = await Promise.all(
      sales.map(async (sale: any) => {
        const productId = typeof sale.productId === 'object' && sale.productId?.$oid 
          ? sale.productId.$oid 
          : sale.productId
        
        const userId = typeof sale.userId === 'object' && sale.userId?.$oid 
          ? sale.userId.$oid 
          : sale.userId

        const customerId = sale.customerId && typeof sale.customerId === 'object' && sale.customerId?.$oid 
          ? sale.customerId.$oid 
          : sale.customerId

        // Fetch related data
        let product = null
        let user = null
        let customer = null
        let paymentMethod = null

        if (productId) {
          try {
            product = await prisma.product.findUnique({
              where: { id: productId },
              include: {
                category: true
              }
            })
          } catch (e) {
            console.error('Error fetching product:', e)
          }
        }

        if (userId) {
          try {
            user = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true }
            })
          } catch (e) {
            console.error('Error fetching user:', e)
          }
        }

        if (customerId) {
          try {
            customer = await prisma.user.findUnique({
              where: { id: customerId },
              select: { name: true, email: true }
            })
          } catch (e) {
            console.error('Error fetching customer:', e)
          }
        }

        if (sale.paymentMethodId) {
          const paymentMethodId = typeof sale.paymentMethodId === 'object' && sale.paymentMethodId?.$oid 
            ? sale.paymentMethodId.$oid 
            : sale.paymentMethodId
          
          try {
            paymentMethod = await prisma.paymentMethod.findUnique({
              where: { id: paymentMethodId },
              select: { name: true }
            })
          } catch (e) {
            console.error('Error fetching payment method:', e)
          }
        }

        // Calculate gross profit
        const costPrice = product?.costPrice || 0
        const quantity = sale.quantity || 0
        const discountAmount = (sale.totalPrice || 0) * ((sale.discountPercentage || 0) / 100)
        const finalPrice = (sale.totalPrice || 0) - discountAmount
        const totalCost = costPrice * quantity
        const grossProfit = finalPrice - totalCost

        return {
          id: sale._id?.$oid || sale._id,
          orderId: sale.orderId || null,
          productId: productId,
          productName: product?.name || "Unknown Product",
          productSku: product?.sku || "Unknown SKU",
          productCategory: product?.category?.name || product?.category || "Unknown",
          productCategoryId: product?.categoryId || null,
          quantity: quantity,
          returnedQuantity: sale.returnedQuantity || 0,
          unitPrice: sale.unitPrice || 0,
          lineTotal: sale.lineTotal || 0,
          totalPrice: sale.totalPrice || 0,
          discountPercentage: sale.discountPercentage || 0,
          discountAmount: sale.discountAmount || 0,
          taxAmount: sale.taxAmount || 0,
          totalAmount: sale.totalAmount || 0,
          costPrice: costPrice,
          grossProfit: grossProfit,
          saleDate: parseMongoDate(sale.saleDate),
          userId: userId,
          userName: user?.name || user?.email || "Unknown User",
          customerName: customer?.name || customer?.email || null,
          paymentMethod: paymentMethod?.name || null,
          createdAt: parseMongoDate(sale.createdAt),
        }
      })
    )

    // Calculate statistics
    const totalSales = transformedSales.reduce((sum, s) => sum + s.quantity, 0)
    const totalRevenue = transformedSales.reduce((sum, s) => {
      const discountAmount = s.totalPrice * (s.discountPercentage / 100)
      return sum + (s.totalPrice - discountAmount)
    }, 0)
    const totalDiscount = transformedSales.reduce((sum, s) => sum + (s.totalPrice * (s.discountPercentage / 100)), 0)
    const totalGrossProfit = transformedSales.reduce((sum, s) => sum + s.grossProfit, 0)
    const averageOrderValue = transformedSales.length > 0 ? totalRevenue / transformedSales.length : 0
    const uniqueProducts = new Set(transformedSales.map(s => s.productId)).size
    const totalTransactions = transformedSales.length

    const stats = {
      totalSales,
      totalRevenue,
      totalDiscount,
      totalGrossProfit,
      averageOrderValue,
      uniqueProducts,
      totalTransactions,
    }

    return NextResponse.json({
      sales: transformedSales,
      stats,
    })
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json(
      { error: "Failed to fetch sales", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, paymentMethodId, customerId, discountPercentage = 0, subtotal, discountAmount, taxAmount, totalAmount } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 })
    }

    // Validate customerId if provided
    if (customerId) {
      const customer = await prisma.user.findUnique({
        where: { id: customerId }
      })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
    }

    // Validate payment method if provided
    if (paymentMethodId) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId }
      })

      if (!paymentMethod) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }

      if (!paymentMethod.isActive) {
        return NextResponse.json({ error: 'Payment method is not active' }, { status: 400 })
      }
    }

    // Generate a unique order ID for this transaction
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create sale records and audit logs
    const sales = []
    const auditLogs = []

    for (const item of items) {
      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 })
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
      }

      // Use provided unit price or fall back to current selling price
      const unitPrice = item.unitPrice || (product.sellingPrice || 0)
      const lineTotal = item.lineTotal || (unitPrice * item.quantity)
      
      // Calculate total price with discount
      const basePrice = lineTotal
      const itemDiscountAmount = basePrice * (discountPercentage / 100)
      const itemTotalPrice = basePrice - itemDiscountAmount

      // Create sale record with order ID and enhanced pricing
      const sale = await prisma.sale.create({
        data: {
          orderId: orderId,
          productId: item.productId,
          userId: session.user.id,
          customerId: customerId || null,
          paymentMethodId: paymentMethodId || null,
          quantity: item.quantity,
          unitPrice: unitPrice,
          lineTotal: lineTotal,
          totalPrice: subtotal || itemTotalPrice, // Store order subtotal
          discountPercentage: discountPercentage,
          discountAmount: discountAmount || 0, // Store order discount amount
          taxAmount: taxAmount || 0, // Store order tax amount
          totalAmount: totalAmount || itemTotalPrice, // Store order total amount
          saleDate: new Date()
        }
      })

      // Update product stock and profitability metrics
      const costPrice = product.costPrice || 0
      const sellingPrice = product.sellingPrice || 0
      const revenue = itemTotalPrice
      const cost = costPrice * item.quantity
      const profit = revenue - cost
      const newTotalRevenue = (product.totalRevenue || 0) + revenue
      const newTotalCost = (product.totalCost || 0) + cost
      const newTotalProfit = (product.totalProfit || 0) + profit
      const newProfitMargin = newTotalRevenue > 0 ? (newTotalProfit / newTotalRevenue) * 100 : 0

      const previousStock = product.stock
      const newStock = previousStock - item.quantity

      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          },
          totalSales: (product.totalSales || 0) + item.quantity,
          totalRevenue: newTotalRevenue,
          totalCost: newTotalCost,
          totalProfit: newTotalProfit,
          profitMargin: newProfitMargin
        }
      })

      // Create stock history record for the sale
      await prisma.stockHistory.create({
        data: {
          productId: item.productId,
          stockLevel: newStock,
          date: new Date(),
          userId: session.user.id,
          reason: `Sale: ${item.quantity} units sold`,
          transactionType: "SALE",
          previousStock,
          newStock,
        }
      })

      // Create audit log
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          actionType: 'SALE_CREATED',
          entityType: 'Sale',
          entityId: sale.id,
          description: `Recorded sale of ${item.quantity} x ${product.name}${discountPercentage > 0 ? ` with ${discountPercentage}% discount` : ''}`,
          previousValue: JSON.stringify({ stock: product.stock }),
          newValue: JSON.stringify({ stock: product.stock - item.quantity }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      sales.push(sale)
      auditLogs.push(auditLog)
    }

    return NextResponse.json({ 
      success: true, 
      sales,
      auditLogs,
      orderId,
      message: 'Sale recorded successfully'
    })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}