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
    Calendar as CalendarIcon,
    Star,
    AlertCircle
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { type DateRange } from "react-day-picker"
import { Pie, PieChart, Cell } from "recharts"
import { CalendarRange } from "@/components/calendar-range"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Detects small screens (SSR-safe: defaults to false, updates after mount)
function useIsMobile(breakpoint = 640) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [breakpoint])

    return isMobile
}

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
        <div className="bg-[#0a0a0a] rounded-xl p-3.5 sm:p-5 border border-white/6 flex flex-col gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-blue-500/5 flex items-center justify-center text-blue-400">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-white/50 truncate">{label}</p>
                    <p className="text-lg sm:text-2xl font-semibold text-white tracking-tight truncate">{value}</p>
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

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        "Most Profitable": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        "High": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        "Good": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
        "Average": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        "Lower": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        "Least Profitable": "bg-red-500/20 text-red-400 border border-red-500/30",
    }

    const defaultStyle = "bg-white/10 text-white/70 border border-white/20"

    return (
        <span className={`text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap ${statusStyles[status] || defaultStyle}`}>
            {status}
        </span>
    )
}

export default function ProductProfitabilityReport() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const isMobile = useIsMobile()

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [productData, setProductData] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Calculate status based on profit margin
    const getStatus = (margin: number) => {
        if (margin >= 40) return "Most Profitable"
        if (margin >= 35) return "High"
        if (margin >= 30) return "Good"
        if (margin >= 25) return "Average"
        if (margin >= 15) return "Lower"
        return "Least Profitable"
    }

    // Prepare data with status
    const productDataWithStatus = productData.map(product => ({
        ...product,
        status: getStatus(product.profitMargin)
    }))

    // Set default date range
    useEffect(() => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateRange({ from: thirtyDaysAgo, to: now })
    }, [])

    // Fetch product profitability data
    useEffect(() => {
        const fetchProductProfitability = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                params.append('startDate', dateRange.from.toISOString().split('T')[0])
                params.append('endDate', dateRange.to.toISOString().split('T')[0])

                const response = await fetch(`/api/reports/product-profitability?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch product profitability data')

                const data = await response.json()
                setProductData(data.products || [])
                setSummary(data.summary || null)
            } catch (err) {
                console.error('Error fetching product profitability:', err)
                setError(err instanceof Error ? err.message : 'Failed to load product profitability data')
                setProductData([])
                setSummary(null)
            } finally {
                setLoading(false)
            }
        }

        fetchProductProfitability()
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
            ["Product", "SKU", "Category", "Quantity Sold", "Total Revenue", "Total COGS", "Gross Profit", "Profit Margin %"],
            ...productData.map(product => [
                product.name,
                product.sku,
                product.category,
                product.totalQuantity,
                product.totalRevenue.toFixed(2),
                product.totalCOGS.toFixed(2),
                product.grossProfit.toFixed(2),
                product.profitMargin.toFixed(2)
            ])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "product-profitability.csv")
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

    // Prepare pie chart data
    const pieChartData = productDataWithStatus.slice(0, 6).map((product, index) => ({
        name: product.name,
        profit: product.grossProfit,
        percentage: summary?.totalGrossProfit > 0 ? (product.grossProfit / summary.totalGrossProfit) * 100 : 0,
        fill: ['#668e2b', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#14b8a6'][index]
    }))

    const chartConfig = {
        profit: {
            label: "Gross Profit",
        },
    } satisfies ChartConfig

    return (
        <div className="font-archivo">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="min-w-0">
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
                                        <BreadcrumbPage>Product Profitability</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-5 sm:gap-6 px-3 sm:px-6 py-5 sm:py-6 min-w-0">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                                    Product Profitability Report
                                </h1>
                                <p className="text-xs sm:text-sm text-white/40">
                                    Revenue, COGS, gross profit, and margin % per apparel product
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Popover>
                                    <PopoverTrigger className="flex-1 sm:flex-none min-w-0">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs sm:text-sm px-3"
                                        >
                                            <CalendarIcon size={16} className="mr-2 shrink-0" />
                                            <span className="truncate">
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
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto max-w-[calc(100vw-1.5rem)] overflow-x-auto p-0 bg-[#0a0a0a] border-white/10"
                                        align="start"
                                    >
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
                                    className="shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    onClick={handleExport}
                                >
                                    <Download size={16} className="sm:mr-2" />
                                    <span className="hidden sm:inline">Export</span>
                                </Button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={formatCurrency(summary.totalRevenue)}
                                    label="Total Revenue"
                                    trend="up"
                                    change="N/A"
                                />
                                <SummaryCard
                                    icon={<Package size={20} />}
                                    value={formatCurrency(summary.totalCOGS)}
                                    label="Total COGS"
                                    trend="down"
                                    change="N/A"
                                />
                                <SummaryCard
                                    icon={<TrendingUp size={20} />}
                                    value={formatCurrency(summary.totalGrossProfit)}
                                    label="Total Gross Profit"
                                    trend="up"
                                    change="N/A"
                                />
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={`${summary.avgProfitMargin.toFixed(1)}%`}
                                    label="Avg Profit Margin"
                                    trend="up"
                                    change="N/A"
                                />
                            </div>
                        )}

                        {/* Chart Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Pie Chart */}
                            <Card className="bg-[#0a0a0a] border-white/6 min-w-0">
                                <CardHeader className="px-4 sm:px-6">
                                    <CardTitle className="text-white text-base sm:text-lg">Profitability by Product</CardTitle>
                                    <CardDescription className="text-white/40 text-xs sm:text-sm">Gross profit share by product</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">Loading data...</div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-red-400">Error: {error}</div>
                                        </div>
                                    ) : productData.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No product data available for selected period</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                                            <ChartContainer
                                                config={chartConfig}
                                                className="mx-auto aspect-square h-52 w-52 sm:h-64 sm:w-64 shrink-0"
                                            >
                                                <PieChart>
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={<ChartTooltipContent hideLabel />}
                                                    />
                                                    <Pie
                                                        data={pieChartData}
                                                        dataKey="profit"
                                                        nameKey="name"
                                                        innerRadius={isMobile ? 40 : 50}
                                                        strokeWidth={isMobile ? 3 : 5}
                                                    >
                                                        {pieChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ChartContainer>
                                            <div className="w-full sm:flex-1 space-y-2.5 sm:space-y-3 min-w-0">
                                                {pieChartData.map((item) => (
                                                    <div key={item.name} className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div
                                                                className="w-3 h-3 shrink-0 rounded-full"
                                                                style={{ backgroundColor: item.fill }}
                                                            />
                                                            <span className="text-white/80 text-xs sm:text-sm truncate">{item.name}</span>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-white font-medium text-xs sm:text-sm">{item.percentage.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top & Bottom Performers */}
                            <Card className="bg-[#0a0a0a] border-white/6 min-w-0">
                                <CardHeader className="px-4 sm:px-6">
                                    <CardTitle className="text-white text-base sm:text-lg">Top & Bottom Performers</CardTitle>
                                    <CardDescription className="text-white/40 text-xs sm:text-sm">Best and worst margin percentages</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">Loading data...</div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-red-400">Error: {error}</div>
                                        </div>
                                    ) : productData.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No product data available for selected period</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5 sm:space-y-6">
                                            <div>
                                                <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                                    <Star size={16} className="fill-emerald-400" />
                                                    Most Profitable
                                                </h4>
                                                <div className="space-y-2">
                                                    {productDataWithStatus.slice(0, 3).map((product, index) => (
                                                        <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                                                            <span className="text-white/70 truncate min-w-0">{index + 1}. {product.name}</span>
                                                            <span className="text-emerald-400 font-medium shrink-0">{product.profitMargin.toFixed(1)}%</span>
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
                                                    {productDataWithStatus.slice(-3).reverse().map((product, index) => (
                                                        <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                                                            <span className="text-white/70 truncate min-w-0">{index + 1}. {product.name}</span>
                                                            <span className="text-red-400 font-medium shrink-0">{product.profitMargin.toFixed(1)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Insight */}
                        {summary && productDataWithStatus.length > 0 && (
                            <div className="bg-blue-500/10 border-blue-500/20 p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-blue-200">
                                    <strong className="text-blue-100">Insight:</strong> {productDataWithStatus[0]?.name} is the most profitable product with a {productDataWithStatus[0]?.profitMargin.toFixed(1)}% margin, while {productDataWithStatus[productDataWithStatus.length - 1]?.name} has the lowest margin at {productDataWithStatus[productDataWithStatus.length - 1]?.profitMargin.toFixed(1)}%.
                                </p>
                            </div>
                        )}

                        {/* Product Table */}
                        <Card className="bg-[#0a0a0a] border-white/6 min-w-0">
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle className="text-white text-base sm:text-lg">Product Profitability Details</CardTitle>
                                <CardDescription className="text-white/40 text-xs sm:text-sm">Detailed breakdown by product</CardDescription>
                            </CardHeader>
                            <CardContent className="px-2 sm:px-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">Loading data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-red-400">Error: {error}</div>
                                    </div>
                                ) : productData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No product data available for selected period</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px]">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Product</th>
                                                    <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">SKU</th>
                                                    <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Qty Sold</th>
                                                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Revenue</th>
                                                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">COGS</th>
                                                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Gross Profit</th>
                                                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Margin %</th>
                                                    <th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {productDataWithStatus.map((product) => (
                                                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-3 sm:p-4">
                                                            <div className="text-sm font-medium text-white">{product.name}</div>
                                                        </td>
                                                        <td className="p-3 sm:p-4">
                                                            <div className="text-sm text-white/70">{product.sku}</div>
                                                        </td>
                                                        <td className="p-3 sm:p-4">
                                                            <div className="text-sm text-white/70">{product.category}</div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right">
                                                            <div className="text-sm text-white/70">{product.totalQuantity}</div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right">
                                                            <div className="text-sm font-medium text-white">{formatCurrency(product.totalRevenue)}</div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right">
                                                            <div className="text-sm text-white/70">{formatCurrency(product.totalCOGS)}</div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right">
                                                            <div className={`text-sm font-medium ${product.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {formatCurrency(product.grossProfit)}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right">
                                                            <div className={`text-sm font-medium ${product.profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {product.profitMargin.toFixed(1)}%
                                                            </div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-center">
                                                            <StatusBadge status={product.status} />
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