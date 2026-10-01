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
    Receipt,
    TrendingUp,
    TrendingDown,
    Building2,
    ShoppingCart,
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

type Trend = "up" | "down"

interface SupplierData {
    supplierId: string
    supplierName: string
    supplierEmail: string | null
    supplierPhone: string | null
    supplierCity: string | null
    supplierState: string | null
    totalPurchases: number
    totalQuantity: number
    totalBaseCost: number
    totalFreight: number
    totalCustoms: number
    totalDuties: number
    totalTaxes: number
    totalLandedCost: number
    totalInvoiceAmount: number
    invoiceCount: number
    percentageOfTotal: number
    averageOrderValue: number
    averageCostPerUnit: number
    orders: Array<{
        orderNumber: string
        orderDate: Date
        status: string
        quantity: number
        baseCost: number
        freight: number
        customs: number
        duties: number
        taxes: number
        totalLandedCost: number
        invoiceAmount: number
        invoiceCount: number
    }>
}

interface Summary {
    totalSuppliers: number
    grandTotalLandedCost: number
    grandTotalInvoiceAmount: number
    totalPurchases: number
    totalQuantity: number
    topSupplier: string | null
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

// Supplier Card Component
function SupplierCard({ supplier }: { supplier: SupplierData }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-white text-lg">{supplier.supplierName}</CardTitle>
                        <CardDescription className="text-white/40 text-sm">
                            {supplier.supplierCity && supplier.supplierState 
                                ? `${supplier.supplierCity}, ${supplier.supplierState}` 
                                : supplier.supplierEmail || 'No location info'}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                            ${supplier.totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-white/50">{supplier.percentageOfTotal.toFixed(1)}% of total</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <p className="text-white/50 text-xs mb-1">Total Purchases</p>
                        <p className="text-white text-sm font-medium">{supplier.totalPurchases}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-1">Total Units</p>
                        <p className="text-white text-sm font-medium">{supplier.totalQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-1">Avg Order Value</p>
                        <p className="text-white text-sm font-medium">${supplier.averageOrderValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-1">Avg Cost/Unit</p>
                        <p className="text-white text-sm font-medium">${supplier.averageCostPerUnit.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <div>
                            <p className="text-white/50 text-xs mb-1">Invoices</p>
                            <p className="text-white text-sm font-medium">{supplier.invoiceCount}</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs mb-1">Invoice Total</p>
                            <p className="text-white text-sm font-medium">${supplier.totalInvoiceAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                        {expanded ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>

                {expanded && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="text-white/60 text-xs mb-2">Recent Orders</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {supplier.orders.slice(0, 10).map((order) => (
                                <div key={order.orderNumber} className="flex items-center justify-between bg-white/5 rounded p-2">
                                    <div className="flex-1">
                                        <p className="text-white/80 text-sm font-medium">{order.orderNumber}</p>
                                        <p className="text-white/50 text-xs">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white text-sm font-medium">${order.totalLandedCost.toFixed(2)}</p>
                                        <p className="text-white/50 text-xs">{order.quantity} units</p>
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

export default function SupplierPurchasesReport() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [suppliers, setSuppliers] = useState<SupplierData[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Set default date range to current month
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({ from: firstDay, to: lastDay })
    }, [])

    // Fetch supplier purchases data
    useEffect(() => {
        const fetchSupplierPurchases = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/reports/supplier-purchases?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setSuppliers(data.suppliers || [])
                    setSummary(data.summary || null)
                } else {
                    console.error('Failed to fetch supplier purchases:', response.status)
                }
            } catch (error) {
                console.error('Error fetching supplier purchases:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSupplierPurchases()
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
                                        <BreadcrumbPage>Purchases by Supplier</BreadcrumbPage>
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
                                    Purchases by Supplier Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Total spend per supplier by period — quantity, invoice amounts, and landed costs
                                </p>
                            </div>
                            <DateRangePicker
                                value={dateRange as any}
                                onChange={setDateRange as any}
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
                                    icon={<Building2 size={16} />}
                                    value={summary.totalSuppliers.toString()}
                                    label="Active Suppliers"
                                    iconColor="bg-blue-500/20 text-blue-400"
                                />
                                <StatCard
                                    icon={<ShoppingCart size={16} />}
                                    value={summary.totalPurchases.toString()}
                                    label="Total Purchases"
                                    iconColor="bg-purple-500/20 text-purple-400"
                                />
                                <StatCard
                                    icon={<Package size={16} />}
                                    value={summary.totalQuantity.toLocaleString()}
                                    label="Total Units"
                                    iconColor="bg-green-500/20 text-green-400"
                                />
                                <StatCard
                                    icon={<DollarSign size={16} />}
                                    value={`$${(summary.grandTotalLandedCost / 1000).toFixed(1)}K`}
                                    label="Total Landed Cost"
                                    iconColor="bg-emerald-500/20 text-emerald-400"
                                />
                                <StatCard
                                    icon={<Receipt size={16} />}
                                    value={`$${(summary.grandTotalInvoiceAmount / 1000).toFixed(1)}K`}
                                    label="Total Invoice Amount"
                                    iconColor="bg-orange-500/20 text-orange-400"
                                />
                            </div>
                        ) : null}

                        {/* Top Supplier Highlight */}
                        {summary && summary.topSupplier && (
                            <Card className="bg-linear-to-r from-purple-950/20 to-blue-950/20 border-purple-500/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <TrendingUp size={20} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/50 text-xs">Top Supplier</p>
                                            <p className="text-white font-semibold">{summary.topSupplier}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Supplier Cards */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="bg-[#0a0a0a] border-white/6 animate-pulse">
                                        <CardContent className="p-6">
                                            <div className="h-20 bg-white/5 rounded" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : suppliers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suppliers.map((supplier) => (
                                    <SupplierCard key={supplier.supplierId} supplier={supplier} />
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center h-48 text-white/50">
                                        No supplier data available for selected period
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
