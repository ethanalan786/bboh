import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Helper function to parse MongoDB date
    const parseMongoDate = (date: any): Date => {
      if (!date) return new Date()
      if (typeof date === 'object' && date.$date) {
        return new Date(date.$date)
      }
      return new Date(date)
    }

    // Use raw MongoDB to find all sales with this order ID
    const salesResults = await prisma.$runCommandRaw({
      find: 'Sale',
      filter: { orderId: orderId },
      sort: { saleDate: -1 }
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

        if (productId) {
          try {
            product = await prisma.product.findUnique({
              where: { id: productId },
              select: { name: true, sku: true, category: true, costPrice: true }
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

        return {
          id: sale._id?.$oid || sale._id,
          orderId: sale.orderId,
          productId: productId,
          productName: product?.name || "Unknown Product",
          productSku: product?.sku || "Unknown SKU",
          productCategory: product?.category || "Unknown",
          quantity: sale.quantity || 0,
          returnedQuantity: sale.returnedQuantity || 0,
          unitPrice: sale.unitPrice || 0,
          lineTotal: sale.lineTotal || 0,
          totalPrice: sale.totalPrice || 0,
          discountPercentage: sale.discountPercentage || 0,
          discountAmount: sale.discountAmount || 0,
          taxAmount: sale.taxAmount || 0,
          totalAmount: sale.totalAmount || 0,
          costPrice: product?.costPrice || 0,
          saleDate: parseMongoDate(sale.saleDate),
          userId: userId,
          userName: user?.name || user?.email || "Unknown User",
          customerName: customer?.name || customer?.email || null,
          createdAt: parseMongoDate(sale.createdAt),
        }
      })
    )

    return NextResponse.json({
      sales: transformedSales,
      orderId: orderId
    })
  } catch (error) {
    console.error("Error fetching order sales:", error)
    return NextResponse.json(
      { error: "Failed to fetch order sales", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}