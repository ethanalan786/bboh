// Type Imports
import type { UserFilters, UserPlan, UserRole, UserStatus } from '@/types/user-types'

// Component Imports
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ROLES: UserRole[] = ['ADMIN', 'FRONT_DESK', 'INVENTORY', 'CUSTOMER']
const PLANS: UserPlan[] = ['Basic', 'Team', 'Enterprise']
const STATUSES: UserStatus[] = ['Active', 'Pending', 'Suspended', 'Inactive']

export interface UserTableFiltersProps {
  filters: UserFilters
  onFilterChange: (filters: Partial<UserFilters>) => void
}

export function UserTableFilters({ filters, onFilterChange }: UserTableFiltersProps) {
  return (
    <div className='flex flex-col gap-4 border-b p-6'>
      <div className='grid grid-cols-1 gap-6 max-md:*:last:col-span-full sm:grid-cols-2 md:grid-cols-3'>
        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='filter-role'>Select Role</Label>
          <Select
            value={filters.role}
            onValueChange={(value: string) => {
              onFilterChange({ role: value as UserFilters['role'] })
            }}
          >
            <SelectTrigger id='filter-role' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {ROLES.map(role => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='filter-plan'>Select Plan</Label>
          <Select
            value={filters.plan}
            onValueChange={(value: string) => {
              onFilterChange({ plan: value as UserFilters['plan'] })
            }}
          >
            <SelectTrigger id='filter-plan' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {PLANS.map(plan => (
                <SelectItem key={plan} value={plan}>
                  {plan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='filter-status'>Select Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: string) => {
              onFilterChange({ status: value as UserFilters['status'] })
            }}
          >
            <SelectTrigger id='filter-status' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}