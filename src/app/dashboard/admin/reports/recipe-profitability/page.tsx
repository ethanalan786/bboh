"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Leaf,
    Download,
    Calendar as CalendarIcon,
    Lightbulb,
    Star,
    AlertCircle
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { type DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ComposedChart } from "recharts"
import { Pie, PieChart, Cell } from "recharts"
import { CalendarRange } from "@/components/calendar-range"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Summary Card Component
function SummaryCard({
    icon,
    value,
    label,
    trend,
    change
}: {
    icon: React.ReactNode
    value: string
    label: string
    trend: "up" | "down"
    change: string
}) {
    const isPositive = trend === "up"

    return (
        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-white/6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-400`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-white/50">{label}</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change}
                </span>
                <span className="text-xs text-white/40">
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                </span>
            </div>
        </div>
    )
}

export default function RecipeProfitabilityReport() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [recipeData, setRecipeData] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Set default date range
    useEffect(() => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateRange({ from: thirtyDaysAgo, to: now })
    }, [])

    // Fetch recipe profitability data
    useEffect(() => {
        const fetchRecipeProfitability = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                params.append('startDate', dateRange.from.toISOString().split('T')[0])
                params.append('endDate', dateRange.to.toISOString().split('T')[0])

                const response = await fetch(`/api/reports/recipe-profitability?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch recipe profitability data')

                const data = await response.json()
                setRecipeData(data.recipes || [])
                setSummary(data.summary || null)
            } catch (err) {
                console.error('Error fetching recipe profitability:', err)
                setError(err instanceof Error ? err.message : 'Failed to load recipe profitability data')
                setRecipeData([])
                setSummary(null)
            } finally {
                setLoading(false)
            }
        }

        fetchRecipeProfitability()
    }, [dateRange])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    const handleExport = () => {
        const csvContent = [
            ["Recipe", "SKU", "Category", "Selling Price", "Ingredient Cost", "Gross Profit", "Margin %", "Quantity Sold", "Total Revenue"],
            ...recipeData.map(recipe => [
                recipe.name,
                recipe.sku,
                recipe.category,
                recipe.sellingPrice.toFixed(2),
                recipe.totalCost.toFixed(2),
                recipe.profitPerUnit.toFixed(2),
                recipe.profitMargin.toFixed(1),
                recipe.totalQuantity,
                recipe.totalRevenue.toFixed(2)
            ])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "recipe-profitability.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatCurrency = (value: number) => {
        return `$${value.toFixed(2)}`
    }

    const formatCurrencyK = (value: number) => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`
        }
        return `$${value.toFixed(2)}`
    }

    // Prepare combined chart data
    const combinedChartData = recipeData.map(recipe => ({
        name: recipe.name,
        revenue: recipe.totalRevenue,
        cost: recipe.totalIngredientCost,
        margin: recipe.avgProfitMargin
    }))

    // Prepare pie chart data (top 5 recipes)
    const pieChartData = recipeData.slice(0, 5).map((recipe, index) => ({
        name: recipe.name,
        profit: recipe.totalGrossProfit,
        percentage: summary?.totalGrossProfit > 0 ? (recipe.totalGrossProfit / summary.totalGrossProfit) * 100 : 0,
        fill: ['#668e2b', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4'][index]
    }))

    const chartConfig = {
        revenue: {
            label: "Revenue",
            color: "#668e2b",
        },
        cost: {
            label: "Ingredient Cost",
            color: "#3b82f6",
        },
        margin: {
            label: "Margin %",
            color: "#f97316",
        },
    } satisfies ChartConfig

    return (
        <div className="font-archivo">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard/admin/reports">Reports</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Recipe Profitability</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-6 px-4 sm:px-6 py-6">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Recipe Profitability Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Revenue per smoothie/product vs total ingredient cost to produce it — margin per recipe
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <CalendarIcon size={16} className="mr-2" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                                                    </>
                                                ) : (
                                                    dateRange.from.toLocaleDateString()
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#0a0a0a] border-white/10" align="start">
                                        <CalendarRange
                                            dateRange={dateRange}
                                            setDateRange={setDateRange}
                                            onApply={() => {}}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    onClick={handleExport}
                                >
                                    <Download size={16} className="mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={formatCurrencyK(summary.totalRevenue)}
                                    label="Total Revenue"
                                    trend="up"
                                    change="+18%"
                                />
                                <SummaryCard
                                    icon={<Leaf size={20} />}
                                    value={formatCurrencyK(summary.totalIngredientCost)}
                                    label="Total Ingredient Cost"
                                    trend="up"
                                    change="+12%"
                                />
                                <SummaryCard
                                    icon={<TrendingUp size={20} />}
                                    value={formatCurrencyK(summary.totalGrossProfit)}
                                    label="Total Gross Profit"
                                    trend="up"
                                    change="+22%"
                                />
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={`${summary.avgMargin.toFixed(1)}%`}
                                    label="Average Margin"
                                    trend="up"
                                    change="+6%"
                                />
                                <SummaryCard
                                    icon={<Star size={20} />}
                                    value={summary.bestPerforming?.name || "N/A"}
                                    label="Best Performing"
                                    trend="up"
                                    change={`${summary.bestPerforming?.profitMargin.toFixed(1)}%` || "N/A"}
                                />
                            </div>
                        )}

                        {/* Revenue vs Cost vs Margin Chart */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white">Revenue vs Ingredient Cost vs Margin</CardTitle>
                                <CardDescription className="text-white/40">Combined view of financial performance per recipe</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">Loading data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-red-400">Error: {error}</div>
                                    </div>
                                ) : recipeData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No recipe data available for selected period</div>
                                    </div>
                                ) : (
                                    <ChartContainer config={chartConfig} className="h-80 w-full">
                                        <ComposedChart accessibilityLayer data={combinedChartData}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis 
                                                yAxisId="revenue"
                                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                            />
                                            <YAxis 
                                                yAxisId="margin"
                                                orientation="right"
                                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}%`}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent />}
                                            />
                                            <Bar 
                                                yAxisId="revenue"
                                                dataKey="revenue" 
                                                fill="var(--color-revenue)" 
                                                radius={4}
                                                name="Revenue"
                                            />
                                            <Bar 
                                                yAxisId="revenue"
                                                dataKey="cost" 
                                                fill="var(--color-cost)" 
                                                radius={4}
                                                name="Ingredient Cost"
                                            />
                                            <Line
                                                yAxisId="margin"
                                                dataKey="margin"
                                                stroke="var(--color-margin)"
                                                strokeWidth={3}
                                                dot={{ fill: "var(--color-margin)", r: 4 }}
                                                name="Margin %"
                                            />
                                        </ComposedChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardHeader>
                                    <CardTitle className="text-white">Profitability by Recipe</CardTitle>
                                    <CardDescription className="text-white/40">Gross profit contribution by recipe</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">Loading data...</div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-red-400">Error: {error}</div>
                                        </div>
                                    ) : recipeData.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No recipe data available for selected period</div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <ChartContainer config={chartConfig} className="h-64 w-64">
                                                <PieChart>
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={<ChartTooltipContent hideLabel />}
                                                    />
                                                    <Pie
                                                        data={pieChartData}
                                                        dataKey="profit"
                                                        nameKey="name"
                                                        innerRadius={50}
                                                        strokeWidth={5}
                                                    >
                                                        {pieChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ChartContainer>
                                            <div className="flex-1 space-y-3">
                                                {pieChartData.map((item) => (
                                                    <div key={item.name} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: item.fill }}
                                                            />
                                                            <span className="text-white/80 text-sm">{item.name}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-white font-medium text-sm">{formatCurrency(item.profit)}</span>
                                                            <span className="text-white/50 text-xs ml-2">({item.percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top & Bottom Performers */}
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardHeader>
                                    <CardTitle className="text-white">Top & Bottom Performers</CardTitle>
                                    <CardDescription className="text-white/40">Best and worst margin percentages</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">Loading data...</div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-red-400">Error: {error}</div>
                                        </div>
                                    ) : recipeData.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No recipe data available for selected period</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                                    <Star size={16} className="fill-emerald-400" />
                                                    Most Profitable
                                                </h4>
                                                <div className="space-y-2">
                                                    {recipeData.slice(0, 3).map((recipe, index) => (
                                                        <div key={recipe.id} className="flex items-center justify-between text-sm">
                                                            <span className="text-white/70">{index + 1}. {recipe.name}</span>
                                                            <span className="text-emerald-400 font-medium">{recipe.profitMargin.toFixed(1)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                                                    <AlertCircle size={16} />
                                                    Least Profitable
                                                </h4>
                                                <div className="space-y-2">
                                                    {recipeData.slice(-3).reverse().map((recipe, index) => (
                                                        <div key={recipe.id} className="flex items-center justify-between text-sm">
                                                            <span className="text-white/70">{index + 1}. {recipe.name}</span>
                                                            <span className="text-red-400 font-medium">{recipe.profitMargin.toFixed(1)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Key Insights */}
                        {summary && recipeData.length > 0 && (
                            <Card className="bg-emerald-500/10 border-emerald-500/20">
                                <CardHeader>
                                    <CardTitle className="text-emerald-300 flex items-center gap-2">
                                        <Lightbulb size={20} />
                                        Key Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-emerald-200">
                                        <li>• <strong className="text-emerald-100">{recipeData[0]?.name}</strong> is the most profitable recipe (Highest margin at {recipeData[0]?.profitMargin.toFixed(1)}% with {formatCurrency(recipeData[0]?.profitPerUnit)} gross profit per sale).</li>
                                        <li>• <strong className="text-emerald-100">{recipeData[recipeData.length - 1]?.name}</strong> has the highest ingredient cost ({formatCurrency(recipeData[recipeData.length - 1]?.totalCost)} per sale, which lowers its margin to {recipeData[recipeData.length - 1]?.profitMargin.toFixed(1)}%).</li>
                                        <li>• Overall margin improved by 6% (Driven by higher sales of high-margin recipes).</li>
                                        <li>• Recommendation: Consider promoting <strong className="text-emerald-100">{recipeData[0]?.name}</strong> and <strong className="text-emerald-100">{recipeData[1]?.name}</strong> to increase overall profitability.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recipe Table */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white">Recipe Profitability Details</CardTitle>
                                <CardDescription className="text-white/40">Detailed breakdown by recipe</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">Loading data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-red-400">Error: {error}</div>
                                    </div>
                                ) : recipeData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No recipe data available for selected period</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Recipe/Product</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Selling Price</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Ingredient Cost</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Gross Profit</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Margin %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recipeData.map((recipe) => (
                                                    <tr key={recipe.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                    <Leaf size={16} className="text-emerald-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-white">{recipe.name}</div>
                                                                    <div className="text-xs text-white/50">{recipe.sku}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm font-medium text-white">{formatCurrency(recipe.sellingPrice)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{formatCurrency(recipe.totalCost)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className={`text-sm font-medium ${recipe.profitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {formatCurrency(recipe.profitPerUnit)}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className={`text-sm font-medium ${recipe.profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {recipe.profitMargin.toFixed(1)}%
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
