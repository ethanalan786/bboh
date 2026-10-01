import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const date = searchParams.get("date")
    const allSales = searchParams.get("allSales") === "true"

    // Build where clause - filter by current user unless admin requests all sales
    const where: any = {}
    
    // Only filter by userId if not requesting all sales or user is not admin
    if (!allSales || !session || session.user.role !== 'ADMIN') {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      where.userId = session.user.id
    }
    
    if (date) {
      // Handle single date parameter (YYYY-MM-DD format)
      const startDate = new Date(date + 'T00:00:00.000Z')
      const endDate = new Date(date + 'T23:59:59.999Z')
      where.saleDate = {
        gte: startDate,
        lte: endDate
      } as any
    } else if (dateFrom) {
      where.saleDate = { gte: new Date(dateFrom) } as any
    }

    if (dateTo && !date) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      where.saleDate = { ...where.saleDate, lte: toDate } as any
    }

    // Get sales
    const sales = await prisma.burnBoxSale.findMany({
      where,
      orderBy: { saleDate: "desc" }
    }) as any[]

    // Calculate stats
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0)
    const totalIngredientCost = sales.reduce((sum, s) => sum + s.ingredientCost, 0)
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0)
    const averageProfitMargin = sales.length > 0 
      ? sales.reduce((sum, s) => sum + s.profitMargin, 0) / sales.length 
      : 0
    const totalRecipesSold = sales.reduce((sum, s) => sum + s.quantity, 0)

    // Find top selling recipe
    const recipeSales = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>()
    sales.forEach(sale => {
      const existing = recipeSales.get(sale.recipeId)
      if (existing) {
        existing.quantity += sale.quantity
        existing.revenue += sale.totalPrice
        existing.profit += sale.profit
      } else {
        recipeSales.set(sale.recipeId, {
          name: sale.recipeName,
          quantity: sale.quantity,
          revenue: sale.totalPrice,
          profit: sale.profit
        })
      }
    })

    let topSellingRecipe = null
    let maxQuantity = 0
    recipeSales.forEach((data) => {
      if (data.quantity > maxQuantity) {
        maxQuantity = data.quantity
        topSellingRecipe = data
      }
    })

    // Calculate today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = sales.filter(s => new Date(s.saleDate) >= today)
    const todaySalesCount = todaySales.length
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalPrice, 0)

    return NextResponse.json({
      sales: sales.map((sale: any) => ({
        id: sale.id,
        orderId: sale.orderId,
        recipeId: sale.recipeId,
        recipeName: sale.recipeName,
        recipeSku: sale.recipeSku,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalPrice: sale.totalPrice,
        ingredientCost: sale.ingredientCost,
        profit: sale.profit,
        profitMargin: sale.profitMargin,
        ingredientsDeducted: sale.ingredientsDeducted || [],
        userId: sale.userId,
        userName: sale.userName,
        customerId: sale.customerId,
        customerName: sale.customerName,
        saleDate: sale.saleDate,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        createdAt: sale.createdAt,
      })),
      stats: {
        totalSales,
        totalRevenue,
        totalIngredientCost,
        totalProfit,
        averageProfitMargin,
        totalRecipesSold,
        topSellingRecipe,
        todaySales: todaySalesCount,
        todayRevenue,
      }
    })
  } catch (error) {
    console.error("Error fetching burnbox sales:", error)
    return NextResponse.json(
      { error: "Failed to fetch burnbox sales", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    // Check if this is a manual entry from GymMaster reconciliation
    const isManualEntry = body.isManualEntry === true
    
    if (isManualEntry) {
      // Handle manual entry from GymMaster reconciliation
      const orderId = body.orderId as string
      const recipeName = body.recipeName as string
      const quantity = body.quantity as number
      const totalPrice = body.totalPrice as number
      const userName = body.userName as string
      const paymentMethod = body.paymentMethod as string | undefined
      const notes = body.notes as string | undefined

      // For manual entries, we don't deduct inventory or calculate profit
      // Generate dummy ObjectIds for required fields since this is a manual entry
      const generateDummyObjectId = () => {
        return Array.from({ length: 24 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')
      }
      
      const dummyRecipeId = generateDummyObjectId()
      const userId = session?.user?.id || generateDummyObjectId()
      
      const sale = await prisma.burnBoxSale.create({
        data: {
          orderId: orderId || `GM-${Date.now()}`,
          recipeId: dummyRecipeId, // Dummy ObjectId for manual entries
          recipeName: recipeName || 'Manual Entry',
          recipeSku: 'MANUAL',
          quantity: quantity || 1,
          unitPrice: totalPrice / (quantity || 1),
          totalPrice: totalPrice || 0,
          ingredientCost: 0, // No cost tracking for manual entries
          profit: 0,
          profitMargin: 0,
          ingredientsDeducted: [] as any,
          userId: userId,
          userName: userName || session?.user?.name || 'System',
          customerId: null,
          customerName: null,
          saleDate: new Date(),
          paymentMethod: paymentMethod || 'Manual',
          notes: notes || 'Manual entry from GymMaster reconciliation',
        }
      })

      // Create stock history entry for manual entry
      await prisma.stockHistory.create({
        data: {
          productId: dummyRecipeId,
          stockLevel: 0, // Manual entries don't track actual stock
          date: new Date(),
          userId: userId,
          reason: `Manual entry: ${recipeName} (${quantity} units)`,
          transactionType: "MANUAL_ENTRY",
          previousStock: 0,
          newStock: 0,
          itemType: "RECIPE",
          itemName: recipeName || 'Manual Entry',
          itemSku: 'MANUAL'
        }
      })

      return NextResponse.json(sale, { status: 201 })
    }
    
    // Original recipe-based sale logic
    const recipeId = body.recipeId as string
    const quantity = body.quantity as number
    const userId = body.userId as string
    const userName = body.userName as string
    const customerId = body.customerId as string | null
    const customerName = body.customerName as string | null
    const paymentMethodId = body.paymentMethodId as string | null
    const paymentMethod = body.paymentMethod as string | null
    const notes = body.notes as string | null

    // Get recipe details
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    }) as any

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      )
    }

    // Calculate costs
    const ingredientCost = recipe.totalCost * quantity
    const totalPrice = recipe.sellingPrice * quantity
    const profit = totalPrice - ingredientCost
    const profitMargin = totalPrice > 0 ? (profit / totalPrice) * 100 : 0

    // Generate order ID
    const orderId = `BB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Deduct ingredients from inventory
    const ingredientsDeducted = []
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: recipeIngredient.ingredientId }
        }) as any

        if (ingredient) {
          const quantityToDeduct = recipeIngredient.quantity * quantity
          const newStock = Math.max(0, ingredient.currentStock - quantityToDeduct)
          const cost = quantityToDeduct * ingredient.costPerUnit

          // Update ingredient stock
          await prisma.ingredient.update({
            where: { id: ingredient.id },
            data: {
              currentStock: newStock,
              updatedAt: new Date(),
            }
          })

          ingredientsDeducted.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: quantityToDeduct,
            unit: ingredient.unit,
            cost: cost
          })
        }
      }
    }

    // Create sale record
    const sale = await prisma.burnBoxSale.create({
      data: {
        orderId,
        recipeId,
        recipeName: recipe.name,
        recipeSku: recipe.sku,
        quantity,
        unitPrice: recipe.sellingPrice,
        totalPrice,
        ingredientCost,
        profit,
        profitMargin,
        ingredientsDeducted: ingredientsDeducted as any,
        userId,
        userName,
        customerId: customerId || null,
        customerName: customerName || null,
        saleDate: new Date(),
        paymentMethodId: paymentMethodId || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      }
    })

    // Create stock history entry for recipe sale
    // Calculate current stock level for the recipe based on limiting ingredient
    let currentRecipeStock = 0
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      const stockLevels = await Promise.all(
        recipe.ingredients.map(async (ingredient: any) => {
          const ing = await prisma.ingredient.findUnique({
            where: { id: ingredient.ingredientId }
          }) as any
          if (ing) {
            return Math.floor(ing.currentStock / ingredient.quantity)
          }
          return 0
        })
      )
      currentRecipeStock = Math.min(...stockLevels)
    }

    // Create stock history entry for the recipe
    await prisma.stockHistory.create({
      data: {
        productId: recipeId,
        stockLevel: currentRecipeStock,
        date: new Date(),
        userId: userId,
        reason: `Sale of ${quantity} ${recipe.name} (${recipe.sku})`,
        transactionType: "SALE",
        previousStock: currentRecipeStock + quantity,
        newStock: currentRecipeStock,
        itemType: "RECIPE",
        itemName: recipe.name,
        itemSku: recipe.sku
      }
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error("Error creating burnbox sale:", error)
    return NextResponse.json(
      { error: "Failed to create burnbox sale", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}