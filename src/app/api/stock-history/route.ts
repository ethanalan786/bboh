import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build query conditions
    const where: any = {}
    
    if (productId) {
      where.productId = productId
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // If no date filters, don't filter by date to get all history
    if (!startDate && !endDate) {
      delete where.date
    }

    const history = await prisma.stockHistory.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    }) as any[]

    // Fetch product information for entries with itemType = "PRODUCT" or no itemType
    const productIds = history
      .filter((h: any) => (h.itemType === 'PRODUCT' || !h.itemType) && h.productId)
      .map((h: any) => h.productId)

    const products = productIds.length > 0 
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true, category: true }
        })
      : []

    // Fetch recipe information for entries with itemType = "RECIPE"
    const recipeIds = history
      .filter((h: any) => h.itemType === 'RECIPE' && h.productId)
      .map((h: any) => h.productId)

    const recipes = recipeIds.length > 0 
      ? await prisma.recipe.findMany({
          where: { id: { in: recipeIds } },
          select: { id: true, name: true, sku: true, category: true }
        })
      : []

    const productMap = new Map(products.map(p => [p.id, p]))
    const recipeMap = new Map(recipes.map(r => [r.id, r]))

    // Enhance history entries with product/recipe information
    const enhancedHistory = history.map((entry: any) => {
      // Default itemType to PRODUCT if not set
      const itemType = entry.itemType || 'PRODUCT'
      
      if (itemType === 'RECIPE') {
        const recipe = recipeMap.get(entry.productId)
        return {
          ...entry,
          itemType: 'RECIPE',
          product: {
            name: entry.itemName || recipe?.name || 'Unknown Recipe',
            sku: entry.itemSku || recipe?.sku || 'Unknown SKU',
            category: recipe?.category || 'BURN_BOX'
          }
        }
      } else {
        // Default to PRODUCT type
        const product = productMap.get(entry.productId)
        return {
          ...entry,
          itemType: 'PRODUCT',
          product: {
            name: entry.itemName || product?.name || 'Unknown Product',
            sku: entry.itemSku || product?.sku || 'Unknown SKU',
            category: product?.category || 'UNKNOWN'
          }
        }
      }
    })

    // Calculate statistics
    const stats = {
      totalAdjustments: enhancedHistory.length,
      uniqueProducts: new Set(enhancedHistory.map(h => h.productId)).size,
      adjustmentTypes: {
        increases: enhancedHistory.filter((h: any) => {
          const prevIndex = enhancedHistory.findIndex((p: any) => p.productId === h.productId && p.date < h.date)
          if (prevIndex === -1) return h.stockLevel > 0
          return h.stockLevel > enhancedHistory[prevIndex].stockLevel
        }).length,
        decreases: enhancedHistory.filter((h: any) => {
          const prevIndex = enhancedHistory.findIndex((p: any) => p.productId === h.productId && p.date < h.date)
          if (prevIndex === -1) return false
          return h.stockLevel < enhancedHistory[prevIndex].stockLevel
        }).length
      }
    }

    return NextResponse.json({
      history: enhancedHistory,
      stats
    })
  } catch (error) {
    console.error('Error fetching stock history:', error)
    return NextResponse.json({ error: 'Failed to fetch stock history' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, stockLevel, date, reason, itemType, itemName, itemSku, transactionType, previousStock, newStock } = body

    if (!productId || stockLevel === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adjustmentDate = date ? new Date(date) : new Date()

    const historyEntry = await prisma.stockHistory.create({
      data: {
        productId,
        stockLevel: Number(stockLevel),
        date: adjustmentDate,
        userId: session.user.id,
        reason: reason || null,
        itemType: itemType || 'PRODUCT',
        itemName: itemName || null,
        itemSku: itemSku || null,
        transactionType: transactionType || null,
        previousStock: previousStock !== undefined ? Number(previousStock) : null,
        newStock: newStock !== undefined ? Number(newStock) : null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }) as any

    // Fetch additional information based on itemType
    if (historyEntry.itemType === 'RECIPE') {
      const recipe = await prisma.recipe.findUnique({
        where: { id: productId },
        select: { name: true, sku: true, category: true }
      })

      historyEntry.product = {
        name: historyEntry.itemName || recipe?.name || 'Unknown Recipe',
        sku: historyEntry.itemSku || recipe?.sku || 'Unknown SKU',
        category: recipe?.category || 'BURN_BOX'
      }
    } else if (historyEntry.itemType === 'PRODUCT') {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, sku: true, category: true }
      })

      historyEntry.product = {
        name: historyEntry.itemName || product?.name || 'Unknown Product',
        sku: historyEntry.itemSku || product?.sku || 'Unknown SKU',
        category: product?.category || 'UNKNOWN'
      }
    }

    return NextResponse.json({ 
      success: true, 
      historyEntry 
    })
  } catch (error) {
    console.error('Error creating stock history entry:', error)
    return NextResponse.json({ error: 'Failed to create stock history entry' }, { status: 500 })
  }
}