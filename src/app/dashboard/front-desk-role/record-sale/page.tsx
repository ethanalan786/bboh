"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import FDRProfileDropdown from '@/components/front-desk-role/fdr-profile-dropdown';
import { FDRThemeToggle } from '@/components/front-desk-role/fdr-theme-toggle';
import { GooeyInput } from '@/components/ui/gooey-input';
import {
  Calendar,
  CreditCard,
  ShoppingCart,
  Shirt,
  Trash2,
  X,
  Zap,
  Percent,
  Search,
  AlertCircle,
  User,
  Wallet,
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from "@/components/ui/toast"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type CategoryTab = "All Products" | "Burn Box" | "Apparel";
type ProductCategory = string; // Will be category name from API

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: ProductCategory;
  imageUrl?: string;
  visual: React.ReactNode;
  badgeColor: string;
  sku?: string;
  description?: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

// ─────────────────────────────────────────────
// Product visuals (memoized for performance)
// ─────────────────────────────────────────────

const SmoothieCup = React.memo(({ color }: { color: "pink" | "green" | "purple" }) => {
  const gradients: Record<string, string> = {
    pink: "from-pink-400 to-pink-600",
    green: "from-green-400 to-green-600",
    purple: "from-purple-400 to-purple-600",
  };
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <div className="relative">
        {/* straw */}
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-1.5 h-6 rounded-full ${color === "pink" ? "bg-pink-300" : color === "green" ? "bg-green-300" : "bg-purple-300"} opacity-80`} />
        {/* cup body */}
        <div className={`w-14 h-16 rounded-b-2xl rounded-t-lg bg-gradient-to-b ${gradients[color]} shadow-lg relative overflow-hidden`}>
          <div className="absolute top-2 left-2 w-2 h-5 bg-white/20 rounded-full" />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/10 rounded-b-2xl" />
        </div>
        {/* lid */}
        <div className={`absolute -top-1 left-0 right-0 h-2 bg-gradient-to-r ${color === "pink" ? "from-pink-300 to-pink-500" : color === "green" ? "from-green-300 to-green-500" : "from-purple-300 to-purple-500"} rounded-full`} />
      </div>
    </div>
  );
});

const EnergyDrinkCan = React.memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="relative w-10 h-16">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-700 to-neutral-900 rounded-lg border border-neutral-600" />
      <div className="absolute inset-x-1 top-1 bottom-1 flex items-center justify-center">
        <Zap size={18} className="text-[#668e2b]" />
      </div>
      <div className="absolute top-0 left-0 right-0 h-2 bg-neutral-600 rounded-t-lg" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-neutral-600 rounded-b-lg" />
    </div>
  </div>
));

const TShirtVisual = React.memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="relative w-14 h-12">
      <div className="absolute inset-0 bg-neutral-800 rounded-sm" />
      {/* collar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-neutral-900 rounded-b-full border-t border-neutral-700" />
      {/* left sleeve */}
      <div className="absolute top-0 left-0 w-3 h-4 bg-neutral-700 rounded-l-sm -translate-x-1 rotate-[-15deg] origin-top-right" />
      {/* right sleeve */}
      <div className="absolute top-0 right-0 w-3 h-4 bg-neutral-700 rounded-r-sm translate-x-1 rotate-[15deg] origin-top-left" />
      {/* logo dot */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-neutral-600" />
    </div>
  </div>
));

const LeggingsVisual = React.memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="flex gap-1.5 items-end pb-1">
      <div className="w-4 h-12 bg-neutral-800 rounded-b-lg rounded-t-md border border-neutral-700" />
      <div className="w-2 h-4 bg-neutral-700 rounded-sm" />
      <div className="w-4 h-12 bg-neutral-800 rounded-b-lg rounded-t-md border border-neutral-700" />
    </div>
  </div>
));

const CapVisual = React.memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="relative w-16 h-10">
      {/* dome */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-7 bg-neutral-800 rounded-t-full border border-neutral-700" />
      {/* brim */}
      <div className="absolute bottom-1 left-0 right-0 h-2.5 bg-neutral-700 rounded-sm" />
      {/* button top */}
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neutral-600 rounded-full" />
      {/* logo */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-neutral-700 rounded-sm flex items-center justify-center">
        <div className="w-2 h-2 border border-neutral-500 rounded-sm" />
      </div>
    </div>
  </div>
));

const HoodieVisual = React.memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 bg-neutral-800 rounded-sm" />
      {/* hood */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-5 bg-neutral-700 rounded-t-2xl" />
      {/* collar detail */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-neutral-900 rounded-b-full" />
      {/* left sleeve */}
      <div className="absolute top-2 left-0 w-3 h-5 bg-neutral-700 rounded-l-sm -translate-x-1" />
      {/* right sleeve */}
      <div className="absolute top-2 right-0 w-3 h-5 bg-neutral-700 rounded-r-sm translate-x-1" />
      {/* pocket */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-neutral-700 rounded-sm" />
      {/* logo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-neutral-600" />
    </div>
  </div>
));

// Move outside component to avoid recreation on every render
const getProductVisual = (name: string, category: string): React.ReactNode => {
  const lowerName = name?.toLowerCase() || "";

  if (category === 'BURN_BOX') {
    if (lowerName.includes('protein')) return <SmoothieCup color="pink" />;
    if (lowerName.includes('green')) return <SmoothieCup color="green" />;
    if (lowerName.includes('berry')) return <SmoothieCup color="purple" />;
    if (lowerName.includes('energy')) return <EnergyDrinkCan />;
    return <SmoothieCup color="pink" />;
  }

  // Apparel
  if (lowerName.includes('t-shirt') || lowerName.includes('tee')) return <TShirtVisual />;
  if (lowerName.includes('legging')) return <LeggingsVisual />;
  if (lowerName.includes('cap')) return <CapVisual />;
  if (lowerName.includes('hoodie')) return <HoodieVisual />;
  return <TShirtVisual />;
};

// ─────────────────────────────────────────────
// Products data
// ─────────────────────────────────────────────

let ALL_PRODUCTS: Product[] = [];

const TAX_RATE = 0.08;

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const CategoryBadge = React.memo(({ category, colorClass }: { category: string; colorClass: string }) => {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${colorClass}`}>
      {category}
    </span>
  );
});

const SoldOutBadge = React.memo(() => {
  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="relative group">
        <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 animate-pulse">
          <AlertCircle size={10} />
          SOLD OUT
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-2 bg-destructive/30 blur-sm rounded-lg" />
        {/* Decorative corners */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-destructive/50 rounded-tl-sm" />
        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-destructive/50 rounded-tr-sm" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-destructive/50 rounded-bl-sm" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-destructive/50 rounded-br-sm" />
      </div>
    </div>
  );
});

const ProductCard = React.memo(({ 
  product, 
  onAdd 
}: { 
  product: Product; 
  onAdd: (product: Product) => void;
}) => {
  const isSoldOut = product.category === 'Apparel' && product.stock === 0;

  return (
    <div className={`bg-[#111111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 ${
      isSoldOut
        ? 'opacity-40 grayscale hover:opacity-50 cursor-not-allowed border-destructive/30'
        : 'hover:border-[#2a2a2a] hover:shadow-lg'
    }`}>
      {/* Visual area */}
      <div className="h-52 rounded-lg bg-[#0d0d0d] overflow-hidden relative">
        {product.visual}
        {isSoldOut && <SoldOutBadge />}
      </div>
      {/* Badge */}
      <CategoryBadge category={product.category} colorClass={product.badgeColor} />
      {/* Name & price */}
      <div>
        <p className="text-[13px] font-medium text-neutral-100 leading-tight">{product.name}</p>
        <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">${product.price.toFixed(2)}</p>
      </div>
      {/* Stock + Add button */}
      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[11px] ${isSoldOut ? 'text-destructive font-bold' : 'text-neutral-500'}`}>
          {isSoldOut ? 'Out of Stock' : 
           product.category === 'Burn Box' ? 'Available' : `Stock: ${product.stock}`}
        </span>
        {!isSoldOut && (
          <button
            onClick={() => onAdd(product)}
            className="w-6 h-6 rounded-full bg-[#668e2b]/10 border border-[#668e2b]/40 flex items-center justify-center text-[#668e2b] hover:bg-[#668e2b] hover:text-black transition-all duration-150 font-bold text-sm"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
});

const CartItemRow = React.memo(({ 
  item, 
  onInc, 
  onDec, 
  onRemove 
}: { 
  item: CartItem; 
  onInc: () => void; 
  onDec: () => void; 
  onRemove: () => void;
}) => {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-200 dark:border-[#1a1a1a] last:border-0">
      {/* Thumbnail */}
      <div className="w-12 h-12 shrink-0 rounded-lg bg-[#0d0d0d] overflow-hidden">
        {item.product.visual}
      </div>
      {/* Name / price */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-neutral-100 truncate">{item.product.name}</p>
        <p className="text-[12px] text-neutral-400">${item.product.price.toFixed(2)}</p>
      </div>
      {/* Qty controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDec}
          className="w-5 h-5 rounded bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-neutral-300 hover:bg-[#2a2a2a] transition-colors text-xs font-bold"
        >
          −
        </button>
        <span className="text-[13px] font-semibold w-5 text-center text-neutral-900 dark:text-neutral-100">{item.qty}</span>
        <button
          onClick={onInc}
          className="w-5 h-5 rounded bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-neutral-300 hover:bg-[#2a2a2a] transition-colors text-xs font-bold"
        >
          +
        </button>
      </div>
      {/* Line total */}
      <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 w-14 text-right">
        ${(item.product.price * item.qty).toFixed(2)}
      </span>
      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-neutral-600 hover:text-red-400 transition-colors ml-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
});

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

const RecordSale = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

  const [greeting, setGreeting] = useState("Good Morning");
  const [currentTime, setCurrentTime] = useState("");

  const [activeTab, setActiveTab] = useState<CategoryTab>("All Products");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // ── Auth ──────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

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

  // ── Fetch initial data (products, customers, payment methods) ────────────────────────
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        // Fetch all data in parallel for maximum speed
        const [recipesResponse, productsResponse, customersResponse, paymentMethodsResponse] = await Promise.all([
          fetch('/api/recipes?status=active'),
          fetch('/api/products/fdr'),
          fetch('/api/customers'),
          fetch('/api/payment-methods')
        ]);

        // Fetch customers
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData.customers || []);
        }

        // Fetch payment methods
        if (paymentMethodsResponse.ok) {
          const paymentMethodsData = await paymentMethodsResponse.json();
          setPaymentMethods(paymentMethodsData.paymentMethods || []);
        }

        // Process products
        const products: Product[] = [];

        // Add recipes as Burn Box products
        if (recipesResponse.ok) {
          const recipesData = await recipesResponse.json();
          const recipeProducts = recipesData.recipes.map((recipe: any) => ({
            id: recipe.id,
            name: recipe.name,
            price: recipe.sellingPrice,
            stock: 999, // Recipes are made from ingredients, not limited by stock
            category: 'Burn Box' as ProductCategory,
            imageUrl: recipe.imageUrl,
            sku: recipe.sku,
            description: recipe.description,
            badgeColor: "bg-emerald-900/60 text-emerald-400 border-emerald-800/40",
            visual: recipe.imageUrl ? (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : getProductVisual(recipe.name, 'BURN_BOX')
          }));
          products.push(...recipeProducts);
        }

        // Add apparel products
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const apparelProducts = productsData.products
            .filter((product: any) => product.category !== 'BURN_BOX')
            .map((product: any) => ({
              id: product.id,
              name: product.name,
              price: product.sellingPrice,
              stock: product.stock,
              category: 'Apparel' as ProductCategory,
              imageUrl: product.imageUrl,
              sku: product.sku,
              description: product.description,
              badgeColor: "bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-800/40",
              visual: product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : getProductVisual(product.name, 'APPAREL')
            }));
          products.push(...apparelProducts);
        }

        ALL_PRODUCTS = products;
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  // ── Cart logic (memoized for performance) ────────────────────────────
  const addToCart = useCallback(async (product: Product) => {
    // For recipes, check ingredient availability
    if (product.category === 'Burn Box') {
      try {
        const response = await fetch(`/api/recipes/check-availability?recipeId=${product.id}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.available) {
            toast.add({
              type: "error",
              description: data.message || "Some ingredients are out of stock",
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking recipe availability:', error);
        // Allow adding to cart even if check fails (fallback behavior)
      }
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = existing.qty + 1;
        // Don't enforce stock limits for recipes (they're made from ingredients)
        if (product.category === 'Apparel' && newQty > product.stock) {
          toast.add({
            type: "warning",
            description: `Only ${product.stock} ${product.stock === 1 ? 'item' : 'items'} available. You can add more stock in the inventory section.`,
          });
          return prev;
        }
        return prev.map((i) => i.product.id === product.id ? { ...i, qty: newQty } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === id);
      if (!item) return prev;
      
      const newQty = item.qty + delta;
      
      // Check if new quantity exceeds available stock (only for apparel)
      if (item.product.category === 'Apparel' && newQty > item.product.stock) {
        toast.add({
          type: "warning",
          description: `Only ${item.product.stock} ${item.product.stock === 1 ? 'item' : 'items'} available. You can add more stock in the inventory section.`,
        });
        return prev;
      }
      
      return prev
        .map((i) => i.product.id === id ? { ...i, qty: newQty } : i)
        .filter((i) => i.qty > 0);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercentage(0);
    setSelectedCustomerId('');
    setSelectedPaymentMethodId('');
  }, []);

  // ── Complete sale ─────────────────────────
  const completeSale = async () => {
    if (!session?.user?.id) {
      toast.add({
        type: "error",
        description: "You must be logged in to complete a sale",
      });
      return;
    }

    setLoading(true);

    try {
      // Separate cart into Burn Box recipes and Apparel products
      const burnBoxItems = cart.filter(item => item.product.category === 'Burn Box');
      const apparelItems = cart.filter(item => item.product.category === 'Apparel');

      // Process Burn Box sales
      for (const item of burnBoxItems) {
        const customer = customers.find(c => c.id === selectedCustomerId);
        const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);

        const response = await fetch('/api/burnbox-sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipeId: item.product.id,
            quantity: item.qty,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            customerId: selectedCustomerId || null,
            customerName: customer?.name || null,
            paymentMethodId: selectedPaymentMethodId || null,
            paymentMethod: paymentMethod?.name || null,
            notes: ''
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete Burn Box sale');
        }
      }

      // Process Apparel sales
      if (apparelItems.length > 0) {
        const items = apparelItems.map((item) => ({
          productId: item.product.id,
          quantity: item.qty,
          unitPrice: item.product.price,
          lineTotal: item.product.price * item.qty
        }));

        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items,
            customerId: selectedCustomerId || null,
            paymentMethodId: selectedPaymentMethodId || null,
            discountPercentage: discountPercentage,
            subtotal: apparelItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0),
            discountAmount: discountAmount,
            taxAmount: tax,
            totalAmount: apparelItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0)
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete Apparel sale');
        }
      }

      setCart([]);
      setDiscountPercentage(0);
      
      toast.add({
        type: "success",
        description: "Sale completed successfully!",
      });
      
      // Refresh products and recipes
      const [recipesResponse, productsResponse] = await Promise.all([
        fetch('/api/recipes?status=active'),
        fetch('/api/products/fdr')
      ]);

      const products: Product[] = [];

      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        const recipeProducts = recipesData.recipes.map((recipe: any) => ({
          id: recipe.id,
          name: recipe.name,
          price: recipe.sellingPrice,
          stock: 999,
          category: 'Burn Box' as ProductCategory,
          imageUrl: recipe.imageUrl,
          sku: recipe.sku,
          description: recipe.description,
          badgeColor: "bg-emerald-900/60 text-emerald-400 border-emerald-800/40",
          visual: recipe.imageUrl ? (
            <img 
              src={recipe.imageUrl} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : getProductVisual(recipe.name, 'BURN_BOX')
        }));
        products.push(...recipeProducts);
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const apparelProducts = productsData.products
          .filter((product: any) => product.category !== 'BURN_BOX')
          .map((product: any) => ({
            id: product.id,
            name: product.name,
            price: product.sellingPrice,
            stock: product.stock,
            category: 'Apparel' as ProductCategory,
            imageUrl: product.imageUrl,
            sku: product.sku,
            description: product.description,
            badgeColor: "bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-800/40",
            visual: product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : getProductVisual(product.name, 'APPAREL')
          }));
        products.push(...apparelProducts);
      }

      ALL_PRODUCTS = products;
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : 'Failed to complete sale',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Derived values (memoized for performance) ────────────────────────
  const filteredBurnBox = useMemo(() =>
    ALL_PRODUCTS.filter((p) => {
      const matchesCategory = p.category === "Burn Box" && (activeTab === "All Products" || activeTab === "Burn Box");
      const matchesSearch = searchQuery === '' || (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }), [ALL_PRODUCTS, activeTab, searchQuery]
  );

  const filteredApparel = useMemo(() =>
    ALL_PRODUCTS.filter((p) => {
      const matchesCategory = p.category === "Apparel" && (activeTab === "All Products" || activeTab === "Apparel");
      const matchesSearch = searchQuery === '' || (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }), [ALL_PRODUCTS, activeTab, searchQuery]
  );

  // Always show all products (sold out will be disabled with badge)
  const displayBurnBox = filteredBurnBox;
  const displayApparel = filteredApparel;

  const subtotal = useMemo(() => 
    cart.reduce((sum, i) => sum + i.product.price * i.qty, 0), [cart]
  );
  
  const discountAmount = useMemo(() => 
    subtotal * (discountPercentage / 100), [subtotal, discountPercentage]
  );
  
  const discountedSubtotal = useMemo(() => 
    subtotal - discountAmount, [subtotal, discountAmount]
  );
  
  const tax = useMemo(() => 
    discountedSubtotal * TAX_RATE, [discountedSubtotal]
  );
  
  const total = useMemo(() => 
    discountedSubtotal + tax, [discountedSubtotal, tax]
  );
  
  const totalItems = useMemo(() => 
    cart.reduce((sum, i) => sum + i.qty, 0), [cart]
  );

  // ── Loading / unauth ──────────────────────
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }
  if (status === "unauthenticated") return null;
  
  // Show skeleton loading while initial data is being fetched
  if (loading && ALL_PRODUCTS.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden font-sans bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
        <FdrSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-20 shrink-0 flex items-center justify-between px-6 gap-4 border-b border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-black">
            <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#111111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl p-3 flex flex-col gap-2">
                  <div className="h-52 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FdrSidebar />

      {/* ── Main area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-20 shrink-0 flex items-center justify-between px-6 gap-4 border-b border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-black">
          <GooeyInput placeholder="Search products, categories, or SKU..." />
          <div className="flex items-center gap-3">
            <FDRThemeToggle />
            <FDRProfileDropdown />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* ── Page heading row ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            {/* Left: title */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 mt-0.5 shrink-0">
                {/* Tag icon */}
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M4 4h10l14 14-10 10L4 14V4z" stroke="#668e2b" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="9" cy="9" r="1.5" fill="#668e2b" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Record a Burn Box Sale</h1>
                <p className="text-[13px] text-neutral-500 mt-0.5">Add products and complete a sale.</p>
              </div>
            </div>
            {/* Right: date + cancel */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl px-4 py-2.5">
                <Calendar size={15} className="text-neutral-500" />
                <div>
                  <p className="text-[11px] text-neutral-500 leading-none">Today</p>
                  <p className="text-[12px] text-neutral-200 mt-0.5 leading-none">{currentTime}</p>
                </div>
              </div>
              <button
                onClick={clearCart}
                disabled={totalItems < 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-800/50 text-red-400 bg-red-950/20 hover:bg-red-950/40 transition-colors text-[13px] font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X size={14} />
                Cancel Sale
              </button>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
            {/* ── LEFT: Products ──────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {(["All Products", "Burn Box", "Apparel"] as CategoryTab[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const isBurnBox = tab === "Burn Box";
                  const isApparel = tab === "Apparel";
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all duration-150
                        ${isActive && tab === "All Products" ? "bg-[#668e2b]/10 border-[#668e2b]/50 text-[#668e2b]" : ""}
                        ${isActive && isBurnBox ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-400" : ""}
                        ${isActive && isApparel ? "bg-fuchsia-900/30 border-fuchsia-700/50 text-fuchsia-400" : ""}
                        ${!isActive ? "bg-neutral-100 dark:bg-[#111] border-neutral-200 dark:border-[#1f1f1f] text-neutral-400 hover:border-[#2a2a2a] hover:text-neutral-200" : ""}
                      `}
                    >
                      {isBurnBox && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                          <path d="M8 2C5 5 3 7 5 10a4 4 0 007 0c1-2.5-1-5-4-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      )}
                      {isApparel && <Shirt size={14} />}
                      {!isBurnBox && !isApparel && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                          <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                          <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                          <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                          <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      )}
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Burn Box section */}
              {(displayBurnBox.length > 0) ? (
                <div className="bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 16 16" className="w-4 h-4 text-emerald-400" fill="none">
                        <path d="M8 2C5 5 3 7 5 10a4 4 0 007 0c1-2.5-1-5-4-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[14px] font-semibold text-neutral-100">Burn Box Products</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">{displayBurnBox.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {displayBurnBox.map((p) => (
                      <ProductCard key={p.id} product={p} onAdd={addToCart} />
                    ))}
                  </div>
                </div>
              ) : (
                activeTab === "All Products" || activeTab === "Burn Box" ? (
                  <div className="bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-8 text-center">
                    <Search size={32} className="text-neutral-600 mx-auto mb-3" />
                    <p className="text-[13px] text-neutral-400">No Burn Box products found matching "{searchQuery}"</p>
                  </div>
                ) : null
              )}

              {/* Apparel section */}
              {(displayApparel.length > 0) ? (
                <div className="bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shirt size={15} className="text-fuchsia-400" />
                      <span className="text-[14px] font-semibold text-neutral-100">Apparel</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">{displayApparel.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {displayApparel.map((p) => (
                      <ProductCard key={p.id} product={p} onAdd={addToCart} />
                    ))}
                  </div>
                </div>
              ) : (
                activeTab === "All Products" || activeTab === "Apparel" ? (
                  <div className="bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-8 text-center">
                    <Search size={32} className="text-neutral-600 mx-auto mb-3" />
                    <p className="text-[13px] text-neutral-400">No Apparel products found matching "{searchQuery}"</p>
                  </div>
                ) : null
              )}
            </div>

            {/* ── RIGHT: Current Sale panel ────────── */}
            <div className="w-full xl:w-[340px] flex-shrink-0">
              <div className="bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-4 sticky top-0">
                {/* Panel header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-neutral-300" />
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">Current Sale</span>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Cart items */}
                <div className="min-h-[80px]">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ShoppingCart size={24} className="text-neutral-700 mb-2" />
                      <p className="text-[12px] text-neutral-600">No items added yet.</p>
                      <p className="text-[11px] text-neutral-700 mt-0.5">Click + on a product to start.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <CartItemRow
                        key={item.product.id}
                        item={item}
                        onInc={() => updateQty(item.product.id, 1)}
                        onDec={() => updateQty(item.product.id, -1)}
                        onRemove={() => removeFromCart(item.product.id)}
                      />
                    ))
                  )}
                </div>

                {/* Customer Selection */}
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-neutral-400" />
                    <span className="text-[13px] text-neutral-400">Customer</span>
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full dark:bg-[#1a1a1a] rounded-lg px-3 py-2 text-[13px] dark:text-neutral-100 outline-none border dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b] transition-colors"
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.email ? `(${customer.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-neutral-400" />
                    <span className="text-[13px] text-neutral-400">Payment Method</span>
                  </div>
                  <select
                    value={selectedPaymentMethodId}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                    className="w-full dark:bg-[#1a1a1a] rounded-lg px-3 py-2 text-[13px] dark:text-neutral-100 outline-none border dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b] transition-colors"
                  >
                    <option value="">Select Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-200 dark:border-[#1a1a1a] my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="text-neutral-200">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Discount Input */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-neutral-400">Discount</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={discountPercentage}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setDiscountPercentage(isNaN(value) ? 0 : Math.min(100, Math.max(0, value)));
                          }}
                          className="w-16 bg-neutral-100 dark:bg-[#1a1a1a] rounded px-2 py-1 text-[13px] text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
                        />
                        <Percent size={12} className="text-neutral-400" />
                      </div>
                    </div>
                    {discountPercentage > 0 && (
                      <span className="text-[13px] text-red-400">-${discountAmount.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-400">Tax (8%)</span>
                    <span className="text-neutral-200">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Total</span>
                    <span className="text-[22px] font-bold text-[#668e2b]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-200 dark:border-[#1a1a1a] my-4" />

                {/* Complete Sale */}
                <button
                  disabled={cart.length === 0 || loading}
                  onClick={completeSale}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#668e2b] text-black font-bold text-[14px] hover:bg-[#7a9f3a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Complete Sale →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecordSale;