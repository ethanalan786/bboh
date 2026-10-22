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
    PieChart as PieChartIcon,
    TrendingDown,
    TrendingUp,
    Scale,
    Calendar as CalendarIcon,
    RefreshCw,
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from "react"
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
        <div className="bg-[#0a0a0a] rounded-2xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 border border-white/6">
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
                <p className="text-lg sm:text-xl font-semibold text-white tracking-tight">
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
        <Card className="bg-[#0a0a0a] border-white/6 col-span-1 xl:col-span-2">
            <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">COGS Over Time</CardTitle>
                <CardDescription className="text-white/40 text-xs sm:text-sm">Daily cost of goods sold vs revenue</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={cogsConfig} className="h-64 sm:h-80 w-full">
                    <ComposedChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            }}
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
                            strokeWidth={2}
                            dot={{ fill: "#f97316", r: 3 }}
                            activeDot={{ r: 5 }}
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

// ─────────────────────────────────────────────
// COGS by Category (responsive donut + legend)
//
//  < md      : donut on top, legend below (stacked)
//  md → xl   : donut left, legend right (card is full width here)
//  xl+       : back to stacked, because the card is a 1/3 column
// ─────────────────────────────────────────────

const CATEGORY_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#ec4899", "#eab308"]

const money = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Short form for the donut centre so big numbers never overflow the hole
const moneyShort = (value: number) =>
    value >= 10000
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value)
        : `$${Math.round(value).toLocaleString()}`

function COGSByCategory({ data }: { data: Array<{ category: string; cogs: number; percentage: number }> }) {
    const items = useMemo(
        () =>
            [...(data || [])]
                .filter((d) => d.cogs > 0)
                .sort((a, b) => b.cogs - a.cogs)
                .map((d, i) => ({ ...d, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })),
        [data]
    )

    const totalCOGS = useMemo(() => items.reduce((sum, item) => sum + item.cogs, 0), [items])

    const categoryConfig = {
        cogs: {
            label: "COGS",
        },
    } satisfies ChartConfig

    return (
        <Card className="bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-white/6 col-span-1 xl:col-span-1">
            <CardHeader>
                <CardTitle className="text-neutral-900 dark:text-white text-lg sm:text-xl">COGS by Category</CardTitle>
                <CardDescription className="text-neutral-500 dark:text-white/40 text-xs sm:text-sm">
                    Cost breakdown by category
                </CardDescription>
            </CardHeader>

            <CardContent>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                            <PieChartIcon size={20} className="text-neutral-400 dark:text-white/30" />
                        </div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-white/70">No category data</p>
                        <p className="text-xs text-neutral-500 dark:text-white/40">
                            No cost of goods recorded for this period.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8 xl:flex-col xl:items-stretch xl:gap-6">
                        {/* Donut */}
                        <div className="w-full max-w-[220px] sm:max-w-[240px] mx-auto md:mx-0 md:w-56 md:shrink-0 xl:mx-auto xl:w-full">
                            <ChartContainer config={categoryConfig} className="mx-auto aspect-square w-full">
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel nameKey="category" />}
                                    />
                                    <Pie
                                        data={items}
                                        dataKey="cogs"
                                        nameKey="category"
                                        innerRadius="64%"
                                        outerRadius="100%"
                                        paddingAngle={items.length > 1 ? 3 : 0}
                                        cornerRadius={4}
                                        stroke="transparent"
                                    >
                                        {items.map((entry) => (
                                            <Cell key={entry.category} fill={entry.color} />
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
                                                                y={(viewBox.cy || 0) - 6}
                                                                className="fill-foreground text-lg sm:text-xl font-bold"
                                                            >
                                                                {moneyShort(totalCOGS)}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) + 14}
                                                                className="fill-muted-foreground text-[10px] sm:text-xs"
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
                        </div>

                        {/* Legend with share bars */}
                        <ul className="flex-1 w-full min-w-0 space-y-3">
                            {items.map((item) => {
                                const pct = Math.max(0, Math.min(100, item.percentage ?? 0))
                                return (
                                    <li key={item.category} className="min-w-0">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-white/80 truncate">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-2 shrink-0">
                                                <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white tabular-nums">
                                                    {money(item.cogs)}
                                                </span>
                                                <span className="text-[11px] text-neutral-500 dark:text-white/40 tabular-nums w-11 text-right">
                                                    {pct.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
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

                    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6">
                        {/* Page Header */}
                        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Cost of Goods Sold (COGS)</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    Total cost of inventory sold in a period, broken down by product or category
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger>
                                        <Button variant="outline" className="w-full sm:w-auto justify-start text-xs sm:text-sm">
                                            <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
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

                                {/* Charts: stacked below xl, 2/3 + 1/3 at xl */}
                                <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
                                    <COGSOverTimeChart data={cogsData.dailyCOGS} />
                                    <COGSByCategory data={cogsData.categoryBreakdown} />
                                </div>

                                {/* Detailed Breakdown */}
                                <Card className="bg-[#0a0a0a] border-white/6">
                                    <CardHeader>
                                        <CardTitle className="text-white text-lg sm:text-xl">COGS Breakdown</CardTitle>
                                        <CardDescription className="text-white/40 text-xs sm:text-sm">Detailed breakdown by product</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                            <div>
                                                <h3 className="text-sm font-semibold text-white mb-3">BurnBox Recipes</h3>
                                                <div className="space-y-2">
                                                    {cogsData.burnboxBreakdown.map((item) => (
                                                        <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm font-medium text-white truncate">{item.name}</p>
                                                                <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                                                            </div>
                                                            <div className="text-right ml-3 shrink-0">
                                                                <p className="text-xs sm:text-sm font-medium text-white">{formatCurrency(item.cogs)}</p>
                                                                <p className="text-xs text-white/40">Rev: {formatCurrency(item.revenue)}</p>
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
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm font-medium text-white truncate">{item.name}</p>
                                                                <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                                                            </div>
                                                            <div className="text-right ml-3 shrink-0">
                                                                <p className="text-xs sm:text-sm font-medium text-white">{formatCurrency(item.cogs)}</p>
                                                                <p className="text-xs text-white/40">Rev: {formatCurrency(item.revenue)}</p>
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