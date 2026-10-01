import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to parse MongoDB date
const parseMongoDate = (date: any): Date => {
  if (!date) return new Date()
  if (typeof date === 'object' && date.$date) {
    return new Date(date.$date)
  }
  return new Date(date)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Fetch latest burnbox sales
    const burnboxSalesResults = await prisma.$runCommandRaw({
      find: 'BurnBoxSale',
      sort: { saleDate: -1 },
      limit: limit
    }) as any

    const burnboxSales = (burnboxSalesResults.cursor?.firstBatch || []).map((sale: any) => ({
      id: sale.id,
      orderId: sale.orderId,
      type: 'burnbox',
      recipeName: sale.recipeName,
      recipeSku: sale.recipeSku,
      quantity: sale.quantity,
      totalPrice: sale.totalPrice,
      profit: sale.profit,
      userName: sale.userName,
      customerName: sale.customerName,
      saleDate: parseMongoDate(sale.saleDate),
      paymentMethod: sale.paymentMethod,
    }))

    // Fetch latest regular (box apparel) sales
    const regularSalesResults = await prisma.$runCommandRaw({
      find: 'Sale',
      sort: { saleDate: -1 },
      limit: limit
    }) as any

    const regularSales = await Promise.all(
      (regularSalesResults.cursor?.firstBatch || []).map(async (sale: any) => {
        const productId = typeof sale.productId === 'object' && sale.productId?.$oid 
          ? sale.productId.$oid 
          : sale.productId

        let product = null
        if (productId) {
          try {
            product = await prisma.product.findUnique({
              where: { id: productId },
              select: { name: true, sku: true, category: true }
            })
          } catch (e) {
            console.error('Error fetching product:', e)
          }
        }

        return {
          id: sale.id,
          orderId: sale.orderId,
          type: 'apparel',
          productName: product?.name || 'Unknown Product',
          productSku: product?.sku || 'N/A',
          productCategory: product?.category || 'General',
          quantity: sale.quantity,
          totalPrice: sale.totalPrice,
          userName: sale.userName,
          customerName: sale.customerName,
          saleDate: parseMongoDate(sale.saleDate),
          paymentMethod: sale.paymentMethod,
        }
      })
    )

    // Combine and sort by date
    const allOrders = [...burnboxSales, ...regularSales]
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, limit)

    return NextResponse.json({
      orders: allOrders,
      burnboxCount: burnboxSales.length,
      apparelCount: regularSales.length
    })
  } catch (error) {
    console.error("Error fetching latest orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch latest orders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}