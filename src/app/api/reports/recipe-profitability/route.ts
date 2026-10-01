import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Fetch all recipes
    const recipes = await prisma.recipe.findMany({
      where: {
        isActive: true
      },
      orderBy: { name: "asc" }
    }) as any[]

    // Fetch Burn Box sales for the period
    const burnBoxSales = await prisma.burnBoxSale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end
        }
      }
    }) as any[]

    // Calculate profitability per recipe
    const recipeProfitability = recipes.map(recipe => {
      const recipeSales = burnBoxSales.filter(sale => sale.recipeId === recipe.id)
      
      const totalQuantity = recipeSales.reduce((sum, sale) => sum + sale.quantity, 0)
      const totalRevenue = recipeSales.reduce((sum, sale) => sum + sale.totalPrice, 0)
      const totalIngredientCost = recipeSales.reduce((sum, sale) => sum + sale.ingredientCost, 0)
      const totalGrossProfit = recipeSales.reduce((sum, sale) => sum + sale.profit, 0)
      
      const avgProfitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

      return {
        id: recipe.id,
        name: recipe.name,
        sku: recipe.sku,
        category: recipe.category,
        sellingPrice: recipe.sellingPrice,
        totalCost: recipe.totalCost,
        profitMargin: recipe.profitMargin,
        profitPerUnit: recipe.profitPerUnit,
        totalQuantity,
        totalRevenue,
        totalIngredientCost,
        totalGrossProfit,
        avgProfitMargin
      }
    })

    // Sort by gross profit descending
    recipeProfitability.sort((a, b) => b.totalGrossProfit - a.totalGrossProfit)

    // Calculate summary statistics
    const totalRevenue = recipeProfitability.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalIngredientCost = recipeProfitability.reduce((sum, r) => sum + r.totalIngredientCost, 0)
    const totalGrossProfit = recipeProfitability.reduce((sum, r) => sum + r.totalGrossProfit, 0)
    const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

    const bestPerforming = recipeProfitability[0] || null

    return NextResponse.json({
      recipes: recipeProfitability,
      summary: {
        totalRevenue,
        totalIngredientCost,
        totalGrossProfit,
        avgMargin,
        bestPerforming
      }
    })
  } catch (error) {
    console.error("Error fetching recipe profitability data:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipe profitability data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
