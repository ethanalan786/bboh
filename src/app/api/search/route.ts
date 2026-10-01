import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/** ObjectId fields only support substring filters on hex strings. */
function objectIdContainsFilter(query: string) {
  if (!/^[a-fA-F0-9]+$/.test(query)) return null
  return { id: { contains: query, mode: "insensitive" as const } }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type")?.split(",") || []
    const limit = Number(searchParams.get("limit") ?? 50)
    const offset = Number(searchParams.get("offset") ?? 0)

    const results: any[] = []
    let total = 0

    // Search products if type includes products or no type specified
    if (type.length === 0 || type.includes("products")) {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          sellingPrice: true,
          stock: true,
          imageUrl: true,
        },
        take: limit,
        skip: offset,
      })

      const productCount = await prisma.product.count({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
      })

      results.push(
        ...products.map((product) => ({
          type: "product",
          id: product.id,
          name: product.name,
          description: `${product.category?.name || 'Unknown'} • ${product.sku || 'No SKU'} • $${(product.sellingPrice || 0).toFixed(2)}`,
          metadata: {
            category: product.category?.name || 'Unknown',
            price: product.sellingPrice || 0,
            stock: product.stock,
            sku: product.sku,
            imageUrl: product.imageUrl,
          },
        }))
      )

      total += productCount
    }

    // Search recipes if type includes recipes or no type specified
    if (type.length === 0 || type.includes("recipes")) {
      const recipes = await prisma.recipe.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          sellingPrice: true,
          imageUrl: true,
          description: true,
        },
        take: limit,
        skip: offset,
      })

      const recipeCount = await prisma.recipe.count({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          isActive: true,
        },
      })

      results.push(
        ...recipes.map((recipe) => ({
          type: "recipe",
          id: recipe.id,
          name: recipe.name,
          description: `Burn Box • ${recipe.sku || 'No SKU'} • $${recipe.sellingPrice.toFixed(2)}`,
          metadata: {
            category: "BURN_BOX",
            price: recipe.sellingPrice,
            sku: recipe.sku,
            imageUrl: recipe.imageUrl,
            fullDescription: recipe.description,
          },
        }))
      )

      total += recipeCount
    }

    // Search sales if type includes sales or no type specified
    if (type.length === 0 || type.includes("sales")) {
      const saleIdFilter = objectIdContainsFilter(query)
      const saleOrConditions = [
        ...(saleIdFilter ? [saleIdFilter] : []),
        { customer: { name: { contains: query, mode: "insensitive" as const } } },
        { paymentMethod: { name: { contains: query, mode: "insensitive" as const } } },
      ]

      const sales = await prisma.sale.findMany({
        where: {
          OR: saleOrConditions,
        },
        include: {
          customer: { select: { name: true } },
          paymentMethod: { select: { name: true } },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      })

      const saleCount = await prisma.sale.count({
        where: { OR: saleOrConditions },
      })

      results.push(
        ...sales.map((sale) => ({
          type: "sale",
          id: sale.id,
          name: `Sale #${sale.id.slice(0, 8)}`,
          description: `${sale.customer?.name || 'Guest'} • ${sale.paymentMethod?.name || 'N/A'} • $${(sale.totalAmount || 0).toFixed(2)}`,
          metadata: {
            customerName: sale.customer?.name,
            paymentMethod: sale.paymentMethod?.name,
            totalAmount: sale.totalAmount,
            createdAt: sale.createdAt,
          },
        }))
      )

      total += saleCount
    }

    // Search customers if type includes customers or no type specified
    if (type.length === 0 || type.includes("customers")) {
      const customers = await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        take: limit,
        skip: offset,
      })

      const customerCount = await prisma.user.count({
        where: {
          role: "CUSTOMER",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
      })

      results.push(
        ...customers.map((customer) => ({
          type: "customer",
          id: customer.id,
          name: customer.name,
          description: `${customer.email || 'No email'} • ${customer.phone || 'No phone'}`,
          metadata: {
            email: customer.email,
            phone: customer.phone,
          },
        }))
      )

      total += customerCount
    }

    // Search BurnBox sales if type includes sales or no type specified
    if (type.length === 0 || type.includes("sales")) {
      const burnBoxSaleIdFilter = objectIdContainsFilter(query)
      const burnBoxSaleOrConditions = [
        ...(burnBoxSaleIdFilter ? [burnBoxSaleIdFilter] : []),
        { recipeName: { contains: query, mode: "insensitive" as const } },
        { recipeSku: { contains: query, mode: "insensitive" as const } },
        { customerName: { contains: query, mode: "insensitive" as const } },
      ]

      const burnBoxSales = await prisma.burnBoxSale.findMany({
        where: {
          OR: burnBoxSaleOrConditions,
        },
        take: limit,
        skip: offset,
        orderBy: { saleDate: "desc" },
      })

      const burnBoxSaleCount = await prisma.burnBoxSale.count({
        where: {
          OR: burnBoxSaleOrConditions,
        },
      })

      results.push(
        ...burnBoxSales.map((sale) => ({
          type: "sale",
          id: sale.id,
          name: `BurnBox Sale #${sale.id.slice(0, 8)}`,
          description: `${sale.recipeName} • ${sale.customerName || 'Guest'} • $${sale.totalPrice.toFixed(2)}`,
          metadata: {
            recipeName: sale.recipeName,
            recipeSku: sale.recipeSku,
            customerName: sale.customerName,
            totalAmount: sale.totalPrice,
            saleDate: sale.saleDate,
          },
        }))
      )

      total += burnBoxSaleCount
    }

    // Apply pagination to combined results
    const paginatedResults = results.slice(offset, offset + limit)

    return NextResponse.json({
      items: paginatedResults,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}