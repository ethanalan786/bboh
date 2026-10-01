import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { weekStart, weekEnd } = body

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: "weekStart and weekEnd are required" },
        { status: 400 }
      )
    }

    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    end.setHours(23, 59, 59, 999)

    // Calculate previous week for comparison
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = new Date(start.getTime() - daysDiff * 24 * 60 * 60 * 1000)
    const previousEnd = new Date(start.getTime() - 1)

    // Fetch settings
    const settings = await (prisma as any).settings.findFirst()
    const lowStockThreshold = settings?.lowStockThreshold || 10

    // ==================== BEGINNING INVENTORY ====================
    const beginningProducts = await prisma.product.findMany() as any[]
    const beginningIngredients = await prisma.ingredient.findMany() as any[]

    const beginningInventoryValue = beginningProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0) +
      beginningIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)

    const beginningTotalItems = beginningProducts.length + beginningIngredients.length

    const beginningInventoryByCategory = {
      BURN_BOX: beginningProducts.filter(p => p.category === 'BURN_BOX').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      APPAREL: beginningProducts.filter(p => p.category === 'APPAREL' || p.category === 'WOMENS_APPAREL' || p.category === 'MENS_APPAREL').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      DRINKS: beginningProducts.filter(p => p.category === 'DRINKS').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      ACCESSORIES: beginningProducts.filter(p => p.category === 'ACCESSORIES').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      INGREDIENTS: beginningIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)
    }

    // ==================== PURCHASES ====================
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: start,
          lte: end
        },
        status: 'RECEIVED'
      },
      include: {
        supplier: true
      }
    }) as any[]

    const totalPurchases = purchaseOrders.length
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0)

    const purchasesBySupplier = purchaseOrders.reduce((acc, po) => {
      const supplierName = po.supplier?.name || 'Unknown'
      if (!acc[supplierName]) {
        acc[supplierName] = { count: 0, amount: 0 }
      }
      acc[supplierName].count += 1
      acc[supplierName].amount += po.totalAmount || 0
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    // ==================== SALES ====================
    // Apparel Sales (Box apparel)
    const apparelSales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        product: true
      }
    }) as any[]

    const apparelRevenue = apparelSales.reduce((sum, sale) => {
      const price = sale.unitPrice || sale.product?.sellingPrice || 0
      return sum + (sale.quantity * price)
    }, 0)

    const apparelQuantity = apparelSales.reduce((sum, sale) => sum + sale.quantity, 0)
    const apparelCOGS = apparelSales.reduce((sum, sale) => {
      const cost = sale.product?.costPrice || 0
      return sum + (sale.quantity * cost)
    }, 0)

    // Burn Box Sales (Burn Box food bar)
    const burnBoxSales = await prisma.burnBoxSale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end
        }
      }
    }) as any[]

    const burnBoxRevenue = burnBoxSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
    const burnBoxQuantity = burnBoxSales.reduce((sum, sale) => sum + sale.quantity, 0)
    const burnBoxCOGS = burnBoxSales.reduce((sum, sale) => sum + (sale.ingredientCost || 0), 0)

    // Additional Income Categories (placeholder for future implementation)
    // These would need to be tracked in the database when the features are implemented
    const equipmentRentalRevenue = 0 // Placeholder - needs database implementation
    const gymMembershipRevenue = 0 // Placeholder - needs database implementation
    const gymMembershipCoopRevenue = 0 // Placeholder - needs database implementation

    // Combined Sales
    const totalSalesRevenue = apparelRevenue + burnBoxRevenue + equipmentRentalRevenue + gymMembershipRevenue + gymMembershipCoopRevenue
    const totalSalesQuantity = apparelQuantity + burnBoxQuantity
    const totalCOGS = apparelCOGS + burnBoxCOGS

    // Sales by category
    const salesByCategory = apparelSales.reduce((acc, sale) => {
      const category = sale.product?.category || 'Other'
      if (!acc[category]) {
        acc[category] = { revenue: 0, quantity: 0 }
      }
      const price = sale.unitPrice || sale.product?.sellingPrice || 0
      acc[category].revenue += price * sale.quantity
      acc[category].quantity += sale.quantity
      return acc
    }, {} as Record<string, { revenue: number; quantity: number }>)

    salesByCategory['Smoothies'] = {
      revenue: burnBoxRevenue,
      quantity: burnBoxQuantity
    }

    // Sales by payment method
    const salesByPaymentMethod = apparelSales.reduce((acc, sale) => {
      const method = sale.paymentMethod?.name || 'Unknown'
      if (!acc[method]) {
        acc[method] = { revenue: 0, count: 0 }
      }
      const price = sale.unitPrice || sale.product?.sellingPrice || 0
      acc[method].revenue += price * sale.quantity
      acc[method].count += 1
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)

    // Add Burn Box payment methods
    burnBoxSales.forEach(sale => {
      const method = sale.paymentMethod || 'Unknown'
      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = { revenue: 0, count: 0 }
      }
      salesByPaymentMethod[method].revenue += sale.totalPrice || 0
      salesByPaymentMethod[method].count += 1
    })

    // Returns
    const returnedSales = apparelSales.filter(sale => sale.returnedQuantity > 0)
    const returnsRevenue = returnedSales.reduce((sum, sale) => {
      const price = sale.unitPrice || sale.product?.sellingPrice || 0
      return sum + (sale.returnedQuantity * price)
    }, 0)

    const netSalesRevenue = totalSalesRevenue - returnsRevenue

    // ==================== INVENTORY DEDUCTIONS ====================
    const apparelDeductions = apparelSales.reduce((sum, sale) => sum + sale.quantity, 0)
    const ingredientDeductions = burnBoxSales.reduce((sum, sale) => {
      const ingredients = sale.ingredientsDeducted as any[] || []
      return sum + ingredients.reduce((ingSum, ing) => ingSum + (ing.quantity || 0), 0)
    }, 0)

    const totalDeductions = apparelDeductions + ingredientDeductions

    // ==================== ENDING INVENTORY ====================
    const endingProducts = await prisma.product.findMany() as any[]
    const endingIngredients = await prisma.ingredient.findMany() as any[]

    const endingInventoryValue = endingProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0) +
      endingIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)

    const endingTotalItems = endingProducts.length + endingIngredients.length

    const endingInventoryByCategory = {
      BURN_BOX: endingProducts.filter(p => p.category === 'BURN_BOX').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      APPAREL: endingProducts.filter(p => p.category === 'APPAREL' || p.category === 'WOMENS_APPAREL' || p.category === 'MENS_APPAREL').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      DRINKS: endingProducts.filter(p => p.category === 'DRINKS').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      ACCESSORIES: endingProducts.filter(p => p.category === 'ACCESSORIES').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      INGREDIENTS: endingIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)
    }

    // ==================== INVENTORY ADJUSTMENTS ====================
    const stockAdjustments = await prisma.stockHistory.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
        transactionType: 'STOCK_ADJUSTED'
      },
      include: {
        product: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }) as any[]

    const totalAdjustments = stockAdjustments.length
    const adjustmentCostImpact = stockAdjustments.reduce((sum, adj) => {
      const quantityChange = adj.newStock !== null && adj.previousStock !== null 
        ? adj.newStock - adj.previousStock 
        : 0
      const costPerUnit = adj.product?.costPrice || 0
      return sum + (quantityChange * costPerUnit)
    }, 0)

    const adjustmentsByReason = stockAdjustments.reduce((acc, adj) => {
      const reason = adj.reason || 'Unknown'
      if (!acc[reason]) {
        acc[reason] = { count: 0, quantity: 0 }
      }
      const quantityChange = adj.newStock !== null && adj.previousStock !== null 
        ? adj.newStock - adj.previousStock 
        : 0
      acc[reason].count += 1
      acc[reason].quantity += Math.abs(quantityChange)
      return acc
    }, {} as Record<string, { count: number; quantity: number }>)

    // ==================== WASTAGE/DAMAGE ====================
    const ingredientAdjustments = await prisma.ingredientAdjustment.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      }
    }) as any[]

    const wastageAdjustments = ingredientAdjustments.filter(adj => 
      ['WASTAGE', 'DAMAGE', 'EXPIRY', 'THEFT'].includes(adj.adjustmentType)
    )

    const totalWastage = wastageAdjustments.reduce((sum, adj) => sum + adj.quantity, 0)
    const wastageCostImpact = wastageAdjustments.reduce((sum, adj) => sum + adj.costImpact, 0)

    const wastageByType = wastageAdjustments.reduce((acc, adj) => {
      const type = adj.adjustmentType
      if (!acc[type]) {
        acc[type] = { count: 0, quantity: 0, cost: 0 }
      }
      acc[type].count += 1
      acc[type].quantity += adj.quantity
      acc[type].cost += adj.costImpact
      return acc
    }, {} as Record<string, { count: number; quantity: number; cost: number }>)

    const unresolvedDiscrepancies = wastageAdjustments.filter(adj => adj.isDiscrepancy && !adj.resolved).length

    // ==================== INVENTORY VALUE ANALYSIS ====================
    const inventoryValueAnalysis = {
      beginningValue: beginningInventoryValue,
      purchasesAdded: totalSpend,
      salesDeducted: totalCOGS,
      adjustmentsImpact: adjustmentCostImpact,
      wastageImpact: wastageCostImpact,
      expectedEndingValue: beginningInventoryValue + totalSpend - totalCOGS + adjustmentCostImpact - wastageCostImpact,
      actualEndingValue: endingInventoryValue,
      variance: endingInventoryValue - (beginningInventoryValue + totalSpend - totalCOGS + adjustmentCostImpact - wastageCostImpact)
    }

    // ==================== GROSS PROFIT ====================
    const grossProfit = netSalesRevenue - totalCOGS
    const grossMargin = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0

    // Previous week comparison
    const previousApparelSales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: previousStart,
          lte: previousEnd
        }
      },
      include: {
        product: true
      }
    }) as any[]

    const previousBurnBoxSales = await prisma.burnBoxSale.findMany({
      where: {
        saleDate: {
          gte: previousStart,
          lte: previousEnd
        }
      }
    }) as any[]

    const previousRevenue = previousApparelSales.reduce((sum, sale) => {
      const price = sale.unitPrice || sale.product?.sellingPrice || 0
      return sum + (sale.quantity * price)
    }, 0) + previousBurnBoxSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
    // Note: Previous week comparison for new income categories would need database implementation

    const previousCOGS = previousApparelSales.reduce((sum, sale) => {
      const cost = sale.product?.costPrice || 0
      return sum + (sale.quantity * cost)
    }, 0) + previousBurnBoxSales.reduce((sum, sale) => sum + (sale.ingredientCost || 0), 0)

    const previousGrossProfit = previousRevenue - previousCOGS
    const previousGrossMargin = previousRevenue > 0 ? (previousGrossProfit / previousRevenue) * 100 : 0

    const revenueChange = previousRevenue > 0 ? ((netSalesRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const profitChange = previousGrossProfit > 0 ? ((grossProfit - previousGrossProfit) / previousGrossProfit) * 100 : 0
    const marginChange = grossMargin - previousGrossMargin

    // ==================== GYMMASTER COMPARISON ====================
    const gymMasterSales = await prisma.gymMasterSale.findMany({
      where: {
        dateTime: {
          gte: start,
          lte: end
        },
        location: 'burnbox'
      }
    }) as any[]

    const gymMasterRevenue = gymMasterSales.reduce((sum, sale) => sum + (sale.amount || 0), 0)
    const gymMasterTransactionCount = gymMasterSales.length

    const gymMasterComparison = {
      gymMasterRevenue,
      gymMasterTransactionCount,
      burnBoxRevenue,
      burnBoxTransactionCount: burnBoxSales.length,
      revenueVariance: burnBoxRevenue - gymMasterRevenue,
      transactionVariance: burnBoxSales.length - gymMasterTransactionCount,
      revenueVariancePercent: gymMasterRevenue > 0 ? ((burnBoxRevenue - gymMasterRevenue) / gymMasterRevenue) * 100 : 0
    }

    // ==================== INCOME BREAKDOWN BY CATEGORY ====================
    const incomeBreakdown = {
      boxApparel: {
        revenue: apparelRevenue,
        quantity: apparelQuantity,
        description: 'Box apparel sales'
      },
      burnBoxFoodBar: {
        revenue: burnBoxRevenue,
        quantity: burnBoxQuantity,
        description: 'Burn Box food bar sales'
      },
      equipmentRental: {
        revenue: equipmentRentalRevenue,
        quantity: 0,
        description: 'Equipment rental income'
      },
      gymMembership: {
        revenue: gymMembershipRevenue,
        quantity: 0,
        description: 'Gym membership fees'
      },
      gymMembershipCooperative: {
        revenue: gymMembershipCoopRevenue,
        quantity: 0,
        description: 'Gym membership cooperative packages'
      },
      totalIncome: {
        revenue: totalSalesRevenue,
        description: 'Total income from all sources'
      }
    }

    // ==================== DISCREPANCIES & UNUSUAL ACTIVITY ====================
    const discrepancies = {
      unresolvedDiscrepancies,
      largeAdjustments: stockAdjustments.filter(adj => {
        const quantityChange = adj.newStock !== null && adj.previousStock !== null 
          ? Math.abs(adj.newStock - adj.previousStock) 
          : 0
        return quantityChange > 50 // More than 50 units
      }).length,
      highWastageItems: wastageAdjustments.filter(adj => adj.quantity > 10).length,
      unusualSalesPatterns: apparelSales.filter(sale => {
        const price = sale.unitPrice || sale.product?.sellingPrice || 0
        return price > 500 // Sales over $500
      }).length,
      missingGymMasterSales: gymMasterRevenue > 0 && burnBoxRevenue > 0 
        ? Math.abs(gymMasterComparison.revenueVariancePercent) > 20 
        : false
    }

    // ==================== SALES BY EMPLOYEE ====================
    const salesByEmployee = apparelSales.reduce((acc, sale) => {
      const employeeName = sale.user?.name || 'Unknown'
      if (!acc[employeeName]) {
        acc[employeeName] = { revenue: 0, quantity: 0, count: 0 }
      }
      const price = sale.unitPrice || sale.product?.sellingPrice || 0
      acc[employeeName].revenue += price * sale.quantity
      acc[employeeName].quantity += sale.quantity
      acc[employeeName].count += 1
      return acc
    }, {} as Record<string, { revenue: number; quantity: number; count: number }>)

    // Add Burn Box sales by employee
    burnBoxSales.forEach(sale => {
      const employeeName = sale.userName || 'Unknown'
      if (!salesByEmployee[employeeName]) {
        salesByEmployee[employeeName] = { revenue: 0, quantity: 0, count: 0 }
      }
      salesByEmployee[employeeName].revenue += sale.totalPrice || 0
      salesByEmployee[employeeName].quantity += sale.quantity
      salesByEmployee[employeeName].count += 1
    })

    // Compile the complete report data
    const reportData = {
      metadata: {
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        generatedAt: new Date().toISOString(),
        businessName: settings?.businessName || 'Burn Box'
      },
      beginningInventory: {
        totalValue: beginningInventoryValue,
        totalItems: beginningTotalItems,
        byCategory: beginningInventoryByCategory
      },
      purchases: {
        totalPurchases,
        totalSpend,
        bySupplier: purchasesBySupplier
      },
      sales: {
        apparel: {
          revenue: apparelRevenue,
          quantity: apparelQuantity,
          cogs: apparelCOGS
        },
        burnBox: {
          revenue: burnBoxRevenue,
          quantity: burnBoxQuantity,
          cogs: burnBoxCOGS
        },
        equipmentRental: {
          revenue: equipmentRentalRevenue,
          quantity: 0,
          cogs: 0
        },
        gymMembership: {
          revenue: gymMembershipRevenue,
          quantity: 0,
          cogs: 0
        },
        gymMembershipCooperative: {
          revenue: gymMembershipCoopRevenue,
          quantity: 0,
          cogs: 0
        },
        combined: {
          totalRevenue: totalSalesRevenue,
          totalQuantity: totalSalesQuantity,
          totalCOGS,
          returns: returnsRevenue,
          netRevenue: netSalesRevenue
        },
        byCategory: salesByCategory,
        byPaymentMethod: salesByPaymentMethod,
        byEmployee: salesByEmployee
      },
      inventoryDeductions: {
        apparel: apparelDeductions,
        ingredients: ingredientDeductions,
        total: totalDeductions
      },
      endingInventory: {
        totalValue: endingInventoryValue,
        totalItems: endingTotalItems,
        byCategory: endingInventoryByCategory
      },
      inventoryAdjustments: {
        totalAdjustments,
        costImpact: adjustmentCostImpact,
        byReason: adjustmentsByReason
      },
      wastage: {
        totalWastage,
        costImpact: wastageCostImpact,
        byType: wastageByType,
        unresolvedDiscrepancies
      },
      inventoryValue: inventoryValueAnalysis,
      grossProfit: {
        total: grossProfit,
        margin: grossMargin,
        previousComparison: {
          previousRevenue,
          previousCOGS,
          previousGrossProfit,
          previousGrossMargin,
          revenueChange,
          profitChange,
          marginChange
        }
      },
      gymMasterComparison,
      incomeBreakdown,
      discrepancies
    }

    // Check if a report for this week already exists
    const existingReport = await (prisma as any).weeklyReport.findFirst({
      where: {
        weekStart: start,
        weekEnd: end
      }
    })

    let weeklyReport
    if (existingReport) {
      // Update existing report
      weeklyReport = await (prisma as any).weeklyReport.update({
        where: { id: existingReport.id },
        data: {
          reportData,
          generatedAt: new Date(),
          status: 'PENDING'
        }
      })
    } else {
      // Create new report
      weeklyReport = await (prisma as any).weeklyReport.create({
        data: {
          weekStart: start,
          weekEnd: end,
          reportData,
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      success: true,
      report: weeklyReport,
      data: reportData
    })
  } catch (error) {
    console.error("Error generating weekly report:", error)
    return NextResponse.json(
      { error: "Failed to generate weekly report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}