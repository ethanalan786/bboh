import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Leaf, Wallet, TrendingUp } from "lucide-react"
import { currency } from "@/lib/utils"

interface TopSellingRecipeCardProps {
  recipe: {
    name: string
    quantity: number
    revenue: number
    profit: number
    description?: string
    tags?: string[]
    image?: string
  }
}

export function TopSellingRecipeCard({ recipe }: TopSellingRecipeCardProps) {
  const defaultDescription = "Fresh, clean energy with natural ingredients."
  const defaultTags = ["Energy", "Green", "Healthy"]
  const defaultImage = "/images/recipes/green-energy.jpg"

  return (
    <Card className="relative overflow-hidden bg-neutral-900 border-neutral-800">
      {/* #1 Best Seller Badge */}
      <div className="absolute top-4 right-4">
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 rounded-full px-3">
          # 1 Best Seller
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 p-6">
        {/* Image */}
        <div className="relative w-28 h-28 shrink-0 rounded-full overflow-hidden bg-linear-to-br from-emerald-900/40 to-neutral-900">
          <img
            src={recipe.image || defaultImage}
            alt={recipe.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/images/recipes/default.jpg"
            }}
          />
        </div>

        {/* Title block */}
        <div className="flex flex-col items-center md:items-start gap-2 shrink-0">
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 rounded-full w-fit gap-1.5 px-3">
            <Crown className="h-3.5 w-3.5" />
            Top Selling Recipe
          </Badge>

          <h2 className="text-2xl font-bold text-white">{recipe.name}</h2>

          <p className="text-sm text-neutral-400 text-center md:text-left">
            {recipe.description || defaultDescription}
          </p>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {(recipe.tags || defaultTags).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-neutral-800/60 border-neutral-700 text-neutral-300 rounded-full font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Metrics row - fills remaining space, evenly spaced */}
        <div className="flex items-center justify-evenly flex-1 gap-6 w-full md:w-auto pl-0 md:pl-6">
          <div className="flex items-center gap-2 shrink-0">
            <Leaf className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <p className="text-xs text-neutral-500 whitespace-nowrap">Total Sales</p>
              <p className="text-xl font-bold text-white whitespace-nowrap">{recipe.quantity}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <p className="text-xs text-neutral-500 whitespace-nowrap">Revenue</p>
              <p className="text-xl font-bold text-white whitespace-nowrap">{currency(recipe.revenue)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <p className="text-xs text-neutral-500 whitespace-nowrap">Profit</p>
              <p className="text-xl font-bold text-white whitespace-nowrap">{currency(recipe.profit)}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}