'use client'

// Third-party Imports
import type { SortingState, Updater, RowData } from '@tanstack/react-table'
import { useTable } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

// Type Imports
import type { AppUser, UserSorting } from '@/types/user-types'

// Component Imports
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { userTableColumns } from './user-table-columns'
import { userTableFeatures, type UserTableFeatures } from './user-table-features'

export interface UserTableProps {
  paginatedUsers: AppUser[]
  totalPages: number
  sorting: UserSorting | null
  onSortingChange: (sorting: UserSorting | null) => void
}

export function UserTable({ paginatedUsers, totalPages, sorting, onSortingChange }: UserTableProps) {
  const sortingState: SortingState = sorting ? [sorting] : []

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const nextSorting = typeof updater === 'function' ? updater(sortingState) : updater

    if (nextSorting.length === 0) {
      onSortingChange(null)

      return
    }

    onSortingChange({
      id: nextSorting[0].id as UserSorting['id'],
      desc: nextSorting[0].desc
    })
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useTable({
    features: userTableFeatures,
    data: paginatedUsers,
    columns: userTableColumns as any,
    state: {
      sorting: sortingState
    },
    onSortingChange: handleSortingChange,
    getRowId: (row: RowData) => (row as AppUser).id,
    enableSortingRemoval: false
  })

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <TableRow key={headerGroup.id} className='h-14 border-t'>
              {headerGroup.headers.map((header: any) => (
                <TableHead
                  key={header.id}
                  className='text-muted-foreground first:pl-4 last:px-4 last:text-center whitespace-nowrap'
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <div
                      className={cn(
                        header.column.getCanSort() &&
                          'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      onKeyDown={event => {
                        if (header.column.getCanSort() && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          header.column.getToggleSortingHandler()?.(event)
                        }
                      }}
                      tabIndex={header.column.getCanSort() ? 0 : undefined}
                    >
                      <table.FlexRender header={header} />
                      {{
                        asc: <ChevronUpIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />,
                        desc: <ChevronDownIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row: any) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell: any) => (
                  <TableCell key={cell.id} className='h-14 first:w-12.5 first:pl-4 last:w-29 last:px-4 whitespace-nowrap'>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={userTableColumns.length} className='h-24 text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
