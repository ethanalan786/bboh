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
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    AlertTriangle,
    Package,
    Leaf,
    RefreshCw,
    Download,
    Plus,
    X
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        "Critical": "bg-red-500/20 text-red-400 border border-red-500/30",
        "Low": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    }

    const defaultStyle = "bg-white/10 text-white/70 border border-white/20"

    return (
        <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusStyles[status] || defaultStyle}`}>
            {status}
        </span>
    )
}

export default function LowStockAlertReport() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [lowStockData, setLowStockData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [restockModal, setRestockModal] = useState<{
        isOpen: boolean
        item: any
        type: 'product' | 'ingredient'
        quantity: string
    }>({
        isOpen: false,
        item: null,
        type: 'product',
        quantity: ''
    })

    // Fetch low stock data
    useEffect(() => {
        const fetchLowStockData = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch('/api/reports/low-stock')
                if (!response.ok) throw new Error('Failed to fetch low stock data')

                const data = await response.json()
                setLowStockData(data)
            } catch (err) {
                console.error('Error fetching low stock data:', err)
                setError(err instanceof Error ? err.message : 'Failed to load low stock data')
                setLowStockData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchLowStockData()
    }, [])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    const handleRefresh = () => {
        // Refetch data
        const fetchLowStockData = async () => {
            setLoading(true)
            try {
                const response = await fetch('/api/reports/low-stock')
                if (!response.ok) throw new Error('Failed to fetch low stock data')
                const data = await response.json()
                setLowStockData(data)
            } catch (err) {
                console.error('Error fetching low stock data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchLowStockData()
    }

    const handleRestockClick = (item: any, type: 'product' | 'ingredient') => {
        setRestockModal({
            isOpen: true,
            item,
            type,
            quantity: ''
        })
    }

    const handleRestockSubmit = async () => {
        const quantity = parseInt(restockModal.quantity)
        if (!quantity || quantity <= 0) {
            alert('Please enter a valid quantity')
            return
        }

        try {
            const response = await fetch('/api/inventory/restock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: restockModal.item.id,
                    type: restockModal.type,
                    quantity: restockModal.quantity
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to restock item')
            }

            const data = await response.json()
            alert(data.message)
            setRestockModal({ isOpen: false, item: null, type: 'product', quantity: '' })
            handleRefresh()
        } catch (error) {
            console.error('Error restocking:', error)
            alert(error instanceof Error ? error.message : 'Failed to restock item')
        }
    }

    const handleExport = () => {
        if (!lowStockData) return

        const csvContent = [
            ["Type", "Name", "SKU", "Category", "Current Stock", "Minimum Level", "Status", "Unit"],
            ...lowStockData.products.map((p: any) => ["Product", p.name, p.sku, p.category, p.currentStock, p.minStock, p.status, p.unit]),
            ...lowStockData.ingredients.map((i: any) => ["Ingredient", i.name, i.sku, i.category, i.currentStock, i.minStock, i.status, i.unit])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "low-stock-alert.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

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
                                        <BreadcrumbPage>Low-Stock Alert</BreadcrumbPage>
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
                                    Low-Stock Alert Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    All products and ingredients that have fallen below a defined minimum threshold
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
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
                        {lowStockData && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <Package size={20} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{lowStockData.summary.totalLowStockProducts}</p>
                                            <p className="text-xs text-white/50">Low-Stock Products</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                            <AlertTriangle size={20} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{lowStockData.summary.criticalProducts}</p>
                                            <p className="text-xs text-white/50">Critical Products</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <Leaf size={20} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{lowStockData.summary.totalLowStockIngredients}</p>
                                            <p className="text-xs text-white/50">Low-Stock Ingredients</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                            <AlertTriangle size={20} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{lowStockData.summary.criticalIngredients}</p>
                                            <p className="text-xs text-white/50">Critical Ingredients</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Low-Stock Products */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Package size={20} className="text-orange-400" />
                                    Low-Stock Products
                                </CardTitle>
                                <CardDescription className="text-white/40">Products below minimum stock level</CardDescription>
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
                                ) : !lowStockData || lowStockData.products.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No low-stock products found</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Product</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">SKU</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Current Stock</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Minimum Level</th>
                                                    <th className="text-center p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                                    <th className="text-center p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lowStockData.products.map((product: any) => (
                                                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium text-white">{product.name}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{product.sku}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{product.category}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white">{product.currentStock} {product.unit}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{product.minStock} {product.unit}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <StatusBadge status={product.status} />
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                                                onClick={() => handleRestockClick(product, 'product')}
                                                            >
                                                                <Plus size={14} className="mr-1" />
                                                                Restock
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Low-Stock Ingredients */}
                        <Card className="bg-[#0a0a0a] border-white/6">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Leaf size={20} className="text-orange-400" />
                                    Low-Stock Ingredients
                                </CardTitle>
                                <CardDescription className="text-white/40">Ingredients below minimum stock level</CardDescription>
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
                                ) : !lowStockData || lowStockData.ingredients.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-white/50">No low-stock ingredients found</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Ingredient</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">SKU</th>
                                                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Current Stock</th>
                                                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Minimum Level</th>
                                                    <th className="text-center p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                                    <th className="text-center p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lowStockData.ingredients.map((ingredient: any) => (
                                                    <tr key={ingredient.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium text-white">{ingredient.name}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{ingredient.sku}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-white/70">{ingredient.category}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white">{ingredient.currentStock} {ingredient.unit}</div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-sm text-white/70">{ingredient.minStock} {ingredient.unit}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <StatusBadge status={ingredient.status} />
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                                                onClick={() => handleRestockClick(ingredient, 'ingredient')}
                                                            >
                                                                <Plus size={14} className="mr-1" />
                                                                Restock
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Restock Modal */}
                        {restockModal.isOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 w-full max-w-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">Restock Item</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRestockModal({ isOpen: false, item: null, type: 'product', quantity: '' })}
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-white/50 mb-1">Item</p>
                                            <p className="text-white font-medium">{restockModal.item?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white/50 mb-1">Current Stock</p>
                                            <p className="text-white">{restockModal.item?.currentStock} {restockModal.item?.unit}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-white/50 mb-2 block">Quantity to Add</label>
                                            <Input
                                                type="number"
                                                value={restockModal.quantity}
                                                onChange={(e) => setRestockModal({ ...restockModal, quantity: e.target.value })}
                                                placeholder="Enter quantity"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                onClick={() => setRestockModal({ isOpen: false, item: null, type: 'product', quantity: '' })}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                                onClick={handleRestockSubmit}
                                            >
                                                Restock
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
