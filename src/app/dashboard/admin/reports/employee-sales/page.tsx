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
import { CalendarRange } from "@/components/calendar-range"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
    Users,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Calendar as CalendarIcon,
    Download
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { type DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
            <div className="flex items-center justify-center flex-col text-center h-full gap-5">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor || 'bg-white/7 text-white/60'}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {value}
                    </p>
                    <p className="text-md text-white/40 mt-0.5">{label}</p>
                </div>
            </div>
        </div>
    )
}

export default function EmployeeSalesReport() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [employeeSales, setEmployeeSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Calculate stats from data
    const totalEmployees = employeeSales.length
    const totalRevenue = employeeSales.reduce((sum, emp) => sum + emp.totalRevenue, 0)
    const totalQuantity = employeeSales.reduce((sum, emp) => sum + emp.totalQuantity, 0)
    const avgRevenuePerEmployee = totalEmployees > 0 ? totalRevenue / totalEmployees : 0

    // Set default date range
    useEffect(() => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateRange({ from: thirtyDaysAgo, to: now })
    }, [])

    // Fetch employee sales data
    useEffect(() => {
        const fetchEmployeeSales = async () => {
            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                if (dateRange?.from) params.append('startDate', dateRange.from.toISOString().split('T')[0])
                if (dateRange?.to) params.append('endDate', dateRange.to.toISOString().split('T')[0])

                const response = await fetch(`/api/reports/employee-sales?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch employee sales data')

                const data = await response.json()
                setEmployeeSales(data.employeeSales || [])
            } catch (err) {
                console.error('Error fetching employee sales:', err)
                setError(err instanceof Error ? err.message : 'Failed to load employee sales data')
                setEmployeeSales([])
            } finally {
                setLoading(false)
            }
        }

        if (dateRange?.from && dateRange?.to) {
            fetchEmployeeSales()
        }
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
            ["Employee", "Total Sales", "Total Revenue", "Average Revenue per Sale"],
            ...employeeSales.map(emp => [
                emp.employeeName,
                emp.totalQuantity,
                emp.totalRevenue.toFixed(2),
                (emp.totalRevenue / emp.totalQuantity).toFixed(2)
            ])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "employee-sales.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Chart configuration
    const chartConfig = {
        revenue: {
            label: "Revenue",
            color: "#668e2b",
        },
        quantity: {
            label: "Quantity",
            color: "#3b82f6",
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
                                        <BreadcrumbPage>Sales by Employee</BreadcrumbPage>
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
                                    Sales by Employee Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Total sales recorded by each Front Desk user
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
                                            onApply={() => {
                                                // Data will be refetched automatically when dateRange changes
                                            }}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Summary Cards */}
                        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                            <SummaryCard
                                icon={<Users size={20} />}
                                value={loading ? "..." : totalEmployees.toString()}
                                label="Total Employees"
                                iconColor="bg-blue-500/20 text-blue-400"
                            />
                            <SummaryCard
                                icon={<DollarSign size={20} />}
                                value={loading ? "..." : `$${totalRevenue.toFixed(2)}`}
                                label="Total Revenue"
                                iconColor="bg-emerald-500/20 text-emerald-400"
                            />
                            <SummaryCard
                                icon={<ShoppingCart size={20} />}
                                value={loading ? "..." : totalQuantity.toString()}
                                label="Total Sales"
                                iconColor="bg-purple-500/20 text-purple-400"
                            />
                            <SummaryCard
                                icon={<TrendingUp size={20} />}
                                value={loading ? "..." : `$${avgRevenuePerEmployee.toFixed(2)}`}
                                label="Avg Revenue/Employee"
                                iconColor="bg-orange-500/20 text-orange-400"
                            />
                        </div>

                        {/* Chart */}
                        <Card className="bg-[#0a0a0a] lg:col-span-2 border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white">Sales by Employee</CardTitle>
                                <CardDescription className="text-white/40">Revenue and quantity per employee</CardDescription>
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
                                ) : employeeSales.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No sales data available for selected period</div>
                                    </div>
                                ) : (
                                    <ChartContainer config={chartConfig} className="h-80 w-full">
                                        <BarChart accessibilityLayer data={employeeSales}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis
                                                dataKey="employeeName"
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
                                            <Bar 
                                                dataKey="totalRevenue" 
                                                fill="var(--color-revenue)" 
                                                radius={8}
                                            />
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        </div>

                        {/* Employee Sales Table */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white">Employee Sales Details</CardTitle>
                                <CardDescription className="text-white/40">Detailed breakdown by employee</CardDescription>
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
                                ) : employeeSales.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No sales data available for selected period</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Employee</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Total Sales</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Total Revenue</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Avg Revenue/Sale</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employeeSales.map((emp, index) => (
                                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                                                                    <Users size={16} className="text-emerald-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-white">{emp.employeeName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm font-medium text-white">{emp.totalQuantity}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm font-medium text-white">${emp.totalRevenue.toFixed(2)}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">${(emp.totalRevenue / emp.totalQuantity).toFixed(2)}</div>
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
