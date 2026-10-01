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
    Package,
    Download,
    Calendar as CalendarIcon
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
        <div className="relative bg-linear-to-br from-[#0a0a0a] to-[#111111] rounded-2xl p-6 border border-white/8 overflow-hidden group hover:border-white/12 transition-all duration-300">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="text-xs font-semibold">{change}</span>
                    </div>
                </div>
                <p className="text-sm text-white/40 mb-2">{label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>
        </div>
    )
}

export default function GrossProfitReport() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [grossProfitData, setGrossProfitData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Set default date range
    useEffect(() => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateRange({ from: thirtyDaysAgo, to: now })
    }, [])

    // Fetch gross profit data
    useEffect(() => {
        const fetchGrossProfitData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                params.append('startDate', dateRange.from.toISOString().split('T')[0])
                params.append('endDate', dateRange.to.toISOString().split('T')[0])

                const response = await fetch(`/api/reports/gross-profit?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch gross profit data')

                const data = await response.json()
                setGrossProfitData(data)
            } catch (err) {
                console.error('Error fetching gross profit:', err)
                setError(err instanceof Error ? err.message : 'Failed to load gross profit data')
                setGrossProfitData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchGrossProfitData()
    }, [dateRange])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    const handleExport = () => {
        if (!grossProfitData) return

        const csvContent = [
            ["Category", "Revenue", "COGS", "Gross Profit", "Margin %"],
            ...grossProfitData.categoryBreakdown.map((cat: any) => [
                cat.category,
                cat.revenue.toFixed(2),
                cat.cogs.toFixed(2),
                cat.profit.toFixed(2),
                cat.margin.toFixed(1)
            ])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "gross-profit.csv")
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
    const combinedChartData = grossProfitData?.historicalData || []

    // Prepare pie chart data
    const pieChartData = (grossProfitData?.categoryBreakdown || []).map((cat: any, index: number) => ({
        name: cat.category,
        profit: cat.profit as number,
        percentage: grossProfitData?.current?.grossProfit > 0 ? (cat.profit / grossProfitData.current.grossProfit) * 100 : 0,
        fill: ['#668e2b', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4'][index]
    }))

    const chartConfig = {
        profit: {
            label: "Gross Profit",
            color: "#668e2b",
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
                                        <BreadcrumbPage>Gross Profit</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-8 px-4 sm:px-6 py-8">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Gross Profit Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Sales revenue minus COGS — overall and by product/category. Includes gross margin %
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
                        {grossProfitData && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={formatCurrencyK(grossProfitData.current.totalRevenue)}
                                    label="Total Sales Revenue"
                                    trend="up"
                                    change={`+${grossProfitData.changes.revenueChange.toFixed(0)}%`}
                                />
                                <SummaryCard
                                    icon={<Package size={20} />}
                                    value={formatCurrencyK(grossProfitData.current.totalCOGS)}
                                    label="Total COGS"
                                    trend="up"
                                    change={`+${grossProfitData.changes.cogsChange.toFixed(0)}%`}
                                />
                                <SummaryCard
                                    icon={<TrendingUp size={20} />}
                                    value={formatCurrencyK(grossProfitData.current.grossProfit)}
                                    label="Gross Profit"
                                    trend="up"
                                    change={`+${grossProfitData.changes.profitChange.toFixed(0)}%`}
                                />
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={`${grossProfitData.current.grossMargin.toFixed(1)}%`}
                                    label="Gross Margin %"
                                    trend="up"
                                    change={`+${grossProfitData.changes.marginChange.toFixed(1)}pp`}
                                />
                            </div>
                        )}

                        {/* Gross Profit Trend Chart */}
                        <Card className="bg-linear-to-br from-[#0a0a0a] to-[#111111] border-white/8 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-white text-lg font-semibold">Gross Profit Trend</CardTitle>
                                <CardDescription className="text-white/40 text-sm">Daily gross profit and margin percentage</CardDescription>
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
                                ) : !grossProfitData || combinedChartData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No data available for selected period</div>
                                    </div>
                                ) : (
                                    <ChartContainer config={chartConfig} className="h-80 w-full">
                                        <ComposedChart accessibilityLayer data={combinedChartData}>
                                            <defs>
                                                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#668e2b" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#668e2b" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                            />
                                            <YAxis 
                                                yAxisId="profit"
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
                                                yAxisId="profit"
                                                dataKey="profit" 
                                                fill="url(#profitGradient)" 
                                                radius={[6, 6, 0, 0]}
                                                name="Gross Profit"
                                            />
                                            <Line
                                                yAxisId="margin"
                                                dataKey="margin"
                                                stroke="#f97316"
                                                strokeWidth={3}
                                                dot={{ fill: "#f97316", r: 5, strokeWidth: 2 }}
                                                activeDot={{ r: 7 }}
                                                name="Margin %"
                                            />
                                        </ComposedChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pie Chart - Full Width */}
                        <Card className="bg-linear-to-br from-[#0a0a0a] to-[#111111] border-white/8 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-white text-lg font-semibold">Gross Profit by Product Category</CardTitle>
                                <CardDescription className="text-white/40 text-sm">Breakdown by category</CardDescription>
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
                                ) : !grossProfitData || pieChartData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No category data available</div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-12">
                                        <ChartContainer config={chartConfig} className="h-72 w-72">
                                            <PieChart>
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                                <Pie
                                                    data={pieChartData}
                                                    dataKey="profit"
                                                    nameKey="name"
                                                    innerRadius={60}
                                                    strokeWidth={4}
                                                >
                                                    {pieChartData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                        <div className="flex-1 max-w-md space-y-4">
                                            {pieChartData.map((item: any, index: number) => (
                                                <div key={`item-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/10">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="w-5 h-5 rounded-full shadow-lg"
                                                            style={{ backgroundColor: item.fill }}
                                                        />
                                                        <span className="text-white/90 text-sm font-semibold">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-white font-bold text-base">{formatCurrency(item.profit)}</span>
                                                        <span className="text-white/50 text-xs ml-2">({item.percentage.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Summary Table */}
                        {grossProfitData && (
                            <Card className="bg-linear-to-br from-[#0a0a0a] to-[#111111] border-white/8 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white text-lg font-semibold">Summary (Overall)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Sales Revenue</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">COGS</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Gross Profit</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Gross Margin %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <div className="text-lg font-bold text-white">{formatCurrency(grossProfitData.current.totalRevenue)}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-lg text-white/70">{formatCurrency(grossProfitData.current.totalCOGS)}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-lg font-bold text-emerald-400">{formatCurrency(grossProfitData.current.grossProfit)}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-lg font-bold text-blue-400">{grossProfitData.current.grossMargin.toFixed(1)}%</div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Product Profitability Table */}
                        <Card className="bg-linear-to-br from-[#0a0a0a] to-[#111111] border-white/8 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-white text-lg font-semibold">Gross Profit by Product</CardTitle>
                                <CardDescription className="text-white/40 text-sm">Detailed breakdown by product/recipe</CardDescription>
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
                                ) : !grossProfitData || grossProfitData.productProfitability.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No product data available for selected period</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Product</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Sales Revenue</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">COGS</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Gross Profit</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Margin %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grossProfitData.productProfitability.map((product: any) => (
                                                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="text-sm font-semibold text-white">{product.name}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{product.category}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm font-semibold text-white">{formatCurrency(product.revenue)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{formatCurrency(product.cogs)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className={`text-sm font-bold ${product.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {formatCurrency(product.profit)}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className={`text-sm font-bold ${product.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {product.margin.toFixed(1)}%
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
