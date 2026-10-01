export interface BurnBoxSale {
  id: string
  orderId: string
  recipeId: string
  recipeName: string
  recipeSku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  ingredientCost: number
  profit: number
  profitMargin: number
  ingredientsDeducted: {
    ingredientId: string
    ingredientName: string
    quantity: number
    unit: string
    cost: number
  }[]
  userId: string
  userName: string
  customerId?: string
  customerName?: string
  saleDate: Date
  paymentMethod?: string
  notes?: string
  createdAt: Date
}

export interface BurnBoxSalesStats {
  totalSales: number
  totalRevenue: number
  totalIngredientCost: number
  totalProfit: number
  averageProfitMargin: number
  totalRecipesSold: number
  topSellingRecipe: {
    name: string
    quantity: number
    revenue: number
    profit: number
  } | null
  todaySales: number
  todayRevenue: number
}