import {
  rowSortingFeature,
  createSortedRowModel,
  tableFeatures,
} from '@tanstack/react-table'

// Define the features this table uses
export const userTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

// Pass this as the first generic argument to ColumnDef, Column, Table, and Row
export type UserTableFeatures = typeof userTableFeatures
