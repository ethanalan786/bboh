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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    Package,
    DollarSign,
    AlertTriangle,
    Clock,
    XCircle,
    Search,
    Filter,
    Download,
    MoreVertical,
    Plus,
    Edit,
    Trash2,
    BarChart3,
    TrendingUp
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { CartesianGrid, ComposedChart, Label, LabelList, Line, Pie, PieChart, XAxis, YAxis, Bar, BarChart, Cell } from "recharts"

// Summary Card Component
function SummaryCard({
    icon,
    value,
    label,
    iconColor
}: {
    icon: React.ReactNode
    value: string
    label: string
    iconColor?: string
}) {
    return (
        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor || 'bg-white/7 text-white/60'}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white tracking-tight">
                        {value}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{label}</p>
                </div>
            </div>
        </div>
    )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        "In Stock": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        "Low Stock": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        "Out of Stock": "bg-red-500/20 text-red-400 border border-red-500/30",
        "Expiring Soon": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    }

    const defaultStyle = "bg-white/10 text-white/70 border border-white/20"

    return (
        <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusStyles[status] || defaultStyle}`}>
            {status}
        </span>
    )
}

// Stock by Category Chart
function StockByCategoryChart({ inventoryData }: { inventoryData: any[] }) {
    // Predefined color palette
    const colorPalette = [
        "#668e2b",
        "#3b82f6",
        "#8b5cf6",
        "#f97316",
        "#ec4899",
        "#06b6d4",
        "#14b8a6",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6"
    ]

    // Calculate category distribution from real data
    const categoryCount = inventoryData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const totalItems = inventoryData.length
    const categoryData = Object.entries(categoryCount)
        .map(([category, count], index) => ({
            category,
            count: count as number,
            percentage: totalItems > 0 ? Math.round(((count as number) / totalItems) * 100) : 0,
            fill: colorPalette[index % colorPalette.length]
        }))
        .sort((a, b) => (b.count as number) - (a.count as number)) // Sort by count descending
        .slice(0, 4) // Take only top 4 categories

    const topCategoriesTotal = categoryData.reduce((sum, cat) => sum + (cat.count as number), 0)

    // Create dynamic chart config based on actual categories
    const categoryConfig: any = {
        count: {
            label: "Items",
        }
    }
    
    // Add dynamic color configuration for each category
    categoryData.forEach((cat, index) => {
        const key = `category${index}`
        categoryConfig[key] = {
            label: cat.category,
            color: cat.fill
        }
    })
    
    // Map category data to use config keys
    const chartData = categoryData.map((cat, index) => ({
        ...cat,
        configKey: `category${index}`
    }))

    const chartConfig = {
        count: {
            label: "Items",
        },
        ...Object.fromEntries(
            chartData.map((cat, index) => [
                `category${index}`,
                { label: cat.category, color: cat.fill }
            ])
        )
    } satisfies ChartConfig

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Stock by Category</CardTitle>
                <CardDescription className="text-white/40">Top 4 categories by item count</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <ChartContainer config={chartConfig} className="h-48 w-48">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="category"
                                innerRadius={50}
                                strokeWidth={5}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
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
                                                        {topCategoriesTotal}
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                    <div className="flex-1 space-y-3">
                        {chartData.map((item) => (
                            <div key={item.category} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: item.fill }}
                                    />
                                    <span className="text-white/80 text-sm">{item.category}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-white font-medium text-sm">{item.count as number}</span>
                                    <span className="text-white/50 text-xs ml-2">({item.percentage as number}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Stock Status Chart
function StockStatusChart({ inventoryData }: { inventoryData: any[] }) {
    // Calculate status distribution from real data
    const statusCount = inventoryData.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const totalItems = inventoryData.length
    const statusData = [
        { status: "In Stock", count: statusCount["In Stock"] || 0, percentage: totalItems > 0 ? Math.round(((statusCount["In Stock"] || 0) / totalItems) * 100) : 0, fill: "#668e2b" },
        { status: "Low Stock", count: statusCount["Low Stock"] || 0, percentage: totalItems > 0 ? Math.round(((statusCount["Low Stock"] || 0) / totalItems) * 100) : 0, fill: "#f97316" },
        { status: "Out of Stock", count: statusCount["Out of Stock"] || 0, percentage: totalItems > 0 ? Math.round(((statusCount["Out of Stock"] || 0) / totalItems) * 100) : 0, fill: "#ef4444" },
    ]

    const statusConfig = {
        count: {
            label: "Items",
            color: "#668e2b",
        },
        inStock: { label: "In Stock", color: "#668e2b" },
        lowStock: { label: "Low Stock", color: "#f97316" },
        outOfStock: { label: "Out of Stock", color: "#ef4444" },
    } satisfies ChartConfig

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Stock Status</CardTitle>
                <CardDescription className="text-white/40">Current inventory status</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={statusConfig} className="h-48 w-full">
                    <BarChart
                        accessibilityLayer
                        data={statusData}
                        margin={{
                            top: 20,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="status"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar 
                            dataKey="count" 
                            fill="var(--color-count)" 
                            radius={8}
                        >
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-white"
                                fontSize={12}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// Inventory Value Trend Chart
function InventoryValueTrendChart({ historicalData }: { historicalData: any[] }) {
    const trendData = historicalData.length > 0 ? historicalData : [
        { date: "No Data", value: 0 }
    ]

    const trendConfig = {
        value: {
            label: "Value",
            color: "#668e2b",
        },
    } satisfies ChartConfig

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Inventory Value Trend</CardTitle>
                <CardDescription className="text-white/40">Value over last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={trendConfig} className="h-48 w-full">
                    <ComposedChart accessibilityLayer data={trendData}>
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
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default function InventoryOnHandDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [businessFilter, setBusinessFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [priceRange, setPriceRange] = useState({ min: "", max: "" })
    const [stockRange, setStockRange] = useState({ min: "", max: "" })
    const [unitFilter, setUnitFilter] = useState("all")
    const [inventoryData, setInventoryData] = useState<any[]>([])
    const [historicalData, setHistoricalData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const itemsPerPage = 10

    // Calculate stats from real data
    const totalIngredients = inventoryData.length
    const totalValue = inventoryData.reduce((sum, item) => sum + item.totalValue, 0)
    const lowStockCount = inventoryData.filter(item => item.status === "Low Stock").length
    const expiringSoonCount = inventoryData.filter(item => item.status === "Expiring Soon").length
    const outOfStockCount = inventoryData.filter(item => item.status === "Out of Stock").length

    // Get unique units from inventory data
    const units = Array.from(new Set(inventoryData.map(item => item.unit)))
    
    // Get unique categories from inventory data
    const categories = Array.from(new Set(inventoryData.map(item => item.category)))
    
    // Get unique businesses from inventory data
    const businesses = Array.from(new Set(inventoryData.map(item => item.business)))

    // Pagination logic - only calculate when data is available
    const totalPages = inventoryData.length > 0 ? Math.ceil(inventoryData.length / itemsPerPage) : 0
    const paginatedData = inventoryData.length > 0 ? inventoryData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) : []

    // Ensure currentPage is within valid range
    const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages))

    // Fetch inventory data from API
    useEffect(() => {
        const fetchInventoryData = async () => {
            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                if (searchTerm) params.append('search', searchTerm)
                if (categoryFilter !== 'all') params.append('category', categoryFilter)
                if (statusFilter !== 'all') params.append('status', statusFilter)
                if (businessFilter !== 'all') params.append('business', businessFilter)
                if (unitFilter !== 'all') params.append('unit', unitFilter)
                if (priceRange.min) params.append('priceMin', priceRange.min)
                if (priceRange.max) params.append('priceMax', priceRange.max)
                if (stockRange.min) params.append('stockMin', stockRange.min)
                if (stockRange.max) params.append('stockMax', stockRange.max)

                const response = await fetch(`/api/reports/inventory-on-hand?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch inventory data')
                
                const data = await response.json()
                setInventoryData(data.inventory || [])
                setHistoricalData(data.historicalData || [])
            } catch (err) {
                console.error('Error fetching inventory:', err)
                setError(err instanceof Error ? err.message : 'Failed to load inventory data')
                setInventoryData([])
            } finally {
                setLoading(false)
            }
        }

        fetchInventoryData()
    }, [searchTerm, categoryFilter, statusFilter, businessFilter, unitFilter, priceRange, stockRange])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, categoryFilter, statusFilter, businessFilter, unitFilter, priceRange, stockRange])



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
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard/admin/reports">Reports</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Inventory On Hand</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-5 px-4 sm:gap-6 sm:px-6 pt-5">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Inventory On Hand
                                </h1>
                                <p className="text-sm text-white/40">
                                    Current stock levels for all products and ingredients
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    onClick={() => {
                                        // Export functionality
                                        const csvContent = [
                                            ["Item", "SKU", "Category", "Business", "Unit", "Current Stock", "Min Stock", "Cost/Unit", "Total Value", "Status"],
                                            ...inventoryData.map(item => [
                                                item.name,
                                                item.sku,
                                                item.category,
                                                item.business,
                                                item.unit,
                                                item.currentStock,
                                                item.minStock,
                                                item.costPerUnit,
                                                item.totalValue,
                                                item.status
                                            ])
                                        ].map(row => row.join(",")).join("\n")

                                        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                                        const link = document.createElement("a")
                                        const url = URL.createObjectURL(blob)
                                        link.setAttribute("href", url)
                                        link.setAttribute("download", "inventory-on-hand.csv")
                                        link.style.visibility = "hidden"
                                        document.body.appendChild(link)
                                        link.click()
                                        document.body.removeChild(link)
                                    }}
                                >
                                    <Download size={16} className="mr-2" />
                                    Export
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                    onClick={() => router.push("/dashboard/admin/box-apparel/products")}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Item
                                </Button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <SummaryCard
                                icon={<Package size={20} />}
                                value={loading ? "..." : totalIngredients.toString()}
                                label="Total Items"
                                iconColor="bg-blue-500/20 text-blue-400"
                            />
                            <SummaryCard
                                icon={<DollarSign size={20} />}
                                value={loading ? "..." : `$${totalValue.toFixed(2)}`}
                                label="Total Value"
                                iconColor="bg-emerald-500/20 text-emerald-400"
                            />
                            <SummaryCard
                                icon={<AlertTriangle size={20} />}
                                value={loading ? "..." : lowStockCount.toString()}
                                label="Low Stock"
                                iconColor="bg-orange-500/20 text-orange-400"
                            />
                            <SummaryCard
                                icon={<Clock size={20} />}
                                value={loading ? "..." : expiringSoonCount.toString()}
                                label="Expiring Soon"
                                iconColor="bg-yellow-500/20 text-yellow-400"
                            />
                            <SummaryCard
                                icon={<XCircle size={20} />}
                                value={loading ? "..." : outOfStockCount.toString()}
                                label="Out of Stock"
                                iconColor="bg-red-500/20 text-red-400"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <StockByCategoryChart inventoryData={inventoryData} />
                            <StockStatusChart inventoryData={inventoryData} />
                            <InventoryValueTrendChart historicalData={historicalData} />
                        </div>

                        {/* Filters */}
                        <div className="space-y-4">
                            {/* Basic Filters */}
                            <div className="flex flex-col lg:flex-row gap-4 items-start">
                                {/* Search Bar */}
                                <div className="relative flex-1 w-full lg:w-auto">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                    <Input
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                    />
                                </div>
                                
                                {/* Basic Filter Dropdowns */}
                                <div className="flex flex-row justify-center gap-2 w-full lg:w-auto">
                                    <Select className="w-fit min-w-52" value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="h-12 px-4 bg-white/5 border-white/10 rounded-xl text-white hover:bg-white/10 focus:ring-1 focus:ring-emerald-500/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl">
                                            <SelectItem value="all" className="text-white focus:bg-white/10 rounded-lg">All Categories</SelectItem>
                                            {categories.length > 0 ? categories.map(category => (
                                                <SelectItem key={category} value={category} className="text-white focus:bg-white/10 rounded-lg">
                                                    {category}
                                                </SelectItem>
                                            )) : (
                                                <SelectItem value="all" disabled className="text-white/50">
                                                    No categories available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select className="w-fit min-w-40"  value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="h-12 px-4 bg-white/5 border-white/10 rounded-xl text-white hover:bg-white/10 focus:ring-1 focus:ring-emerald-500/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl">
                                            <SelectItem value="all" className="text-white focus:bg-white/10 rounded-lg">All Status</SelectItem>
                                            <SelectItem value="In Stock" className="text-white focus:bg-white/10 rounded-lg">In Stock</SelectItem>
                                            <SelectItem value="Low Stock" className="text-white focus:bg-white/10 rounded-lg">Low Stock</SelectItem>
                                            <SelectItem value="Out of Stock" className="text-white focus:bg-white/10 rounded-lg">Out of Stock</SelectItem>
                                            <SelectItem value="Expiring Soon" className="text-white focus:bg-white/10 rounded-lg">Expiring Soon</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={businessFilter} onValueChange={setBusinessFilter}>
                                        <SelectTrigger className="h-12 px-4 bg-white/5 border-white/10 rounded-xl text-white hover:bg-white/10 focus:ring-1 focus:ring-emerald-500/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl">
                                            <SelectItem value="all" className="text-white focus:bg-white/10 rounded-lg">All Businesses</SelectItem>
                                            {businesses.length > 0 ? businesses.map(business => (
                                                <SelectItem key={business} value={business} className="text-white focus:bg-white/10 rounded-lg">
                                                    {business}
                                                </SelectItem>
                                            )) : (
                                                <SelectItem value="all" disabled className="text-white/50">
                                                    No businesses available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-12 px-4 bg-white/5 border-white/10 rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    >
                                        <Filter size={16} className="mr-2" />
                                        {showAdvancedFilters ? "Less" : "More"}
                                    </Button>
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            {showAdvancedFilters && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Unit Filter */}
                                        <div className="space-y-2">
                                            <label className="text-xs text-white/50 uppercase tracking-wider">Unit</label>
                                            <Select value={unitFilter} onValueChange={setUnitFilter}>
                                                <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-lg text-white hover:bg-white/10 focus:ring-1 focus:ring-emerald-500/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-lg">
                                                    <SelectItem value="all" className="text-white focus:bg-white/10">All Units</SelectItem>
                                                    {units.length > 0 ? units.map(unit => (
                                                        <SelectItem key={unit} value={unit} className="text-white focus:bg-white/10">
                                                            {unit}
                                                        </SelectItem>
                                                    )) : (
                                                        <SelectItem value="all" disabled className="text-white/50">
                                                            No units available
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Price Range */}
                                        <div className="space-y-2">
                                            <label className="text-xs text-white/50 uppercase tracking-wider">Cost Range ($)</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Min"
                                                    value={priceRange.min}
                                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                                    className="h-10 bg-white/5 border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                                />
                                                <Input
                                                    placeholder="Max"
                                                    value={priceRange.max}
                                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                                    className="h-10 bg-white/5 border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                                />
                                            </div>
                                        </div>

                                        {/* Stock Range */}
                                        <div className="space-y-2">
                                            <label className="text-xs text-white/50 uppercase tracking-wider">Stock Range</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Min"
                                                    value={stockRange.min}
                                                    onChange={(e) => setStockRange({ ...stockRange, min: e.target.value })}
                                                    className="h-10 bg-white/5 border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                                />
                                                <Input
                                                    placeholder="Max"
                                                    value={stockRange.max}
                                                    onChange={(e) => setStockRange({ ...stockRange, max: e.target.value })}
                                                    className="h-10 bg-white/5 border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                                />
                                            </div>
                                        </div>

                                        {/* Clear Filters */}
                                        <div className="space-y-2">
                                            <label className="text-xs text-white/50 uppercase tracking-wider">Actions</label>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full h-10 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                onClick={() => {
                                                    setSearchTerm("")
                                                    setCategoryFilter("all")
                                                    setStatusFilter("all")
                                                    setBusinessFilter("all")
                                                    setUnitFilter("all")
                                                    setPriceRange({ min: "", max: "" })
                                                    setStockRange({ min: "", max: "" })
                                                }}
                                            >
                                                Clear All Filters
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Inventory Table */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">Loading inventory data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-red-400">Error: {error}</div>
                                    </div>
                                ) : inventoryData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No inventory items found</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Image</th>
                                                <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Item</th>
                                                <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">SKU</th>
                                                <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Business</th>
                                                <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Unit</th>
                                                <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Current Stock</th>
                                                <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Min Stock</th>
                                                <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Cost/Unit</th>
                                                <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Total Value</th>
                                                <th className="text-center p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.map((item) => (
                                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        {item.image ? (
                                                            <img 
                                                                src={item.image} 
                                                                alt={item.name}
                                                                className="w-12 h-12 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                                                                <Package size={20} className="text-white/30" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-medium text-white">{item.name}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm text-white/70">{item.sku}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm text-white/70">{item.category}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm text-white/70">{item.business}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm text-white/70">{item.unit}</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="text-sm font-medium text-white">{item.currentStock.toFixed(1)}</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="text-sm text-white/70">{item.minStock}</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="text-sm text-white/70">${item.costPerUnit.toFixed(2)}</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="text-sm font-medium text-white">${item.totalValue.toFixed(2)}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <StatusBadge status={item.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                    )}
                            </CardContent>
                            {totalPages > 1 && !loading && !error && inventoryData.length > 0 && (
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-white/50">
                                            Showing {inventoryData.length > 0 ? ((safeCurrentPage - 1) * itemsPerPage) + 1 : 0} to {inventoryData.length > 0 ? Math.min(safeCurrentPage * itemsPerPage, inventoryData.length) : 0} of {inventoryData.length} items
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={safeCurrentPage === 1}
                                                className="group relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'rgba(255,255,255,0.7)',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)'
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                                                }}
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Previous
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-medium transition-all duration-200 rounded-lg hover:scale-110 active:scale-95"
                                                        style={safeCurrentPage === page ? {
                                                            background: 'linear-gradient(135deg, rgba(102, 142, 43, 0.3) 0%, rgba(102, 142, 43, 0.15) 100%)',
                                                            border: '1px solid rgba(102, 142, 43, 0.4)',
                                                            color: '#668e2b',
                                                            boxShadow: '0 0 20px rgba(102, 142, 43, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        } : {
                                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: 'rgba(255,255,255,0.6)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (safeCurrentPage !== page) {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)'
                                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                                                                e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (safeCurrentPage !== page) {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                                                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                                                            }
                                                        }}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={safeCurrentPage === totalPages}
                                                className="group relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'rgba(255,255,255,0.7)',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)'
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                                                }}
                                            >
                                                Next
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
