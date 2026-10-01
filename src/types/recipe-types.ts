import { UnitOfMeasurement } from "./ingredient-types"

export interface RecipeIngredient {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: UnitOfMeasurement
  costPerUnit: number
  totalCost: number
}

export interface Recipe {
  id: string
  name: string
  sku: string
  category: string
  description?: string
  ingredients: RecipeIngredient[]
  totalCost: number
  sellingPrice: number
  profitMargin: number
  profitPerUnit: number
  preparationTime?: number // in minutes
  servings?: number
  instructions?: string[]
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RecipeStats {
  totalRecipes: number
  activeRecipes: number
  averageCost: number
  averageProfitMargin: number
  totalRecipesValue: number
}

export interface RecipeFormData {
  name: string
  sku: string
  category: string
  description?: string
  ingredients: Omit<RecipeIngredient, 'totalCost'>[]
  sellingPrice: number
  preparationTime?: number
  servings?: number
  instructions?: string[]
  imageUrl?: string
  isActive: boolean
}

export const RECIPE_CATEGORIES = [
  "Smoothies",
  "Shakes",
  "Bowls",
  "Drinks",
  "Snacks",
  "Meals",
  "Desserts",
  "Other"
]