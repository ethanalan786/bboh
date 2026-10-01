import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const business = searchParams.get("business")
    const unit = searchParams.get("unit")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const stockMin = searchParams.get("stockMin")
    const stockMax = searchParams.get("stockMax")

    console.log("Fetching inventory with filters:", { search, category, status, business, unit, priceMin, priceMax, stockMin, stockMax })

    // Fetch settings to get low stock threshold
    const settings = await (prisma as any).settings.findFirst()
    const lowStockThreshold = settings?.lowStockThreshold || 10

    // Fetch ingredients (Burn Box) - start with simple query
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { createdAt: "desc" }
    }) as any[]

    console.log("Fetched ingredients:", ingredients.length)

    // Fetch products (Box Apparel) - start with simple query
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    }) as any[]

    console.log("Fetched products:", products.length)

    // Apply client-side filtering for now
    let filteredIngredients = ingredients
    let filteredProducts = products

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredIngredients = ingredients.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.sku.toLowerCase().includes(searchLower)
      )
      filteredProducts = products.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.sku.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (category && category !== "all") {
      filteredIngredients = filteredIngredients.filter(item => item.category === category)
      filteredProducts = filteredProducts.filter(item => item.category === category)
    }

    // Apply unit filter
    if (unit && unit !== "all") {
      filteredIngredients = filteredIngredients.filter(item => item.unit.toLowerCase() === unit.toLowerCase())
    }

    // Apply price range filter
    if (priceMin) {
      const min = parseFloat(priceMin)
      filteredIngredients = filteredIngredients.filter(item => item.costPerUnit >= min)
      filteredProducts = filteredProducts.filter(item => (item.costPrice || 0) >= min)
    }
    if (priceMax) {
      const max = parseFloat(priceMax)
      filteredIngredients = filteredIngredients.filter(item => item.costPerUnit <= max)
      filteredProducts = filteredProducts.filter(item => (item.costPrice || 0) <= max)
    }

    // Apply stock range filter
    if (stockMin) {
      const min = parseFloat(stockMin)
      filteredIngredients = filteredIngredients.filter(item => item.currentStock >= min)
      filteredProducts = filteredProducts.filter(item => item.stock >= min)
    }
    if (stockMax) {
      const max = parseFloat(stockMax)
      filteredIngredients = filteredIngredients.filter(item => item.currentStock <= max)
      filteredProducts = filteredProducts.filter(item => item.stock <= max)
    }

    // Combine and format data
    const combinedInventory = [
      ...filteredIngredients.map((item: any) => {
        const stockLevel = item.currentStock
        const minStock = item.minStockLevel
        let itemStatus = "In Stock"
        if (stockLevel === 0) itemStatus = "Out of Stock"
        else if (stockLevel < minStock) itemStatus = "Low Stock"
        
        // Check for expiring soon
        if (item.expiryDate) {
          const now = new Date()
          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          const expiryDate = new Date(item.expiryDate)
          if (expiryDate <= sevenDaysFromNow && expiryDate > now) {
            itemStatus = "Expiring Soon"
          }
        }

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          business: "Burn Box",
          unit: item.unit.toLowerCase(),
          currentStock: item.currentStock,
          minStock: item.minStockLevel,
          costPerUnit: item.costPerUnit,
          totalValue: item.currentStock * item.costPerUnit,
          status: itemStatus,
          image: item.imageUrl
        }
      }),
      ...filteredProducts.map((item: any) => {
        const stockLevel = item.stock
        const minStock = lowStockThreshold
        let itemStatus = "In Stock"
        if (stockLevel === 0) itemStatus = "Out of Stock"
        else if (stockLevel < minStock) itemStatus = "Low Stock"

        // Determine business based on category
        let business = "Box Apparel"
        if (item.category === "BURN_BOX" || item.category === "DRINKS") {
          business = "Burn Box"
        }

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          business: business,
          unit: "pcs",
          currentStock: item.stock,
          minStock: minStock,
          costPerUnit: item.costPrice || 0,
          totalValue: item.stock * (item.costPrice || 0),
          status: itemStatus,
          image: item.imageUrl
        }
      })
    ]

    // Apply status filter if specified
    let filteredInventory = combinedInventory
    if (status && status !== "all") {
      filteredInventory = combinedInventory.filter(item => item.status === status)
    }

    // Apply business filter if specified
    if (business && business !== "all") {
      filteredInventory = filteredInventory.filter(item => item.business === business)
    }

    // Calculate stats
    const totalItems = filteredInventory.length
    const totalValue = filteredInventory.reduce((sum, item) => sum + item.totalValue, 0)
    const lowStockCount = filteredInventory.filter(item => item.status === "Low Stock").length
    const expiringSoonCount = filteredInventory.filter(item => item.status === "Expiring Soon").length
    const outOfStockCount = filteredInventory.filter(item => item.status === "Out of Stock").length

    // Get unique categories and units
    const categories = Array.from(new Set(filteredInventory.map(item => item.category)))
    const units = Array.from(new Set(filteredInventory.map(item => item.unit)))

    // Calculate historical inventory value for last 7 days
    const historicalData = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        // For now, use current inventory value with slight variation to simulate trend
        // In production, this would query stock history for accurate historical data
        const variation = (6 - i) * 0.05 // 5% variation per day
        const dailyValue = totalValue * (1 - variation + (Math.random() * 0.1))
        
        historicalData.push({
            date: dateStr,
            value: dailyValue
        })
    }

    return NextResponse.json({
      inventory: filteredInventory,
      stats: {
        totalItems,
        totalValue,
        lowStockCount,
        expiringSoonCount,
        outOfStockCount
      },
      filters: {
        categories,
        units
      },
      historicalData
    })
  } catch (error) {
    console.error("Error fetching inventory data:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}