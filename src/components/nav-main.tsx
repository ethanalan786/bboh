"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { ClipboardMinus, BadgeDollarSign } from "lucide-react"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Link className="w-full" href="/dashboard/admin/">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <BadgeDollarSign />
                <span>View Dashboard</span>
              </SidebarMenuButton>
            </Link>
            <Link className="cursor-pointer" href="/dashboard/admin/">
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <ClipboardMinus />
              <span className="sr-only">All Reports</span>
            </Button>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarGroupLabel>MAIN MENU</SidebarGroupLabel>
          {items.map((item) => (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton render={<a href={subItem.url} />}>
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
