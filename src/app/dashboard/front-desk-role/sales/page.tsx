"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import FDRProfileDropdown from '@/components/front-desk-role/fdr-profile-dropdown';
import { FDRThemeToggle } from '@/components/front-desk-role/fdr-theme-toggle';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { GooeyInput } from '@/components/ui/gooey-input';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Box,
  Clock,
  PackageSearch,
  ShoppingCart
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from "@/components/ui/toast"
import { columns, type Sale } from "./columns";
import { DataTable } from "./data-table";

interface StockProduct {
  id: string;
  name: string;
  quantity: number;
  bgColor: string;
  textColor: string;
  imageUrl?: string;
  visual: React.ReactNode;
}

const RecentSales = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good Morning");
  const [currentTime, setCurrentTime] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockItems, setStockItems] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

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
    async function fetchSales() {
      try {
        // Fetch both regular sales and burnbox sales
        const [salesResponse, burnboxResponse] = await Promise.all([
          fetch('/api/sales/user'),
          fetch('/api/burnbox-sales')
        ]);

        const allSales: Sale[] = [];

        // Process regular sales
        if (salesResponse.ok) {
          const data = await salesResponse.json();
          allSales.push(...data);
        }

        // Process burnbox sales
        if (burnboxResponse.ok) {
          const data = await burnboxResponse.json();
          const burnboxSales = (data.sales || []).map((sale: any) => ({
            id: sale.id,
            orderId: sale.orderId,
            productId: sale.recipeId,
            product: {
              id: sale.recipeId,
              name: sale.recipeName,
              sku: sale.recipeSku,
              category: 'BURN_BOX',
              price: sale.unitPrice
            },
            userId: sale.userId,
            quantity: sale.quantity,
            totalPrice: sale.totalPrice,
            saleDate: sale.saleDate,
            createdAt: sale.createdAt,
            updatedAt: sale.createdAt
          }));
          allSales.push(...burnboxSales);
        }

        // Sort by date descending
        allSales.sort((a, b) => {
          const dateA = new Date(a.saleDate);
          const dateB = new Date(b.saleDate);
          return dateB.getTime() - dateA.getTime();
        });

        setSales(allSales);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
        toast.add({
          type: "error",
          description: "Failed to fetch sales data",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  // Fetch stock items from API
  useEffect(() => {
    async function fetchStockItems() {
      try {
        const response = await fetch('/api/products/fdr');
        if (response.ok) {
          const data = await response.json();
          const items: StockProduct[] = (data.products || []).slice(0, 5).map((product: any) => {
            const category = product.category || 'APPAREL'
            return {
              id: product.id,
              name: product.name,
              quantity: product.stock,
              imageUrl: product.imageUrl,
              bgColor: category === 'BURN_BOX' 
                ? "bg-[#112214]" 
                : "bg-neutral-200 dark:bg-[#1a1a1a]",
              textColor: category === 'BURN_BOX' 
                ? "text-green-400" 
                : "text-neutral-300",
              visual: product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : getProductVisual(product.name, category, 'large')
            }
          })
          setStockItems(items)
        } else {
          toast.add({
            type: "error",
            description: "Failed to fetch stock data",
          });
        }
      } catch (error) {
        console.error('Failed to fetch stock items:', error)
        toast.add({
          type: "error",
          description: "Failed to fetch stock data",
        });
      } finally {
        setLoadingStock(false)
      }
    }
    fetchStockItems()
  }, [])

  // Helper function to get product visual
  const getProductVisual = (name: string, category: string, size: 'large' | 'small' = 'large'): React.ReactNode => {
    const lowerName = name?.toLowerCase() || ""

    if (category === 'BURN_BOX') {
      if (lowerName.includes('protein')) {
        if (size === 'small') {
          return (
            <div className="w-3 h-5 rounded-full bg-linear-to-b from-pink-400 to-pink-600" />
          )
        }
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-12 rounded-full bg-linear-to-b from-pink-400 to-pink-600 flex items-end justify-center pb-1 shadow-lg">
              <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>
        )
      }
      if (lowerName.includes('green')) {
        if (size === 'small') {
          return (
            <div className="w-3 h-5 rounded-full bg-linear-to-b from-green-400 to-green-600" />
          )
        }
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-12 rounded-full bg-linear-to-b from-green-400 to-green-600 flex items-end justify-center pb-1 shadow-lg">
              <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>
        )
      }
      if (size === 'small') {
        return (
          <div className="w-3 h-5 rounded-full bg-linear-to-b from-pink-400 to-pink-600" />
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-12 rounded-full bg-linear-to-b from-pink-400 to-pink-600 flex items-end justify-center pb-1 shadow-lg">
            <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
          </div>
        </div>
      )
    }
    
    // Apparel
    if (lowerName.includes('t-shirt') || lowerName.includes('tee')) {
      if (size === 'small') {
        return (
          <div className="relative w-5 h-4">
            <div className="absolute inset-0 bg-neutral-500 rounded-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#1e1e1e] rounded-b-full" />
          </div>
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-10 h-9">
            <div className="absolute inset-0 bg-[#2a2a2a] rounded-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#1e1e1e] rounded-b-full" />
            <div className="absolute top-0 left-0 w-2.5 h-3 bg-[#333] rounded-l-sm -translate-x-1" />
            <div className="absolute top-0 right-0 w-2.5 h-3 bg-[#333] rounded-r-sm translate-x-1" />
          </div>
        </div>
      )
    }
    if (lowerName.includes('legging')) {
      if (size === 'small') {
        return (
          <div className="flex gap-0.5 h-4 items-end">
            <div className="w-1 h-4 bg-neutral-400 rounded-b-sm" />
            <div className="w-1 h-4 bg-neutral-400 rounded-b-sm" />
          </div>
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex gap-1 h-12 items-end">
            <div className="w-3 h-10 bg-[#333] rounded-b-sm rounded-t-lg" />
            <div className="w-3 h-10 bg-[#333] rounded-b-sm rounded-t-lg" />
          </div>
        </div>
      )
    }
    if (lowerName.includes('cap')) {
      if (size === 'small') {
        return (
          <div className="relative w-5 h-3">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-neutral-400 rounded-t-full" />
            <div className="absolute bottom-0 left-0 w-5 h-0.5 bg-neutral-500 rounded-sm" />
          </div>
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-12 h-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-5 bg-[#2a2a2a] rounded-t-full" />
            <div className="absolute bottom-0 left-0 w-12 h-2 bg-[#333] rounded-sm" />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-5 h-3 bg-[#242424] rounded-t-sm" />
          </div>
        </div>
      )
    }
    // Default
    if (size === 'small') {
      return (
        <div className="relative w-5 h-4">
          <div className="absolute inset-0 bg-neutral-500 rounded-sm" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#1e1e1e] rounded-b-full" />
        </div>
      )
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-10 h-9">
          <div className="absolute inset-0 bg-[#2a2a2a] rounded-sm" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#1e1e1e] rounded-b-full" />
          <div className="absolute top-0 left-0 w-2.5 h-3 bg-[#333] rounded-l-sm -translate-x-1" />
          <div className="absolute top-0 right-0 w-2.5 h-3 bg-[#333] rounded-r-sm translate-x-1" />
        </div>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden font-saprona bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FdrSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 shrink-0 flex items-center justify-between px-6 gap-4 border-b border-neutral-200 dark:border-neutral-800 dark:border-[#1a1a1a] bg-white dark:bg-black">
          <GooeyInput 
            placeholder="Search sales, products, or dates..." 
            onServerSearch={async (query) => {
              try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=sales,products,recipes&limit=10`);
                if (response.ok) {
                  const data = await response.json();
                  return data.items.map((item: any) => ({
                    id: item.id,
                    label: item.name,
                    data: item
                  }));
                }
                return [];
              } catch (error) {
                console.error('Search error:', error);
                return [];
              }
            }}
            searchDebounce={300}
            minSearchLength={2}
            onResultSelect={(result) => {
              // Handle result selection - navigate to relevant page
              if (result.data.type === 'sale') {
                router.push(`/dashboard/front-desk-role/sales`);
              } else if (result.data.type === 'product') {
                router.push(`/dashboard/front-desk-role/record-sale`);
              } else if (result.data.type === 'recipe') {
                router.push(`/dashboard/front-desk-role/record-sale`);
              }
            }}
            renderResult={(result) => (
              <div className="flex flex-col">
                <span className="font-medium">{result.label}</span>
                <span className="text-xs text-muted-foreground">{result.data.description}</span>
              </div>
            )}
          />
          <div className="flex items-center gap-3">
            <FDRThemeToggle />
            <FDRProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">My Recent Sales</h1>
              <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1">View your recent sales history and transactions.</p>
            </div>
            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-3">
              <Clock size={15} className="text-neutral-500 dark:text-neutral-500" />
              <div>
                <p className="text-sm font-semibold">Today</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">{currentTime}</p>
              </div>
            </div>
          </div>

          {/* Quick Stock Overview */}
          <div className="bg-neutral-100 dark:bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Box size={15} className="text-neutral-500 dark:text-neutral-500" />
                <span className="text-sm font-semibold">
                  Quick Stock Overview
                </span>
              </div>
              <button 
                onClick={() => router.push('/dashboard/front-desk-role/stock')}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-xs text-neutral-600 mb-4">
              Current available stock (selected items)
            </p>

            <div className="grid grid-cols-5 gap-3">
              {loadingStock ? (
                <div className="col-span-5 flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stockItems.length === 0 ? (
                <Empty className="border border-dashed border-[#1e1e1e] bg-[#0d0d0d]">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <PackageSearch className="text-neutral-500 dark:text-neutral-500" />
                    </EmptyMedia>
                    <EmptyTitle className="text-neutral-900 dark:text-neutral-100">No Stock Data</EmptyTitle>
                    <EmptyDescription className="text-neutral-500 dark:text-neutral-500">
                      No products found in the database. Add products to see stock availability.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                stockItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-3 flex flex-col items-center text-center"
                  >
                    <div
                      className={cn(
                        "w-full h-52 rounded-lg mb-2 overflow-hidden",
                        item.bgColor
                      )}
                    >
                      {item.visual}
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-400 leading-tight mb-2">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-500">
                      <Box size={9} />
                      <span>{item.quantity} left</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sales.length === 0 ? (
            <Empty className="border border-dashed border-[#1e1e1e] bg-neutral-100 dark:bg-[#111]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart className="text-neutral-500 dark:text-neutral-500" />
                </EmptyMedia>
                <EmptyTitle className="text-neutral-900 dark:text-neutral-100">No Sales Yet</EmptyTitle>
                <EmptyDescription className="text-neutral-500 dark:text-neutral-500">
                  Start recording sales to see your history here.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <button 
                  onClick={() => router.push('/dashboard/front-desk-role/record-sale')}
                  className="bg-[#c8f135] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c8f135]/90 transition-colors"
                >
                  Record a Sale
                </button>
              </EmptyContent>
            </Empty>
          ) : (
            <DataTable columns={columns} data={sales} />
          )}
        </main>
      </div>
    </div>
  );
};

export default RecentSales;