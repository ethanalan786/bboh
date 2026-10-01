import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const unit = searchParams.get("unit")

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { $regex: search, $options: "i" } as any },
        { sku: { $regex: search, $options: "i" } as any }
      ]
    }
    
    if (category && category !== "all") {
      where.category = category
    }

    if (unit && unit !== "all") {
      where.unit = unit
    }

    // Get ingredients
    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { createdAt: "desc" }
    }) as any[]

    // Calculate stats
    const totalIngredients = ingredients.length
    const totalInventoryValue = ingredients.reduce((sum, i) => {
      return sum + (i.currentStock * i.costPerUnit)
    }, 0)
    const lowStockItems = ingredients.filter(i => i.currentStock < i.minStockLevel).length
    const outOfStockItems = ingredients.filter(i => i.currentStock === 0).length
    
    // Check for expiring soon (within 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const expiringSoonItems = ingredients.filter(i => {
      if (!i.expiryDate) return false
      const expiryDate = new Date(i.expiryDate)
      return expiryDate <= sevenDaysFromNow && expiryDate > now
    }).length

    return NextResponse.json({
      ingredients: ingredients.map((ingredient: any) => ({
        id: ingredient.id,
        name: ingredient.name,
        sku: ingredient.sku,
        category: ingredient.category,
        description: ingredient.description,
        unit: ingredient.unit,
        quantity: ingredient.quantity,
        costPerUnit: ingredient.costPerUnit,
        supplier: ingredient.supplier,
        minStockLevel: ingredient.minStockLevel,
        currentStock: ingredient.currentStock,
        bulkQuantity: ingredient.bulkQuantity,
        bulkUnit: ingredient.bulkUnit,
        conversionFactor: ingredient.conversionFactor,
        expiryDate: ingredient.expiryDate,
        location: ingredient.location,
        imageUrl: ingredient.imageUrl,
        createdAt: ingredient.createdAt,
        updatedAt: ingredient.updatedAt,
      })),
      stats: {
        totalIngredients,
        totalInventoryValue,
        lowStockItems,
        expiringSoonItems,
        outOfStockItems,
      }
    })
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    return NextResponse.json(
      { error: "Failed to fetch ingredients", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { duplicateId } = body
    
    // Handle duplication
    if (duplicateId) {
      const originalIngredient = await prisma.ingredient.findUnique({
        where: { id: duplicateId }
      }) as any

      if (!originalIngredient) {
        return NextResponse.json(
          { error: "Original ingredient not found" },
          { status: 404 }
        )
      }

      // Use provided name/SKU or auto-generate
      const newName = body.name || `${originalIngredient.name} (Copy)`
      const newSku = body.sku || `${originalIngredient.sku}-COPY`
      
      // Check if new SKU already exists
      const existingIngredient = await prisma.ingredient.findUnique({
        where: { sku: newSku }
      })

      if (existingIngredient) {
        return NextResponse.json(
          { error: "Ingredient with this SKU already exists" },
          { status: 400 }
        )
      }

      const duplicatedIngredient = await prisma.ingredient.create({
        data: {
          name: newName,
          sku: newSku,
          category: body.category || originalIngredient.category,
          description: body.description !== undefined ? body.description : originalIngredient.description,
          unit: body.unit || originalIngredient.unit,
          quantity: body.quantity !== undefined ? body.quantity : originalIngredient.quantity,
          costPerUnit: body.costPerUnit !== undefined ? body.costPerUnit : originalIngredient.costPerUnit,
          supplier: body.supplier !== undefined ? body.supplier : originalIngredient.supplier,
          minStockLevel: body.minStockLevel !== undefined ? body.minStockLevel : originalIngredient.minStockLevel,
          bulkQuantity: body.bulkQuantity !== undefined ? body.bulkQuantity : originalIngredient.bulkQuantity,
          bulkUnit: body.bulkUnit !== undefined ? body.bulkUnit : originalIngredient.bulkUnit,
          conversionFactor: body.conversionFactor !== undefined ? body.conversionFactor : originalIngredient.conversionFactor,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : originalIngredient.expiryDate,
          location: body.location !== undefined ? body.location : originalIngredient.location,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl : originalIngredient.imageUrl,
          currentStock: 0, // Start with 0 stock for duplicated items
        }
      })

      return NextResponse.json(duplicatedIngredient, { status: 201 })
    }
    
    // Handle normal creation
    const name = body.name as string
    const sku = body.sku as string
    const category = body.category as string
    const description = body.description as string | undefined
    const unit = body.unit as string
    const quantity = body.quantity as number
    const costPerUnit = body.costPerUnit as number
    const supplier = body.supplier as string | undefined
    const minStockLevel = body.minStockLevel as number
    const bulkQuantity = body.bulkQuantity as number | undefined
    const bulkUnit = body.bulkUnit as string | undefined
    const conversionFactor = body.conversionFactor as number | undefined
    const expiryDate = body.expiryDate as string | undefined
    const location = body.location as string | undefined
    const imageUrl = body.imageUrl as string | undefined

    // Check if SKU already exists
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { sku }
    })

    if (existingIngredient) {
      return NextResponse.json(
        { error: "Ingredient with this SKU already exists" },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        sku,
        category,
        description: description || null,
        unit: unit as any,
        quantity,
        costPerUnit,
        supplier: supplier || null,
        minStockLevel,
        bulkQuantity: bulkQuantity || null,
        bulkUnit: bulkUnit as any || null,
        conversionFactor: conversionFactor || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location: location || null,
        imageUrl: imageUrl || null,
        currentStock: quantity,
      }
    })

    return NextResponse.json(ingredient, { status: 201 })
  } catch (error) {
    console.error("Error creating ingredient:", error)
    return NextResponse.json(
      { error: "Failed to create ingredient", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    
    const name = body.name as string
    const sku = body.sku as string
    const category = body.category as string
    const description = body.description as string | undefined
    const unit = body.unit as string
    const quantity = body.quantity as number
    const costPerUnit = body.costPerUnit as number
    const supplier = body.supplier as string | undefined
    const minStockLevel = body.minStockLevel as number
    const bulkQuantity = body.bulkQuantity as number | undefined
    const bulkUnit = body.bulkUnit as string | undefined
    const conversionFactor = body.conversionFactor as number | undefined
    const expiryDate = body.expiryDate as string | undefined
    const location = body.location as string | undefined
    const imageUrl = body.imageUrl as string | undefined

    // Check if SKU already exists for another ingredient
    const existingIngredient = await prisma.ingredient.findFirst({
      where: { 
        sku,
        NOT: { id }
      }
    })

    if (existingIngredient) {
      return NextResponse.json(
        { error: "Ingredient with this SKU already exists" },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        sku,
        category,
        description: description || null,
        unit: unit as any,
        quantity,
        costPerUnit,
        supplier: supplier || null,
        minStockLevel,
        bulkQuantity: bulkQuantity || null,
        bulkUnit: bulkUnit as any || null,
        conversionFactor: conversionFactor || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location: location || null,
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(ingredient)
  } catch (error) {
    console.error("Error updating ingredient:", error)
    return NextResponse.json(
      { error: "Failed to update ingredient", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Ingredient ID is required" },
        { status: 400 }
      )
    }

    await prisma.ingredient.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting ingredient:", error)
    return NextResponse.json(
      { error: "Failed to delete ingredient", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}



