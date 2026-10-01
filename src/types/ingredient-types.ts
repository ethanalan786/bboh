export type UnitOfMeasurement = 'POUND' | 'OUNCE' | 'GRAM' | 'KILOGRAM' | 'SCOOP' | 'TABLESPOON' | 'TEASPOON' | 'CUP' | 'LITER' | 'MILLILITER' | 'QUART' | 'GALLON' | 'CAN' | 'COUNT'

export interface Ingredient {
  id: string
  name: string
  sku: string
  category: string
  description?: string
  unit: UnitOfMeasurement
  quantity: number
  costPerUnit: number
  supplier?: string
  minStockLevel: number
  currentStock: number
  bulkQuantity?: number
  bulkUnit?: UnitOfMeasurement
  conversionFactor?: number // Conversion from bulk unit to base unit
  expiryDate?: Date
  location?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface IngredientStats {
  totalIngredients: number
  totalInventoryValue: number
  lowStockItems: number
  expiringSoonItems: number
  outOfStockItems: number
}

export interface IngredientFormData {
  name: string
  sku: string
  category: string
  description?: string
  unit: UnitOfMeasurement
  quantity: number
  costPerUnit: number
  supplier?: string
  minStockLevel: number
  bulkQuantity?: number
  bulkUnit?: UnitOfMeasurement
  conversionFactor?: number
  expiryDate?: string
  location?: string
  imageUrl?: string
}

export const UNIT_LABELS: Record<UnitOfMeasurement, string> = {
  'POUND': 'Pounds (lb)',
  'OUNCE': 'Ounces (oz)',
  'GRAM': 'Grams (g)',
  'KILOGRAM': 'Kilograms (kg)',
  'SCOOP': 'Scoops',
  'TABLESPOON': 'Tablespoons (tbsp)',
  'TEASPOON': 'Teaspoons (tsp)',
  'CUP': 'Cups',
  'LITER': 'Liters (L)',
  'MILLILITER': 'Milliliters (mL)',
  'QUART': 'Quarts (qt)',
  'GALLON': 'Gallons (gal)',
  'CAN': 'Cans',
  'COUNT': 'Count'
}

export const UNIT_CONVERSIONS: Record<UnitOfMeasurement, number> = {
  'POUND': 453.592, // to grams
  'OUNCE': 28.3495, // to grams
  'GRAM': 1, // base unit
  'KILOGRAM': 1000, // to grams
  'SCOOP': 1, // scoop is unit-specific, needs conversion factor
  'TABLESPOON': 14.7868, // to grams (approximate for water)
  'TEASPOON': 4.92892, // to grams (approximate for water)
  'CUP': 236.588, // to grams (approximate for water)
  'LITER': 1000, // to grams (for water)
  'MILLILITER': 1, // to grams (for water)
  'QUART': 946.353, // to grams (for water)
  'GALLON': 3785.41, // to grams (for water)
  'CAN': 1, // can is unit-specific, needs conversion factor
  'COUNT': 1 // count is unit-specific, needs conversion factor
}