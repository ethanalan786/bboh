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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    DollarSign,
    Package,
    Truck,
    Receipt,
    Calculator,
    TrendingUp,
    TrendingDown,
    PieChart,
    Percent,
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

type Trend = "up" | "down"

interface ItemBreakdown {
    itemName: string
    itemSku: string
    quantity: number
    unitPrice: number
    baseCost: number
    freight: number
    customs: number
    duties: number
    taxes: number
    other: number
    totalLandedCost: number
    costPerUnit: number
    percentageBreakdown: {
        baseCost: number
        freight: number
        customs: number
        duties: number
        taxes: number
        other: number
    }
}

interface PurchaseData {
    orderNumber: string
    orderDate: Date
    supplier: {
        id: string
        name: string
    }
    status: string
    items: ItemBreakdown[]
    totals: {
        totalQuantity: number
        totalBaseCost: number
        totalFreight: number
        totalCustoms: number
        totalDuties: number
        totalTaxes: number
        totalOther: number
        totalLandedCost: number
        averageCostPerUnit: number
    }
    invoices: Array<{
        id: string
        invoiceNumber: string
        totalAmount: number
        taxAmount: number
    }>
}

interface Summary {
    totalOrders: number
    totalQuantity: number
    totalBaseCost: number
    totalFreight: number
    totalCustoms: number
    totalDuties: number
    totalTaxes: number
    totalOther: number
    totalLandedCost: number
    averageCostPerUnit: number
    percentageBreakdown: {
        baseCost: number
        freight: number
        customs: number
        duties: number
        taxes: number
        other: number
    }
}

// Stat Card Component
function StatCard({
    icon,
    value,
    label,
    trend,
    change,
    iconColor
}: {
    icon: React.ReactNode
    value: string
    label: string
    trend?: Trend
    change?: string
    iconColor?: string
}) {
    const isUp = trend === "up"
    
    return (
        <div className="bg-[#0a0a0a] rounded-2xl p-4 flex flex-col gap-3 border border-white/6">
            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor || 'bg-white/7 text-white/60'}`}>
                    {icon}
                </div>
                {trend && change && (
                    <span
                        className={`text-xs font-medium flex items-center gap-1 ${isUp ? "text-emerald-400" : "text-red-400"}`}
                    >
                        {change}
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </span>
                )}
            </div>
            
            <div>
                <p className="text-xl font-semibold text-white tracking-tight">
                    {value}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
        </div>
    )
}

// Cost Breakdown Card Component
function CostBreakdownCard({ summary }: { summary: Summary }) {
    const costComponents = [
        { 
            label: "Base Cost", 
            value: summary.totalBaseCost, 
            percentage: summary.percentageBreakdown.baseCost,
            color: "bg-blue-500",
            icon: <Receipt size={16} />
        },
        { 
            label: "Freight", 
            value: summary.totalFreight, 
            percentage: summary.percentageBreakdown.freight,
            color: "bg-purple-500",
            icon: <Truck size={16} />
        },
        { 
            label: "Customs", 
            value: summary.totalCustoms, 
            percentage: summary.percentageBreakdown.customs,
            color: "bg-orange-500",
            icon: <Package size={16} />
        },
        { 
            label: "Duties", 
            value: summary.totalDuties, 
            percentage: summary.percentageBreakdown.duties,
            color: "bg-green-500",
            icon: <DollarSign size={16} />
        },
        { 
            label: "Taxes", 
            value: summary.totalTaxes, 
            percentage: summary.percentageBreakdown.taxes,
            color: "bg-red-500",
            icon: <Calculator size={16} />
        },
        { 
            label: "Other", 
            value: summary.totalOther, 
            percentage: summary.percentageBreakdown.other,
            color: "bg-yellow-500",
            icon: <Percent size={16} />
        },
    ]

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Landed Cost Components</CardTitle>
                <CardDescription className="text-white/40">Overall cost breakdown across all purchases</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {costComponents.map((component) => (
                        <div key={component.label} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-lg ${component.color} bg-opacity-20 flex items-center justify-center`}>
                                        <div className={component.color.replace('bg-', 'text-')}>
                                            {component.icon}
                                        </div>
                                    </div>
                                    <span className="text-white/80 text-sm font-medium">{component.label}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-white font-medium text-sm">
                                        ${component.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-white/50 text-xs ml-2">
                                        ({component.percentage.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${component.color}`}
                                    style={{ width: `${component.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-white font-medium text-sm">Total Landed Cost</span>
                        <span className="text-emerald-400 font-semibold text-lg">
                            ${summary.totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Purchase Detail Card Component
function PurchaseDetailCard({ purchase }: { purchase: PurchaseData }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-white text-lg">{purchase.orderNumber}</CardTitle>
                        <CardDescription className="text-white/40 text-sm">
                            {purchase.supplier.name} • {format(new Date(purchase.orderDate), 'MMM dd, yyyy')}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                            ${purchase.totals.totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-white/50">
                            ${purchase.totals.averageCostPerUnit.toFixed(2)}/unit
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <p className="text-white/50 text-xs mb-1">Items</p>
                        <p className="text-white text-sm font-medium">{purchase.items.length}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-1">Total Units</p>
                        <p className="text-white text-sm font-medium">{purchase.totals.totalQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-1">Base Cost</p>
                        <p className="text-white text-sm font-medium">${purchase.totals.totalBaseCost.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-1">Freight</p>
                        <p className="text-white text-sm font-medium">${purchase.totals.totalFreight.toFixed(2)}</p>
                    </div>
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-white/50 hover:text-white transition-colors w-full text-center"
                >
                    {expanded ? 'Hide Item Details' : 'Show Item Details'}
                </button>

                {expanded && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="space-y-3">
                            {purchase.items.map((item, index) => (
                                <div key={index} className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-white text-sm font-medium">{item.itemName}</p>
                                            <p className="text-white/50 text-xs">SKU: {item.itemSku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white text-sm font-medium">${item.costPerUnit.toFixed(2)}/unit</p>
                                            <p className="text-white/50 text-xs">{item.quantity} units</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <p className="text-white/40">Base</p>
                                            <p className="text-white">${item.baseCost.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Freight</p>
                                            <p className="text-white">${item.freight.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Customs</p>
                                            <p className="text-white">${item.customs.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Duties</p>
                                            <p className="text-white">${item.duties.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Taxes</p>
                                            <p className="text-white">${item.taxes.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Total</p>
                                            <p className="text-emerald-400 font-medium">${item.totalLandedCost.toFixed(2)}</p>
                                        </div>
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

export default function LandedCostReport() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [purchases, setPurchases] = useState<PurchaseData[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Set default date range to current month
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({ from: firstDay, to: lastDay })
    }, [])

    // Fetch landed cost breakdown data
    useEffect(() => {
        const fetchLandedCostData = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/reports/landed-cost?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setPurchases(data.purchases || [])
                    setSummary(data.summary || null)
                } else {
                    console.error('Failed to fetch landed cost data:', response.status)
                }
            } catch (error) {
                console.error('Error fetching landed cost data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLandedCostData()
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
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard/admin/reports">Reports</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Landed Cost Breakdown</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-5 px-4 sm:gap-6 sm:px-6 pt-5">
                        {/* Page Header + Date Range */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Landed Cost Breakdown Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Detailed cost component breakdown per purchase — exact contribution of shipping, customs, and other expenses to final landed cost per unit
                                </p>
                            </div>
                            <DateRangePicker
                                value={dateRange as { from: Date | undefined; to: Date | undefined } | undefined}
                                onChange={setDateRange}
                                className="w-full"
                            />
                        </div>

                        {/* Summary Stats */}
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="bg-[#0a0a0a] rounded-2xl p-4 flex flex-col gap-3 border border-white/6 animate-pulse">
                                        <div className="h-8 w-8 rounded-lg bg-white/7" />
                                        <div className="h-6 w-20 bg-white/5 rounded" />
                                        <div className="h-4 w-16 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : summary ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <StatCard
                                    icon={<Receipt size={16} />}
                                    value={summary.totalOrders.toString()}
                                    label="Total Orders"
                                    iconColor="bg-blue-500/20 text-blue-400"
                                />
                                <StatCard
                                    icon={<Package size={16} />}
                                    value={summary.totalQuantity.toLocaleString()}
                                    label="Total Units"
                                    iconColor="bg-purple-500/20 text-purple-400"
                                />
                                <StatCard
                                    icon={<DollarSign size={16} />}
                                    value={`$${(summary.totalBaseCost / 1000).toFixed(1)}K`}
                                    label="Base Cost"
                                    iconColor="bg-green-500/20 text-green-400"
                                />
                                <StatCard
                                    icon={<Truck size={16} />}
                                    value={`$${(summary.totalFreight / 1000).toFixed(1)}K`}
                                    label="Freight"
                                    iconColor="bg-orange-500/20 text-orange-400"
                                />
                                <StatCard
                                    icon={<Calculator size={16} />}
                                    value={`$${summary.averageCostPerUnit.toFixed(2)}`}
                                    label="Avg Cost/Unit"
                                    iconColor="bg-emerald-500/20 text-emerald-400"
                                />
                            </div>
                        ) : null}

                        {/* Cost Breakdown Card */}
                        {summary && <CostBreakdownCard summary={summary} />}

                        {/* Purchase Detail Cards */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Card key={i} className="bg-[#0a0a0a] border-white/6 animate-pulse">
                                        <CardContent className="p-6">
                                            <div className="h-24 bg-white/5 rounded" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : purchases.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {purchases.map((purchase) => (
                                    <PurchaseDetailCard key={purchase.orderNumber} purchase={purchase} />
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center h-48 text-white/50">
                                        No landed cost data available for selected period
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
