"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { Bookmark } from "lucide-react"
import { useEffect, useState } from "react"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const [bookmarks, setBookmarks] = useState<Array<{ reportId: string; reportTitle: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch('/api/reports/bookmarks')
        if (!response.ok) throw new Error('Failed to fetch bookmarks')

        const data = await response.json()
        setBookmarks(data.bookmarks || [])
      } catch (error) {
        console.error('Error fetching bookmarks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarks()
  }, [])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>REPORTS</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton render={<a href={item.url} />}>
              {item.icon}
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {!loading && bookmarks.length > 0 && bookmarks.map((bookmark) => (
          <SidebarMenuItem key={bookmark.reportId}>
            <SidebarMenuButton render={<a href={bookmark.reportId} />}>
              <Bookmark size={16} className="text-yellow-400 fill-yellow-400" />
              <span>{bookmark.reportTitle}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}