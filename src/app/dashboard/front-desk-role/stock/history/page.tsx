"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FdrDashboardHeader } from '@/components/front-desk-role/fdr-dashboard-header';
import { GooeyInput } from '@/components/ui/gooey-input';
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Box,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarLucide,
  Filter,
  Download,
  RefreshCw,
  User,
  Package,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from "@/components/ui/toast"
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns"

type StockHistoryEntry = {
  id: string;
  productId: string;
  stockLevel: number;
  date: string;
  reason: string | null;
  createdAt: string;
  itemType?: string; // "PRODUCT" or "RECIPE"
  transactionType?: string;
  product?: {
    name: string;
    sku: string;
    category: string;
  };
  user?: {
    name: string;
    email: string;
  };
};

type StockHistoryStats = {
  totalAdjustments: number;
  uniqueProducts: number;
  adjustmentTypes: {
    increases: number;
    decreases: number;
  };
};

const CATEGORY_LABELS: Record<string, string> = {
  BURN_BOX: "Smoothies",
  APPAREL: "Apparel",
  SUPPLEMENT: "Supplements",
  DRINKS: "Drinks",
  ACCESSORIES: "Accessories",
  Smoothies: "Smoothies",
  Shakes: "Shakes",
  Bowls: "Bowls",
  Drinks: "Drinks",
  Snacks: "Snacks",
  Meals: "Meals",
  Desserts: "Desserts",
  Other: "Other",
};

const StockHistory = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [stats, setStats] = useState<StockHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [itemTypeFilter, setItemTypeFilter] = useState("all"); // "all", "PRODUCT", "RECIPE"
  
  // Date range filters
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/api/stock-history?limit=200';
      
      // Add date range filters
      if (dateRange === 'today') {
        const today = new Date();
        url += `&startDate=${startOfDay(today).toISOString()}&endDate=${endOfDay(today).toISOString()}`;
      } else if (dateRange === 'week') {
        const weekAgo = subDays(new Date(), 7);
        url += `&startDate=${startOfDay(weekAgo).toISOString()}&endDate=${endOfDay(new Date()).toISOString()}`;
      } else if (dateRange === 'month') {
        const monthAgo = subMonths(new Date(), 1);
        url += `&startDate=${startOfDay(monthAgo).toISOString()}&endDate=${endOfDay(new Date()).toISOString()}`;
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${startOfDay(customStartDate).toISOString()}&endDate=${endOfDay(customEndDate).toISOString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stock history:', error);
      toast.add({
        type: "error",
        description: "Failed to load stock history",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateRange, customStartDate, customEndDate]);

  const uniqueUsers = Array.from(new Set(history.map(h => h.user?.name)));
  const uniqueCategories = Array.from(new Set(history.map(h => h.product?.category).filter(Boolean)));

  const filteredHistory = history.filter(entry => {
    const matchesQuery = 
      query.trim() === "" ||
      entry.product?.name?.toLowerCase().includes(query.toLowerCase()) ||
      entry.product?.sku?.toLowerCase().includes(query.toLowerCase()) ||
      entry.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
      (entry.reason && entry.reason.toLowerCase().includes(query.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || entry.product?.category === categoryFilter;
    const matchesUser = userFilter === "all" || entry.user?.name === userFilter;
    const matchesItemType = itemTypeFilter === "all" || entry.itemType === itemTypeFilter;
    
    return matchesQuery && matchesCategory && matchesUser && matchesItemType;
  });

  const handleDateRangeChange = (range: typeof dateRange) => {
    setDateRange(range);
    if (range !== 'custom') {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const getStockChange = (entry: StockHistoryEntry, index: number) => {
    if (index === filteredHistory.length - 1) return null;
    const nextEntry = filteredHistory[index + 1];
    if (nextEntry.productId !== entry.productId) return null;
    return entry.stockLevel - nextEntry.stockLevel;
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center dark:bg-black dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden font-saprona dark:bg-black dark:text-neutral-100">
      <FdrSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FdrDashboardHeader placeholder="Search stock history..." />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Title row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border border-emerald-800/40 bg-emerald-950/40 flex items-center justify-center">
                <Clock size={18} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold dark:text-neutral-100">Stock History</h1>
                <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-0.5">
                  Track all stock adjustments over time with full historical context
                </p>
              </div>
            </div>
            <button
              onClick={fetchHistory}
              className="flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-3 hover:bg-[#161616] transition-colors"
            >
              <RefreshCw size={15} className="text-neutral-500 dark:text-neutral-500" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Stat cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Clock size={18} className="text-emerald-400" />}
                iconRing="border-emerald-800/40 bg-emerald-950/40"
                label="Total Adjustments"
                value={stats.totalAdjustments}
                sub="All time changes"
              />
              <StatCard
                icon={<Package size={18} className="text-blue-400" />}
                iconRing="border-blue-800/40 bg-blue-950/40"
                label="Unique Products"
                value={stats.uniqueProducts}
                sub="Products adjusted"
              />
              <StatCard
                icon={<TrendingUp size={18} className="text-emerald-400" />}
                iconRing="border-emerald-800/40 bg-emerald-950/40"
                label="Stock Increases"
                value={stats.adjustmentTypes.increases}
                sub="Additions to inventory"
              />
              <StatCard
                icon={<TrendingDown size={18} className="text-fuchsia-400" />}
                iconRing="border-fuchsia-800/40 bg-fuchsia-950/40"
                label="Stock Decreases"
                value={stats.adjustmentTypes.decreases}
                sub="Removals from inventory"
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-2.5">
              <Search size={15} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by item, SKU, user, or reason..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-neutral-600"
              />
            </div>

            <Combobox
              items={["all", ...uniqueCategories]}
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value ?? "all")}
            >
              <ComboboxInput placeholder="All Categories" />
              <ComboboxContent>
                <ComboboxEmpty>No categories found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item === "all" ? "All Categories" : CATEGORY_LABELS[item] ?? item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <Combobox
              items={["all", ...uniqueUsers]}
              value={userFilter}
              onValueChange={(value) => setUserFilter(value ?? "all")}
            >
              <ComboboxInput placeholder="All Users" />
              <ComboboxContent>
                <ComboboxEmpty>No users found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item === "all" ? "All Users" : item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <Combobox
              items={["all", "PRODUCT", "RECIPE"]}
              value={itemTypeFilter}
              onValueChange={(value) => setItemTypeFilter(value ?? "all")}
            >
              <ComboboxInput placeholder="All Types" />
              <ComboboxContent>
                <ComboboxEmpty>No types found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item === "all" ? "All Types" : item === "PRODUCT" ? "Products" : "Recipes"}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            {/* Date range filter */}
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-3 py-2.5">
              <CalendarLucide size={15} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as typeof dateRange)}
                className="bg-transparent outline-none text-sm dark:text-neutral-100"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger>
                    <button className="flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm hover:bg-[#161616] transition-colors">
                      <CalendarLucide size={15} className="text-neutral-500 dark:text-neutral-500" />
                      {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Start Date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date: Date | undefined) => setCustomStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
                <ArrowRight size={15} className="text-neutral-500 dark:text-neutral-500" />
                <Popover>
                  <PopoverTrigger>
                    <button className="flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm hover:bg-[#161616] transition-colors">
                      <CalendarLucide size={15} className="text-neutral-500 dark:text-neutral-500" />
                      {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'End Date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date: Date | undefined) => setCustomEndDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* History table */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 dark:text-neutral-500 border-b border-neutral-200 dark:border-[#1a1a1a]">
                    <th className="font-medium px-5 py-3">Date & Time</th>
                    <th className="font-medium px-5 py-3">Type</th>
                    <th className="font-medium px-5 py-3">Item</th>
                    <th className="font-medium px-5 py-3">Stock Level</th>
                    <th className="font-medium px-5 py-3">Change</th>
                    <th className="font-medium px-5 py-3">User</th>
                    <th className="font-medium px-5 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((entry, index) => {
                    const stockChange = getStockChange(entry, index);
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-[#161616] last:border-0 hover:bg-[#151515] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="dark:text-neutral-100">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-500">{format(new Date(entry.date), 'h:mm a')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            entry.itemType === 'RECIPE' 
                              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' 
                              : 'bg-blue-900/30 text-blue-400 border border-blue-800/40'
                          }`}>
                            {entry.itemType === 'RECIPE' ? 'Recipe' : 'Product'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424] flex items-center justify-center shrink-0 ${
                              entry.itemType === 'RECIPE' ? 'bg-emerald-950/40 border-emerald-800/40' : ''
                            }`}>
                              <Box size={14} className={`text-neutral-500 dark:text-neutral-500 ${
                                entry.itemType === 'RECIPE' ? 'text-emerald-400' : ''
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium dark:text-neutral-100 leading-none">{entry.product?.name || 'Unknown Item'}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">{entry.product?.sku || 'Unknown SKU'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium dark:text-neutral-100">{entry.stockLevel}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {stockChange !== null ? (
                            <div className="flex items-center gap-1">
                              {stockChange > 0 ? (
                                <TrendingUp size={14} className="text-emerald-400" />
                              ) : stockChange < 0 ? (
                                <TrendingDown size={14} className="text-fuchsia-400" />
                              ) : null}
                              <span className={stockChange > 0 ? "text-emerald-400" : stockChange < 0 ? "text-fuchsia-400" : "text-neutral-400 dark:text-neutral-400"}>
                                {stockChange > 0 ? '+' : ''}{stockChange}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-500 dark:text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424] flex items-center justify-center">
                              <User size={12} className="text-neutral-500 dark:text-neutral-500" />
                            </div>
                            <span className="text-neutral-300">{entry.user?.name || 'Unknown User'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {entry.reason ? (
                            <span className="text-neutral-400 dark:text-neutral-400 text-xs">{entry.reason}</span>
                          ) : (
                            <span className="text-neutral-600 text-xs">No reason provided</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-neutral-500 dark:text-neutral-500 text-sm">
                        No stock history found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  iconRing,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconRing: string;
  label: string;
  value: number;
  sub: string;
}) => (
  <div className="flex items-center justify-between bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl px-5 py-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${iconRing}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">{label}</p>
        <p className="text-xl font-bold dark:text-neutral-100 leading-tight">{value}</p>
        <p className="text-[11px] text-neutral-600">{sub}</p>
      </div>
    </div>
  </div>
);

export default StockHistory;