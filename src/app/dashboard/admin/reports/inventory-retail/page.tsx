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
import { Input } from "@/components/ui/input"
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
    Search
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Line, LineChart } from "recharts"
import { Pie, PieChart, Cell } from "recharts"

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
        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400`}>
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

export default function InventoryRetailValueReport() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [searchTerm, setSearchTerm] = useState("")
    const [inventoryData, setInventoryData] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([])
    const [historicalData, setHistoricalData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch inventory retail value data
    useEffect(() => {
        const fetchInventoryRetailValue = async () => {
            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                if (searchTerm) params.append('search', searchTerm)

                const response = await fetch(`/api/reports/inventory-retail?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch inventory retail value data')

                const data = await response.json()
                setInventoryData(data.products || [])
                setSummary(data.summary || null)
                setCategoryBreakdown(data.categoryBreakdown || [])
                setHistoricalData(data.historicalData || [])
            } catch (err) {
                console.error('Error fetching inventory retail value:', err)
                setError(err instanceof Error ? err.message : 'Failed to load inventory retail value data')
                setInventoryData([])
                setSummary(null)
                setCategoryBreakdown([])
                setHistoricalData([])
            } finally {
                setLoading(false)
            }
        }

        fetchInventoryRetailValue()
    }, [searchTerm])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    const handleExport = () => {
        const csvContent = [
            ["Product Name", "SKU", "Category", "Qty in Stock", "Selling Price", "Total Retail Value", "Cost Value", "Margin %"],
            ...inventoryData.map(product => [
                product.name,
                product.sku,
                product.category,
                product.quantity,
                product.sellingPrice.toFixed(2),
                product.totalRetailValue.toFixed(2),
                product.totalCostValue.toFixed(2),
                product.margin.toFixed(1)
            ])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "inventory-retail-value.csv")
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
    const pieChartData = categoryBreakdown.slice(0, 5).map((category, index) => ({
        name: category.category,
        value: category.totalRetailValue,
        percentage: category.percentage,
        fill: ['#668e2b', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4'][index]
    }))

    // Prepare bar chart data (top 5 categories)
    const barChartData = categoryBreakdown.slice(0, 5).map(category => ({
        name: category.category,
        value: category.totalRetailValue
    }))

    const chartConfig = {
        value: {
            label: "Retail Value",
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
                                        <BreadcrumbPage>Inventory Retail Value</BreadcrumbPage>
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
                                    Inventory Retail Value
                                </h1>
                                <p className="text-sm text-white/40">
                                    Expected retail value of remaining apparel inventory (qty × selling price)
                                </p>
                            </div>
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

                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    icon={<Package size={20} />}
                                    value={summary.totalItems.toString()}
                                    label="Total Items in Stock"
                                    trend="up"
                                    change="+12%"
                                />
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={formatCurrencyK(summary.totalRetailValue)}
                                    label="Total Retail Value"
                                    trend="up"
                                    change="+18%"
                                />
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={formatCurrency(summary.avgSellingPrice)}
                                    label="Avg. Selling Price"
                                    trend="up"
                                    change="+7%"
                                />
                                <SummaryCard
                                    icon={<DollarSign size={20} />}
                                    value={formatCurrencyK(summary.totalCostValue)}
                                    label="Total Cost Value"
                                    trend="up"
                                    change="+10%"
                                />
                            </div>
                        )}

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Pie Chart */}
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardHeader>
                                    <CardTitle className="text-white">Retail Value by Category</CardTitle>
                                    <CardDescription className="text-white/40">Total: {summary && formatCurrencyK(summary.totalRetailValue)}</CardDescription>
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
                                    ) : categoryBreakdown.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No category data available</div>
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
                                                        dataKey="value"
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
                                                            <span className="text-white font-medium text-sm">{formatCurrency(item.value)}</span>
                                                            <span className="text-white/50 text-xs ml-2">({item.percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Line Chart */}
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardHeader>
                                    <CardTitle className="text-white">Retail Value Trend</CardTitle>
                                    <CardDescription className="text-white/40">Last 20 days</CardDescription>
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
                                    ) : historicalData.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No historical data available</div>
                                        </div>
                                    ) : (
                                        <ChartContainer config={chartConfig} className="h-64 w-full">
                                            <LineChart accessibilityLayer data={historicalData}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                />
                                                <YAxis 
                                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                                />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent />}
                                                />
                                                <Line
                                                    dataKey="value"
                                                    stroke="#668e2b"
                                                    strokeWidth={3}
                                                    dot={{ fill: "#668e2b", r: 4 }}
                                                />
                                            </LineChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Bar Chart */}
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardHeader>
                                    <CardTitle className="text-white">Top 5 Categories by Retail Value</CardTitle>
                                    <CardDescription className="text-white/40">Highest value categories</CardDescription>
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
                                    ) : categoryBreakdown.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-white/50">No category data available</div>
                                        </div>
                                    ) : (
                                        <ChartContainer config={chartConfig} className="h-64 w-full">
                                            <BarChart accessibilityLayer data={barChartData}>
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
                                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                                />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent />}
                                                />
                                                <Bar 
                                                    dataKey="value" 
                                                    fill="#668e2b" 
                                                    radius={4}
                                                />
                                            </BarChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white">Inventory Retail Value Details</CardTitle>
                                <CardDescription className="text-white/40">Detailed breakdown by product</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                        <Input
                                            placeholder="Search product..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-12 h-10 bg-white/5 border-white/10 rounded-xl text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">Loading data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-red-400">Error: {error}</div>
                                    </div>
                                ) : inventoryData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No inventory data available</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Product Name</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Qty in Stock</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Selling Price</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Total Retail Value</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Cost Value</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Margin</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryData.map((product) => (
                                                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium text-white">{product.name}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{product.category}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white">{product.quantity}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{formatCurrency(product.sellingPrice)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm font-medium text-white">{formatCurrency(product.totalRetailValue)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{formatCurrency(product.totalCostValue)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className={`text-sm font-medium ${product.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
