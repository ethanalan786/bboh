import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from './prisma';

// Store the scheduled task
let scheduledTask: ScheduledTask | null = null;

// Function to get the week's start and end dates based on current date
function getWeekRange(date: Date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const weekStart = new Date(current.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(current.setDate(diff + 6));
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

// Function to generate weekly report
export async function generateWeeklyReport() {
  try {
    console.log('Starting automatic weekly report generation...');
    
    const { weekStart, weekEnd } = getWeekRange();
    
    // Check if report already exists for this week
    const existingReport = await (prisma as any).weeklyReport.findFirst({
      where: {
        weekStart,
        weekEnd
      }
    });
    
    if (existingReport) {
      console.log('Weekly report already exists for this week, skipping generation.');
      return existingReport;
    }
    
    // Calculate previous week for comparison
    const daysDiff = Math.ceil((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(weekStart.getTime() - daysDiff * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(weekStart.getTime() - 1);

    // Fetch settings
    const settings = await (prisma as any).settings.findFirst();
    const lowStockThreshold = settings?.lowStockThreshold || 10;

    // ==================== BEGINNING INVENTORY ====================
    const beginningProducts = await prisma.product.findMany() as any[];
    const beginningIngredients = await prisma.ingredient.findMany() as any[];

    const beginningInventoryValue = beginningProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0) +
      beginningIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);

    const beginningTotalItems = beginningProducts.length + beginningIngredients.length;

    const beginningInventoryByCategory = {
      BURN_BOX: beginningProducts.filter(p => p.category === 'BURN_BOX').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      APPAREL: beginningProducts.filter(p => p.category === 'APPAREL' || p.category === 'WOMENS_APPAREL' || p.category === 'MENS_APPAREL').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      DRINKS: beginningProducts.filter(p => p.category === 'DRINKS').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      ACCESSORIES: beginningProducts.filter(p => p.category === 'ACCESSORIES').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      INGREDIENTS: beginningIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)
    };

    // ==================== PURCHASES ====================
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: weekStart,
          lte: weekEnd
        },
        status: 'RECEIVED'
      },
      include: {
        supplier: true
      }
    }) as any[];

    const totalPurchases = purchaseOrders.length;
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    const purchasesBySupplier = purchaseOrders.reduce((acc, po) => {
      const supplierName = po.supplier?.name || 'Unknown';
      if (!acc[supplierName]) {
        acc[supplierName] = { count: 0, amount: 0 };
      }
      acc[supplierName].count += 1;
      acc[supplierName].amount += po.totalAmount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // ==================== SALES ====================
    // Apparel Sales
    const apparelSales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        product: true
      }
    }) as any[];

    const apparelRevenue = apparelSales.reduce((sum, sale) => {
      const price = sale.unitPrice || sale.product?.sellingPrice || 0;
      return sum + (sale.quantity * price);
    }, 0);

    const apparelQuantity = apparelSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const apparelCOGS = apparelSales.reduce((sum, sale) => {
      const cost = sale.product?.costPrice || 0;
      return sum + (sale.quantity * cost);
    }, 0);

    // Burn Box Sales
    const burnBoxSales = await prisma.burnBoxSale.findMany({
      where: {
        saleDate: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    }) as any[];

    const burnBoxRevenue = burnBoxSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const burnBoxQuantity = burnBoxSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const burnBoxCOGS = burnBoxSales.reduce((sum, sale) => sum + sale.ingredientCost, 0);

    // Combined Sales
    const totalSalesRevenue = apparelRevenue + burnBoxRevenue;
    const totalSalesQuantity = apparelQuantity + burnBoxQuantity;
    const totalCOGS = apparelCOGS + burnBoxCOGS;

    // Sales by category
    const salesByCategory = apparelSales.reduce((acc, sale) => {
      const category = sale.product?.category || 'Other';
      if (!acc[category]) {
        acc[category] = { revenue: 0, quantity: 0 };
      }
      const price = sale.unitPrice || sale.product?.sellingPrice || 0;
      acc[category].revenue += price * sale.quantity;
      acc[category].quantity += sale.quantity;
      return acc;
    }, {} as Record<string, { revenue: number; quantity: number }>);

    salesByCategory['Smoothies'] = {
      revenue: burnBoxRevenue,
      quantity: burnBoxQuantity
    };

    // Sales by payment method
    const salesByPaymentMethod = apparelSales.reduce((acc, sale) => {
      const method = sale.paymentMethod?.name || 'Unknown';
      if (!acc[method]) {
        acc[method] = { revenue: 0, count: 0 };
      }
      const price = sale.unitPrice || sale.product?.sellingPrice || 0;
      acc[method].revenue += price * sale.quantity;
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    // Returns
    const returnedSales = apparelSales.filter(sale => sale.returnedQuantity > 0);
    const returnsRevenue = returnedSales.reduce((sum, sale) => {
      const price = sale.unitPrice || sale.product?.sellingPrice || 0;
      return sum + (sale.returnedQuantity * price);
    }, 0);

    const netSalesRevenue = totalSalesRevenue - returnsRevenue;

    // ==================== INVENTORY DEDUCTIONS ====================
    const apparelDeductions = apparelSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const ingredientDeductions = burnBoxSales.reduce((sum, sale) => {
      const ingredients = sale.ingredientsDeducted as any[] || [];
      return sum + ingredients.reduce((ingSum, ing) => ingSum + (ing.quantity || 0), 0);
    }, 0);

    const totalDeductions = apparelDeductions + ingredientDeductions;

    // ==================== ENDING INVENTORY ====================
    const endingProducts = await prisma.product.findMany() as any[];
    const endingIngredients = await prisma.ingredient.findMany() as any[];

    const endingInventoryValue = endingProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0) +
      endingIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);

    const endingTotalItems = endingProducts.length + endingIngredients.length;

    const endingInventoryByCategory = {
      BURN_BOX: endingProducts.filter(p => p.category === 'BURN_BOX').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      APPAREL: endingProducts.filter(p => p.category === 'APPAREL' || p.category === 'WOMENS_APPAREL' || p.category === 'MENS_APPAREL').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      DRINKS: endingProducts.filter(p => p.category === 'DRINKS').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      ACCESSORIES: endingProducts.filter(p => p.category === 'ACCESSORIES').reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0),
      INGREDIENTS: endingIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)
    };

    // ==================== INVENTORY ADJUSTMENTS ====================
    const stockAdjustments = await prisma.stockHistory.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd
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
    }) as any[];

    const totalAdjustments = stockAdjustments.length;
    const adjustmentCostImpact = stockAdjustments.reduce((sum, adj) => {
      const quantityChange = adj.newStock !== null && adj.previousStock !== null 
        ? adj.newStock - adj.previousStock 
        : 0;
      const costPerUnit = adj.product?.costPrice || 0;
      return sum + (quantityChange * costPerUnit);
    }, 0);

    const adjustmentsByReason = stockAdjustments.reduce((acc, adj) => {
      const reason = adj.reason || 'Unknown';
      if (!acc[reason]) {
        acc[reason] = { count: 0, quantity: 0 };
      }
      const quantityChange = adj.newStock !== null && adj.previousStock !== null 
        ? adj.newStock - adj.previousStock 
        : 0;
      acc[reason].count += 1;
      acc[reason].quantity += Math.abs(quantityChange);
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    // ==================== WASTAGE/DAMAGE ====================
    const ingredientAdjustments = await prisma.ingredientAdjustment.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    }) as any[];

    const wastageAdjustments = ingredientAdjustments.filter(adj => 
      ['WASTAGE', 'DAMAGE', 'EXPIRY', 'THEFT'].includes(adj.adjustmentType)
    );

    const totalWastage = wastageAdjustments.reduce((sum, adj) => sum + adj.quantity, 0);
    const wastageCostImpact = wastageAdjustments.reduce((sum, adj) => sum + adj.costImpact, 0);

    const wastageByType = wastageAdjustments.reduce((acc, adj) => {
      const type = adj.adjustmentType;
      if (!acc[type]) {
        acc[type] = { count: 0, quantity: 0, cost: 0 };
      }
      acc[type].count += 1;
      acc[type].quantity += adj.quantity;
      acc[type].cost += adj.costImpact;
      return acc;
    }, {} as Record<string, { count: number; quantity: number; cost: number }>);

    const unresolvedDiscrepancies = wastageAdjustments.filter(adj => adj.isDiscrepancy && !adj.resolved).length;

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
    };

    // ==================== GROSS PROFIT ====================
    const grossProfit = netSalesRevenue - totalCOGS;
    const grossMargin = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

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
    }) as any[];

    const previousBurnBoxSales = await prisma.burnBoxSale.findMany({
      where: {
        saleDate: {
          gte: previousStart,
          lte: previousEnd
        }
      }
    }) as any[];

    const previousRevenue = previousApparelSales.reduce((sum, sale) => {
      const price = sale.unitPrice || sale.product?.sellingPrice || 0;
      return sum + (sale.quantity * price);
    }, 0) + previousBurnBoxSales.reduce((sum, sale) => sum + sale.totalPrice, 0);

    const previousCOGS = previousApparelSales.reduce((sum, sale) => {
      const cost = sale.product?.costPrice || 0;
      return sum + (sale.quantity * cost);
    }, 0) + previousBurnBoxSales.reduce((sum, sale) => sum + sale.ingredientCost, 0);

    const previousGrossProfit = previousRevenue - previousCOGS;
    const previousGrossMargin = previousRevenue > 0 ? (previousGrossProfit / previousRevenue) * 100 : 0;

    const revenueChange = previousRevenue > 0 ? ((netSalesRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const profitChange = previousGrossProfit > 0 ? ((grossProfit - previousGrossProfit) / previousGrossProfit) * 100 : 0;
    const marginChange = grossMargin - previousGrossMargin;

    // ==================== GYMMASTER COMPARISON ====================
    const gymMasterSales = await prisma.gymMasterSale.findMany({
      where: {
        dateTime: {
          gte: weekStart,
          lte: weekEnd
        },
        location: 'burnbox'
      }
    }) as any[];

    const gymMasterRevenue = gymMasterSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const gymMasterTransactionCount = gymMasterSales.length;

    const gymMasterComparison = {
      gymMasterRevenue,
      gymMasterTransactionCount,
      burnBoxRevenue,
      burnBoxTransactionCount: burnBoxSales.length,
      revenueVariance: burnBoxRevenue - gymMasterRevenue,
      transactionVariance: burnBoxSales.length - gymMasterTransactionCount,
      revenueVariancePercent: gymMasterRevenue > 0 ? ((burnBoxRevenue - gymMasterRevenue) / gymMasterRevenue) * 100 : 0
    };

    // ==================== DISCREPANCIES & UNUSUAL ACTIVITY ====================
    const discrepancies = {
      unresolvedDiscrepancies,
      largeAdjustments: stockAdjustments.filter(adj => {
        const quantityChange = adj.newStock !== null && adj.previousStock !== null 
          ? Math.abs(adj.newStock - adj.previousStock) 
          : 0;
        return quantityChange > 50; // More than 50 units
      }).length,
      highWastageItems: wastageAdjustments.filter(adj => adj.quantity > 10).length,
      unusualSalesPatterns: apparelSales.filter(sale => {
        const price = sale.unitPrice || sale.product?.sellingPrice || 0;
        return price > 500; // Sales over $500
      }).length,
      missingGymMasterSales: gymMasterRevenue > 0 && burnBoxRevenue > 0 
        ? Math.abs(gymMasterComparison.revenueVariancePercent) > 20 
        : false
    };

    // ==================== SALES BY EMPLOYEE ====================
    const salesByEmployee = apparelSales.reduce((acc, sale) => {
      const employeeName = sale.user?.name || 'Unknown';
      if (!acc[employeeName]) {
        acc[employeeName] = { revenue: 0, quantity: 0, count: 0 };
      }
      const price = sale.unitPrice || sale.product?.sellingPrice || 0;
      acc[employeeName].revenue += price * sale.quantity;
      acc[employeeName].quantity += sale.quantity;
      acc[employeeName].count += 1;
      return acc;
    }, {} as Record<string, { revenue: number; quantity: number; count: number }>);

    // Compile the complete report data
    const reportData = {
      metadata: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
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
      discrepancies
    };

    // Check if a report for this week already exists
    const existingReportCheck = await (prisma as any).weeklyReport.findFirst({
      where: {
        weekStart,
        weekEnd
      }
    });

    let weeklyReport;
    if (existingReportCheck) {
      // Update existing report
      weeklyReport = await (prisma as any).weeklyReport.update({
        where: { id: existingReportCheck.id },
        data: {
          reportData,
          generatedAt: new Date(),
          status: 'PENDING'
        }
      });
    } else {
      // Create new report
      weeklyReport = await (prisma as any).weeklyReport.create({
        data: {
          weekStart,
          weekEnd,
          reportData,
          status: 'PENDING'
        }
      });
    }

    console.log('Weekly report generated successfully:', weeklyReport.id);
    
    // Automatically send the report if enabled
    if (settings?.weeklyReportEnabled) {
      console.log('Automatically sending weekly report...');
      await sendWeeklyReport(weeklyReport.id);
    }
    
    return weeklyReport;
  } catch (error) {
    console.error('Error in automatic weekly report generation:', error);
    throw error;
  }
}

// Function to send weekly report
async function sendWeeklyReport(reportId: string) {
  try {
    const nodemailer = (await import('nodemailer')).default;
    
    // Fetch the weekly report
    const weeklyReport = await (prisma as any).weeklyReport.findUnique({
      where: { id: reportId }
    });

    if (!weeklyReport) {
      throw new Error('Weekly report not found');
    }

    // Fetch settings for email configuration
    const settings = await (prisma as any).settings.findFirst();
    
    // Get recipients from settings or use a default
    let recipients: string[] = [];
    if (settings?.weeklyReportRecipients) {
      try {
        recipients = JSON.parse(settings.weeklyReportRecipients);
      } catch (e) {
        console.error("Error parsing weeklyReportRecipients:", e);
      }
    }

    if (recipients.length === 0) {
      console.log('No email recipients configured. Skipping email sending.');
      return;
    }

    const reportData = weeklyReport.reportData as any;
    const businessName = reportData?.metadata?.businessName || 'Burn Box';
    const weekStart = new Date(weeklyReport.weekStart).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
    const weekEnd = new Date(weeklyReport.weekEnd).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Format currency
    const formatCurrency = (value: number) => {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format percentage
    const formatPercent = (value: number) => {
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    // Generate HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <header style="background-color: #668E2B; padding: 20px; text-align: center;">
          <h1 style="font-size: 24px; color: white; margin: 0;">Weekly Operations Report</h1>
          <p style="font-size: 16px; color: white; margin: 10px 0 0 0;">${businessName}</p>
        </header>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">
            <strong>Report Period:</strong> ${weekStart} - ${weekEnd}
          </p>
          
          <!-- Key Metrics Section -->
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Key Performance Metrics</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Sales Revenue:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.sales.combined.netRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Cost of Goods Sold:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.sales.combined.totalCOGS)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Gross Profit:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #668E2B; font-weight: bold;">${formatCurrency(reportData.grossProfit.total)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Gross Margin:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reportData.grossProfit.margin.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Beginning Inventory Value:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.beginningInventory.totalValue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Ending Inventory Value:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.endingInventory.totalValue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Purchases:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.purchases.totalSpend)} (${reportData.purchases.totalPurchases} orders)</td>
              </tr>
            </table>
          </div>

          <!-- Sales Breakdown -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Sales Breakdown</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr style="background-color: #668E2B; color: white;">
                <th style="padding: 10px; text-align: left;">Category</th>
                <th style="padding: 10px; text-align: right;">Revenue</th>
                <th style="padding: 10px; text-align: right;">Quantity</th>
              </tr>
              ${Object.entries(reportData.sales.byCategory).map(([category, data]: [string, any]) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px;">${category}</td>
                  <td style="padding: 8px; text-align: right;">${formatCurrency(data.revenue)}</td>
                  <td style="padding: 8px; text-align: right;">${data.quantity}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Inventory Changes -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Inventory Changes</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Inventory Adjustments:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reportData.inventoryAdjustments.totalAdjustments} (Impact: ${formatCurrency(reportData.inventoryAdjustments.costImpact)})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Wastage/Damage:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reportData.wastage.totalWastage.toFixed(2)} units (Cost: ${formatCurrency(reportData.wastage.costImpact)})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Unresolved Discrepancies:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.discrepancies.unresolvedDiscrepancies > 0 ? '#dc2626' : '#668E2B'};">${reportData.discrepancies.unresolvedDiscrepancies}</td>
              </tr>
            </table>
          </div>

          <!-- Previous Week Comparison -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">Previous Week Comparison</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Revenue Change:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.grossProfit.previousComparison.revenueChange >= 0 ? '#16a34a' : '#dc2626'};">${formatPercent(reportData.grossProfit.previousComparison.revenueChange)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Profit Change:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.grossProfit.previousComparison.profitChange >= 0 ? '#16a34a' : '#dc2626'};">${formatPercent(reportData.grossProfit.previousComparison.profitChange)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Margin Change:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${reportData.grossProfit.previousComparison.marginChange >= 0 ? '#16a34a' : '#dc2626'};">${formatPercent(reportData.grossProfit.previousComparison.marginChange)}pp</td>
              </tr>
            </table>
          </div>

          <!-- GymMaster Comparison -->
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #668E2B; margin: 0 0 15px 0; border-bottom: 2px solid #668E2B; padding-bottom: 5px;">GymMaster Comparison</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>GymMaster Revenue:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.gymMasterComparison.gymMasterRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Burn Box Revenue:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(reportData.gymMasterComparison.burnBoxRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Revenue Variance:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${Math.abs(reportData.gymMasterComparison.revenueVariancePercent) <= 10 ? '#16a34a' : '#dc2626'};">${formatCurrency(reportData.gymMasterComparison.revenueVariance)} (${formatPercent(reportData.gymMasterComparison.revenueVariancePercent)})</td>
              </tr>
            </table>
          </div>

          <!-- Alerts -->
          ${reportData.discrepancies.unresolvedDiscrepancies > 0 || reportData.discrepancies.largeAdjustments > 0 || reportData.discrepancies.highWastageItems > 0 ? `
            <div style="background-color: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #dc2626; margin: 0 0 10px 0;">⚠️ Alerts & Discrepancies</h2>
              <ul style="margin: 0; padding-left: 20px;">
                ${reportData.discrepancies.unresolvedDiscrepancies > 0 ? `<li style="color: #dc2626;">${reportData.discrepancies.unresolvedDiscrepancies} unresolved discrepancies require attention</li>` : ''}
                ${reportData.discrepancies.largeAdjustments > 0 ? `<li style="color: #dc2626;">${reportData.discrepancies.largeAdjustments} large inventory adjustments detected</li>` : ''}
                ${reportData.discrepancies.highWastageItems > 0 ? `<li style="color: #dc2626;">${reportData.discrepancies.highWastageItems} high wastage items recorded</li>` : ''}
                ${reportData.discrepancies.missingGymMasterSales ? `<li style="color: #dc2626;">Significant variance between Burn Box and GymMaster sales data</li>` : ''}
              </ul>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This report was automatically generated by the Burn Box Operations Hub. 
            For detailed analysis, please log in to the admin dashboard.
          </p>
        </div>
        
        <footer style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
        </footer>
      </div>
    `;

    // Send email to all recipients
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(','),
      subject: `Weekly Operations Report - ${weekStart} to ${weekEnd}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    
    // Update report status
    const updatedReport = await (prisma as any).weeklyReport.update({
      where: { id: reportId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipients
      }
    });

    console.log('Weekly report sent successfully.');
    return updatedReport;
  } catch (error) {
    console.error('Error sending weekly report:', error);
    
    // Update report status to failed
    await (prisma as any).weeklyReport.update({
      where: { id: reportId },
      data: {
        status: 'FAILED'
      }
    });

    throw error;
  }
}

// Function to start the scheduler
export function startWeeklyReportScheduler() {
  if (scheduledTask) {
    console.log('Weekly report scheduler is already running.');
    return;
  }
  
  // Default schedule: Every Monday at 9:00 AM
  // This can be overridden by settings
  const schedule = '0 9 * * 1'; // Cron expression: minute hour day month dayOfWeek
  
  scheduledTask = cron.schedule(schedule, async () => {
    console.log('Running scheduled weekly report generation...');
    await generateWeeklyReport();
  });
  
  console.log('Weekly report scheduler started with schedule:', schedule);
}

// Function to stop the scheduler
export function stopWeeklyReportScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Weekly report scheduler stopped.');
  }
}

// Function to restart the scheduler with new schedule
export function restartWeeklyReportScheduler(newSchedule?: string) {
  stopWeeklyReportScheduler();
  
  if (newSchedule) {
    scheduledTask = cron.schedule(newSchedule, async () => {
      console.log('Running scheduled weekly report generation...');
      await generateWeeklyReport();
    });
    console.log('Weekly report scheduler restarted with schedule:', newSchedule);
  } else {
    startWeeklyReportScheduler();
  }
}

// Function to manually trigger report generation (for testing)
export async function triggerManualReportGeneration() {
  console.log('Manually triggering weekly report generation...');
  await generateWeeklyReport();
}