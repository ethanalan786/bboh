import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get all ingredients
    const ingredients = await prisma.ingredient.findMany() as any[]
    
    // Get all recipes to calculate usage
    const recipes = await prisma.recipe.findMany() as any[]
    
    // Calculate ingredient usage from recipes
    const ingredientUsageMap = new Map<string, any>()
    
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((recipeIngredient: any) => {
          const ingredientId = recipeIngredient.ingredientId
          if (!ingredientUsageMap.has(ingredientId)) {
            const ingredient = ingredients.find(i => i.id === ingredientId)
            if (ingredient) {
              ingredientUsageMap.set(ingredientId, {
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                ingredientSku: ingredient.sku,
                unit: ingredient.unit,
                totalUsed: 0,
                totalCost: 0,
                recipeCount: 0,
                lastUsed: recipe.updatedAt,
              })
            }
          }
          
          const usage = ingredientUsageMap.get(ingredientId)
          if (usage) {
            usage.totalUsed += recipeIngredient.quantity
            usage.totalCost += recipeIngredient.quantity * recipeIngredient.costPerUnit
            usage.recipeCount += 1
            if (new Date(recipe.updatedAt) > new Date(usage.lastUsed)) {
              usage.lastUsed = recipe.updatedAt
            }
          }
        })
      }
    })
    
    const ingredientUsage = Array.from(ingredientUsageMap.values())
    
    // Calculate stats
    const totalIngredientCost = ingredientUsage.reduce((sum, u) => sum + u.totalCost, 0)
    const highUsageItems = ingredientUsage.filter(u => u.totalUsed > 100).length // Threshold can be adjusted
    
    // Calculate monthly usage (simplified - using total usage as proxy)
    const monthlyUsage = totalIngredientCost / 12 // Rough estimate
    
    return NextResponse.json({
      usage: ingredientUsage,
      stats: {
        totalIngredientCost,
        highUsageItems,
        monthlyUsage,
      }
    })
  } catch (error) {
    console.error("Error fetching ingredient usage:", error)
    return NextResponse.json(
      { error: "Failed to fetch ingredient usage", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}