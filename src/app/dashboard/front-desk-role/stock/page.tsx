"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FdrDashboardHeader } from '@/components/front-desk-role/fdr-dashboard-header';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { GooeyInput } from '@/components/ui/gooey-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import NumberFlow from "@number-flow/react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Box,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  History,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Search,
  X,
  XCircle
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string | number;
  name: string;
  variant?: string;
  category: string;
  sku: string;
  stock: number;
  price: number;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  isRecipe?: boolean;
  limitingIngredient?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  BURN_BOX: "Smoothies",
  APPAREL: "Apparel",
  DRINKS: "Drinks",
  ACCESSORIES: "Accessories",
  WOMENS_APPAREL: "Women's Apparel",
  MENS_APPAREL: "Men's Apparel",
};

const STATUS_META = {
  in: { label: "In Stock", dot: "bg-emerald-400", badge: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" },
  low: { label: "Low Stock", dot: "bg-amber-400", badge: "bg-amber-950/60 text-amber-400 border-amber-800/40" },
  out: { label: "Out of Stock", dot: "bg-fuchsia-400", badge: "bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-800/40" },
} as const;

// Shared classes for the small square icon buttons (larger touch target below lg, where cards are shown)
const ICON_BTN =
  "w-9 h-9 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg border border-neutral-300 dark:border-[#242424] hover:bg-neutral-200 dark:hover:bg-[#1a1a1a] transition-colors";

const StockAvailability = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [recipeLowStockThreshold, setRecipeLowStockThreshold] = useState(3);

  const getStatus = (stock: number, isRecipe: boolean = false) => {
    if (stock === 0) return "out";
    const threshold = isRecipe ? recipeLowStockThreshold : lowStockThreshold;
    if (stock < threshold) return "low";
    return "in";
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          if (settings.lowStockThreshold) {
            setLowStockThreshold(settings.lowStockThreshold);
          }
        }
      } catch (e) {
        console.error('Error fetching settings:', e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

  const [currentTime, setCurrentTime] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockValue, setStockValue] = useState<number>(0);
  const [stockReason, setStockReason] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState<Date>(new Date());
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentProductStock, setCurrentProductStock] = useState<number>(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
          " • " +
          now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products/fdr');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          console.error('Failed to fetch products:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        query.trim() === "" ||
        (p.name?.toLowerCase() || "").includes(query.toLowerCase()) ||
        (p.sku?.toLowerCase() || "").includes(query.toLowerCase()) ||
        (CATEGORY_LABELS[p.category] ?? p.category).toLowerCase().includes(query.toLowerCase()) ||
        ((p as any).isRecipe && "recipe".includes(query.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || getStatus(p.stock, (p as any).isRecipe) === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, categoryFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => getStatus(p.stock, (p as any).isRecipe) === "in").length;
    const low = products.filter((p) => getStatus(p.stock, (p as any).isRecipe) === "low").length;
    const out = products.filter((p) => getStatus(p.stock, (p as any).isRecipe) === "out").length;
    return { total, inStock, low, out };
  }, [products]);

  const resetFilters = () => {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const handleStartEditStock = (product: Product) => {
    // Prevent editing stock for recipes - their stock is calculated from ingredients
    if ((product as any).isRecipe) {
      toast.add({
        type: "error",
        description: "Recipe stock is automatically calculated from ingredients. Manage ingredient stock instead.",
      });
      return;
    }
    
    setEditingProduct(product);
    setStockValue(product.stock);
    setStockReason("");
    setCurrentProductStock(product.stock);
    setAdjustmentDate(new Date());
    setShowEditDialog(true);
  };

  const handleCancelEditStock = () => {
    setShowEditDialog(false);
    setEditingProduct(null);
    setStockValue(0);
    setStockReason("");
    setAdjustmentDate(new Date());
    setCurrentProductStock(0);
  };

  const handleSaveStock = async () => {
    if (!editingProduct || !session?.user?.id) return;

    // Prevent decreasing stock - should only be done through sales
    if (stockValue < currentProductStock) {
      toast.add({
        type: "error",
        description: "Stock level cannot be decreased. Use 'Record a Sale' to reduce inventory.",
      });
      return;
    }

    setUpdatingStock(true);
    try {
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: editingProduct.id,
          quantity: stockValue,
          reason: stockReason,
          adjustmentDate: adjustmentDate.toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }

      const data = await response.json();
      toast.add({
        type: "success",
        description: `Stock updated successfully for ${format(adjustmentDate, 'PPP')}!`,
      });

      // Refresh products
      const productsResponse = await fetch('/api/products/fdr');
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to refresh products:', productsResponse.status, productsResponse.statusText);
      }

      handleCancelEditStock();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : 'Failed to update stock',
      });
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleQuickStockChange = (product: Product, delta: number) => {
    // Prevent editing stock for recipes - their stock is calculated from ingredients
    if ((product as any).isRecipe) {
      toast.add({
        type: "error",
        description: "Recipe stock is automatically calculated from ingredients. Manage ingredient stock instead.",
      });
      return;
    }
    
    // Only allow increasing stock, not decreasing
    if (delta < 0) {
      toast.add({
        type: "error",
        description: "Stock level cannot be decreased. Use 'Record a Sale' to reduce inventory.",
      });
      return;
    }
    
    const newValue = product.stock + delta;
    setEditingProduct(product);
    setStockValue(newValue);
    setStockReason("");
    setAdjustmentDate(new Date());
    setCurrentProductStock(product.stock);
    setShowEditDialog(true);
  };

  const handleViewHistory = async (productId: string) => {
    setViewingHistory(productId);
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/stock/transactions?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setStockHistory(data.transactions || []);
      } else {
        console.error('Failed to fetch stock history:', response.status, response.statusText);
        toast.add({
          type: "error",
          description: "Failed to load stock history",
        });
      }
    } catch (error) {
      console.error('Failed to fetch stock history:', error);
      toast.add({
        type: "error",
        description: "Failed to load stock history",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Product cell (image + name + variant + limiting ingredient) - shared by table and cards
  const renderProductInfo = (product: Product) => (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 lg:w-9 lg:h-9 rounded-lg dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424] flex items-center justify-center shrink-0 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Box size={15} className="text-neutral-500" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-medium dark:text-neutral-100 leading-tight">
          {product.name}
          {(product as any).isRecipe && (
            <span className="ml-2 text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">Recipe</span>
          )}
        </p>
        {product.variant && (
          <p className="text-xs text-neutral-500 mt-1">{product.variant}</p>
        )}
        {(product as any).limitingIngredient && (
          <p className="text-xs text-amber-400 mt-1">
            Limited by: {(product as any).limitingIngredient}
          </p>
        )}
      </div>
    </div>
  );

  // Status pill - shared by table and cards
  const renderStatusBadge = (product: Product) => {
    const st = getStatus(product.stock, (product as any).isRecipe);
    const meta = STATUS_META[st];
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    );
  };

  // Row actions - shared by table and cards
  const renderActions = (product: Product) => {
    if ((product as any).isRecipe) {
      return (
        <span className="text-xs text-neutral-500 italic">
          Auto-calculated
        </span>
      );
    }

    if (editingProduct?.id === product.id) {
      return (
        <>
          <button
            onClick={handleSaveStock}
            disabled={updatingStock}
            className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-400 rounded-lg px-3 py-2 lg:py-1.5 transition-colors disabled:opacity-50"
          >
            {updatingStock ? 'Saving...' : <><Save size={13} /> Save</>}
          </button>
          <button
            onClick={handleCancelEditStock}
            className={`${ICON_BTN} text-neutral-400`}
          >
            <X size={14} />
          </button>
        </>
      );
    }

    return (
      <>
        <button
          onClick={() => handleQuickStockChange(product, 1)}
          className={`${ICON_BTN} text-neutral-400`}
          title="Add 1 to stock"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => handleStartEditStock(product)}
          className="flex items-center gap-1.5 text-xs font-medium dark:bg-[#1a1a1a] hover:bg-[#222] border border-neutral-300 dark:border-[#242424] rounded-lg px-3 h-9 lg:h-auto lg:py-1.5 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => handleViewHistory(product.id as string)}
          className={ICON_BTN}
          title="View stock history"
        >
          <History size={14} className="text-neutral-400" />
        </button>
        <button
          onClick={() => handleView(product)}
          className={ICON_BTN}
        >
          <ChevronRight size={14} className="text-neutral-500" />
        </button>
      </>
    );
  };

  if (status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center dark:bg-black dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <SidebarProvider>
      {/* w-full + flex-1 is what makes the page fill the whole viewport inside SidebarProvider's flex container */}
      <div className="flex h-dvh w-full flex-1 min-w-0 overflow-hidden font-saprona dark:bg-black dark:text-neutral-100">
        <FdrSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <FdrDashboardHeader
            placeholder="Search products, categories, or SKU..."
            showSidebarTrigger={true}
          />

          <main className="flex-1 overflow-y-auto w-full p-3 sm:p-5 lg:p-8">
            {/* Title row */}
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5 sm:mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full border border-emerald-800/40 bg-emerald-940/40 flex items-center justify-center">
                  <Box size={18} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold dark:text-neutral-100">Stock Availability</h1>
                  <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">
                    Check real-time stock levels, manage inventory, and avoid running out of your best sellers.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 xl:flex items-stretch xl:items-center gap-2 sm:gap-3">
                <button
                  onClick={() => router.push('/dashboard/front-desk-role/stock/history')}
                  className="flex items-center gap-2 text-left bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-neutral-200 dark:bg-[#161616] transition-colors min-w-0"
                >
                  <History size={15} className="text-neutral-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">View History</p>
                    <p className="text-xs text-neutral-500 truncate">Full timeline</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 sm:gap-3 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 min-w-0">
                  <CalendarIcon size={15} className="text-neutral-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">Last Updated</p>
                    <p className="text-xs text-neutral-500 truncate">{currentTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
              <StatCard
                icon={<Box size={18} className="text-emerald-400" />}
                iconRing="border-emerald-800/40 bg-emerald-950/40"
                label="Total Items"
                value={counts.total}
                sub="Products in inventory"
              />
              <StatCard
                icon={<CheckCircle2 size={18} className="text-emerald-400" />}
                iconRing="border-emerald-800/40 bg-emerald-950/40"
                label="In Stock"
                value={counts.inStock}
                sub="Items available"
              />
              <StatCard
                icon={<AlertTriangle size={18} className="text-amber-400" />}
                iconRing="border-amber-800/40 bg-amber-950/40"
                label="Low Stock"
                value={counts.low}
                sub="Running low"
              />
              <StatCard
                icon={<XCircle size={18} className="text-fuchsia-400" />}
                iconRing="border-fuchsia-800/40 bg-fuchsia-950/40"
                label="Out of Stock"
                value={counts.out}
                sub="Currently unavailable"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-2.5">
                <Search size={15} className="text-neutral-500 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product name, SKU, or category..."
                  className="bg-transparent outline-none text-sm w-full min-w-0 placeholder:text-neutral-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-3">
                <div className="min-w-0">
                  <Combobox
                    items={["all", ...categories]}
                    value={categoryFilter}
                    onValueChange={(value) => setCategoryFilter(value ?? "all")}
                  >
                    <ComboboxInput placeholder="All Categories" className="w-full" />
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
                </div>

                <div className="min-w-0">
                  <Combobox
                    items={["all", "in", "low", "out"]}
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value ?? "all")}
                  >
                    <ComboboxInput placeholder="All Stock Status" className="w-full" />
                    <ComboboxContent>
                      <ComboboxEmpty>No status found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item === "all" ? "All Stock Status" : 
                             item === "in" ? "In Stock" : 
                             item === "low" ? "Low Stock" : "Out of Stock"}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                <button
                  onClick={resetFilters}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-200 dark:bg-[#161616] transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
            </div>

            {/* Table (lg and up) / Cards (below lg) */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Large-screen table */}
                <div className="hidden lg:block w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200 dark:border-[#1a1a1a]">
                          <th className="font-medium px-4 xl:px-6 py-3">Product</th>
                          <th className="font-medium px-4 xl:px-6 py-3">Category</th>
                          <th className="font-medium px-4 xl:px-6 py-3">SKU</th>
                          <th className="font-medium px-4 xl:px-6 py-3">Stock Level</th>
                          <th className="font-medium px-4 xl:px-6 py-3">Status</th>
                          <th className="font-medium px-4 xl:px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((product) => (
                          <tr
                            key={product.id}
                            className="border-b border-[#161616] last:border-0 hover:bg-[#151515] transition-colors"
                          >
                            <td className="px-4 xl:px-6 py-3.5">
                              {renderProductInfo(product)}
                            </td>
                            <td className="px-4 xl:px-6 py-3.5 text-neutral-400">
                              {CATEGORY_LABELS[product.category] ?? product.category}
                            </td>
                            <td className="px-4 xl:px-6 py-3.5 text-neutral-400 whitespace-nowrap">{product.sku}</td>
                            <td className="px-4 xl:px-6 py-3.5">
                              <NumberFlow value={product.stock} className="text-neutral-300" />
                            </td>
                            <td className="px-4 xl:px-6 py-3.5">
                              {renderStatusBadge(product)}
                            </td>
                            <td className="px-4 xl:px-6 py-3.5">
                              <div className="flex items-center justify-end gap-2">
                                {renderActions(product)}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filtered.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-neutral-500 text-sm">
                              No products match your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cards: phones and tablets (2 columns from sm) */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((product) => (
                    <div
                      key={product.id}
                      className="bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-4 space-y-3 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 text-sm">
                          {renderProductInfo(product)}
                        </div>
                        <div className="shrink-0">
                          {renderStatusBadge(product)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="text-neutral-500 mb-0.5">Category</p>
                          <p className="text-neutral-400 truncate">{CATEGORY_LABELS[product.category] ?? product.category}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-neutral-500 mb-0.5">SKU</p>
                          <p className="text-neutral-400 truncate">{product.sku}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-neutral-500 mb-0.5">Stock</p>
                          <NumberFlow value={product.stock} className="text-neutral-300 text-sm font-semibold" />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-[#1a1a1a]">
                        {renderActions(product)}
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="col-span-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl px-5 py-12 text-center text-neutral-500 text-sm">
                      No products match your filters.
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        {/* Stock History Modal */}
        <Dialog open={viewingHistory !== null} onOpenChange={(open) => !open && setViewingHistory(null)}>
          <DialogContent className="bg-neutral-100 dark:bg-[#111] border-neutral-200 dark:border-[#1a1a1a] dark:text-neutral-100 w-[calc(100%-1.5rem)] sm:w-full max-w-2xl max-h-[85vh] overflow-hidden p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold">Stock History</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stockHistory.length > 0 ? (
                <div className="space-y-3">
                  {stockHistory.map((entry) => (
                    <div key={entry.id} className="dark:bg-[#161616] border border-neutral-300 dark:border-[#242424] rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CalendarIcon size={14} className="text-neutral-500 shrink-0" />
                          <span className="text-xs sm:text-sm dark:text-neutral-100">
                            {format(new Date(entry.date), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-emerald-400 shrink-0">{entry.stockLevel}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400">
                        <span>By {entry.user?.name || 'Unknown'}</span>
                        {entry.reason && <span>• {entry.reason}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  No stock history available for this product
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => !open && handleCancelEditStock()}>
          <DialogContent className="bg-neutral-100 dark:bg-[#111] border-neutral-200 dark:border-[#1a1a1a] dark:text-neutral-100 w-[calc(100%-1.5rem)] sm:w-full max-w-md max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold">Adjust Stock Level</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Update inventory for {editingProduct?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2 sm:py-4">
              {/* Current Stock Display */}
              <div className="dark:bg-[#161616] border border-neutral-300 dark:border-[#242424] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Current Stock</p>
                    <NumberFlow value={currentProductStock} className="text-2xl font-bold dark:text-neutral-100" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-500 mb-1">New Stock</p>
                    <NumberFlow value={stockValue} className="text-2xl font-bold text-[#668e2b]" />
                  </div>
                </div>
              </div>

              {/* Stock Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-neutral-100">New Stock Level</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 dark:bg-[#1a1a1a] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-neutral-300 dark:border-[#242424] focus-within:border-[#668e2b] focus-within:ring-1 focus-within:ring-[#668e2b] transition-all">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={currentProductStock.toString()}
                      value={stockValue}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setStockValue(Math.max(currentProductStock, newValue));
                      }}
                      onBlur={() => {
                        setStockValue((prev) => Math.max(currentProductStock, prev));
                      }}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white outline-none"
                    />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (stockValue > currentProductStock) {
                          setStockValue(stockValue - 1);
                        }
                      }}
                      disabled={stockValue <= currentProductStock}
                      className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg dark:bg-[#1a1a1a] hover:bg-neutral-300 dark:hover:bg-[#222] border border-neutral-300 dark:border-[#242424] text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                      <Minus size={20} />
                    </button>
                    <button
                      onClick={() => setStockValue(stockValue + 1)}
                      className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-[#668e2b] hover:bg-[#7a9f3a] border border-[#668e2b] text-white transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-neutral-500">Stock can only be increased. Use "Record a Sale" to decrease inventory.</p>
              </div>

              {/* Date Selection */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium dark:text-neutral-100">Adjustment Date</label>
                <Popover>
                  <PopoverTrigger>
                    <button
                      type="button"
                      className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        adjustmentDate.toDateString() === new Date().toDateString()
                          ? 'dark:bg-[#1a1a1a] border-neutral-300 dark:border-[#242424] text-neutral-300 hover:bg-[#222]'
                          : 'bg-[#668e2b]/10 border-[#668e2b]/40 text-[#668e2b] hover:bg-[#668e2b]/20'
                      }`}
                    >
                      <CalendarIcon size={16} />
                      <span className="text-sm">{format(adjustmentDate, 'PPP')}</span>
                      {adjustmentDate.toDateString() !== new Date().toDateString() && (
                        <span className="text-xs text-neutral-400">Backdated</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto max-w-[calc(100vw-1.5rem)] overflow-x-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={adjustmentDate}
                      onSelect={(selectedDate: Date | undefined) => selectedDate && setAdjustmentDate(selectedDate)}
                    />
                    {adjustmentDate.toDateString() !== new Date().toDateString() && (
                      <div className="p-3 border-t border-neutral-300 dark:border-[#242424]">
                        <button
                          onClick={() => setAdjustmentDate(new Date())}
                          className="w-full py-2 text-xs dark:hover:text-neutral-100 dark:bg-[#1a1a1a] hover:bg-[#222] rounded-lg transition-colors"
                        >
                          Reset to Today
                        </button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-neutral-100">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Restock from supplier"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full dark:bg-[#1a1a1a] rounded-lg px-4 py-3 dark:text-neutral-100 outline-none border-neutral-300 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
              <button
                onClick={handleCancelEditStock}
                className="flex-1 flex items-center justify-center gap-2 dark:bg-[#1a1a1a] hover:bg-[#222] border border-neutral-300 dark:border-[#242424] rounded-lg px-4 py-3 transition-colors text-neutral-300"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                disabled={updatingStock || (stockValue === currentProductStock && adjustmentDate.toDateString() === new Date().toDateString() && stockReason === '')}
                className="flex-1 flex items-center justify-center gap-2 bg-[#668e2b] hover:bg-[#7a9f3a] text-black font-medium rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStock ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Details Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} swipeDirection="right">
          <DrawerContent className="bg-linear-to-b from-[#0a0a0a] to-[#111] border-[#1e1e1e] dark:text-neutral-100">
            <div className="w-full max-w-xl mx-auto">
              <DrawerHeader className="border-b border-[#1e1e1e] pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-linear-to-br from-[#668e2b]/20 to-[#668e2b]/5 border border-[#668e2b]/30 flex items-center justify-center">
                      <Box size={20} className="text-[#668e2b]" />
                    </div>
                    <div className="min-w-0">
                      <DrawerTitle className="dark:text-neutral-100 text-lg font-semibold">Product Details</DrawerTitle>
                      <DrawerDescription className="text-neutral-400 text-xs">
                        Comprehensive product information
                      </DrawerDescription>
                    </div>
                  </div>
                  <DrawerClose className="w-9 h-9 sm:w-8 sm:h-8 shrink-0 rounded-lg bg-neutral-200 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424] hover:bg-[#222] transition-colors flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
                    <X size={18} />
                  </DrawerClose>
                </div>
              </DrawerHeader>

              {selectedProduct && (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(100dvh-100px)]">
                  {/* Product Image */}
                  <div className="relative group">
                    <div className="w-full aspect-square max-h-[45dvh] sm:max-h-none rounded-2xl overflow-hidden bg-neutral-200 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424]">
                      {selectedProduct.imageUrl ? (
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Box size={64} className="text-neutral-600 mx-auto mb-2" />
                            <p className="text-xs text-neutral-500">No image available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                        selectedProduct.stock > 10 
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' 
                          : selectedProduct.stock > 0 
                          ? 'bg-amber-950/60 text-amber-400 border-amber-800/40' 
                          : 'bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-800/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedProduct.stock > 10 ? 'bg-emerald-400' : 
                          selectedProduct.stock > 0 ? 'bg-amber-400' : 'bg-fuchsia-400'
                        }`} />
                        {selectedProduct.stock > 10 ? 'In Stock' : selectedProduct.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Product Name & Price */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold dark:text-neutral-100 leading-tight">{selectedProduct.name}</h2>
                        {selectedProduct.variant && (
                          <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded-md bg-neutral-200 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424] text-neutral-400">
                            {selectedProduct.variant}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl sm:text-2xl font-bold text-[#668e2b]">${selectedProduct.price.toFixed(2)}</p>
                        <p className="text-xs text-neutral-500">per unit</p>
                      </div>
                    </div>
                    {selectedProduct.description && (
                      <p className="text-sm text-neutral-400 leading-relaxed">{selectedProduct.description}</p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="min-w-0 bg-linear-to-br from-[#1a1a1a] to-[#151515] border border-neutral-300 dark:border-[#242424] rounded-xl p-2.5 sm:p-3 text-center">
                      <p className="text-xs text-neutral-500 mb-1">Stock</p>
                      <p className={`text-lg font-bold ${
                        selectedProduct.stock > 10 ? 'text-emerald-400' : 
                        selectedProduct.stock > 0 ? 'text-amber-400' : 'text-fuchsia-400'
                      }`}>
                        {selectedProduct.stock}
                      </p>
                    </div>
                    <div className="min-w-0 bg-linear-to-br from-[#1a1a1a] to-[#151515] border border-neutral-300 dark:border-[#242424] rounded-xl p-2.5 sm:p-3 text-center">
                      <p className="text-xs text-neutral-500 mb-1">SKU</p>
                      <p className="text-sm font-semibold dark:text-neutral-100 truncate">{selectedProduct.sku}</p>
                    </div>
                    <div className="min-w-0 bg-linear-to-br from-[#1a1a1a] to-[#151515] border border-neutral-300 dark:border-[#242424] rounded-xl p-2.5 sm:p-3 text-center">
                      <p className="text-xs text-neutral-500 mb-1">Category</p>
                      <p className="text-sm font-semibold dark:text-neutral-100 truncate">{CATEGORY_LABELS[selectedProduct.category] ?? selectedProduct.category}</p>
                    </div>
                  </div>

                  {/* Inventory Progress */}
                  <div className="bg-linear-to-br from-[#0d0d0d] to-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium dark:text-neutral-100">Inventory Level</p>
                      <span className={`text-xs font-semibold ${
                        selectedProduct.stock > 10 ? 'text-emerald-400' : 
                        selectedProduct.stock > 0 ? 'text-amber-400' : 'text-fuchsia-400'
                      }`}>
                        {selectedProduct.stock} units
                      </span>
                    </div>
                    <div className="relative h-3 bg-neutral-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                          selectedProduct.stock > 10 ? 'bg-linear-to-r from-emerald-500 to-emerald-400' : 
                          selectedProduct.stock > 0 ? 'bg-linear-to-r from-amber-500 to-amber-400' : 'bg-linear-to-r from-fuchsia-500 to-fuchsia-400'
                        }`}
                        style={{ width: `${Math.min(selectedProduct.stock * 5, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-neutral-500">
                      <span>0</span>
                      <span>20</span>
                      <span>40</span>
                      <span>60</span>
                      <span>80</span>
                      <span>100+</span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-linear-to-br from-[#0d0d0d] to-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-[#242424] flex items-center justify-center">
                        <Box size={14} className="text-neutral-400" />
                      </div>
                      <p className="text-sm font-semibold dark:text-neutral-100">Product Information</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 py-2 border-b border-[#1e1e1e]">
                        <span className="text-sm text-neutral-400">Brand</span>
                        <span className="text-sm font-medium dark:text-neutral-100 text-right">Burn Box</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b border-[#1e1e1e]">
                        <span className="text-sm text-neutral-400">Supplier</span>
                        <span className="text-sm font-medium dark:text-neutral-100 text-right">Default Supplier</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b border-[#1e1e1e]">
                        <span className="text-sm text-neutral-400">Category</span>
                        <span className="text-sm font-medium dark:text-neutral-100 text-right">{CATEGORY_LABELS[selectedProduct.category] ?? selectedProduct.category}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2">
                        <span className="text-sm text-neutral-400">Size/Variant</span>
                        <span className="text-sm font-medium dark:text-neutral-100 text-right">{selectedProduct.variant || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  {selectedProduct.createdAt && selectedProduct.updatedAt && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                      <CalendarIcon size={14} />
                      <span>Created: {new Date(selectedProduct.createdAt).toLocaleDateString()}</span>
                      <span className="text-neutral-700">•</span>
                      <span>Updated: {new Date(selectedProduct.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </SidebarProvider>
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
  value: number | string;
  sub: string;
}) => (
  <div className="flex items-center justify-between bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl px-3.5 sm:px-5 py-3 sm:py-4 min-w-0">
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 ${iconRing}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 truncate">{label}</p>
        <p className="text-lg sm:text-xl font-bold dark:text-neutral-100 leading-tight">{value}</p>
        <p className="text-[10px] sm:text-[11px] text-neutral-600 truncate">{sub}</p>
      </div>
    </div>
  </div>
);

export default StockAvailability;