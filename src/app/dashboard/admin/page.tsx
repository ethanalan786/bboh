"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CalendarRange } from "@/components/calendar-range";
import { ChartBarActive } from "@/components/charts/active-bar-chart";
import { ChartPieDonutText } from "@/components/charts/chart-radial-stacked";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Bookmark,
    Box,
    Calendar as CalendarIcon,
    Clock,
    DollarSign,
    Mail,
    Package,
    ShieldCheck,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Truck
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type DateRange } from "react-day-picker";


type Trend = "up" | "down";

interface StatCardProps {
    icon: React.ReactNode;
    value: string;
    label: string;
    period: string;
    change: string;
    trend: Trend;
}

function StatCard({
    icon,
    value,
    label,
    period,
    change,
    trend,
}: StatCardProps) {
    const isUp = trend === "up";
    return (
        <div className="bg-[#0a0a0a] rounded-2xl p-4 md:p-5 flex flex-col justify-between gap-4 border border-white/6">
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center text-white/60">
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
                <p className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                    {value}
                </p>
                <p className="text-sm text-white/40 mt-0.5">{label}</p>
            </div>
            <div>
                <span className="text-xs text-white bg-white/12 px-2.5 py-1 rounded-full">
                    {period}
                </span>
            </div>
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="bg-[#0a0a0a] rounded-2xl p-4 md:p-5 flex flex-col justify-between gap-4 border border-white/6">
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
                <div className="w-16 h-5 rounded bg-white/5 animate-pulse" />
            </div>
            <div>
                <div className="h-8 w-24 rounded bg-white/5 animate-pulse mb-2" />
                <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
            </div>
            <div>
                <div className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
            </div>
        </div>
    );
}

function BottomMetricSkeleton() {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-white/40 text-xs mb-3">
                <div className="w-3 h-3 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded bg-white/5 animate-pulse mb-3" />
            <div className="h-2 w-full rounded bg-white/5 animate-pulse" />
        </div>
    );
}

function EarningInsightsSkeleton() {
    return (
        <div className="bg-[#0a0a0a] col-span-1 md:col-span-2 lg:col-span-2 max-w-full rounded-2xl p-5 border border-white/6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="h-5 w-32 rounded bg-white/5 animate-pulse mb-2" />
                    <div className="h-3 w-48 rounded bg-white/5 animate-pulse" />
                </div>
            </div>
            <div className="flex flex-col lg:flex-row items-end gap-8 justify-between">
                <div className="w-full lg:w-lg">
                    <div className="flex justify-center gap-2 flex-col pb-5">
                        <div className="flex items-baseline gap-2">
                            <div className="h-16 w-40 rounded bg-white/5 animate-pulse" />
                            <div className="h-6 w-12 rounded-full bg-white/5 animate-pulse" />
                        </div>
                        <div className="h-4 w-64 rounded bg-white/5 animate-pulse mt-1.5" />
                    </div>
                    <Separator orientation="horizontal" className="w-px bg-white/6" />
                    <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6 py-8">
                        <BottomMetricSkeleton />
                        <div className="w-px bg-white/6 hidden md:block" />
                        <BottomMetricSkeleton />
                        <div className="w-px bg-white/6 hidden md:block" />
                        <BottomMetricSkeleton />
                    </div>
                </div>
                <div className="h-48 w-48 rounded bg-white/5 animate-pulse" />
            </div>
        </div>
    );
}

interface BottomMetricProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    barWidth: string;
    barColor: string;
}

function BottomMetric({
    icon,
    label,
    value,
    barWidth,
}: BottomMetricProps) {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-white/40 text-xs mb-3">
                {icon}
                <span>{label}</span>
            </div>
            <p className="text-2xl font-semibold text-white tracking-tight mb-3">
                {value}
            </p>
            <Progress value={parseInt(barWidth.replace("%", ""))} />
        </div>
    );
}

export default function SuppliersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [dashboardStats, setDashboardStats] = useState<any>({
        totalSales: { value: "$0", change: "0%", trend: "up" as const, period: "Today" },
        totalProfit: { value: "$0", change: "0%", trend: "up" as const, period: "Today" },
        totalOrders: { value: "0", change: "0%", trend: "up" as const, period: "Today" },
        avgOrderValue: { value: "$0", change: "0%", trend: "up" as const, period: "Today" },
        weeklyEarnings: {
            value: "$0",
            change: "0%",
            trend: "up" as const,
            earning: "$0",
            profit: "$0",
            expense: "$0",
            earningPercentage: 0,
            profitPercentage: 0,
            expensePercentage: 0
        },
        weeklyChartData: []
    });
    const [isLoading, setIsLoading] = useState(true);

    // Set default date range to today
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        setDateRange({ from: today, to: endOfDay });
    }, []);

    // Fetch dashboard stats
    useEffect(() => {
        const fetchDashboardStats = async () => {
            if (!dateRange?.from || !dateRange?.to) return;

            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('dateFrom', dateRange.from.toISOString().split('T')[0]);
                params.append('dateTo', dateRange.to.toISOString().split('T')[0]);

                const response = await fetch(`/api/dashboard-stats?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch dashboard stats');

                const data = await response.json();
                setDashboardStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardStats();
    }, [dateRange]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
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
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard/admin">
                                            Reports
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Consolidated Report</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-5 px-4 sm:gap-6 sm:px-6 pt-5">
                        {/* Date Range Selector */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Consolidated Report
                                </h1>
                                <p className="text-sm text-white/40">
                                    Overview of sales, profit, and performance metrics
                                </p>
                            </div>
                            <Popover>
                                <PopoverTrigger>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="justify-start text-left bg-white/5 border-white/10 text-white hover:bg-white/10 inline-flex items-center rounded-4xl px-3 py-2 text-sm font-medium transition-all cursor-pointer"
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
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#0a0a0a] border-white/10" align="start">
                                    <CalendarRange
                                        dateRange={dateRange}
                                        setDateRange={setDateRange}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-full gap-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2 lg:col-span-1">
                                {/* Left stat cards */}
                                <div className="flex flex-col gap-3">
                                    {isLoading ? (
                                        <>
                                            <StatCardSkeleton />
                                            <StatCardSkeleton />
                                        </>
                                    ) : (
                                        <>
                                            <StatCard
                                                icon={<Mail size={16} />}
                                                value={dashboardStats.totalSales.value}
                                                label="Total Sales"
                                                period={dashboardStats.totalSales.period}
                                                change={dashboardStats.totalSales.change}
                                                trend={dashboardStats.totalSales.trend}
                                            />
                                            <StatCard
                                                icon={<DollarSign size={16} />}
                                                value={dashboardStats.totalProfit.value}
                                                label="Total Profit"
                                                period={dashboardStats.totalProfit.period}
                                                change={dashboardStats.totalProfit.change}
                                                trend={dashboardStats.totalProfit.trend}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Middle stat cards */}
                                <div className="flex flex-col gap-3">
                                    {isLoading ? (
                                        <>
                                            <StatCardSkeleton />
                                            <StatCardSkeleton />
                                        </>
                                    ) : (
                                        <>
                                            <StatCard
                                                icon={<ShoppingCart size={16} />}
                                                value={dashboardStats.totalOrders.value}
                                                label="Total Orders"
                                                period={dashboardStats.totalOrders.period}
                                                change={dashboardStats.totalOrders.change}
                                                trend={dashboardStats.totalOrders.trend}
                                            />
                                            <StatCard
                                                icon={<Bookmark size={16} />}
                                                value={dashboardStats.avgOrderValue.value}
                                                label="Avg. Order Value"
                                                period={dashboardStats.avgOrderValue.period}
                                                change={dashboardStats.avgOrderValue.change}
                                                trend={dashboardStats.avgOrderValue.trend}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right: Earning Insights */}
                            {isLoading ? (
                                <EarningInsightsSkeleton />
                            ) : (
                                <div className="bg-[#0a0a0a] col-span-1 md:col-span-2 lg:col-span-2 max-w-full rounded-2xl p-5 border border-white/6 flex flex-col gap-5">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-white font-semibold text-sm">
                                                Earning insights
                                            </p>
                                            <p className="text-white/30 text-xs mt-0.5">
                                                Weekly Earning overview
                                            </p>
                                        </div>
                                    </div>

                                    {/* Weekly amount + bar chart row */}
                                    <div className="flex flex-col lg:flex-row items-end gap-8 justify-between">
                                        {/* Amount */}
                                        <div className="w-full lg:w-lg">
                                            <div className="flex justify-center gap-2 flex-col pb-5">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                                                        {dashboardStats.weeklyEarnings?.value || "$0"}
                                                    </span>
                                                    <span className={`text-xs font-medium ${dashboardStats.weeklyEarnings?.trend === "up" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"} px-2 py-0.5 rounded-full`}>
                                                        {dashboardStats.weeklyEarnings?.change || "0%"}
                                                    </span>
                                                </div>
                                                <p className="text-white/30 text-sm mt-1.5 max-w-fit leading-relaxed">
                                                    Earning of selected period compared to previous period. {dashboardStats.weeklyEarnings?.trend === "up" ? "it's increasing keep it up." : "it needs attention."}
                                                </p>
                                            </div>

                                            {/* Bottom metrics */}
                                            <Separator
                                                orientation="horizontal"
                                                className="w-px bg-white/6"
                                            />
                                            <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6 py-8">
                                                <BottomMetric
                                                    icon={<Mail size={12} />}
                                                    label="Earning"
                                                    value={dashboardStats.weeklyEarnings?.earning || "$0"}
                                                    barWidth={`${dashboardStats.weeklyEarnings?.earningPercentage || 0}%`}
                                                    barColor="bg-white/60"
                                                />
                                                <div className="w-px bg-white/6 hidden md:block" />
                                                <BottomMetric
                                                    icon={<DollarSign size={12} />}
                                                    label="Profit"
                                                    value={dashboardStats.weeklyEarnings?.profit || "$0"}
                                                    barWidth={`${dashboardStats.weeklyEarnings?.profitPercentage || 0}%`}
                                                    barColor="bg-white/60"
                                                />
                                                <div className="w-px bg-white/6 hidden md:block" />
                                                <BottomMetric
                                                    icon={<ShoppingCart size={12} />}
                                                    label="Expense"
                                                    value={dashboardStats.weeklyEarnings?.expense || "$0"}
                                                    barWidth={`${dashboardStats.weeklyEarnings?.expensePercentage || 0}%`}
                                                    barColor="bg-white/60"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-fit lg:w-auto">
                                            <ChartBarActive
                                                data={dashboardStats.weeklyChartData.length > 0 ? dashboardStats.weeklyChartData : undefined}
                                                activeIndex={dashboardStats.weeklyChartData.length > 0 ? dashboardStats.weeklyChartData.length - 1 : 0}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid max-w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-4 sm:gap-6 sm:p-6">
                        <div className="md:col-span-1 lg:col-span-1">
                            <OrdersOverviewCard />
                        </div>
                        <div className="md:col-span-1 lg:col-span-1">
                            <LatestOrdersCard />
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                            <PopularProductCard dateRange={dateRange} />
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}

interface Product {
    id: string;
    name: string;
    price: string;
    visitors: string;
    swatch?: string;
}

const tabs = [
    { key: "packed", label: "Packed", Icon: Box },
    { key: "shipped", label: "Shipped", Icon: Truck },
    { key: "received", label: "Received", Icon: ShieldCheck },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function OrdersOverviewCard() {
    const [activeTab, setActiveTab] = useState<TabKey>("packed");

    return (
        <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-neutral-950 p-4 md:p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800">
                        <img
                            src="https://api.dicebear.com/9.x/notionists/svg?seed=jackwilliams&backgroundColor=b6b6b6"
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-[15px] font-semibold leading-tight text-white">
                            @jackwilliams
                        </p>
                        <p className="text-sm leading-tight text-neutral-500">Business</p>
                    </div>
                </div>
            </div>

            <ChartPieDonutText />
        </section>
    );
}




interface LatestOrder {
    id: string;
    orderId: string | null;
    type: 'burnbox' | 'apparel';
    recipeName?: string;
    productName?: string;
    productSku?: string;
    recipeSku?: string;
    productCategory?: string;
    quantity: number;
    totalPrice: number;
    userName: string;
    customerName?: string;
    saleDate: Date | string;
    paymentMethod?: string;
}

function LatestOrdersCard() {
    const [orders, setOrders] = useState<LatestOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestOrders = async () => {
            try {
                const response = await fetch('/api/latest-orders?limit=8');
                if (!response.ok) throw new Error('Failed to fetch latest orders');

                const data = await response.json();
                setOrders(data.orders || []);
            } catch (error) {
                console.error('Error fetching latest orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestOrders();
    }, []);

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;
    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return 'N/A';
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getOrderTypeBadge = (type: string) => {
        if (type === 'burnbox') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">
                    BurnBox
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                Apparel
            </span>
        );
    };

    return (
        <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-neutral-950 p-4 md:p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-[17px] font-semibold text-white">Latest Orders</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Recent BurnBox & Apparel orders
                    </p>
                </div>
            </div>

            <div className="mt-5 flex-1 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white/50">Loading orders...</div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white/50">No recent orders</div>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto max-h-75">
                        {orders.map((order, index) => (
                            <div
                                key={order.id || order.orderId || `order-${index}`}
                                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                    <Package size={18} className="text-white/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-sm font-medium text-white truncate">
                                            {order.type === 'burnbox' ? order.recipeName : order.productName}
                                        </span>
                                        {getOrderTypeBadge(order.type)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
                                        <span>Qty: {order.quantity}</span>
                                        <span>•</span>
                                        <span>{formatPrice(order.totalPrice)}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDate(order.saleDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export const popularProducts: Product[] = [
    {
        id: "nike-vision-low",
        name: "Nike Vision Low Shoes",
        price: "$5,600",
        visitors: "10.6K",
        swatch: "#e8e5df",
    },
    {
        id: "adidas-ultraboost-21",
        name: "Adidas Ultraboost 21",
        price: "$4,500",
        visitors: "4.5K",
        swatch: "#d9d3c7",
    },
    {
        id: "puma-rsx-toys",
        name: "Puma RS-X Toys",
        price: "$3,200",
        visitors: "2K",
        swatch: "#dfe6ea",
    },
    {
        id: "new-balance-550",
        name: "New Balance 550",
        price: "$2,800",
        visitors: "1.8K",
        swatch: "#e4d9d0",
    },
    {
        id: "reebok-classic-leather",
        name: "Reebok Classic Leather",
        price: "$2,200",
        visitors: "1.2K",
        swatch: "#eceae6",
    },
];

function ProductSwatch({ color }: { color?: string }) {
    const defaultColor = color || '#3b82f6';
    return (
        <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: defaultColor }}>
            <Package size={18} className="text-white/80" />
        </div>
    );
}

function PopularProductCard({ dateRange }: { dateRange?: DateRange }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [totalVisitors, setTotalVisitors] = useState<string>("0");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPopularProducts = async () => {
            try {
                const params = new URLSearchParams();
                params.append('limit', '5');
                
                if (dateRange?.from) {
                    params.append('dateFrom', dateRange.from.toISOString().split('T')[0]);
                }
                if (dateRange?.to) {
                    params.append('dateTo', dateRange.to.toISOString().split('T')[0]);
                }

                const response = await fetch(`/api/popular-products?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch popular products');

                const data = await response.json();
                setProducts(data.products || []);
                setTotalVisitors(data.totalVisitors || "0");
            } catch (error) {
                console.error('Error fetching popular products:', error);
                // Fallback to static data on error
                setProducts(popularProducts);
                setTotalVisitors("10.4K");
            } finally {
                setLoading(false);
            }
        };

        fetchPopularProducts();
    }, [dateRange]);

    return (
        <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-neutral-950 p-4 md:p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-[17px] font-semibold text-white">
                        Popular product
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Total {totalVisitors} visitors
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="mt-6 flex-1 flex items-center justify-center">
                    <div className="text-white/50">Loading popular products...</div>
                </div>
            ) : (
                <ul className="mt-6 flex flex-1 flex-col justify-between gap-5">
                    {products.map((product) => (
                        <li key={product.id} className="flex items-center gap-3">
                            <ProductSwatch color={product.swatch} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-medium text-white">
                                    {product.name}
                                </p>
                                <p className="text-sm text-neutral-500">{product.price}</p>
                            </div>
                            <p className="shrink-0 text-sm text-neutral-500">
                                {product.visitors}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}