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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarRange } from "@/components/calendar-range"
import {
    DollarSign,
    Package,
    TrendingDown,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Box,
    Scale,
    Calendar as CalendarIcon,
    RefreshCw,
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { CartesianGrid, ComposedChart, Label, Line, Pie, PieChart, XAxis, YAxis, Bar, Cell } from "recharts"
import { type DateRange } from "react-day-picker"
import { format } from "date-fns"

type Trend = "up" | "down"

interface COGSData {
    totalCOGS: number
    totalRevenue: number
    grossProfit: number
    grossMargin: number
    burnboxCOGS: number
    apparelCOGS: number
    categoryBreakdown: Array<{
        category: string
        cogs: number
        revenue: number
        percentage: number
    }>
    dailyCOGS: Array<{
        date: string
        cogs: number
        revenue: number
    }>
    burnboxBreakdown: Array<{
        name: string
        cogs: number
        revenue: number
        quantity: number
    }>
    apparelBreakdown: Array<{
        name: string
        cogs: number
        revenue: number
        quantity: number
    }>
    comparison: {
        previousCOGS: number
        change: number
        trend: "up" | "down"
    } | null
    period: {
        from: string | null
        to: string | null
    }
}

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

// COGS Over Time Chart
function COGSOverTimeChart({ data }: { data: Array<{ date: string; cogs: number; revenue: number }> }) {
    const cogsConfig = {
        cogs: {
            label: "COGS",
            color: "#f97316",
        },
        revenue: {
            label: "Revenue",
            color: "#10b981",
        },
    } satisfies ChartConfig

    return (
        <Card className="bg-[#0a0a0a] border-white/6 col-span-3">
            <CardHeader>
                <CardTitle className="text-white">COGS Over Time</CardTitle>
                <CardDescription className="text-white/40">Daily cost of goods sold vs revenue</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={cogsConfig} className="h-75 w-full">
                    <ComposedChart accessibilityLayer data={data}>
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
                        <Bar
                            dataKey="cogs"
                            fill="rgba(249, 115, 22, 0.3)"
                            radius={2}
                        />
                        <Line
                            dataKey="cogs"
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={{ fill: "#f97316", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// COGS by Category Chart
function COGSByCategory({ data }: { data: Array<{ category: string; cogs: number; percentage: number }> }) {
    const totalCOGS = data.reduce((sum, item) => sum + item.cogs, 0)

    const categoryConfig = {
        cogs: {
            label: "COGS",
        },
    } satisfies ChartConfig

    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f97316"]

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">COGS by Category</CardTitle>
                <CardDescription className="text-white/40">Cost breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center flex-col gap-6">
                    <ChartContainer config={categoryConfig} className="h-48 w-48">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={data}
                                dataKey="cogs"
                                nameKey="category"
                                innerRadius={50}
                                strokeWidth={5}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
                                                        y={(viewBox.cy || 0) - 24}
                                                        className="fill-foreground text-base font-bold"
                                                    >
                                                        ${totalCOGS.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) - 6}
                                                        className="fill-muted-foreground text-xs"
                                                    >
                                                        Total COGS
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                        return null
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                    <div className="flex-1 space-y-2">
                        {data.map((item, index) => (
                            <div key={item.category} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span className="text-sm text-white/70">{item.category}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-white">${item.cogs.toLocaleString()}</span>
                                    <span className="text-xs text-white/40 ml-2">({item.percentage.toFixed(1)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function COGSReportPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [cogsData, setCOGSData] = useState<COGSData | null>(null)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Set default date range to today
    useEffect(() => {
        const today = new Date()
        const startOfDay = new Date(today)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)
        setDateRange({ from: startOfDay, to: endOfDay })
    }, [])

    // Fetch COGS data
    const fetchCOGSData = async () => {
        if (!dateRange?.from || !dateRange?.to) return

        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
            params.append('dateTo', format(dateRange.to, 'yyyy-MM-dd'))

            const response = await fetch(`/api/reports/cogs?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                setCOGSData(data)
            } else {
                console.error('Failed to fetch COGS data:', response.status)
            }
        } catch (error) {
            console.error('Error fetching COGS data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch data when date range changes
    useEffect(() => {
        fetchCOGSData()
    }, [dateRange])

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    if (status === 'loading') {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const formatPercentage = (value: number) => `${value.toFixed(1)}%`

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
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/dashboard/admin/reports">Reports</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>COGS Report</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-6 p-6">
                        {/* Page Header */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Cost of Goods Sold (COGS)</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Total cost of inventory sold in a period, broken down by product or category
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarRange 
                                            dateRange={dateRange}
                                            setDateRange={setDateRange}
                                            onApply={() => setIsCalendarOpen(false)}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={fetchCOGSData}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-white/50">Loading COGS data...</div>
                            </div>
                        ) : cogsData ? (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <StatCard
                                        icon={<Package />}
                                        value={formatCurrency(cogsData.totalCOGS)}
                                        label="Total COGS"
                                        period="Selected period"
                                        change={cogsData.comparison ? formatPercentage(cogsData.comparison.change) : 'N/A'}
                                        trend={cogsData.comparison?.trend || 'up'}
                                        iconColor="bg-orange-500/20 text-orange-400"
                                    />
                                    <StatCard
                                        icon={<DollarSign />}
                                        value={formatCurrency(cogsData.totalRevenue)}
                                        label="Total Revenue"
                                        period="Selected period"
                                        change="N/A"
                                        trend="up"
                                        iconColor="bg-emerald-500/20 text-emerald-400"
                                    />
                                    <StatCard
                                        icon={<TrendingUp />}
                                        value={formatCurrency(cogsData.grossProfit)}
                                        label="Gross Profit"
                                        period="Selected period"
                                        change="N/A"
                                        trend="up"
                                        iconColor="bg-blue-500/20 text-blue-400"
                                    />
                                    <StatCard
                                        icon={<Scale />}
                                        value={formatPercentage(cogsData.grossMargin)}
                                        label="Gross Margin"
                                        period="Selected period"
                                        change="N/A"
                                        trend="up"
                                        iconColor="bg-purple-500/20 text-purple-400"
                                    />
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                    <COGSOverTimeChart data={cogsData.dailyCOGS} />
                                    <COGSByCategory data={cogsData.categoryBreakdown} />
                                </div>

                                {/* Detailed Breakdown */}
                                <Card className="bg-[#0a0a0a] border-white/6">
                                    <CardHeader>
                                        <CardTitle className="text-white">COGS Breakdown</CardTitle>
                                        <CardDescription className="text-white/40">Detailed breakdown by product</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 space-y-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-white mb-3">BurnBox Recipes</h3>
                                                <div className="space-y-2">
                                                    {cogsData.burnboxBreakdown.map((item) => (
                                                        <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{item.name}</p>
                                                                <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-white">{formatCurrency(item.cogs)}</p>
                                                                <p className="text-xs text-white/40">Revenue: {formatCurrency(item.revenue)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-white mb-3">Apparel Products</h3>
                                                <div className="space-y-2">
                                                    {cogsData.apparelBreakdown.map((item) => (
                                                        <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{item.name}</p>
                                                                <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-white">{formatCurrency(item.cogs)}</p>
                                                                <p className="text-xs text-white/40">Revenue: {formatCurrency(item.revenue)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-white/50">Select a date range to view COGS data</div>
                            </div>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}