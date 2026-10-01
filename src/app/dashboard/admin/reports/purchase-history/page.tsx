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
    Truck,
    FileText,
    TrendingUp,
    TrendingDown,
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

type Trend = "up" | "down"

interface LandedCost {
    baseCost: number
    freight: number
    customs: number
    duties: number
    taxes: number
    totalLandedCost: number
    costPerUnit: number
}

interface PurchaseOrder {
    id: string
    orderNumber: string
    orderDate: Date
    supplier: {
        id: string
        name: string
        email: string | null
    }
    status: string
    expectedDate: Date | null
    receivedDate: Date | null
    items: any[]
    totalQuantity: number
    landedCost: LandedCost
    invoices: Array<{
        id: string
        invoiceNumber: string
        totalAmount: number
        taxAmount: number
        discountAmount: number
        status: string
        invoiceDate: Date
    }>
    assignedTo: string | null
    notes: string | null
}

interface Summary {
    totalPurchases: number
    totalBaseCost: number
    totalFreight: number
    totalCustoms: number
    totalDuties: number
    totalTaxes: number
    totalLandedCost: number
    totalQuantity: number
    averageCostPerUnit: number
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

// Summary Card Component
function SummaryCard({ summary }: { summary: Summary }) {
    const costBreakdown = [
        { label: "Base Cost", value: summary.totalBaseCost, color: "bg-blue-500/20 text-blue-400" },
        { label: "Freight", value: summary.totalFreight, color: "bg-purple-500/20 text-purple-400" },
        { label: "Customs", value: summary.totalCustoms, color: "bg-orange-500/20 text-orange-400" },
        { label: "Duties", value: summary.totalDuties, color: "bg-green-500/20 text-green-400" },
        { label: "Taxes", value: summary.totalTaxes, color: "bg-red-500/20 text-red-400" },
    ]

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Cost Breakdown Summary</CardTitle>
                <CardDescription className="text-white/40">Total landed cost components</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {costBreakdown.map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.color.split(' ')[0]}`} />
                                <span className="text-white/70 text-sm">{item.label}</span>
                            </div>
                            <span className={`text-sm font-medium ${item.color.split(' ')[1]}`}>
                                ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between py-2 border-t border-white/10 mt-4">
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

// Purchase Table Component
function PurchaseTable({ purchases }: { purchases: PurchaseOrder[] }) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <CardTitle className="text-white">Purchase Orders</CardTitle>
                <CardDescription className="text-white/40">Detailed purchase history with landed costs</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Order #</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Supplier</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Date</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Status</th>
                                <th className="text-right py-3 px-4 text-white/60 text-xs font-medium">Total Landed Cost</th>
                                <th className="text-right py-3 px-4 text-white/60 text-xs font-medium">Cost/Unit</th>
                                <th className="text-center py-3 px-4 text-white/60 text-xs font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((purchase) => (
                                <>
                                    <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 text-white text-sm font-medium">{purchase.orderNumber}</td>
                                        <td className="py-3 px-4 text-white/80 text-sm">{purchase.supplier.name}</td>
                                        <td className="py-3 px-4 text-white/60 text-sm">{format(new Date(purchase.orderDate), 'MMM dd, yyyy')}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                purchase.status === 'RECEIVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                purchase.status === 'ORDERED' ? 'bg-blue-500/20 text-blue-400' :
                                                purchase.status === 'PARTIALLY_RECEIVED' ? 'bg-purple-500/20 text-purple-400' :
                                                purchase.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {purchase.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-white text-sm font-medium">
                                            ${purchase.landedCost.totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right text-white/80 text-sm">
                                            ${purchase.landedCost.costPerUnit.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => toggleRow(purchase.id)}
                                                className="text-white/50 hover:text-white transition-colors"
                                            >
                                                {expandedRows.has(purchase.id) ? '▼' : '▶'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.has(purchase.id) && (
                                        <tr className="bg-white/5">
                                            <td colSpan={7} className="py-4 px-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Base Cost</p>
                                                        <p className="text-white text-sm font-medium">${purchase.landedCost.baseCost.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Freight</p>
                                                        <p className="text-white text-sm font-medium">${purchase.landedCost.freight.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Customs</p>
                                                        <p className="text-white text-sm font-medium">${purchase.landedCost.customs.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Duties</p>
                                                        <p className="text-white text-sm font-medium">${purchase.landedCost.duties.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Taxes</p>
                                                        <p className="text-white text-sm font-medium">${purchase.landedCost.taxes.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Total Quantity</p>
                                                        <p className="text-white text-sm font-medium">{purchase.totalQuantity}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Expected Date</p>
                                                        <p className="text-white text-sm">{purchase.expectedDate ? format(new Date(purchase.expectedDate), 'MMM dd, yyyy') : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-1">Received Date</p>
                                                        <p className="text-white text-sm">{purchase.receivedDate ? format(new Date(purchase.receivedDate), 'MMM dd, yyyy') : 'N/A'}</p>
                                                    </div>
                                                </div>
                                                {purchase.invoices.length > 0 && (
                                                    <div>
                                                        <p className="text-white/50 text-xs mb-2">Invoices</p>
                                                        <div className="space-y-2">
                                                            {purchase.invoices.map((invoice) => (
                                                                <div key={invoice.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                                                                    <span className="text-white/80 text-sm">{invoice.invoiceNumber}</span>
                                                                    <span className="text-white text-sm font-medium">${invoice.totalAmount.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {purchase.notes && (
                                                    <div className="mt-4">
                                                        <p className="text-white/50 text-xs mb-1">Notes</p>
                                                        <p className="text-white/70 text-sm">{purchase.notes}</p>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

export default function PurchaseHistoryReport() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Set default date range to current month
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({ from: firstDay, to: lastDay })
    }, [])

    // Fetch purchase history data
    useEffect(() => {
        const fetchPurchaseHistory = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/reports/purchase-history?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setPurchases(data.purchases || [])
                    setSummary(data.summary || null)
                } else {
                    console.error('Failed to fetch purchase history:', response.status)
                }
            } catch (error) {
                console.error('Error fetching purchase history:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPurchaseHistory()
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
                                        <BreadcrumbPage>Purchase History</BreadcrumbPage>
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
                                    Purchase History Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    All approved purchases with full landed cost breakdown
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-[#0a0a0a] rounded-2xl p-4 flex flex-col gap-3 border border-white/6 animate-pulse">
                                        <div className="h-8 w-8 rounded-lg bg-white/7" />
                                        <div className="h-6 w-20 bg-white/5 rounded" />
                                        <div className="h-4 w-16 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : summary ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <StatCard
                                    icon={<Receipt size={16} />}
                                    value={summary.totalPurchases.toString()}
                                    label="Total Purchases"
                                    iconColor="bg-purple-500/20 text-purple-400"
                                />
                                <StatCard
                                    icon={<DollarSign size={16} />}
                                    value={`$${(summary.totalBaseCost / 1000).toFixed(1)}K`}
                                    label="Base Cost"
                                    iconColor="bg-blue-500/20 text-blue-400"
                                />
                                <StatCard
                                    icon={<Truck size={16} />}
                                    value={`$${(summary.totalFreight / 1000).toFixed(1)}K`}
                                    label="Freight"
                                    iconColor="bg-orange-500/20 text-orange-400"
                                />
                                <StatCard
                                    icon={<Package size={16} />}
                                    value={summary.totalQuantity.toLocaleString()}
                                    label="Total Units"
                                    iconColor="bg-green-500/20 text-green-400"
                                />
                                <StatCard
                                    icon={<TrendingUp size={16} />}
                                    value={`$${summary.averageCostPerUnit.toFixed(2)}`}
                                    label="Avg Cost/Unit"
                                    iconColor="bg-emerald-500/20 text-emerald-400"
                                />
                                <StatCard
                                    icon={<FileText size={16} />}
                                    value={`$${(summary.totalLandedCost / 1000).toFixed(1)}K`}
                                    label="Total Landed Cost"
                                    iconColor="bg-red-500/20 text-red-400"
                                />
                            </div>
                        ) : null}

                        {/* Cost Breakdown Summary */}
                        {summary && <SummaryCard summary={summary} />}

                        {/* Purchase Table */}
                        {isLoading ? (
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center h-48">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </CardContent>
                            </Card>
                        ) : purchases.length > 0 ? (
                            <PurchaseTable purchases={purchases} />
                        ) : (
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center h-48 text-white/50">
                                        No purchase data available for selected period
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
