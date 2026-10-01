export type AdjustmentType = 'WASTAGE' | 'DAMAGE' | 'EXPIRY' | 'PHYSICAL_COUNT' | 'THEFT' | 'OTHER'

export interface IngredientAdjustment {
  id: string
  ingredientId: string
  ingredientName: string
  ingredientSku: string
  adjustmentType: AdjustmentType
  previousStock: number
  newStock: number
  quantity: number
  unit: string
  reason: string
  userId: string
  userName: string
  date: Date
  costImpact: number
  isDiscrepancy: boolean
  resolved: boolean
  createdAt: Date
}

export interface AdjustmentStats {
  totalAdjustments: number
  totalWastage: number
  totalDamage: number
  totalExpiry: number
  totalDiscrepancies: number
  unresolvedDiscrepancies: number
  totalCostImpact: number
}

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  'WASTAGE': 'Wastage',
  'DAMAGE': 'Damage',
  'EXPIRY': 'Expiry',
  'PHYSICAL_COUNT': 'Physical Count',
  'THEFT': 'Theft',
  'OTHER': 'Other'
}

export const ADJUSTMENT_TYPE_COLORS: Record<AdjustmentType, string> = {
  'WASTAGE': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'DAMAGE': 'bg-red-500/10 text-red-400 border-red-500/20',
  'EXPIRY': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'PHYSICAL_COUNT': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'THEFT': 'bg-red-500/10 text-red-400 border-red-500/20',
  'OTHER': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}