import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Fetch settings to get low stock threshold
    const settings = await (prisma as any).settings.findFirst()
    const lowStockThreshold = settings?.lowStockThreshold || 10

    // Fetch products with low stock
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lt: lowStockThreshold
        }
      },
      orderBy: { stock: 'asc' }
    }) as any[]

    // Fetch ingredients with low stock
    const ingredients = await prisma.ingredient.findMany({
      where: {
        currentStock: {
          lt: prisma.ingredient.fields.minStockLevel
        }
      },
      orderBy: { currentStock: 'asc' }
    }) as any[]

    // Process products
    const lowStockProducts = products.map(product => {
      const minStock = lowStockThreshold
      const currentStock = product.stock
      const stockRatio = currentStock / minStock

      let status = "Low"
      if (stockRatio <= 0.4) status = "Critical"

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        currentStock,
        minStock,
        status,
        unit: "pcs"
      }
    })

    // Process ingredients
    const lowStockIngredients = ingredients.map(ingredient => {
      const minStock = ingredient.minStockLevel
      const currentStock = ingredient.currentStock
      const stockRatio = currentStock / minStock
      
      let status = "Low"
      if (stockRatio <= 0.4) status = "Critical"
      
      return {
        id: ingredient.id,
        name: ingredient.name,
        sku: ingredient.sku,
        category: ingredient.category,
        currentStock,
        minStock,
        status,
        unit: ingredient.unit.toLowerCase()
      }
    })

    return NextResponse.json({
      products: lowStockProducts,
      ingredients: lowStockIngredients,
      summary: {
        totalLowStockProducts: lowStockProducts.length,
        totalLowStockIngredients: lowStockIngredients.length,
        criticalProducts: lowStockProducts.filter(p => p.status === "Critical").length,
        criticalIngredients: lowStockIngredients.filter(i => i.status === "Critical").length
      }
    })
  } catch (error) {
    console.error("Error fetching low stock data:", error)
    return NextResponse.json(
      { error: "Failed to fetch low stock data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
