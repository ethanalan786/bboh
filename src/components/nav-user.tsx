"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon, SparklesIcon, CheckmarkBadgeIcon, CreditCardIcon, NotificationIcon, LogoutIcon, Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Switch } from "@/components/ui/motion-switch"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/feedback" className="cursor-pointer">
                <DropdownMenuItem>
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                  Software Feedback
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleThemeToggle}>
                <div className="flex items-center gap-2 w-full">
                  <HugeiconsIcon icon={theme === "dark" ? Moon02Icon : Sun01Icon} strokeWidth={2} />
                  <span className="flex-1">Theme</span>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeToggle}
                    size="md"
                  />
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/admin/users" className="cursor-pointer">
              <DropdownMenuItem>
                <HugeiconsIcon icon={CheckmarkBadgeIcon} strokeWidth={2} />
                Users Management
              </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/admin/audit-trail" className="cursor-pointer">
              <DropdownMenuItem>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                Audit Trail
              </DropdownMenuItem>
              </Link>
               <Link href="/dashboard/admin/settings" className="cursor-pointer">
              <DropdownMenuItem>
                <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                Settings
              </DropdownMenuItem>
               </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
