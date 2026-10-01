import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, type, quantity } = body

    if (!itemId || !type || !quantity) {
      return NextResponse.json({ error: 'Item ID, type, and quantity are required' }, { status: 400 })
    }

    const quantityToAdd = parseInt(quantity)
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    if (type === 'product') {
      const product = await prisma.product.findUnique({
        where: { id: itemId }
      }) as any

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const updatedProduct = await prisma.product.update({
        where: { id: itemId },
        data: {
          stock: product.stock + quantityToAdd
        }
      }) as any

      // Create stock history record
      await prisma.stockHistory.create({
        data: {
          productId: itemId,
          stockLevel: updatedProduct.stock,
          date: new Date(),
          userId: session.user.id,
          transactionType: "STOCK_ADDED",
          previousStock: product.stock,
          newStock: updatedProduct.stock,
          reason: `Restocked via Low-Stock Alert Report (+${quantityToAdd})`
        }
      })

      return NextResponse.json({ 
        success: true, 
        newStock: updatedProduct.stock,
        message: `Restocked ${quantityToAdd} units to ${product.name}`
      })

    } else if (type === 'ingredient') {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: itemId }
      }) as any

      if (!ingredient) {
        return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
      }

      const updatedIngredient = await prisma.ingredient.update({
        where: { id: itemId },
        data: {
          currentStock: ingredient.currentStock + quantityToAdd
        }
      }) as any

      return NextResponse.json({ 
        success: true, 
        newStock: updatedIngredient.currentStock,
        message: `Restocked ${quantityToAdd} ${ingredient.unit} to ${ingredient.name}`
      })

    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

  } catch (error) {
    console.error("Error restocking item:", error)
    return NextResponse.json(
      { error: "Failed to restock item", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
