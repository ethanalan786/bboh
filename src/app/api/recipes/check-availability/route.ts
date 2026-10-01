import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("recipeId")

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      )
    }

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

    // Check ingredient availability
    const unavailableIngredients = []
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: recipeIngredient.ingredientId }
        }) as any

        if (ingredient) {
          const requiredQuantity = recipeIngredient.quantity
          if (ingredient.currentStock < requiredQuantity) {
            unavailableIngredients.push({
              ingredientName: ingredient.name,
              required: requiredQuantity,
              available: ingredient.currentStock
            })
          }
        }
      }
    }

    if (unavailableIngredients.length > 0) {
      const ingredientNames = unavailableIngredients.map(i => i.ingredientName).join(', ')
      return NextResponse.json({
        available: false,
        message: `Missing ingredients: ${ingredientNames}`,
        unavailableIngredients
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error("Error checking recipe availability:", error)
    return NextResponse.json(
      { error: "Failed to check recipe availability", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
