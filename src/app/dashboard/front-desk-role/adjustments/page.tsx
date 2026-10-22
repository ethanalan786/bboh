"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FdrDashboardHeader } from '@/components/front-desk-role/fdr-dashboard-header';
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
  Edit,
  Trash2,
  Clock,
  PackageSearch,
  ShoppingCart,
  X,
  Check
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

interface Sale {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    sellingPrice: number;
  };
  userId: string;
  quantity: number;
  totalPrice: number;
  saleDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isBurnBoxSale?: boolean;
  orderId?: string | null;
}

const Adjustments = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good Morning");
  const [currentTime, setCurrentTime] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editReason, setEditReason] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
              sellingPrice: sale.unitPrice
            },
            userId: sale.userId,
            quantity: sale.quantity,
            totalPrice: sale.totalPrice,
            saleDate: sale.saleDate,
            createdAt: sale.createdAt,
            updatedAt: sale.createdAt,
            isBurnBoxSale: true
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
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditQuantity(sale.quantity);
    setEditReason("");
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingSale) return;

    const nextQuantity = Number(editQuantity);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 0 || !Number.isInteger(nextQuantity)) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (nextQuantity === editingSale.quantity && !editReason.trim()) {
      setEditDialogOpen(false);
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: nextQuantity,
          reason: editReason.trim()
        })
      });

      if (response.ok) {
        const allSales = await fetchAllSales();
        setSales(allSales);
        setEditDialogOpen(false);
        setEditingSale(null);
        setEditQuantity(0);
        setEditReason('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to adjust sale');
      }
    } catch (error) {
      console.error('Error adjusting sale:', error);
      alert('Failed to adjust sale');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (sale: Sale) => {
    setDeletingSale(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSale) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/sales/${deletingSale.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const allSales = await fetchAllSales();
        setSales(allSales);
        setDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete sale');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete sale');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchAllSales = async () => {
    const [salesResponse, burnboxResponse] = await Promise.all([
      fetch('/api/sales/user'),
      fetch('/api/burnbox-sales')
    ]);

    const allSales: Sale[] = [];

    if (salesResponse.ok) {
      const data = await salesResponse.json();
      allSales.push(...data);
    }

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
          sellingPrice: sale.unitPrice
        },
        userId: sale.userId,
        quantity: sale.quantity,
        totalPrice: sale.totalPrice,
        saleDate: sale.saleDate,
        createdAt: sale.createdAt,
        updatedAt: sale.createdAt,
        isBurnBoxSale: true
      }));
      allSales.push(...burnboxSales);
    }

    allSales.sort((a, b) => {
      const dateA = new Date(a.saleDate);
      const dateB = new Date(b.saleDate);
      return dateB.getTime() - dateA.getTime();
    });

    return allSales;
  };

  const filteredSales = sales.filter(sale => {
    const query = searchQuery.toLowerCase();
    const productName = sale.product?.name?.toLowerCase() || '';
    const sku = sale.product?.sku?.toLowerCase() || '';
    const category = sale.product?.category?.toLowerCase() || '';
    return productName.includes(query) || sku.includes(query) || category.includes(query);
  });

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden font-saprona bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FdrSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FdrDashboardHeader
          placeholder="Search sales to adjust..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Sale Adjustments</h1>
              <p className="text-neutral-500 text-sm mt-1">Edit or delete recorded sales if mistakes were made.</p>
            </div>
            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-3">
              <Clock size={15} className="text-neutral-500" />
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Today</p>
                <p className="text-xs text-neutral-500">{currentTime}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSales.length === 0 ? (
            <Empty className="border border-dashed border-neutral-200 dark:border-[#1e1e1e] bg-neutral-100 dark:bg-[#111]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart className="text-neutral-500" />
                </EmptyMedia>
                <EmptyTitle className="text-neutral-900 dark:text-neutral-100">
                  {searchQuery ? "No Sales Found" : "No Sales to Adjust"}
                </EmptyTitle>
                <EmptyDescription className="text-neutral-500">
                  {searchQuery 
                    ? "Try a different search term."
                    : "Start recording sales to see adjustments here."
                  }
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <button 
                    onClick={() => router.push('/dashboard/front-desk-role/record-sale')}
                    className="bg-[#668e2b] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#668e2b]/90 transition-colors"
                  >
                    Record a Sale
                  </button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1e1e1e] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[80px_1fr_100px_100px_120px_140px] gap-4 px-6 py-3 border-b border-neutral-200 dark:border-[#1e1e1e] text-xs font-semibold text-neutral-500">
                <div>Date</div>
                <div>Product</div>
                <div>Category</div>
                <div>Quantity</div>
                <div className="text-right">Total</div>
                <div className="text-right">Actions</div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-[#1e1e1e]">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="grid grid-cols-[80px_1fr_100px_100px_120px_140px] gap-4 px-6 py-4 items-center hover:bg-neutral-200 dark:hover:bg-[#161616] transition-colors"
                  >
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {new Date(sale.saleDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{sale.product?.name || 'Unknown'}</div>
                      <div className="text-xs text-neutral-500">{sale.product?.sku || ''}</div>
                    </div>
                    
                    <div>
                      <Badge 
                        variant="outline" 
                        className={
                          sale.product?.category === 'BURN_BOX' 
                            ? "bg-emerald-900/60 text-emerald-400 border-emerald-800/40"
                            : "bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-800/40"
                        }
                      >
                        {sale.product?.category === 'BURN_BOX' ? 'Burn Box' : 'Apparel'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-neutral-600 dark:text-neutral-300">{sale.quantity}</div>
                    
                    <div className="text-right font-medium text-neutral-900 dark:text-neutral-100">
                      ${sale.totalPrice.toFixed(2)}
                    </div>
                    
                    <div className="flex items-center justify-end gap-2">
                      {sale.isBurnBoxSale ? (
                        <span className="text-xs text-neutral-500 italic" title="Burn Box sales cannot be adjusted">
                          Cannot adjust
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(sale)}
                            className="p-2 rounded-lg bg-neutral-200 dark:bg-[#1a1a1a] hover:bg-neutral-300 dark:hover:bg-[#222] text-neutral-600 dark:text-neutral-400 transition-colors"
                            title="Edit sale"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sale)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            title="Delete sale"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[min(92vw,560px)] rounded-2xl border border-neutral-300 dark:border-[#2a2a2a] bg-white dark:bg-[#111] text-neutral-900 dark:text-neutral-100 shadow-2xl shadow-black/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Adjust Sale</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Update the quantity for {editingSale?.product?.name} and keep an audit trail of the change.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">New Quantity</label>
              <Input
                type="number"
                min="0"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number.parseInt(e.target.value, 10) || 0)}
                className="bg-neutral-100 dark:bg-[#1a1a1a] border-neutral-200 dark:border-[#242424] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">Reason for Adjustment (Optional)</label>
              <Textarea
                placeholder="Why are you adjusting this sale?"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="min-h-[90px] bg-neutral-100 dark:bg-[#1a1a1a] border-neutral-200 dark:border-[#242424] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-500"
              />
            </div>

            {editingSale && (
              <div className="rounded-xl border border-neutral-200 dark:border-[#1f1f1f] bg-neutral-100 dark:bg-[#1a1a1a] p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Current Quantity</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{editingSale.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">New Quantity</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{editQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Current Total</span>
                  <span className="text-neutral-900 dark:text-neutral-100">${editingSale.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-neutral-500 dark:text-neutral-400">New Total</span>
                  <span className="text-[#668e2b]">${((editingSale.product?.sellingPrice || 0) * editQuantity).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-neutral-200 dark:border-[#242424] bg-neutral-100 dark:bg-[#1a1a1a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#222]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="bg-[#668e2b] text-black hover:bg-[#7a9f3a]"
            >
              {editLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Save Adjustment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl border border-neutral-300 dark:border-[#2a2a2a] bg-white dark:bg-[#111] text-neutral-900 dark:text-neutral-100 shadow-2xl shadow-black/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Sale</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete this sale? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deletingSale && (
            <div className="bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{deletingSale.product?.name}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {deletingSale.quantity} x ${deletingSale.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-neutral-200 dark:border-[#242424] bg-neutral-100 dark:bg-[#1a1a1a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#222]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Adjustments;