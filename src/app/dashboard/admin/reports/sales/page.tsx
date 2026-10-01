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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    DollarSign,
    Percent,
    ShoppingCart,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { CartesianGrid, ComposedChart, Label, Line, Pie, PieChart, XAxis, YAxis, Cell } from "recharts"
import { type DateRange } from "react-day-picker"
import { format } from "date-fns"

type Trend = "up" | "down"

// Stat Card
function StatCard({
    icon,
    value,
    label,
    period,
    change,
    trend,
    iconColor
}: {
    icon: React.ReactNode
    value: string
    label: string
    period: string
    change: string
    trend: Trend
    iconColor?: string
}) {
    const isUp = trend === "up"
    
    return (
        <div className="bg-[#0a0a0a] rounded-2xl p-4 flex flex-col gap-3 border border-white/6">
            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor || 'bg-white/7 text-white/60'}`}>
                    {icon}
                </div>
                <span
                    className={`text-xs font-medium flex items-center gap-1 ${isUp ? "text-emerald-400" : "text-red-400"}`}
                >
                    {change}
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                </span>
            </div>
            
            <div>
                <p className="text-xl font-semibold text-white tracking-tight">
                    {value}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
                <p className="text-xs text-white/30">{period}</p>
            </div>
        </div>
    )
}



// Sales Over Time Chart
function SalesOverTimeChart({ dateRange }: { dateRange?: DateRange }) {
    const [salesData, setSalesData] = useState<Array<{ date: string; sales: number }>>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSalesData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('dateTo', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/sales-dashboard-chart?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setSalesData(data.dailySales || [])
                } else {
                    console.error('Failed to fetch sales chart data:', response.status)
                }
            } catch (error) {
                console.error('Error fetching sales chart data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSalesData()
    }, [dateRange])

    const salesConfig = {
        sales: {
            label: "Total Sales",
            color: "#10b981",
        },
    } satisfies ChartConfig

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <div>
                    <CardTitle className="text-white">Sales Over Time</CardTitle>
                    <CardDescription className="text-white/40">Daily total sales</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={salesConfig} className="h-75 w-full">
                    <ComposedChart accessibilityLayer data={salesData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        />
                        <YAxis 
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Line
                            dataKey="sales"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// Top Categories Component
function TopCategories({ dateRange }: { dateRange?: DateRange }) {
    const [categories, setCategories] = useState<Array<{ name: string; sales: number; percentage: number; color: string }>>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCategoriesData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('dateTo', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/top-categories?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setCategories(data.categories || [])
                } else {
                    console.error('Failed to fetch categories data:', response.status)
                }
            } catch (error) {
                console.error('Error fetching categories data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCategoriesData()
    }, [dateRange])

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Top Categories</CardTitle>
                <CardDescription className="text-white/40">Sales by category</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-white/50">
                        No data available
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map((category) => (
                            <div key={category.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-sm font-medium">{category.name}</span>
                                    <div className="text-right">
                                        <span className="text-white font-medium text-sm">${category.sales.toLocaleString()}</span>
                                        <span className="text-white/50 text-xs ml-2">({category.percentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div 
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: `${category.percentage}%`,
                                            backgroundColor: category.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Sales by Business Component
function SalesByBusiness({ dateRange }: { dateRange?: DateRange }) {
    const [businessData, setBusinessData] = useState<Array<{ business: string; sales: number; percentage: number; fill: string }>>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchBusinessData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('dateTo', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/sales-by-business?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setBusinessData(data.businessData || [])
                } else {
                    console.error('Failed to fetch business data:', response.status)
                }
            } catch (error) {
                console.error('Error fetching business data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBusinessData()
    }, [dateRange])

    const totalSales = businessData.reduce((sum, item) => sum + item.sales, 0)

    const businessConfig = {
        sales: {
            label: "Sales",
        },
        burnBox: { label: "Burn Box", color: "#f97316" },
        boxApparel: { label: "Box Apparel", color: "#10b981" },
    } satisfies ChartConfig

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Sales by Business</CardTitle>
                <CardDescription className="text-white/40">Total sales by business unit</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : businessData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-white/50">
                        No data available
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <ChartContainer config={businessConfig} className="h-48 w-48">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={businessData} 
                                    dataKey="sales"
                                    nameKey="business"
                                    innerRadius={50}
                                    strokeWidth={5}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-white text-2xl font-bold"
                                                        >
                                                            ${(totalSales / 1000).toFixed(1)}K
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="flex-1 space-y-4">
                            {businessData.map((item) => (
                                <div key={item.business} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: item.fill }}
                                            />
                                            <span className="text-white/80 text-sm font-medium">{item.business}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-white font-medium text-sm">${item.sales.toLocaleString()}</span>
                                            <span className="text-white/50 text-xs ml-2">({item.percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.fill
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Top Products Table Component
function TopProducts({ dateRange }: { dateRange?: DateRange }) {
    const [products, setProducts] = useState<Array<{ name: string; quantity: number; sales: number }>>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProductsData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('dateTo', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/top-products?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setProducts(data.products || [])
                } else {
                    console.error('Failed to fetch products data:', response.status)
                }
            } catch (error) {
                console.error('Error fetching products data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProductsData()
    }, [dateRange])

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Top Products</CardTitle>
                <CardDescription className="text-white/40">Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-white/50">
                        No data available
                    </div>
                ) : (
                    <div className="space-y-3">
                        {products.map((product, index) => (
                            <div key={product.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs font-medium">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{product.name}</p>
                                        <p className="text-white/50 text-xs">Qty: {product.quantity}</p>
                                    </div>
                                </div>
                                <span className="text-white font-medium text-sm">${product.sales.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Summary Financial Component
function Summary({ kpiData }: { kpiData: any }) {
    const summary = [
        { label: "Total Sales", value: `$${(kpiData?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: false },
        { label: "Total Discounts", value: `$${(kpiData?.discounts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: false },
        { label: "Net Sales", value: `$${((kpiData?.totalSales || 0) - (kpiData?.discounts || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
        { label: "Gross Profit", value: `$${((kpiData?.totalSales || 0) - (kpiData?.discounts || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
        { label: "Avg Transaction Value", value: `$${(kpiData?.avgSaleValue || 0).toFixed(2)}`, highlight: false },
    ]

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Summary</CardTitle>
                <CardDescription className="text-white/40">Financial overview</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {summary.map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-white/70 text-sm">{item.label}</span>
                            <span className={`text-sm font-medium ${item.highlight ? 'text-emerald-400' : 'text-white'}`}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
                <Button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white">
                    View Detailed Report
                </Button>
            </CardContent>
        </Card>
    )
}

export default function SalesDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [kpiData, setKpiData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Set default date range to current month
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({ from: firstDay, to: lastDay })
    }, [])

    // Fetch KPI data
    useEffect(() => {
        const fetchKpiData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('dateTo', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/sales-dashboard-kpis?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setKpiData(data)
                } else {
                    console.error('Failed to fetch KPI data:', response.status)
                }
            } catch (error) {
                console.error('Error fetching KPI data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchKpiData()
    }, [dateRange])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

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
                                        <BreadcrumbLink href="/dashboard/admin">Reports</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Sales Dashboard</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-5 px-4 sm:gap-6 sm:px-6 pt-5">
                        {/* Date Range Selector */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Sales Dashboard
                                </h1>
                                <p className="text-sm text-white/40">
                                    Overview of sales performance and metrics
                                </p>
                            </div>
                            <div className="text-sm text-white/60">
                                {dateRange?.from && dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                                    </>
                                ) : (
                                    "Select date range"
                                )}
                            </div>
                        </div>

                        {/* Top Row - 6 Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-[#0a0a0a] rounded-2xl p-4 flex flex-col gap-3 border border-white/6 animate-pulse">
                                        <div className="h-8 w-8 rounded-lg bg-white/7" />
                                        <div className="h-6 w-20 bg-white/5 rounded" />
                                        <div className="h-4 w-16 bg-white/5 rounded" />
                                    </div>
                                ))
                            ) : (
                                <>
                                    <StatCard
                                        icon={<DollarSign size={16} />}
                                        value={`$${(kpiData?.totalSales / 1000).toFixed(1)}K`}
                                        label="Total Sales"
                                        period="vs previous period"
                                        change={`${kpiData?.comparison?.salesChange >= 0 ? '+' : ''}${kpiData?.comparison?.salesChange?.toFixed(0) || 0}%`}
                                        trend={kpiData?.comparison?.salesChange >= 0 ? 'up' : 'down'}
                                        iconColor="bg-emerald-500/20 text-emerald-400"
                                    />
                                    <StatCard
                                        icon={<ShoppingCart size={16} />}
                                        value={kpiData?.quantitySold?.toLocaleString() || '0'}
                                        label="Quantity Sold"
                                        period="vs previous period"
                                        change={`${kpiData?.comparison?.quantityChange >= 0 ? '+' : ''}${kpiData?.comparison?.quantityChange?.toFixed(0) || 0}%`}
                                        trend={kpiData?.comparison?.quantityChange >= 0 ? 'up' : 'down'}
                                        iconColor="bg-blue-500/20 text-blue-400"
                                    />
                                    <StatCard
                                        icon={<Wallet size={16} />}
                                        value={`$${kpiData?.avgSaleValue?.toFixed(2) || '0.00'}`}
                                        label="Avg. Sale Value"
                                        period="vs previous period"
                                        change={`${kpiData?.comparison?.avgValueChange >= 0 ? '+' : ''}${kpiData?.comparison?.avgValueChange?.toFixed(0) || 0}%`}
                                        trend={kpiData?.comparison?.avgValueChange >= 0 ? 'up' : 'down'}
                                        iconColor="bg-purple-500/20 text-purple-400"
                                    />
                                    <StatCard
                                        icon={<Users size={16} />}
                                        value={kpiData?.totalTransactions?.toLocaleString() || '0'}
                                        label="Transactions"
                                        period="vs previous period"
                                        change={`${kpiData?.comparison?.transactionsChange >= 0 ? '+' : ''}${kpiData?.comparison?.transactionsChange?.toFixed(0) || 0}%`}
                                        trend={kpiData?.comparison?.transactionsChange >= 0 ? 'up' : 'down'}
                                        iconColor="bg-orange-500/20 text-orange-400"
                                    />
                                    <StatCard
                                        icon={<Target size={16} />}
                                        value={kpiData?.uniqueCustomers?.toLocaleString() || '0'}
                                        label="New Customers"
                                        period="vs previous period"
                                        change={`${kpiData?.comparison?.customersChange >= 0 ? '+' : ''}${kpiData?.comparison?.customersChange?.toFixed(0) || 0}%`}
                                        trend={kpiData?.comparison?.customersChange >= 0 ? 'up' : 'down'}
                                        iconColor="bg-green-500/20 text-green-400"
                                    />
                                    <StatCard
                                        icon={<Percent size={16} />}
                                        value={`$${kpiData?.discounts?.toFixed(2) || '0.00'}`}
                                        label="Discounts"
                                        period="vs previous period"
                                        change={`${kpiData?.comparison?.discountsChange >= 0 ? '+' : ''}${kpiData?.comparison?.discountsChange?.toFixed(0) || 0}%`}
                                        trend={kpiData?.comparison?.discountsChange >= 0 ? 'up' : 'down'}
                                        iconColor="bg-red-500/20 text-red-400"
                                    />
                                </>
                            )}
                        </div>

                        {/* Middle Row - 3 Large Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            {/* Sales Over Time */}
                            <div className="lg:col-span-4">
                                <SalesOverTimeChart dateRange={dateRange} />
                            </div>
                            
                            {/* Sales by Channel */}
                            <SalesByBusiness dateRange={dateRange} />
                        </div>

                        {/* Middle Row 2 - 2 Large Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Top Categories */}
                            <TopCategories dateRange={dateRange} />
                            
                            {/* Top Products */}
                            <TopProducts dateRange={dateRange} />
                            
                            {/* Summary */}
                            <Summary kpiData={kpiData} />
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}