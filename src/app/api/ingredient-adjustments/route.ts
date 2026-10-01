import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    // Build where clause
    const where: any = {}
    
    if (type && type !== "all") {
      where.adjustmentType = type
    }

    if (status === "resolved") {
      where.resolved = true
    } else if (status === "unresolved") {
      where.resolved = false
    }

    // Get adjustments
    const adjustments = await prisma.ingredientAdjustment.findMany({
      where,
      orderBy: { date: "desc" }
    }) as any[]

    // Calculate stats
    const totalAdjustments = adjustments.length
    const totalWastage = adjustments
      .filter(a => a.adjustmentType === "WASTAGE")
      .reduce((sum, a) => sum + a.costImpact, 0)
    const totalDamage = adjustments
      .filter(a => a.adjustmentType === "DAMAGE")
      .reduce((sum, a) => sum + a.costImpact, 0)
    const totalExpiry = adjustments
      .filter(a => a.adjustmentType === "EXPIRY")
      .reduce((sum, a) => sum + a.costImpact, 0)
    const totalDiscrepancies = adjustments.filter(a => a.isDiscrepancy).length
    const unresolvedDiscrepancies = adjustments.filter(a => a.isDiscrepancy && !a.resolved).length
    const totalCostImpact = adjustments.reduce((sum, a) => sum + a.costImpact, 0)

    return NextResponse.json({
      adjustments: adjustments.map((adjustment: any) => ({
        id: adjustment.id,
        ingredientId: adjustment.ingredientId,
        ingredientName: adjustment.ingredientName,
        ingredientSku: adjustment.ingredientSku,
        adjustmentType: adjustment.adjustmentType,
        previousStock: adjustment.previousStock,
        newStock: adjustment.newStock,
        quantity: adjustment.quantity,
        unit: adjustment.unit,
        reason: adjustment.reason,
        userId: adjustment.userId,
        userName: adjustment.userName,
        date: adjustment.date,
        costImpact: adjustment.costImpact,
        isDiscrepancy: adjustment.isDiscrepancy,
        resolved: adjustment.resolved,
        createdAt: adjustment.createdAt,
      })),
      stats: {
        totalAdjustments,
        totalWastage,
        totalDamage,
        totalExpiry,
        totalDiscrepancies,
        unresolvedDiscrepancies,
        totalCostImpact,
      }
    })
  } catch (error) {
    console.error("Error fetching ingredient adjustments:", error)
    return NextResponse.json(
      { error: "Failed to fetch ingredient adjustments", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const ingredientId = body.ingredientId as string
    const ingredientName = body.ingredientName as string
    const ingredientSku = body.ingredientSku as string
    const adjustmentType = body.adjustmentType as string
    const previousStock = body.previousStock as number
    const newStock = body.newStock as number
    const quantity = body.quantity as number
    const unit = body.unit as string
    const reason = body.reason as string
    const userId = body.userId as string
    const userName = body.userName as string
    const isDiscrepancy = body.isDiscrepancy as boolean | undefined

    // Calculate cost impact
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId }
    }) as any

    if (!ingredient) {
      return NextResponse.json(
        { error: "Ingredient not found" },
        { status: 404 }
      )
    }

    const costImpact = Math.abs(quantity) * ingredient.costPerUnit

    // Create adjustment record
    const adjustment = await prisma.ingredientAdjustment.create({
      data: {
        ingredientId,
        ingredientName,
        ingredientSku,
        adjustmentType: adjustmentType as any,
        previousStock,
        newStock,
        quantity,
        unit,
        reason,
        userId,
        userName,
        date: new Date(),
        costImpact,
        isDiscrepancy: isDiscrepancy || false,
        resolved: false,
      }
    })

    // Update ingredient stock
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        currentStock: newStock,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error) {
    console.error("Error creating ingredient adjustment:", error)
    return NextResponse.json(
      { error: "Failed to create ingredient adjustment", details: error instanceof Error ? error.message : "Unknown error" },
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
        { error: "Adjustment ID is required" },
        { status: 400 }
      )
    }

    await prisma.ingredientAdjustment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting ingredient adjustment:", error)
    return NextResponse.json(
      { error: "Failed to delete ingredient adjustment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, resolved } = body

    if (!id) {
      return NextResponse.json(
        { error: "Adjustment ID is required" },
        { status: 400 }
      )
    }

    const adjustment = await prisma.ingredientAdjustment.update({
      where: { id },
      data: {
        resolved: resolved !== undefined ? resolved : true,
      }
    })

    return NextResponse.json(adjustment)
  } catch (error) {
    console.error("Error updating ingredient adjustment:", error)
    return NextResponse.json(
      { error: "Failed to update ingredient adjustment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}