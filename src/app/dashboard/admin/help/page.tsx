"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  ChevronRight,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Callout,
  DocSection,
  Figure,
  MenuPath,
  MockAdminSidebar,
  MockBar,
  MockCart,
  MockFields,
  MockScreen,
  MockStatCards,
  Step,
  Steps,
} from "@/components/help/doc-ui";

const SECTIONS = [
  { id: "orientation", label: "Getting Around" },
  { id: "burn-box", label: "Burn Box" },
  { id: "apparel", label: "Box Apparel" },
  { id: "purchases", label: "Purchases" },
  { id: "reports", label: "Reports" },
  { id: "users-audit", label: "Users & Audit Trail" },
  { id: "settings", label: "Settings" },
  { id: "gymmaster", label: "GymMaster Reconciliation" },
  { id: "feedback", label: "Feedback & Account" },
];

export default function AdminHelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("orientation");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router]);

  // Highlight the section currently in view
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
      <div className="flex h-screen items-center justify-center bg-[#080808]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="font-archivo min-h-screen bg-[#080808]">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between px-6 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-white/40 hover:text-white transition-colors" />
              <div className="w-px h-4 bg-white/10" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard/admin" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-white/20" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs text-white/60">Help &amp; Guide</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 w-full">
            {/* Page title */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#668e2b]/15 border border-[#668e2b]/30 flex items-center justify-center">
                  <LifeBuoy className="h-5 w-5 text-[#8fb53c]" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight">Admin Help &amp; Guide</h1>
                  <p className="mt-0.5 text-sm text-white/40">
                    Step-by-step instructions for every screen in the admin dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Side nav */}
              <nav className="lg:w-52 shrink-0">
                <div className="lg:sticky lg:top-24">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
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
                              ? "bg-[#668e2b]/15 text-[#9cc24b] font-medium"
                              : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
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
                  title="Getting Around the Admin Dashboard"
                  description="Every admin page shares the same layout: a sidebar on the left, a top bar with breadcrumbs, and the page content."
                >
                  <Figure caption="The admin sidebar — highlighted items are clickable">
                    <MockScreen sidebar={<MockAdminSidebar />}>
                      <MockBar buttons={["Export CSV", "Record Sale"]} active="Record Sale" left="Burn Box Sales" />
                      <MockStatCards
                        cards={[
                          { label: "Total Sales", value: "$1,240" },
                          { label: "Orders", value: "38" },
                          { label: "Profit", value: "$612", hot: true },
                          { label: "Items Sold", value: "96" },
                        ]}
                      />
                    </MockScreen>
                  </Figure>

                  <Steps>
                    <Step title="The sidebar (left)">
                      <ul className="list-disc space-y-1 pl-5">
                        <li><strong>View Dashboard</strong> (green button at the top) — opens the Consolidated Report.</li>
                        <li><strong>MAIN MENU</strong> — three collapsible groups: <em>Burn Box</em>, <em>Box Apparel</em>, and <em>Purchases</em>. Click a group name to expand or collapse it, then click a page inside.</li>
                        <li><strong>REPORTS</strong> — quick links to the Reports hub and GymMaster Reconciliation. Any reports you bookmark also appear here.</li>
                        <li><strong>Help &amp; Guide</strong> — this page. You can also reach it from your profile menu (bottom-left avatar → Help &amp; Guide).</li>
                      </ul>
                    </Step>
                    <Step title="The top bar">
                      The <strong>sidebar toggle</strong> (icon at the far left of the top bar, next to the breadcrumb) collapses or expands the sidebar — useful on smaller screens. The breadcrumb shows where you are (e.g. <em>Admin → Users</em>) and links back.
                    </Step>
                    <Step title="The profile menu (bottom-left)">
                      Click your avatar/name at the bottom of the sidebar to open a menu with:
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        <li><strong>Software Feedback</strong> — report bugs or request features.</li>
                        <li><strong>Theme</strong> — toggle dark/light mode.</li>
                        <li><strong>Users Management</strong>, <strong>Audit Trail</strong>, <strong>Settings</strong> — shortcuts to admin tools.</li>
                        <li><strong>Log out</strong> — end your session.</li>
                      </ul>
                    </Step>
                    <Step title="If you get lost">
                      Use your browser&apos;s back button, click the breadcrumb, or open the sidebar and pick the section you need. Every list page also has a search box and filter button — see each section below.
                    </Step>
                  </Steps>
                </DocSection>

                {/* ── Burn Box ── */}
                <DocSection
                  id="burn-box"
                  title="Burn Box (Smoothies & Ingredients)"
                  description="Manage the ingredients that go into Burn Box drinks, the recipes themselves, stock levels, wastage adjustments, and sales."
                >
                  <SubBlock
                    name="Ingredients"
                    path={["Sidebar", "Burn Box", "Ingredients"]}
                    what="The raw materials (e.g. protein powder, fruits, cups) used to make Burn Box drinks, with stock levels and costs."
                  >
                    <Steps>
                      <Step title="Find an ingredient">
                        Use the <strong>search box</strong> (filters by name/SKU as you type) or the <strong>filter icon</strong> button to narrow the list.
                      </Step>
                      <Step title="Add a new ingredient">
                        Click <strong>Add Ingredient</strong> (top-right). In the dialog fill in the required fields: <em>Name</em>, <em>SKU</em>, <em>Category</em>, <em>Unit of Measurement</em>, <em>Initial Quantity</em>, <em>Cost per Unit</em>, and <em>Min Stock Level</em>. Optional fields include bulk-unit conversion, supplier, and storage location. Click <strong>Create</strong>.
                        <Figure>
                          <MockFields
                            fields={[
                              { label: "Name *", value: "Vanilla Protein", active: true },
                              { label: "SKU *", value: "ING-001" },
                              { label: "Category *", value: "Protein" },
                              { label: "Unit *", value: "g" },
                              { label: "Initial Qty *", value: "5000" },
                              { label: "Cost/Unit *", value: "0.04" },
                              { label: "Min Stock *", value: "500" },
                            ]}
                          />
                        </Figure>
                      </Step>
                      <Step title="Edit or remove an ingredient">
                        Open the row&apos;s <strong>⋯ (three-dot) menu</strong> on the far right of the table and choose <strong>Edit</strong> or <strong>Delete</strong>.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Recipes"
                    path={["Sidebar", "Burn Box", "Recipes"]}
                    what="Drink recipes built from ingredients, with pricing and photos. Active recipes appear on the front-desk sale screen."
                  >
                    <Steps>
                      <Step title="Create a recipe">
                        Click <strong>Add Recipe</strong> (top-right). Give it a name, description, instructions, and servings; upload or paste an image; then add ingredients with quantities. Enter the cost breakdown (material, labor, overhead, other, shipping) and the <strong>Selling Price</strong> — the dialog shows margin and profit per unit live.
                      </Step>
                      <Step title="Keep recipes sellable">
                        A recipe can only be sold if all its ingredients are in stock. Watch the <strong>Inventory</strong> page for low ingredient levels.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Inventory"
                    path={["Sidebar", "Burn Box", "Inventory"]}
                    what="Live stock levels for every ingredient, plus usage tracking showing how much each recipe consumes."
                  >
                    <Steps>
                      <Step title="Review stock">
                        Search or filter the ingredient list. Stock cards show current quantities; the <strong>Ingredient Usage Tracking</strong> section below shows what each recipe uses.
                      </Step>
                      <Step title="Export data">
                        Click the <strong>download icon</strong> (next to the refresh icon) to export the list to CSV.
                      </Step>
                      <Step title="Quick add">
                        The <strong>Add Ingredient</strong> button here opens the same dialog as the Ingredients page.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Adjustments"
                    path={["Sidebar", "Burn Box", "Adjustments"]}
                    what="Log wastage, damage, expiry, theft, or count corrections against ingredients. Every adjustment is recorded with a reason."
                  >
                    <Steps>
                      <Step title="Record an adjustment">
                        Click <strong>Record Adjustment</strong> (top-right). In the dialog choose the <strong>Ingredient</strong>, the <strong>Adjustment Type</strong> (Wastage, Damage, Expiry, Physical Count, Theft, or Other), the <strong>New Stock</strong> level, a <strong>Reason</strong>, and optionally tick <strong>Is Discrepancy</strong> to flag it for review. Submit to save.
                        <Figure>
                          <MockFields
                            fields={[
                              { label: "Ingredient *", value: "Spinach", active: true },
                              { label: "Type *", value: "Wastage" },
                              { label: "Previous Stock", value: "1200 g" },
                              { label: "New Stock *", value: "1100 g" },
                              { label: "Reason *", value: "Wilted batch" },
                              { label: "Discrepancy", value: "☐ flag for review" },
                            ]}
                          />
                        </Figure>
                      </Step>
                      <Step title="Review history">
                        The <strong>Adjustment History</strong> table lists every change with type, previous/new stock, reason, and who made it. Use search and the type filter to narrow it down, or export to CSV.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Sales"
                    path={["Sidebar", "Burn Box", "Sales"]}
                    what="Record Burn Box drink sales. Selling a recipe automatically deducts its ingredients from inventory."
                  >
                    <Steps>
                      <Step title="Record a sale">
                        Click <strong>Record Sale</strong> (top-right). In the <em>Record Burn Box Sale</em> dialog: pick a <strong>Recipe</strong>, enter <strong>Quantity</strong>, optionally add a <strong>Customer Name</strong>, choose a <strong>Payment Method</strong> (Cash, Card, or Other), and add notes if needed. Review the <strong>Sale Summary</strong> (total, ingredient cost, profit) and submit.
                        <Figure>
                          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                            <MockFields
                              fields={[
                                { label: "Recipe *", value: "Green Protein", active: true },
                                { label: "Quantity *", value: "2" },
                                { label: "Customer", value: "Walk-in" },
                                { label: "Payment *", value: "Card" },
                                { label: "Notes", value: "Optional…" },
                              ]}
                            />
                            <MockCart
                              lines={[{ name: "Green Protein", qty: 2, price: "$12.00" }]}
                              total="$12.00"
                              cta="Record Sale"
                              activeCta
                            />
                          </div>
                        </Figure>
                      </Step>
                      <Step title="Check the stats & history">
                        The stat cards at the top summarize the period. The <strong>Sales History</strong> table below lists every sale; use search/filters or the <strong>download icon</strong> to export CSV.
                      </Step>
                    </Steps>
                  </SubBlock>
                </DocSection>

                {/* ── Box Apparel ── */}
                <DocSection
                  id="apparel"
                  title="Box Apparel (Products)"
                  description="Manage sellable apparel products — stock, pricing, photos, and sales — separate from Burn Box ingredients."
                >
                  <SubBlock
                    name="Products"
                    path={["Sidebar", "Box Apparel", "Products"]}
                    what="Your apparel catalog: t-shirts, leggings, caps, hoodies, etc. These are the products front-desk staff sell."
                  >
                    <Steps>
                      <Step title="Add a product">
                        Click <strong>Add product</strong> (top-right, green). A panel slides in from the right — fill in the product name, SKU, category, variant details (size/color), pricing, stock quantity, supplier, and image, then click <strong>Create product</strong>.
                      </Step>
                      <Step title="Edit, restock, or remove">
                        Each row has an <strong>edit (pencil) icon</strong> and a <strong>⋯ menu</strong>. The menu offers: <em>Edit</em>, <em>Add Stock</em>, <em>Adjust Stock</em>, <em>Duplicate</em> (creates a copy with a -COPY suffix), and <em>Delete</em>.
                      </Step>
                      <Step title="Bulk actions & export">
                        Tick the checkboxes on rows to reveal <strong>Bulk Edit</strong>, <strong>Bulk Duplicate</strong>, and <strong>Bulk Delete</strong> buttons above the table. The <strong>download icon</strong> exports the filtered list to CSV. Use the filter button and column sort to organize the list.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Inventory (Apparel)"
                    path={["Sidebar", "Box Apparel", "Inventory"]}
                    what="Transaction history for apparel stock — every in/out movement with dates and quantities."
                  >
                    <Steps>
                      <Step title="Review movements">
                        Search transactions by product and use the filter controls. The table shows date, product, type of movement, quantity change, and the resulting stock level.
                      </Step>
                      <Step title="Refresh">
                        Click the <strong>refresh icon</strong> to reload the latest transactions.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Sales (Apparel)"
                    path={["Sidebar", "Box Apparel", "Sales"]}
                    what="All apparel sales across the business, with the ability to process returns."
                  >
                    <Steps>
                      <Step title="Review sales">
                        Search and filter the <strong>Sales History</strong> table. Stat/filter controls at the top let you narrow by date or status.
                      </Step>
                      <Step title="Process a return">
                        Click <strong>Process Return</strong> (top of page) or use the return action on a sale row. In the dialog enter the return quantities/reason and confirm — stock is added back automatically.
                      </Step>
                    </Steps>
                  </SubBlock>
                </DocSection>

                {/* ── Purchases ── */}
                <DocSection
                  id="purchases"
                  title="Purchases"
                  description="Track suppliers and purchase orders so you know what you bought, from whom, and what it cost."
                >
                  <SubBlock
                    name="Suppliers"
                    path={["Sidebar", "Purchases", "Suppliers"]}
                    what="Your vendor directory used when creating purchase orders and ingredients."
                  >
                    <Steps>
                      <Step title="Add a supplier">
                        Click <strong>Add Supplier</strong> (top-right), fill in the name and contact details in the dialog, and save.
                      </Step>
                      <Step title="Manage suppliers">
                        Use the <strong>pencil icon</strong> to edit or the <strong>⋯ menu → Delete</strong> to remove a supplier. Search and filters are at the top; the download icon exports CSV.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock
                    name="Invoices & Purchase Orders"
                    path={["Sidebar", "Purchases", "Invoices"]}
                    what="Create purchase orders and attach supplier invoices for cost tracking (landed cost, purchase history reports)."
                  >
                    <Steps>
                      <Step title="Create a purchase order">
                        Click <strong>New Purchase Order</strong> (top-right). On the form: choose the <strong>Supplier</strong>, review order details, click <strong>Add Item</strong> for each product (name, quantity, unit price — totals calculate automatically), add optional notes, then click <strong>Create Purchase Order</strong>.
                      </Step>
                      <Step title="Upload the supplier invoice">
                        On the Invoices list, open a purchase order&apos;s <strong>⋯ menu → Upload Invoice</strong> and attach the scanned/PDF invoice. It goes to the <strong>Review Invoice</strong> dialog for approval.
                      </Step>
                      <Step title="View an order">
                        Use <strong>⋯ → View Details</strong> on any order row to see its full breakdown. The download icon exports the list to CSV.
                      </Step>
                    </Steps>
                  </SubBlock>
                </DocSection>

                {/* ── Reports ── */}
                <DocBlock
                  id="reports"
                  title="Reports"
                  path={["Sidebar", "REPORTS", "Reports"]}
                  what="One hub for every business report: sales, profitability, inventory, purchasing, and automated weekly reports."
                >
                  <Steps>
                    <Step title="Pick a report">
                      Reports are grouped into colored sections — <em>Sales &amp; Profitability</em>, <em>Inventory</em>, <em>Purchasing</em>, and <em>Automated</em>. Click any report card to open it. Key metric cards at the top of each section summarize the selected period.
                    </Step>
                    <Step title="Set the date range">
                      Use the <strong>date range picker</strong> at the top-right of the page to change the period all reports use.
                    </Step>
                    <Step title="Bookmark favorites">
                      Click the <strong>bookmark icon</strong> on a report card to pin it — bookmarked reports appear in the yellow section at the top and in your sidebar under REPORTS for one-click access.
                    </Step>
                  </Steps>
                </DocBlock>

                {/* ── Users & Audit ── */}
                <DocBlock
                  id="users-audit"
                  title="Users Management & Audit Trail"
                  path={["Profile menu (bottom-left sidebar)", "Users Management / Audit Trail"]}
                  what="Control who can log in and what they can do, and review a complete history of staff actions."
                >
                  <SubBlock name="Users Management" path={["Avatar menu", "Users Management"]} what="Create staff accounts, set roles, and remove access.">
                    <Steps>
                      <Step title="Add a user">
                        Click <strong>Add User</strong> (top-right), fill in their details and role (<em>Admin</em>, <em>Front Desk</em>, <em>Inventory</em>, or <em>Customer</em>), and save. They&apos;ll be able to log in with the credentials you set.
                      </Step>
                      <Step title="Edit, deactivate, or delete">
                        Use the <strong>⋯ menu</strong> on a user&apos;s row → <em>Edit</em>, <em>Reactivate</em> (inactive users), or <em>Delete</em>. You can&apos;t delete your own account, and the role filter buttons (All / Admin / Front Desk / Inventory / Customer) plus search help you find anyone quickly.
                      </Step>
                      <Step title="What happens on Delete">
                        Users with no activity are deleted permanently (you&apos;ll be asked to type their name). Users with sales or history get a choice: <strong>Deactivate Only</strong> keeps all records and blocks their login, or <strong>Delete Everything</strong> permanently removes all their data — this requires typing their email to confirm.
                      </Step>
                    </Steps>
                  </SubBlock>

                  <SubBlock name="Audit Trail" path={["Avatar menu", "Audit Trail"]} what="A searchable log of every staff action in the system.">
                    <Steps>
                      <Step title="Review staff activity">
                        The table logs every significant action — sales created/adjusted/deleted, inventory updates, invoices, adjustments, and product changes — with the employee&apos;s name, a description, timestamp, and old→new values.
                      </Step>
                      <Step title="Filter the log">
                        Use the <strong>search box</strong> (matches names, descriptions, IDs) and the <strong>action</strong> and <strong>entity</strong> dropdown filters to narrow results.
                      </Step>
                    </Steps>
                  </SubBlock>
                </DocBlock>

                {/* ── Settings ── */}
                <DocBlock
                  id="settings"
                  title="Settings"
                  path={["Avatar menu", "Settings"]}
                  what="Business profile, integrations, payment methods, product categories, and notification preferences."
                >
                  <Steps>
                    <Step title="Edit a section">
                      Settings are grouped into sections: <em>Business Profile</em>, <em>Weekly Report Recipients</em>, <em>Integrations</em> (GymMaster, QuickBooks), <em>Payment Methods</em>, <em>Product Categories</em>, and notifications. Change any field, then click <strong>Save Changes</strong> at the top-right — you&apos;ll see a confirmation message. Use <strong>Refresh</strong> to reload saved values.
                    </Step>
                    <Step title="Payment methods & categories">
                      These appear as dropdowns on the front-desk sale screen, so keep them up to date. Add/remove them with the inline buttons in their sections.
                    </Step>
                    <Step>
                      <Callout tone="warning" title="API keys">
                        Integration credentials (GymMaster, QuickBooks, Gemini) are stored here. Only enter keys you intend to activate, and keep sync toggles off until credentials are verified.
                      </Callout>
                    </Step>
                  </Steps>
                </DocBlock>

                {/* ── GymMaster ── */}
                <DocBlock
                  id="gymmaster"
                  title="GymMaster Reconciliation"
                  path={["Sidebar", "REPORTS", "GymMaster Reconciliation"]}
                  what="Compare sales recorded in Burn Box against GymMaster to catch discrepancies. Requires GymMaster sync to be enabled in Settings."
                >
                  <Steps>
                    <Step title="Run a comparison">
                      Pick a <strong>date range</strong> (calendar button, top-right), then click <strong>Sync with GymMaster</strong>. If sync is disabled in Settings the button is greyed out — enable it under Settings → Integrations first.
                    </Step>
                    <Step title="Read the results">
                      Summary cards show total sales from the app vs GymMaster and the number of discrepancies. Expand rows or click <strong>view details</strong> to see item-level differences, and use <strong>Add to App</strong> to pull a missing GymMaster sale into Burn Box.
                    </Step>
                    <Step title="Export">
                      Click <strong>Export CSV</strong> to download the reconciliation data for review.
                    </Step>
                  </Steps>
                </DocBlock>

                {/* ── Feedback ── */}
                <DocBlock
                  id="feedback"
                  title="Software Feedback & Account"
                  path={["Avatar menu", "Software Feedback"]}
                  what="Tell the developers about bugs or ideas, and manage your session."
                >
                  <Steps>
                    <Step title="Submit feedback">
                      Open your avatar menu (bottom-left) → <strong>Software Feedback</strong>. Click the submit button, enter a summary and details, choose a category/severity if prompted, and send. You can track status (Open / In Progress / Resolved) on the same page.
                    </Step>
                    <Step title="Theme & logout">
                      The avatar menu also has a <strong>Theme</strong> switch (dark/light) and <strong>Log out</strong>. Logging out returns you to the login page.
                    </Step>
                  </Steps>
                </DocBlock>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// ── Local helpers ────────────────────────────

function SubBlock({
  name,
  path,
  what,
  children,
}: {
  name: string;
  path: string[];
  what: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <MenuPath parts={path} />
        <ChevronRight size={14} className="text-white/20" />
      </div>
      <p className="mt-2 text-sm text-white/40">{what}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DocBlock({
  id,
  title,
  path,
  what,
  children,
}: {
  id: string;
  title: string;
  path: string[];
  what: string;
  children: React.ReactNode;
}) {
  return (
    <DocSection id={id} title={title} description={what}>
      <div className="mb-4">
        <MenuPath parts={path} />
      </div>
      {children}
    </DocSection>
  );
}
