"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { RefreshLink } from "@/components/refresh-link";
import { useSession } from "next-auth/react";
import {
    Bell,
    Search,
    Home,
    ShoppingCart,
    Package,
    Clock,
    ArrowRight,
    Box,
    TrendingUp,
    Edit,
    History,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FDRProfileDropdown from "@/components/front-desk-role/fdr-profile-dropdown";


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
}



// ─────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
    { icon: Home, label: "Front Desk", href: "/dashboard/front-desk-role" },
    { icon: ShoppingCart, label: "Record a Sale", href: "/dashboard/front-desk-role/record-sale" },
    { icon: Package, label: "Stock Availability", href: "/dashboard/front-desk-role/stock" },
    { icon: History, label: "Stock History", href: "/dashboard/front-desk-role/stock/history" },
    { icon: Clock, label: "My Recent Sales", href: "/dashboard/front-desk-role/sales" },
    { icon: Edit, label: "Adjustments", href: "/dashboard/front-desk-role/adjustments" },
    { icon: User, label: "Customers", href: "/dashboard/front-desk-role/customers" },
];


// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function fdrSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = theme === 'system' ? systemTheme : theme;
    const logoSrc = !mounted ? '/hlogo-dark.svg' : (currentTheme === 'dark' ? '/hlogo-dark.svg' : '/hlogo-light.svg');

    // Determine active nav based on current pathname
    const activeNav = NAV_ITEMS.find(item => pathname === item.href)?.label || "Front Desk";

    return (
        <aside className="hidden lg:flex w-62 flex-shrink-0 flex-col dark:bg-black border-r dark:border-[#1e1e1e]">
            {/* Logo */}
            <div className="px-4 pt-[10px]">
                <Image
                    src={logoSrc}
                    alt="Burn Box Logo"
                    width={180}
                    height={180}
                    className="rounded-lg w-full"
                />
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-1">
                {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                    <RefreshLink
                        key={label}
                        href={href}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-4 rounded-lg text-sm transition-colors text-left",
                            activeNav === label
                                ? "bg-neutral-100 dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100"
                                : "text-neutral-600 dark:text-[#bbbdbb] hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#161616]"
                        )}
                    >
                        <Icon size={19} />
                        {label}
                    </RefreshLink>
                ))}
            </nav>

            {/* User */}
            <div className="p-3 border-t border-gray-200 dark:border-[#1e1e1e]">
                <FDRProfileDropdown variant="sidebar" />
            </div>
        </aside>
    );
}
