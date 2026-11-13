"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FdrDashboardHeader } from '@/components/front-desk-role/fdr-dashboard-header';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  CircleHelp,
  Home,
  Package,
  History,
  Clock,
  Edit,
  User,
  ShoppingCart,
  Menu,
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  Callout,
  DocSection,
  Figure,
  MenuPath,
  MockBar,
  MockCart,
  MockFdrSidebar,
  MockProductGrid,
  MockScreen,
  MockStatCards,
  Step,
  Steps,
} from '@/components/help/doc-ui';

const NAV_ITEMS = [
  { icon: Home, label: "Front Desk", href: "/dashboard/front-desk-role" },
  { icon: ShoppingCart, label: "Record a Sale", href: "/dashboard/front-desk-role/record-sale" },
  { icon: Package, label: "Stock Availability", href: "/dashboard/front-desk-role/stock" },
  { icon: History, label: "Stock History", href: "/dashboard/front-desk-role/stock/history" },
  { icon: Clock, label: "My Recent Sales", href: "/dashboard/front-desk-role/sales" },
  { icon: Edit, label: "Adjustments", href: "/dashboard/front-desk-role/adjustments" },
  { icon: User, label: "Customers", href: "/dashboard/front-desk-role/customers" },
  { icon: CircleHelp, label: "Help & Guide", href: "/dashboard/front-desk-role/help" },
];

const SECTIONS = [
  { id: "orientation", label: "Getting Around" },
  { id: "record-sale", label: "Recording a Sale" },
  { id: "stock", label: "Stock Availability" },
  { id: "stock-history", label: "Stock History" },
  { id: "sales", label: "My Recent Sales" },
  { id: "adjustments", label: "Adjustments" },
  { id: "customers", label: "Customers" },
  { id: "profile", label: "Profile & Logout" },
];

const FdrHelpPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("orientation");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden font-saprona bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FdrSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FdrDashboardHeader
          placeholder="Search pages, products, sales, customers..."
          leftContent={
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Menu"
            >
              <Menu size={22} className="text-neutral-600 dark:text-neutral-300" />
            </button>
          }
        />

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-neutral-200 bg-white dark:border-[#1e1e1e] dark:bg-black">
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                    pathname === href
                      ? "bg-neutral-100 text-neutral-900 dark:bg-[#1e1e1e] dark:text-neutral-100"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-[#bbbdbb] dark:hover:text-neutral-200 dark:hover:bg-[#161616]"
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">
            {/* Page title */}
            <div className="mb-8 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border border-[#668e2b]/40 bg-[#668e2b]/10 flex items-center justify-center">
                <CircleHelp size={20} className="text-[#668e2b]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Help &amp; Guide</h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Step-by-step instructions for every screen. Bookmark this page — it&apos;s always in your menu.
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Side nav */}
              <nav className="lg:w-52 shrink-0">
                <div className="lg:sticky lg:top-6">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> On this page
                  </p>
                  <ul className="space-y-0.5">
                    {SECTIONS.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={cn(
                            "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                            activeSection === s.id
                              ? "bg-[#668e2b]/15 text-[#4c641f] dark:text-[#8fb53c] font-medium"
                              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#161616]"
                          )}
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>

              {/* Content */}
              <div className="flex-1 min-w-0 max-w-3xl">
                {/* ── Orientation ── */}
                <DocSection
                  id="orientation"
                  title="Getting Around"
                  description="The same layout appears on every page: a sidebar on the left and a top bar with search."
                >
                  <Figure caption="Front desk sidebar — the highlighted item is the page you're reading">
                    <MockScreen sidebar={<MockFdrSidebar active="Help & Guide" />}>
                      <MockBar
                        buttons={["In Stock", "Low Stock", "Out of Stock"]}
                        left="Stock Availability"
                      />
                      <MockStatCards
                        cards={[
                          { label: "Total Items", value: "42" },
                          { label: "In Stock", value: "35" },
                          { label: "Low Stock", value: "5", hot: true },
                          { label: "Out", value: "2" },
                        ]}
                      />
                    </MockScreen>
                  </Figure>

                  <Steps>
                    <Step title="The sidebar (left, desktop)">
                      Contains every page: <strong>Front Desk</strong> (home dashboard), <strong>Record a Sale</strong>, <strong>Stock Availability</strong>, <strong>Stock History</strong>, <strong>My Recent Sales</strong>, <strong>Adjustments</strong>, <strong>Customers</strong>, and <strong>Help &amp; Guide</strong> (this page). The current page is highlighted.
                    </Step>
                    <Step title="On a phone or small screen">
                      The sidebar hides. Tap the <strong>☰ menu icon</strong> at the top-left of the header to open the same list as a dropdown menu.
                    </Step>
                    <Step title="The top bar">
                      The <strong>search box</strong> finds products, recipes, sales, and customers — start typing and pick a result to jump straight to it. On the right: the <strong>theme toggle</strong> (sun/moon) and your <strong>profile menu</strong>.
                    </Step>
                    <Step title="Your profile menu">
                      Click your name/avatar (bottom of the sidebar, or top-right on the header) to open a menu with <strong>Profile</strong> and <strong>Log out</strong>.
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── Record a Sale ── */}
                <DocSection
                  id="record-sale"
                  title="Recording a Sale"
                  description="The main thing you'll do every shift — ring up Burn Box drinks and apparel."
                >
                  <MenuPath parts={["Sidebar", "Record a Sale"]} />

                  <Steps>
                    <Step title="Open the sale screen">
                      Click <strong>Record a Sale</strong> in the sidebar. The page shows all products on the left and the <strong>Current Sale</strong> cart on the right (on smaller screens the cart is a button at the bottom).
                    </Step>
                    <Step title="Find products">
                      Use the <strong>Search products...</strong> box or the tabs — <em>All Products</em>, <em>Burn Box</em> (drinks, green badge), <em>Apparel</em> (clothing, purple badge).
                    </Step>
                    <Step title="Add items to the cart">
                      Tap the <strong>+</strong> button on a product card. Burn Box drinks check ingredient availability automatically — if something&apos;s missing you&apos;ll see an error and the item won&apos;t add. Apparel is capped at available stock; sold-out items are greyed out with a <strong>SOLD OUT</strong> badge.
                      <Figure>
                        <MockProductGrid
                          items={[
                            { name: "Green Protein", price: "$6.00", badge: "Burn Box" },
                            { name: "Protein Pink", price: "$6.00", badge: "Burn Box" },
                            { name: "Logo Tee", price: "$25.00", badge: "Apparel", },
                          ]}
                          active="Green Protein"
                        />
                        <p className="mt-1 text-center text-[10px] text-neutral-400">Tap the + on a card — the highlighted card shows where</p>
                      </Figure>
                    </Step>
                    <Step title="Adjust quantities">
                      In the cart, use the <strong>− / +</strong> buttons on each line, or the <strong>trash icon</strong> to remove an item entirely. <strong>Clear</strong> empties the whole cart; <strong>Cancel Sale</strong> (top-right) abandons it.
                    </Step>
                    <Step title="Choose customer & payment">
                      In the cart panel set the <strong>Customer</strong> dropdown (defaults to <em>Walk-in Customer</em>) and the <strong>Payment Method</strong> dropdown. Add a customer first on the Customers page if they&apos;re not listed.
                    </Step>
                    <Step title="Apply a discount (optional)">
                      Enter a percentage in the <strong>Discount</strong> field — the discount amount, 8% tax, subtotal, and <strong>Total</strong> update live.
                    </Step>
                    <Step title="Complete the sale">
                      Click the big green <strong>Complete Sale →</strong> button. Wait for the &quot;Sale completed successfully!&quot; message — stock and ingredient levels update automatically. The cart empties and you&apos;re ready for the next customer.
                      <Figure>
                        <MockCart
                          lines={[
                            { name: "Green Protein", qty: 2, price: "$12.00" },
                            { name: "Logo Tee", qty: 1, price: "$25.00" },
                          ]}
                          customer="Jane D."
                          payment="Card"
                          discount="-$1.85"
                          total="$35.15"
                          activeCta
                        />
                      </Figure>
                    </Step>
                  </Steps>

                  <Callout tone="tip" title="Good to know">
                    Mixed carts work fine — Burn Box drinks and apparel can be on the same sale. If a Burn Box drink fails at checkout it usually means an ingredient ran out; check Stock Availability.
                  </Callout>
                </DocSection>

                {/* ── Stock Availability ── */}
                <DocSection
                  id="stock"
                  title="Stock Availability"
                  description="Check what's in stock and fix levels — without needing admin access."
                >
                  <MenuPath parts={["Sidebar", "Stock Availability"]} />

                  <Steps>
                    <Step title="Read the status cards">
                      Four cards at the top count <strong>Total Items</strong>, <strong>In Stock</strong>, <strong>Low Stock</strong>, and <strong>Out of Stock</strong>. Rows are also color-coded: green = in stock, amber = low, purple = out.
                    </Step>
                    <Step title="Find an item">
                      Use the <strong>search box</strong> in the header (matches name, SKU, category) and the <strong>category</strong> and <strong>status</strong> filters above the table.
                    </Step>
                    <Step title="Add stock (the + button)">
                      The <strong>+</strong> icon button adds 1 unit and opens the edit dialog to confirm. Use <strong>Edit</strong> to set an exact new quantity, pick the adjustment date, and write a reason, then <strong>Save</strong>.
                    </Step>
                    <Step title="Rules you should know">
                      You can only <strong>increase</strong> stock here — decreasing happens automatically through sales. Recipe (Burn Box) stock is calculated from ingredients, so it shows <em>Auto-calculated</em> and can&apos;t be edited directly; restock the ingredients instead.
                    </Step>
                    <Step title="Dig deeper">
                      The <strong>history icon</strong> (clock) on a row shows that item&apos;s stock changes, the <strong>› chevron</strong> opens a detail drawer, and <strong>View History</strong> (top-right) goes to the full Stock History page.
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── Stock History ── */}
                <DocSection
                  id="stock-history"
                  title="Stock History"
                  description="The full audit log of stock movements — sales, restocks, and adjustments."
                >
                  <MenuPath parts={["Sidebar", "Stock History"]} />

                  <Steps>
                    <Step title="Browse the log">
                      Each entry shows the product, stock level change, date, reason, and who made it. Stat cards at the top total adjustments and increases/decreases.
                    </Step>
                    <Step title="Filter">
                      Combine the <strong>search box</strong>, <strong>category</strong>, <strong>user</strong>, and <strong>item type</strong> (Product vs Recipe) filters, plus a <strong>date range</strong> (Today / Week / Month / Custom / All) to narrow the list.
                    </Step>
                    <Step title="Export">
                      Use the <strong>download icon</strong> to export the filtered history.
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── My Recent Sales ── */}
                <DocSection
                  id="sales"
                  title="My Recent Sales"
                  description="Every sale you've personally recorded, plus a quick stock glance."
                >
                  <MenuPath parts={["Sidebar", "My Recent Sales"]} />

                  <Steps>
                    <Step title="Review your sales">
                      The table lists your sales newest-first — date, product, quantity, total. If it&apos;s empty, click <strong>Record a Sale</strong> to make your first one.
                    </Step>
                    <Step title="Quick stock overview">
                      The panel at the top shows a few products with quantities left. <strong>View All →</strong> takes you to Stock Availability.
                    </Step>
                    <Step title="Search">
                      The header search finds sales, products, and recipes — picking a result jumps you to the right page.
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── Adjustments ── */}
                <DocSection
                  id="adjustments"
                  title="Adjustments (Fixing Sale Mistakes)"
                  description="Made a wrong sale? Edit or delete it here — every change is logged for the admin audit trail."
                >
                  <MenuPath parts={["Sidebar", "Adjustments"]} />

                  <Steps>
                    <Step title="Find the sale">
                      The list shows your sales (Burn Box and apparel). Use the header <strong>search box</strong> to filter by product name, SKU, or category.
                    </Step>
                    <Step title="Edit a sale">
                      Click the <strong>pencil icon</strong> on a row → in the <em>Adjust Sale</em> dialog enter the corrected <strong>New Quantity</strong> and an optional <strong>Reason</strong>. The dialog shows current vs new totals before you confirm.
                    </Step>
                    <Step title="Delete a sale">
                      Click the <strong>red trash icon</strong> and confirm in the dialog. Deleting restores the sold stock.
                    </Step>
                    <Step>
                      <Callout tone="note" title="Burn Box sales can't be adjusted here">
                        Rows marked <em>Cannot adjust</em> are recipe sales — contact an admin if one needs correcting.
                      </Callout>
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── Customers ── */}
                <DocSection
                  id="customers"
                  title="Customers"
                  description="The people you can attach to sales for records and future reference."
                >
                  <MenuPath parts={["Sidebar", "Customers"]} />

                  <Steps>
                    <Step title="Add a customer">
                      Click <strong>Add Customer</strong> (top-right) → enter <strong>Name</strong> and <strong>Email</strong> (required) plus optional phone → <strong>Add Customer</strong>. They&apos;ll appear in the Customer dropdown at checkout.
                    </Step>
                    <Step title="Edit or delete">
                      Use the <strong>pencil</strong> or <strong>red trash</strong> icons on a row. The header search filters by name, email, or phone.
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── Profile ── */}
                <DocSection
                  id="profile"
                  title="Profile &amp; Logout"
                  description="Your personal details and how to sign out."
                >
                  <MenuPath parts={["Profile menu", "Profile"]} />

                  <Steps>
                    <Step title="Open your profile">
                      Click your name/avatar at the <strong>bottom of the sidebar</strong> (or top-right) → <strong>Profile</strong>.
                    </Step>
                    <Step title="Update details">
                      Edit your name, phone, address, and other fields, optionally upload a profile photo, then save. Changes apply to your account immediately.
                    </Step>
                    <Step title="Log out">
                      Same menu → <strong>Log out</strong>. You&apos;ll be returned to the login screen — always log out on shared computers.
                    </Step>
                  </Steps>
                </DocSection>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FdrHelpPage;
