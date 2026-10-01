'use client'

// Component Imports
import { Pagination } from '@/components/ui/pagination'

// Hook Imports
import { usePagination } from '@/hooks/use-pagination'

export interface UserPaginationProps {
  showingFrom: number
  showingTo: number
  total: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function UserPagination({
  showingFrom,
  showingTo,
  total,
  currentPage,
  totalPages,
  onPageChange
}: UserPaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay: 2
  })

  return (
    <div className='flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col'>
      <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
        Showing <span>{showingFrom}</span> to <span>{showingTo}</span> of <span>{total}</span> entries
      </p>

      <div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}