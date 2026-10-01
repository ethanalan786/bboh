"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ReactNode } from "react"

interface RefreshLinkProps {
  href: string
  children: ReactNode
  className?: string
  [key: string]: any
}

export function RefreshLink({ href, children, className, ...props }: RefreshLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    // Force a full page refresh by using window.location
    window.location.href = href
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  )
}
