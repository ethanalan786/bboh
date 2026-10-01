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
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    DollarSign,
    Receipt,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    User,
    Calendar,
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

type Trend = "up" | "down"

interface InvoiceData {
    id: string
    invoiceNumber: string
    invoiceDate: Date
    dueDate: Date | null
    totalAmount: number
    taxAmount: number
    discountAmount: number
    status: string
    fileName: string | null
    fileType: string | null
    fileSize: number | null
    fileUrl: string | null
    purchaseOrder: {
        orderNumber: string
        supplierName: string
    }
    uploadedBy: {
        id: string
        name: string
        email: string
    }
    uploadedAt: Date
    reviewedBy: {
        id: string
        name: string
    } | null
    reviewedAt: Date | null
    verifiedAt: Date | null
    notes: string | null
    extractedData: any
}

interface Summary {
    totalInvoices: number
    totalAmount: number
    totalTax: number
    totalDiscount: number
    statusCounts: {
        PENDING_REVIEW: number
        UNDER_REVIEW: number
        APPROVED: number
        REJECTED: number
        PAID: number
    }
    pendingReview: number
    approved: number
    rejected: number
    paid: number
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

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        PENDING_REVIEW: {
            color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            icon: <Clock size={14} />,
            label: "Pending Review"
        },
        UNDER_REVIEW: {
            color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            icon: <AlertCircle size={14} />,
            label: "Under Review"
        },
        APPROVED: {
            color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            icon: <CheckCircle size={14} />,
            label: "Approved"
        },
        REJECTED: {
            color: "bg-red-500/20 text-red-400 border-red-500/30",
            icon: <XCircle size={14} />,
            label: "Rejected"
        },
        PAID: {
            color: "bg-green-500/20 text-green-400 border-green-500/30",
            icon: <CheckCircle size={14} />,
            label: "Paid"
        },
    }

    const config = statusConfig[status] || statusConfig.PENDING_REVIEW

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            {config.icon}
            {config.label}
        </span>
    )
}

// Invoice Table Component
function InvoiceTable({ invoices }: { invoices: InvoiceData[] }) {
    const [filterStatus, setFilterStatus] = useState<string>("ALL")

    const filteredInvoices = filterStatus === "ALL" 
        ? invoices 
        : invoices.filter(inv => inv.status === filterStatus)

    return (
        <Card className="bg-[#0a0a0a] border-white/6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white">Invoice Log</CardTitle>
                        <CardDescription className="text-white/40">All uploaded invoices with status and timestamps</CardDescription>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Invoice #</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Supplier</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">PO #</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Date</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Status</th>
                                <th className="text-right py-3 px-4 text-white/60 text-xs font-medium">Amount</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Uploaded By</th>
                                <th className="text-left py-3 px-4 text-white/60 text-xs font-medium">Reviewed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-white text-sm font-medium">{invoice.invoiceNumber}</td>
                                    <td className="py-3 px-4 text-white/80 text-sm">{invoice.purchaseOrder.supplierName}</td>
                                    <td className="py-3 px-4 text-white/60 text-sm">{invoice.purchaseOrder.orderNumber}</td>
                                    <td className="py-3 px-4 text-white/60 text-sm">{format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</td>
                                    <td className="py-3 px-4">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="py-3 px-4 text-right text-white text-sm font-medium">
                                        ${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3 px-4 text-white/60 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-white/40" />
                                            <span>{invoice.uploadedBy.name}</span>
                                        </div>
                                        <div className="text-xs text-white/40 mt-0.5">
                                            {format(new Date(invoice.uploadedAt), 'MMM dd, HH:mm')}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-white/60 text-sm">
                                        {invoice.reviewedBy ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-white/40" />
                                                <span>{invoice.reviewedBy.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-white/30">—</span>
                                        )}
                                        {invoice.reviewedAt && (
                                            <div className="text-xs text-white/40 mt-0.5">
                                                {format(new Date(invoice.reviewedAt), 'MMM dd, HH:mm')}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredInvoices.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-white/50">
                        No invoices found for the selected filter
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function InvoiceLogReport() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [invoices, setInvoices] = useState<InvoiceData[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Set default date range to current month
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({ from: firstDay, to: lastDay })
    }, [])

    // Fetch invoice log data
    useEffect(() => {
        const fetchInvoiceLog = async () => {
            if (!dateRange?.from || !dateRange?.to) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'))
                params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'))

                const response = await fetch(`/api/reports/invoice-log?${params.toString()}`)
                if (response.ok) {
                    const data = await response.json()
                    setInvoices(data.invoices || [])
                    setSummary(data.summary || null)
                } else {
                    console.error('Failed to fetch invoice log:', response.status)
                }
            } catch (error) {
                console.error('Error fetching invoice log:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchInvoiceLog()
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
                                        <BreadcrumbPage>Invoice Log</BreadcrumbPage>
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
                                    Invoice Log Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    All uploaded invoices with status, uploaders, reviewers, and timestamps
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
                                    value={summary.totalInvoices.toString()}
                                    label="Total Invoices"
                                    iconColor="bg-blue-500/20 text-blue-400"
                                />
                                <StatCard
                                    icon={<DollarSign size={16} />}
                                    value={`$${(summary.totalAmount / 1000).toFixed(1)}K`}
                                    label="Total Amount"
                                    iconColor="bg-emerald-500/20 text-emerald-400"
                                />
                                <StatCard
                                    icon={<Clock size={16} />}
                                    value={summary.pendingReview.toString()}
                                    label="Pending Review"
                                    iconColor="bg-yellow-500/20 text-yellow-400"
                                />
                                <StatCard
                                    icon={<CheckCircle size={16} />}
                                    value={summary.approved.toString()}
                                    label="Approved"
                                    iconColor="bg-green-500/20 text-green-400"
                                />
                                <StatCard
                                    icon={<XCircle size={16} />}
                                    value={summary.rejected.toString()}
                                    label="Rejected"
                                    iconColor="bg-red-500/20 text-red-400"
                                />
                                <StatCard
                                    icon={<FileText size={16} />}
                                    value={`$${summary.totalTax.toFixed(2)}`}
                                    label="Total Tax"
                                    iconColor="bg-purple-500/20 text-purple-400"
                                />
                            </div>
                        ) : null}

                        {/* Invoice Table */}
                        {isLoading ? (
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center h-48">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </CardContent>
                            </Card>
                        ) : invoices.length > 0 ? (
                            <InvoiceTable invoices={invoices} />
                        ) : (
                            <Card className="bg-[#0a0a0a] border-white/6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center h-48 text-white/50">
                                        No invoice data available for selected period
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
