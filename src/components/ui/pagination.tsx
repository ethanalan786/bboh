import * as React from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = React.useMemo(() => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }, [currentPage, totalPages])

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
        </PaginationItem>
        {pages.map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === 'number' ? (
              <Button
                variant={page === currentPage ? 'outline' : 'ghost'}
                size="icon"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </nav>
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-2!", className)}
      {...props}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-2!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 items-center justify-center",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
