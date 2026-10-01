import type { Role } from "@prisma/client"

export type SearchContext = "admin" | "front-desk"

export interface SearchablePageEntry {
  id: string
  title: string
  url: string
  section: string
  keywords: string[]
  /** Which dashboard areas can see this page in search */
  contexts: SearchContext[]
  /** If set, user role must be one of these (ADMIN sees all admin pages) */
  roles?: Role[]
}

export const SEARCHABLE_PAGES: SearchablePageEntry[] = [
  // Front desk
  {
    id: "fdr-home",
    title: "Front Desk",
    url: "/dashboard/front-desk-role",
    section: "Front Desk",
    keywords: ["home", "dashboard", "overview"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-record-sale",
    title: "Record a Sale",
    url: "/dashboard/front-desk-role/record-sale",
    section: "Front Desk",
    keywords: ["pos", "checkout", "sale", "sell"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-stock",
    title: "Stock Availability",
    url: "/dashboard/front-desk-role/stock",
    section: "Front Desk",
    keywords: ["inventory", "stock", "products", "availability"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-stock-history",
    title: "Stock History",
    url: "/dashboard/front-desk-role/stock/history",
    section: "Front Desk",
    keywords: ["history", "movements", "stock"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-sales",
    title: "My Recent Sales",
    url: "/dashboard/front-desk-role/sales",
    section: "Front Desk",
    keywords: ["sales", "recent", "orders"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-adjustments",
    title: "Sale Adjustments",
    url: "/dashboard/front-desk-role/adjustments",
    section: "Front Desk",
    keywords: ["adjustments", "edit sale", "void"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-customers",
    title: "Customers",
    url: "/dashboard/front-desk-role/customers",
    section: "Front Desk",
    keywords: ["customers", "clients", "members"],
    contexts: ["front-desk", "admin"],
  },
  {
    id: "fdr-profile",
    title: "Profile",
    url: "/dashboard/front-desk-role/profile",
    section: "Front Desk",
    keywords: ["profile", "account", "settings"],
    contexts: ["front-desk", "admin"],
  },
  // Admin hub
  {
    id: "admin-home",
    title: "Admin Dashboard",
    url: "/dashboard/admin",
    section: "Admin",
    keywords: ["admin", "home", "overview"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "admin-users",
    title: "Users",
    url: "/dashboard/admin/users",
    section: "Admin",
    keywords: ["users", "staff", "roles"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "admin-settings",
    title: "Settings",
    url: "/dashboard/admin/settings",
    section: "Admin",
    keywords: ["settings", "configuration"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "admin-audit",
    title: "Audit Trail",
    url: "/dashboard/admin/audit-trail",
    section: "Admin",
    keywords: ["audit", "logs", "history"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "admin-feedback",
    title: "Feedback",
    url: "/dashboard/feedback",
    section: "Admin",
    keywords: ["feedback", "bugs", "ideas"],
    contexts: ["admin", "front-desk"],
  },
  // Burn Box
  {
    id: "bb-ingredients",
    title: "Ingredients",
    url: "/dashboard/admin/burn-box/ingredients",
    section: "Burn Box",
    keywords: ["ingredients", "burn box"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "bb-recipes",
    title: "Recipes",
    url: "/dashboard/admin/burn-box/recipes",
    section: "Burn Box",
    keywords: ["recipes", "burn box", "menu"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "bb-inventory",
    title: "Burn Box Inventory",
    url: "/dashboard/admin/burn-box/inventory",
    section: "Burn Box",
    keywords: ["inventory", "burn box", "stock"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "bb-adjustments",
    title: "Burn Box Adjustments",
    url: "/dashboard/admin/burn-box/adjustments",
    section: "Burn Box",
    keywords: ["adjustments", "burn box"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "bb-sales",
    title: "Burn Box Sales",
    url: "/dashboard/admin/burn-box/sales",
    section: "Burn Box",
    keywords: ["sales", "burn box"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  // Box Apparel
  {
    id: "apparel-products",
    title: "Apparel Products",
    url: "/dashboard/admin/box-apparel/products",
    section: "Box Apparel",
    keywords: ["products", "apparel", "merch"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "apparel-inventory",
    title: "Apparel Inventory",
    url: "/dashboard/admin/box-apparel/inventory",
    section: "Box Apparel",
    keywords: ["inventory", "apparel"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "apparel-sales",
    title: "Apparel Sales",
    url: "/dashboard/admin/box-apparel/sales",
    section: "Box Apparel",
    keywords: ["sales", "apparel"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  // Purchases
  {
    id: "purchases-invoices",
    title: "Purchase Invoices",
    url: "/dashboard/admin/purchases/invoices",
    section: "Purchases",
    keywords: ["invoices", "purchase orders", "po", "purchases"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "purchases-invoices-create",
    title: "Create Purchase Order",
    url: "/dashboard/admin/purchases/invoices/create",
    section: "Purchases",
    keywords: ["create", "purchase order", "new invoice"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "purchases-suppliers",
    title: "Suppliers",
    url: "/dashboard/admin/purchases/suppliers",
    section: "Purchases",
    keywords: ["suppliers", "vendors"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  // Reports
  {
    id: "reports-hub",
    title: "Reports",
    url: "/dashboard/admin/reports",
    section: "Reports",
    keywords: ["reports", "analytics"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-sales",
    title: "Sales Report",
    url: "/dashboard/admin/reports/sales",
    section: "Reports",
    keywords: ["sales report", "revenue"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-cogs",
    title: "COGS Report",
    url: "/dashboard/admin/reports/cogs",
    section: "Reports",
    keywords: ["cogs", "cost of goods"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-gross-profit",
    title: "Gross Profit Report",
    url: "/dashboard/admin/reports/gross-profit",
    section: "Reports",
    keywords: ["gross profit", "margin"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-product-profit",
    title: "Product Profitability",
    url: "/dashboard/admin/reports/product-profitability",
    section: "Reports",
    keywords: ["product", "profitability"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-recipe-profit",
    title: "Recipe Profitability",
    url: "/dashboard/admin/reports/recipe-profitability",
    section: "Reports",
    keywords: ["recipe", "profitability", "burn box"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-employee-sales",
    title: "Employee Sales",
    url: "/dashboard/admin/reports/employee-sales",
    section: "Reports",
    keywords: ["employee", "staff sales"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-inventory-on-hand",
    title: "Inventory On Hand",
    url: "/dashboard/admin/reports/inventory-on-hand",
    section: "Reports",
    keywords: ["inventory on hand", "stock report"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-inventory-movement",
    title: "Inventory Movement",
    url: "/dashboard/admin/reports/inventory-movement",
    section: "Reports",
    keywords: ["inventory movement", "transfers"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-inventory-retail",
    title: "Inventory Retail",
    url: "/dashboard/admin/reports/inventory-retail",
    section: "Reports",
    keywords: ["retail inventory"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "reports-low-stock",
    title: "Low Stock Report",
    url: "/dashboard/admin/reports/low-stock",
    section: "Reports",
    keywords: ["low stock", "reorder"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
  {
    id: "gymmaster",
    title: "GymMaster Reconciliation",
    url: "/dashboard/admin/gymmaster-reconcilation",
    section: "Admin",
    keywords: ["gymmaster", "reconciliation", "sync"],
    contexts: ["admin"],
    roles: ["ADMIN"],
  },
]

function pageMatchesQuery(page: SearchablePageEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  if (page.title.toLowerCase().includes(q)) return true
  if (page.section.toLowerCase().includes(q)) return true
  return page.keywords.some((kw) => kw.toLowerCase().includes(q))
}

export function searchPages(
  query: string,
  context: SearchContext,
  userRole?: string | null,
): SearchablePageEntry[] {
  const isAdmin = userRole === "ADMIN"

  return SEARCHABLE_PAGES.filter((page) => {
    if (!page.contexts.includes(context)) return false
    if (page.roles?.length) {
      if (userRole !== "ADMIN") {
        if (!userRole || !page.roles.includes(userRole as Role)) return false
      }
    }
    return pageMatchesQuery(page, query)
  })
}
