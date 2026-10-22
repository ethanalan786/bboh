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
    Download,
    RefreshCw,
    Filter,
    ArrowUp,
    ArrowDown,
    AlertTriangle
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { type DateRange } from "react-day-picker"
import { CalendarRange } from "@/components/calendar-range"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Transaction Type Badge Component
function TransactionTypeBadge({ type }: { type: string }) {
    const typeStyles: Record<string, string> = {
        "STOCK_ADDED": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        "STOCK_ADJUSTED": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        "SALE": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        "WASTAGE": "bg-red-500/20 text-red-400 border border-red-500/30",
        "DAMAGE": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        "EXPIRY": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        "THEFT": "bg-pink-500/20 text-pink-400 border border-pink-500/30",
        "PHYSICAL_COUNT": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
        "STOCK_RETURN": "bg-violet-500/20 text-violet-400 border border-violet-500/30",
    }

    const defaultStyle = "bg-white/10 text-white/70 border border-white/20"

    return (
        <span className={`text-xs px-2 py-1 rounded-md font-medium ${typeStyles[type] || defaultStyle}`}>
            {type.replace(/_/g, ' ')}
        </span>
    )
}

export default function InventoryMovementReport() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [movements, setMovements] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<string>("all")
    const [selectedTransactionType, setSelectedTransactionType] = useState<string>("all")

    // Set default date range
    useEffect(() => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateRange({ from: thirtyDaysAgo, to: now })
    }, [])

    // Fetch inventory movement data
    useEffect(() => {
        const fetchInventoryMovement = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams()
                params.append('startDate', dateRange.from.toISOString().split('T')[0])
                params.append('endDate', dateRange.to.toISOString().split('T')[0])
                if (selectedProduct !== 'all') params.append('productId', selectedProduct)
                if (selectedTransactionType !== 'all') params.append('transactionType', selectedTransactionType)

                const response = await fetch(`/api/reports/inventory-movement?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch inventory movement data')

                const data = await response.json()
                setMovements(data.movements || [])
                setSummary(data.summary || null)
            } catch (err) {
                console.error('Error fetching inventory movement:', err)
                setError(err instanceof Error ? err.message : 'Failed to load inventory movement data')
                setMovements([])
                setSummary(null)
            } finally {
                setLoading(false)
            }
        }

        fetchInventoryMovement()
    }, [dateRange, selectedProduct, selectedTransactionType])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    const handleRefresh = () => {
        // Refetch data
        const fetchInventoryMovement = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('startDate', dateRange?.from?.toISOString().split('T')[0] || '')
                params.append('endDate', dateRange?.to?.toISOString().split('T')[0] || '')
                if (selectedProduct !== 'all') params.append('productId', selectedProduct)
                if (selectedTransactionType !== 'all') params.append('transactionType', selectedTransactionType)

                const response = await fetch(`/api/reports/inventory-movement?${params.toString()}`)
                if (!response.ok) throw new Error('Failed to fetch inventory movement data')
                const data = await response.json()
                setMovements(data.movements || [])
                setSummary(data.summary || null)
            } catch (err) {
                console.error('Error fetching inventory movement:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchInventoryMovement()
    }

    const handleExport = () => {
        const csvContent = [
            ["Date", "Product Name", "SKU", "Category", "Transaction Type", "Previous Stock", "New Stock", "Quantity Change", "User", "Reason"],
            ...movements.map(m => [
                new Date(m.date).toLocaleDateString(),
                m.productName,
                m.productSku,
                m.category,
                m.transactionType,
                m.previousStock || 'N/A',
                m.newStock || 'N/A',
                m.quantityChange,
                m.userName,
                m.reason || 'N/A'
            ])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "inventory-movement.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const transactionTypes = [
        { value: "all", label: "All Types" },
        { value: "STOCK_ADDED", label: "Purchases Received" },
        { value: "SALE", label: "Sales Deductions" },
        { value: "STOCK_ADJUSTED", label: "Adjustments" },
        { value: "WASTAGE", label: "Wastage" },
        { value: "DAMAGE", label: "Damage" },
        { value: "EXPIRY", label: "Expiry" },
        { value: "THEFT", label: "Theft" },
        { value: "PHYSICAL_COUNT", label: "Physical Count" },
        { value: "STOCK_RETURN", label: "Stock Return" }
    ]

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
                                        <BreadcrumbPage>Inventory Movement</BreadcrumbPage>
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
                                    Inventory Movement Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Full history of every inventory change — purchases received, sales deductions, adjustments, and wastage — per product/ingredient over a date range
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Popover>
                                    <PopoverTrigger>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <Filter size={16} className="mr-2" />
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
                                            onApply={() => {}}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw size={16} className="mr-2" />
                                    Refresh
                                </Button>
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

                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{summary.totalMovements}</p>
                                            <p className="text-xs text-white/50">Total Movements</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <ArrowUp size={20} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{summary.purchasesReceived}</p>
                                            <p className="text-xs text-white/50">Purchases Received</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <ArrowDown size={20} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{summary.salesDeductions}</p>
                                            <p className="text-xs text-white/50">Sales Deductions</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{summary.adjustments}</p>
                                            <p className="text-xs text-white/50">Adjustments</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{summary.wastage}</p>
                                            <p className="text-xs text-white/50">Wastage</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="flex-1 min-w-48">
                                        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Transaction Type</label>
                                        <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                                            <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-lg text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-lg">
                                                {transactionTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value} className="text-white focus:bg-white/10">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 min-w-48">
                                        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Product</label>
                                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                            <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-lg text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-lg">
                                                <SelectItem value="all" className="text-white focus:bg-white/10">All Products</SelectItem>
                                                {Array.from(new Set(movements.map(m => m.productId))).slice(0, 20).map(productId => {
                                                    const product = movements.find(m => m.productId === productId)
                                                    return (
                                                        <SelectItem key={productId} value={productId} className="text-white focus:bg-white/10">
                                                            {product?.productName || productId}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Movement Table */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white">Inventory Movement Details</CardTitle>
                                <CardDescription className="text-white/40">Full history of inventory changes</CardDescription>
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
                                ) : movements.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No inventory movements found for selected period</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Date</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Product Name</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">SKU</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                    <th className="text-center p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Transaction Type</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Previous Stock</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">New Stock</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Quantity Change</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">User</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movements.map((movement) => (
                                                    <tr key={movement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="text-sm text-white">{new Date(movement.date).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium text-white">{movement.productName}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{movement.productSku}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{movement.category}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <TransactionTypeBadge type={movement.transactionType} />
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{movement.previousStock || 'N/A'}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white">{movement.newStock || 'N/A'}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className={`text-sm font-medium ${movement.quantityChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{movement.userName}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/50 max-w-xs truncate">{movement.reason || '-'}</div>
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
