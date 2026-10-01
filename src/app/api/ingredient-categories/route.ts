import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const categories = await prisma.ingredientCategory.findMany({
      where,
      orderBy: { name: "asc" }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching ingredient categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch ingredient categories", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Check if category already exists
    const existingCategory = await prisma.ingredientCategory.findUnique({
      where: { name: name.trim() }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      )
    }

    const category = await prisma.ingredientCategory.create({
      data: {
        name: name.trim(),
        description: description || null
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating ingredient category:", error)
    return NextResponse.json(
      { error: "Failed to create ingredient category", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Check if category name already exists for another category
    const existingCategory = await prisma.ingredientCategory.findFirst({
      where: { 
        name: name.trim(),
        NOT: { id }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      )
    }

    const category = await prisma.ingredientCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating ingredient category:", error)
    return NextResponse.json(
      { error: "Failed to update ingredient category", details: error instanceof Error ? error.message : "Unknown error" },
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
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Get the category name first
    const category = await prisma.ingredientCategory.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if category is being used by any ingredients
    const ingredientsWithCategory = await prisma.ingredient.findMany({
      where: { category: category.name }
    })

    if (ingredientsWithCategory.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that is being used by ingredients" },
        { status: 400 }
      )
    }

    await prisma.ingredientCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting ingredient category:", error)
    return NextResponse.json(
      { error: "Failed to delete ingredient category", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
