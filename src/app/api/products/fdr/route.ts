import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This endpoint is specifically for Front Desk Role users
// It only provides selling price information, not cost breakdown
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category && category !== "All Categories") {
      where.category = {
        name: category
      }
    }

    // Get products - only return FDR-safe fields
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { createdAt: "desc" }
    })

    // Get recipes and calculate their stock availability based on ingredients
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    }) as any[]

    // Get all ingredients for stock calculation
    const ingredients = await prisma.ingredient.findMany() as any[]
    const ingredientStockMap = new Map(
      ingredients.map(ing => [ing.id, ing.currentStock])
    )
    const ingredientNameMap = new Map(
      ingredients.map(ing => [ing.id, ing.name])
    )

    // Calculate recipe stock based on limiting ingredient
    const recipesWithStock = recipes.map(recipe => {
      const recipeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
      
      if (recipeIngredients.length === 0) {
        return {
          ...recipe,
          stock: 0,
          status: "Out of Stock"
        }
      }

      // Find the limiting ingredient (the one that allows the fewest servings)
      let maxServings = Infinity
      let limitingIngredient = null

      for (const ing of recipeIngredients) {
        // Use ingredientId to match with ingredients map
        const ingredientId = ing.ingredientId
        const ingredientStock = ingredientStockMap.get(ingredientId) || 0
        const servingsPossible = ingredientStock / (ing.quantity || 1)
        
        if (servingsPossible < maxServings) {
          maxServings = servingsPossible
          limitingIngredient = ingredientNameMap.get(ingredientId) || ing.ingredientName || ing.name || "Unknown Ingredient"
        }
      }

      const stock = Math.floor(maxServings)
      const status = stock === 0 ? "Out of Stock" : stock < 3 ? "Low Stock" : "In Stock"

      return {
        id: recipe.id,
        name: recipe.name,
        sku: recipe.sku,
        category: "BURN_BOX",
        size: "N/A",
        color: "N/A",
        variant: "N/A",
        stock,
        sellingPrice: recipe.sellingPrice || 0,
        status,
        imageUrl: recipe.imageUrl,
        isRecipe: true,
        limitingIngredient
      }
    })

    // Combine products and recipes
    const allItems = [
      ...products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Unknown',
        size: p.size || "N/A",
        color: p.color || "N/A",
        variant: p.variant || "N/A",
        stock: p.stock,
        sellingPrice: p.sellingPrice || 0,
        status: p.stock === 0 ? "Out of Stock" : p.stock < 10 ? "Low Stock" : "In Stock",
        imageUrl: p.imageUrl,
        isRecipe: false
      })),
      ...recipesWithStock
    ]

    return NextResponse.json({
      products: allItems
    })
  } catch (error) {
    console.error("Error fetching products for FDR:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}