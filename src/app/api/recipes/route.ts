import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status")

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

    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }

    // Get recipes
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" }
    }) as any[]

    // Calculate stats
    const totalRecipes = recipes.length
    const activeRecipes = recipes.filter(r => r.isActive).length
    const averageCost = recipes.length > 0
      ? recipes.reduce((sum: number, r: any) => sum + r.totalCost, 0) / recipes.length
      : 0
    const averageProfitMargin = recipes.length > 0
      ? recipes.reduce((sum: number, r: any) => sum + r.profitMargin, 0) / recipes.length
      : 0
    const totalRecipesValue = recipes.reduce((sum: number, r: any) => sum + r.sellingPrice, 0)

    return NextResponse.json({
      recipes: recipes.map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        sku: recipe.sku,
        category: recipe.category,
        description: recipe.description,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        totalCost: recipe.totalCost,
        sellingPrice: recipe.sellingPrice,
        profitMargin: recipe.profitMargin,
        profitPerUnit: recipe.profitPerUnit,
        preparationTime: recipe.preparationTime,
        servings: recipe.servings,
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        imageUrl: recipe.imageUrl,
        isActive: recipe.isActive,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      })),
      stats: {
        totalRecipes,
        activeRecipes,
        averageCost,
        averageProfitMargin,
        totalRecipesValue,
      }
    })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { duplicateId } = body
    
    // Handle duplication
    if (duplicateId) {
      const originalRecipe = await prisma.recipe.findUnique({
        where: { id: duplicateId }
      }) as any

      if (!originalRecipe) {
        return NextResponse.json(
          { error: "Original recipe not found" },
          { status: 404 }
        )
      }

      // Use provided name/SKU or auto-generate
      const newName = body.name || `${originalRecipe.name} (Copy)`
      const newSku = body.sku || `${originalRecipe.sku}-COPY`
      
      // Check if new SKU already exists
      const existingRecipe = await prisma.recipe.findFirst({
        where: { 
          sku: newSku,
          NOT: { id: duplicateId }
        }
      })

      if (existingRecipe) {
        return NextResponse.json(
          { error: "Recipe with this SKU already exists" },
          { status: 400 }
        )
      }

      // Calculate cost from provided ingredients or original
      const ingredients = Array.isArray(body.ingredients) ? body.ingredients : (Array.isArray(originalRecipe.ingredients) ? originalRecipe.ingredients : [])
      const totalCost = ingredients.reduce((sum: number, ing: any) => {
        return sum + (ing.quantity * ing.costPerUnit)
      }, 0)

      const sellingPrice = body.sellingPrice !== undefined ? body.sellingPrice : originalRecipe.sellingPrice
      const profitPerUnit = sellingPrice - totalCost
      const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0

      const duplicatedRecipe = await prisma.recipe.create({
        data: {
          name: newName,
          sku: newSku,
          category: body.category || originalRecipe.category,
          description: body.description !== undefined ? body.description : originalRecipe.description,
          ingredients: ingredients,
          totalCost,
          sellingPrice,
          profitMargin,
          profitPerUnit,
          preparationTime: body.preparationTime !== undefined ? body.preparationTime : originalRecipe.preparationTime,
          servings: body.servings !== undefined ? body.servings : originalRecipe.servings,
          instructions: body.instructions !== undefined ? body.instructions : originalRecipe.instructions,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl : originalRecipe.imageUrl,
          isActive: body.isActive !== undefined ? body.isActive : false, // Start as inactive for duplicated recipes
        }
      })

      // Create stock history entry for recipe duplication
      await prisma.stockHistory.create({
        data: {
          productId: duplicatedRecipe.id,
          stockLevel: 0, // Recipe stock is calculated dynamically from ingredients
          date: new Date(),
          userId: session?.user?.id || "system",
          reason: `Recipe duplicated from ${originalRecipe.name}`,
          transactionType: "RECIPE_CREATED",
          previousStock: 0,
          newStock: 0,
          itemType: "RECIPE",
          itemName: duplicatedRecipe.name,
          itemSku: duplicatedRecipe.sku
        }
      })

      return NextResponse.json(duplicatedRecipe, { status: 201 })
    }
    
    // Handle normal creation
    const name = body.name as string
    const sku = body.sku as string
    const category = body.category as string
    const description = body.description as string | undefined
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : []
    const sellingPrice = body.sellingPrice as number
    const preparationTime = body.preparationTime as number | undefined
    const servings = body.servings as number | undefined
    const instructions = Array.isArray(body.instructions) ? body.instructions : []
    const imageUrl = body.imageUrl as string | undefined
    const isActive = body.isActive as boolean | undefined

    // Calculate total cost from ingredients
    const totalCost = ingredients.reduce((sum: number, ing: any) => {
      return sum + (ing.quantity * ing.costPerUnit)
    }, 0)

    // Calculate profit metrics
    const profitPerUnit = sellingPrice - totalCost
    const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0

    // Check if SKU already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { sku }
    })

    if (existingRecipe) {
      return NextResponse.json(
        { error: "Recipe with this SKU already exists" },
        { status: 400 }
      )
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        sku,
        category,
        description: description || null,
        ingredients: ingredients as any,
        totalCost,
        sellingPrice,
        profitMargin,
        profitPerUnit,
        preparationTime: preparationTime || null,
        servings: servings || null,
        instructions: instructions as any || null,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      }
    })

    // Create stock history entry for recipe creation
    await prisma.stockHistory.create({
      data: {
        productId: recipe.id,
        stockLevel: 0, // Recipe stock is calculated dynamically from ingredients
        date: new Date(),
        userId: session?.user?.id || "system",
        reason: `Recipe created: ${recipe.name}`,
        transactionType: "RECIPE_CREATED",
        previousStock: 0,
        newStock: 0,
        itemType: "RECIPE",
        itemName: recipe.name,
        itemSku: recipe.sku
      }
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error("Error creating recipe:", error)
    return NextResponse.json(
      { error: "Failed to create recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { id } = body
    
    const name = body.name as string
    const sku = body.sku as string
    const category = body.category as string
    const description = body.description as string | undefined
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : []
    const sellingPrice = body.sellingPrice as number
    const preparationTime = body.preparationTime as number | undefined
    const servings = body.servings as number | undefined
    const instructions = Array.isArray(body.instructions) ? body.instructions : []
    const imageUrl = body.imageUrl as string | undefined
    const isActive = body.isActive as boolean | undefined

    // Calculate total cost from ingredients
    const totalCost = ingredients.reduce((sum: number, ing: any) => {
      return sum + (ing.quantity * ing.costPerUnit)
    }, 0)

    // Calculate profit metrics
    const profitPerUnit = sellingPrice - totalCost
    const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0

    // Check if SKU already exists for another recipe
    const existingRecipe = await prisma.recipe.findFirst({
      where: { 
        sku,
        NOT: { id }
      }
    })

    if (existingRecipe) {
      return NextResponse.json(
        { error: "Recipe with this SKU already exists" },
        { status: 400 }
      )
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        sku,
        category,
        description: description || null,
        ingredients: ingredients as any,
        totalCost,
        sellingPrice,
        profitMargin,
        profitPerUnit,
        preparationTime: preparationTime || null,
        servings: servings || null,
        instructions: instructions as any || null,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      }
    })

    // Create stock history entry for recipe update
    await prisma.stockHistory.create({
      data: {
        productId: recipe.id,
        stockLevel: 0, // Recipe stock is calculated dynamically from ingredients
        date: new Date(),
        userId: session?.user?.id || "system",
        reason: `Recipe updated: ${recipe.name}`,
        transactionType: "RECIPE_UPDATED",
        previousStock: 0,
        newStock: 0,
        itemType: "RECIPE",
        itemName: recipe.name,
        itemSku: recipe.sku
      }
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error("Error updating recipe:", error)
    return NextResponse.json(
      { error: "Failed to update recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      )
    }

    // Get recipe details before deletion for stock history
    const recipe = await prisma.recipe.findUnique({
      where: { id }
    })

    await prisma.recipe.delete({
      where: { id }
    })

    // Create stock history entry for recipe deletion
    if (recipe) {
      await prisma.stockHistory.create({
        data: {
          productId: id,
          stockLevel: 0,
          date: new Date(),
          userId: session?.user?.id || "system",
          reason: `Recipe deleted: ${recipe.name}`,
          transactionType: "RECIPE_DELETED",
          previousStock: 0,
          newStock: 0,
          itemType: "RECIPE",
          itemName: recipe.name,
          itemSku: recipe.sku
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return NextResponse.json(
      { error: "Failed to delete recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}