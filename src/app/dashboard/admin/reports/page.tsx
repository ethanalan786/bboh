"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    AlertTriangle,
    Bookmark,
    BookmarkCheck,
    Box,
    Calculator,
    ChevronRight,
    DollarSign,
    FileText,
    History,
    Package,
    Percent,
    PiggyBank,
    Receipt,
    Scale,
    ShoppingBag,
    Truck,
    Users,
    Utensils
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Trend = "up" | "down";

interface MetricCardProps {
    icon: React.ReactNode;
    value: string;
    label: string;
    change: string;
    trend: Trend;
    comparison: string;
    theme?: "blue" | "emerald" | "purple";
}

function MetricCard({ icon, value, label, change, trend, comparison, theme = "blue" }: MetricCardProps) {
    const isUp = trend === "up";

    const themeColors = {
        blue: { accent: "text-blue-400", bg: "bg-blue-500/5" },
        emerald: { accent: "text-emerald-400", bg: "bg-emerald-500/5" },
        purple: { accent: "text-purple-400", bg: "bg-purple-500/5" },
    };

    const colors = themeColors[theme];

    return (
        <div className="bg-[#0a0a0a] rounded-xl p-5 border border-white/6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.accent}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-white/50">{label}</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change}
                </span>
                <span className="text-xs text-white/40">{comparison}</span>
            </div>
        </div>
    );
}

type AccessTag = "Both" | "Box Apparel" | "Burn Box";

interface ReportCardProps {
    number: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    access: [AccessTag, string];
    route: string;
    theme?: "blue" | "emerald" | "purple";
    isBookmarked?: boolean;
    onBookmarkToggle?: (reportId: string, reportTitle: string) => void;
}

function accessPillStyle(tag: AccessTag): string {
    switch (tag) {
        case "Both":
            return "bg-white/[0.07] text-white/70 border border-white/10";
        case "Box Apparel":
            return "bg-orange-500/15 text-orange-300 border border-orange-500/20";
        case "Burn Box":
            return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
    }
}

function ReportCard({ number, icon, title, description, access, route, theme = "blue", isBookmarked = false, onBookmarkToggle }: ReportCardProps) {
    const [businessTag, adminTag] = access;

    const themeColors = {
        blue: { accent: "text-blue-400", bg: "bg-blue-500/5" },
        emerald: { accent: "text-emerald-400", bg: "bg-emerald-500/5" },
        purple: { accent: "text-purple-400", bg: "bg-purple-500/5" },
    };

    const colors = themeColors[theme];

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onBookmarkToggle) {
            onBookmarkToggle(route, title);
        }
    };

    return (
        <Link href={route} className="block">
            <div className="group bg-[#0a0a0a] rounded-xl p-5 border border-white/6 hover:border-white/10 transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-lg ${colors.bg} flex items-center justify-center ${colors.accent} shrink-0`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed">{description}</p>
                    </div>
                    <button
                        onClick={handleBookmarkClick}
                        className="shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                        {isBookmarked ? (
                            <BookmarkCheck size={18} className="text-yellow-400 fill-yellow-400" />
                        ) : (
                            <Bookmark size={18} className="text-white/30 group-hover:text-white/60 transition-colors" />
                        )}
                    </button>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md ${accessPillStyle(businessTag)}`}>
                            {businessTag}
                        </span>
                        {adminTag && (
                            <span className="text-xs text-white/30">Admin only</span>
                        )}
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
            </div>
        </Link>
    );
}

export default function SalesProfitabilityReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(2026, 8, 1),
        to: new Date(2026, 8, 20),
    });
    const [salesMetrics, setSalesMetrics] = useState<any[]>([]);
    const [inventoryMetrics, setInventoryMetrics] = useState<any[]>([]);
    const [purchasingMetrics, setPurchasingMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState<Array<{ reportId: string; reportTitle: string }>>([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    useEffect(() => {
        const fetchSalesMetrics = async () => {
            if (!dateRange.from || !dateRange.to) return;

            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('startDate', dateRange.from.toISOString().split('T')[0]);
                params.append('endDate', dateRange.to.toISOString().split('T')[0]);

                const response = await fetch(`/api/reports/sales-profitability?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch sales metrics');

                const data = await response.json();

                const formatCurrency = (value: number) => {
                    if (value >= 1000) {
                        return `$${(value / 1000).toFixed(1)}K`;
                    }
                    return `$${value.toFixed(2)}`;
                };

                const formatPercent = (value: number) => {
                    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
                };

                const formatDateRange = (start: string, end: string) => {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    return `vs ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                };

                setSalesMetrics([
                    {
                        icon: <DollarSign size={20} />,
                        value: formatCurrency(data.current.totalSales),
                        label: "Total Sales",
                        change: formatPercent(data.changes.salesChange),
                        trend: data.changes.salesChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <Package size={20} />,
                        value: formatCurrency(data.current.cogs),
                        label: "COGS",
                        change: formatPercent(data.changes.cogsChange),
                        trend: data.changes.cogsChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <PiggyBank size={20} />,
                        value: formatCurrency(data.current.grossProfit),
                        label: "Gross Profit",
                        change: formatPercent(data.changes.profitChange),
                        trend: data.changes.profitChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <Percent size={20} />,
                        value: `${data.current.grossMargin.toFixed(1)}%`,
                        label: "Gross Margin",
                        change: `${data.changes.marginChange > 0 ? '+' : ''}${data.changes.marginChange.toFixed(1)}pp`,
                        trend: data.changes.marginChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                ]);
            } catch (error) {
                console.error('Error fetching sales metrics:', error);
                // Keep default values on error
            } finally {
                setLoading(false);
            }
        };

        fetchSalesMetrics();
    }, [dateRange]);

    // Fetch bookmarks
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (status !== "authenticated") return;

            setBookmarksLoading(true);
            try {
                const response = await fetch('/api/reports/bookmarks');
                if (!response.ok) throw new Error('Failed to fetch bookmarks');

                const data = await response.json();
                setBookmarks(data.bookmarks || []);
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            } finally {
                setBookmarksLoading(false);
            }
        };

        fetchBookmarks();
    }, [status]);

    // Fetch inventory metrics
    useEffect(() => {
        const fetchInventoryMetrics = async () => {
            if (!dateRange.from || !dateRange.to) return;

            try {
                const params = new URLSearchParams();
                params.append('startDate', dateRange.from.toISOString().split('T')[0]);
                params.append('endDate', dateRange.to.toISOString().split('T')[0]);

                const response = await fetch(`/api/reports/inventory-metrics?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch inventory metrics');

                const data = await response.json();

                const formatNumber = (value: number) => {
                    return value.toLocaleString();
                };

                const formatCurrency = (value: number) => {
                    if (value >= 1000) {
                        return `$${(value / 1000).toFixed(1)}K`;
                    }
                    return `$${value.toFixed(2)}`;
                };

                const formatPercent = (value: number) => {
                    return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
                };

                const formatDateRange = (start: string, end: string) => {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    return `vs ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                };

                setInventoryMetrics([
                    {
                        icon: <Box size={20} />,
                        value: formatNumber(data.current.totalItems),
                        label: "Total Items",
                        change: formatPercent(data.changes.itemsChange),
                        trend: data.changes.itemsChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <Scale size={20} />,
                        value: formatCurrency(data.current.inventoryValue),
                        label: "Inventory Value",
                        change: formatPercent(data.changes.valueChange),
                        trend: data.changes.valueChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <AlertTriangle size={20} />,
                        value: data.current.lowStock.toString(),
                        label: "Low Stock Items",
                        change: data.changes.lowStockChange > 0 ? `+${data.changes.lowStockChange}` : data.changes.lowStockChange.toString(),
                        trend: data.changes.lowStockChange <= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <History size={20} />,
                        value: formatNumber(data.current.movements),
                        label: "Movements",
                        change: formatPercent(data.changes.movementsChange),
                        trend: data.changes.movementsChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                ]);
            } catch (error) {
                console.error('Error fetching inventory metrics:', error);
            }
        };

        fetchInventoryMetrics();
    }, [dateRange]);

    // Fetch purchasing metrics
    useEffect(() => {
        const fetchPurchasingMetrics = async () => {
            if (!dateRange.from || !dateRange.to) return;

            try {
                const params = new URLSearchParams();
                params.append('startDate', dateRange.from.toISOString().split('T')[0]);
                params.append('endDate', dateRange.to.toISOString().split('T')[0]);

                const response = await fetch(`/api/reports/purchasing-metrics?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch purchasing metrics');

                const data = await response.json();

                const formatCurrency = (value: number) => {
                    if (value >= 1000) {
                        return `$${(value / 1000).toFixed(1)}K`;
                    }
                    return `$${value.toFixed(2)}`;
                };

                const formatPercent = (value: number) => {
                    return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
                };

                const formatDateRange = (start: string, end: string) => {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    return `vs ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                };

                setPurchasingMetrics([
                    {
                        icon: <ShoppingBag size={20} />,
                        value: data.current.purchases.toString(),
                        label: "Total Purchases",
                        change: formatPercent(data.changes.purchasesChange),
                        trend: data.changes.purchasesChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <DollarSign size={20} />,
                        value: formatCurrency(data.current.totalSpend),
                        label: "Total Spend",
                        change: formatPercent(data.changes.spendChange),
                        trend: data.changes.spendChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <Truck size={20} />,
                        value: data.current.pendingInvoices.toString(),
                        label: "Pending Invoices",
                        change: data.changes.invoicesChange > 0 ? `+${data.changes.invoicesChange}` : data.changes.invoicesChange.toString(),
                        trend: data.changes.invoicesChange <= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                    {
                        icon: <Package size={20} />,
                        value: data.current.activeSuppliers.toString(),
                        label: "Active Suppliers",
                        change: formatPercent(data.changes.suppliersChange),
                        trend: data.changes.suppliersChange >= 0 ? "up" as const : "down" as const,
                        comparison: formatDateRange(data.comparison.startDate, data.comparison.endDate),
                    },
                ]);
            } catch (error) {
                console.error('Error fetching purchasing metrics:', error);
            }
        };

        fetchPurchasingMetrics();
    }, [dateRange]);

    const handleBookmarkToggle = async (reportId: string, reportTitle: string) => {
        const isBookmarked = bookmarks.some(b => b.reportId === reportId);

        try {
            if (isBookmarked) {
                // Remove bookmark
                await fetch(`/api/reports/bookmarks?reportId=${encodeURIComponent(reportId)}`, {
                    method: 'DELETE'
                });
                setBookmarks(bookmarks.filter(b => b.reportId !== reportId));
            } else {
                // Add bookmark
                const response = await fetch('/api/reports/bookmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reportId, reportTitle })
                });
                if (!response.ok) throw new Error('Failed to add bookmark');
                const data = await response.json();
                setBookmarks([...bookmarks, data.bookmark]);
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const isReportBookmarked = (reportId: string) => {
        return bookmarks.some(b => b.reportId === reportId);
    };

    const salesReports: Array<{
        number: string;
        icon: React.ReactNode;
        title: string;
        description: string;
        access: [AccessTag, string];
        route: string;
    }> = [
            {
                number: "01",
                icon: <FileText size={20} />,
                title: "Sales Report",
                description: "Total sales by date range, business, location, product, category, or employee. Shows qty sold and revenue.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/sales",
            },
            {
                number: "02",
                icon: <Package size={20} />,
                title: "Cost of Goods Sold (COGS) Report",
                description: "Total cost of inventory sold in a period, broken down by product or category.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/cogs",
            },
            {
                number: "03",
                icon: <PiggyBank size={20} />,
                title: "Gross Profit Report",
                description: "Sales revenue minus COGS — overall and by product/category. Includes gross margin %.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/gross-profit",
            },
            {
                number: "04",
                icon: <ShoppingBag size={20} />,
                title: "Product Profitability Report",
                description: "Revenue, COGS, gross profit, and margin % per apparel product — shows which items are most/least profitable.",
                access: ["Box Apparel", "Admin only"],
                route: "/dashboard/admin/reports/product-profitability",
            },
            {
                number: "05",
                icon: <Utensils size={20} />,
                title: "Recipe Profitability Report",
                description: "Revenue per smoothie/product vs total ingredient cost to produce it — margin per recipe.",
                access: ["Burn Box", "Admin only"],
                route: "/dashboard/admin/reports/recipe-profitability",
            },
            {
                number: "06",
                icon: <Users size={20} />,
                title: "Sales by Employee Report",
                description: "Total sales recorded by each Front Desk user — quantity and revenue — for a selected period.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/employee-sales",
            },
        ];

    const inventoryReports: Array<{
        number: string;
        icon: React.ReactNode;
        title: string;
        description: string;
        access: [AccessTag, string];
        route: string;
    }> = [
            {
                number: "07",
                icon: <Box size={20} />,
                title: "Inventory On Hand",
                description: "Current stock levels for every product/ingredient at any point in time.",
                access: ["Both", ""],
                route: "/dashboard/admin/reports/inventory-on-hand",
            },
            {
                number: "08",
                icon: <DollarSign size={20} />,
                title: "Inventory Retail Value",
                description: "Expected retail value of remaining apparel inventory (qty × selling price).",
                access: ["Box Apparel", "Admin only"],
                route: "/dashboard/admin/reports/inventory-retail",
            },
            {
                number: "09",
                icon: <AlertTriangle size={20} />,
                title: "Low-Stock Alert Report",
                description: "All products and ingredients that have fallen below a defined minimum threshold.",
                access: ["Both", ""],
                route: "/dashboard/admin/reports/low-stock",
            },
            {
                number: "10",
                icon: <History size={20} />,
                title: "Inventory Movement Report",
                description: "Full history of every inventory change — purchases received, sales deductions, adjustments, and wastage — per product/ingredient over a date range.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/inventory-movement",
            },
        ];

    const purchasingReports: Array<{
        number: string;
        icon: React.ReactNode;
        title: string;
        description: string;
        access: [AccessTag, string];
        route: string;
    }> = [
            {
                number: "13",
                icon: <History size={20} />,
                title: "Purchase History Report",
                description: "All approved purchases with full landed cost breakdown — original cost, freight, customs, duties, taxes, total landed, and cost per unit.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/purchase-history",
            },
            {
                number: "14",
                icon: <Receipt size={20} />,
                title: "Purchases by Supplier Report",
                description: "Total spend per supplier by period — quantity, invoice amounts, and landed costs.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/supplier-purchases",
            },
            {
                number: "15",
                icon: <Receipt size={20} />,
                title: "Invoice Log Report",
                description: "All uploaded invoices with status (pending review / approved / rejected), who uploaded, who approved, and timestamps.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/invoice-log",
            },
            {
                number: "16",
                icon: <Calculator size={20} />,
                title: "Landed Cost Breakdown Report",
                description: "Detailed cost component breakdown per purchase — shows the exact contribution of shipping, customs, and other expenses to the final landed cost per unit.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/landed-cost",
            },
        ];

    const automatedReports: Array<{
        number: string;
        icon: React.ReactNode;
        title: string;
        description: string;
        access: [AccessTag, string];
        route: string;
    }> = [
            {
                number: "17",
                icon: <FileText size={20} />,
                title: "Weekly Reports",
                description: "Automated weekly inventory and sales reports with comprehensive metrics, GymMaster comparison, and email delivery.",
                access: ["Both", "Admin only"],
                route: "/dashboard/admin/reports/weekly",
            },
        ];

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
                                        <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Reports</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-6 px-4 sm:px-6 py-6">

                        {/* Page Header + Filters in one row */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Reports
                                </h1>
                                <p className="text-sm text-white/40">
                                    View sales, profitability, and inventory reports across your business.
                                </p>
                            </div>
                            {/* Filter Controls */}
                            <div className="flex items-center gap-2">
                                <DateRangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Bookmarked Reports Section */}
                        {bookmarks.length > 0 && (
                            <div className="rounded-2xl bg-linear-to-br from-yellow-950/20 to-yellow-900/10 border border-yellow-500/20 p-6">
                                <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                                    <BookmarkCheck size={20} className="fill-yellow-400" />
                                    Your Bookmarked Reports
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {bookmarks.map((bookmark) => {
                                        const allReports = [...salesReports, ...inventoryReports, ...purchasingReports, ...automatedReports];
                                        const report = allReports.find(r => r.route === bookmark.reportId);
                                        if (!report) return null;

                                        return (
                                            <ReportCard
                                                key={bookmark.reportId}
                                                {...report}
                                                isBookmarked={true}
                                                onBookmarkToggle={handleBookmarkToggle}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sales & Profitability Section */}
                        <div className="rounded-2xl bg-linear-to-br from-blue-950/20 to-blue-900/10 border p-6">
                            <h2 className="text-lg font-semibold text-blue-300 mb-4">Sales & Profitability</h2>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-[#0a0a0a] rounded-xl p-5 border border-white/6 animate-pulse">
                                            <div className="h-6 w-10 bg-white/10 rounded mb-3"></div>
                                            <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
                                            <div className="h-4 w-16 bg-white/10 rounded"></div>
                                        </div>
                                    ))
                                ) : salesMetrics.length > 0 ? (
                                    salesMetrics.map((metric) => (
                                        <MetricCard key={metric.label} {...metric} theme="blue" />
                                    ))
                                ) : (
                                    <div className="col-span-4 text-center text-white/50 py-8">
                                        No sales data available for selected period
                                    </div>
                                )}
                            </div>

                            {/* Report Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {salesReports.map((report) => (
                                    <ReportCard
                                        key={report.number}
                                        {...report}
                                        theme="blue"
                                        isBookmarked={isReportBookmarked(report.route)}
                                        onBookmarkToggle={handleBookmarkToggle}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Inventory Reports Section */}
                        <div className="rounded-2xl bg-linear-to-br from-emerald-950/20 to-emerald-900/10 border border-emerald-500/20 p-6">
                            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Inventory Reports</h2>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-[#0a0a0a] rounded-xl p-5 border border-white/6 animate-pulse">
                                            <div className="h-6 w-10 bg-white/10 rounded mb-3"></div>
                                            <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
                                            <div className="h-4 w-16 bg-white/10 rounded"></div>
                                        </div>
                                    ))
                                ) : inventoryMetrics.length > 0 ? (
                                    inventoryMetrics.map((metric) => (
                                        <MetricCard key={metric.label} {...metric} theme="emerald" />
                                    ))
                                ) : (
                                    <div className="col-span-4 text-center text-white/50 py-8">
                                        No inventory data available for selected period
                                    </div>
                                )}
                            </div>

                            {/* Report Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {inventoryReports.map((report) => (
                                    <ReportCard
                                        key={report.number}
                                        {...report}
                                        theme="emerald"
                                        isBookmarked={isReportBookmarked(report.route)}
                                        onBookmarkToggle={handleBookmarkToggle}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Purchasing Reports Section */}
                        <div className="rounded-2xl bg-linear-to-br from-purple-950/20 to-purple-900/10 border border-purple-500/20 p-6">
                            <h2 className="text-lg font-semibold text-purple-400 mb-4">Purchasing Reports</h2>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-[#0a0a0a] rounded-xl p-5 border border-white/6 animate-pulse">
                                            <div className="h-6 w-10 bg-white/10 rounded mb-3"></div>
                                            <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
                                            <div className="h-4 w-16 bg-white/10 rounded"></div>
                                        </div>
                                    ))
                                ) : purchasingMetrics.length > 0 ? (
                                    purchasingMetrics.map((metric) => (
                                        <MetricCard key={metric.label} {...metric} theme="purple" />
                                    ))
                                ) : (
                                    <div className="col-span-4 text-center text-white/50 py-8">
                                        No purchasing data available for selected period
                                    </div>
                                )}
                            </div>

                            {/* Report Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {purchasingReports.map((report) => (
                                    <ReportCard
                                        key={report.number}
                                        {...report}
                                        theme="purple"
                                        isBookmarked={isReportBookmarked(report.route)}
                                        onBookmarkToggle={handleBookmarkToggle}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Automated Reports Section */}
                        <div className="rounded-2xl bg-linear-to-br from-orange-950/20 to-orange-900/10 border border-orange-500/20 p-6">
                            <h2 className="text-lg font-semibold text-orange-400 mb-4">Automated Reports</h2>

                            {/* Report Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {automatedReports.map((report) => (
                                    <ReportCard
                                        key={report.number}
                                        {...report}
                                        theme="emerald"
                                        isBookmarked={isReportBookmarked(report.route)}
                                        onBookmarkToggle={handleBookmarkToggle}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}