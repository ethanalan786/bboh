"use client"

import { useSession } from "next-auth/react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { CropIcon, FileTextIcon, LayoutBottomIcon, MapsIcon, PieChartIcon, Settings01Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { IconBrandCodesandbox, IconShirtFilled } from '@tabler/icons-react'

const data = {
  teams: [
    {
      name: "Burn Box",
      logo: (
        <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />
      ),
      plan: "Operations Hub",
    }
  ],
  navMain: [
    {
      title: "Burn Box",
      url: "#",
      icon: (
        <IconBrandCodesandbox stroke={2.5} className="w-9 h-9"/>
      ),
      isActive: true,
      items: [
        {
          title: "Ingredients",
          url: "/dashboard/admin/burn-box/ingredients",
        },
        {
          title: "Recipes",
          url: "/dashboard/admin/burn-box/recipes",
        },
        {
          title: "Inventory",
          url: "/dashboard/admin/burn-box/inventory",
        },
        {
          title: "Adjustments",
          url: "/dashboard/admin/burn-box/adjustments",
        },
        {
          title: "Sales",
          url: "/dashboard/admin/burn-box/sales",
        },
      ],
    },
    {
      title: "Box Apparel",
      url: "#",
      icon: (
        <IconShirtFilled className="w-9 h-9"/>
      ),
      items: [
        {
          title: "Products",
          url: "/dashboard/admin/box-apparel/products",
        },
        {
          title: "Inventory",
          url: "/dashboard/admin/box-apparel/inventory",
        },
        {
          title: "Sales",
          url: "/dashboard/admin/box-apparel/sales",
        },
      ],
    },
    {
      title: "Purchases",
      url: "#",
      icon: (
        <HugeiconsIcon icon={CropIcon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Invoices",
          url: "/dashboard/admin/purchases/invoices",
        },
        {
          title: "Suppliers",
          url: "/dashboard/admin/purchases/suppliers",
        }
      ],
    },
  ],
  projects: [
    {
      name: "Reports",
      url: "/dashboard/admin/reports/",
      icon: (
        <HugeiconsIcon icon={FileTextIcon} strokeWidth={2} />
      ),
    },
    {
      name: "GymMaster Reconciliation",
      url: "/dashboard/admin/gymmaster-reconcilation",
      icon: (
        <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />
      ),
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  // Use real user data from session, or fallback to empty object if not authenticated
  const user = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email || "",
    avatar: "/avatars/shadcn.jpg",
  } : {
    name: "Guest",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
