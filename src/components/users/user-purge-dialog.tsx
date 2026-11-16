"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface UserActivity {
  sales: number
  burnBoxSales: number
  stockHistory: number
  auditLogs: number
  reportBookmarks: number
  feedback: number
  customerSales: number
}

interface UserPurgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    email: string
  } | null
  onDeactivate: () => void
  onPurge: (confirmEmail: string) => void
  isLoading?: boolean
}

const ACTIVITY_ROWS: {
  key: keyof UserActivity
  label: string
  where: string
  deleted: boolean
}[] = [
  {
    key: "sales",
    label: "Sales they recorded",
    where: "Front Desk → My Recent Sales & Adjustments, admin Sales pages & reports",
    deleted: true,
  },
  {
    key: "burnBoxSales",
    label: "Burn Box drink sales",
    where: "Admin → Burn Box → Sales (kept as historical records — not deleted)",
    deleted: false,
  },
  {
    key: "stockHistory",
    label: "Stock history entries",
    where: "Front Desk → Stock History, admin inventory reports",
    deleted: true,
  },
  {
    key: "auditLogs",
    label: "Audit trail entries",
    where: "Admin → Audit Trail",
    deleted: true,
  },
  {
    key: "customerSales",
    label: "Sales where they were the customer",
    where: "Sale records — customer name is removed, sale is kept",
    deleted: false,
  },
  {
    key: "reportBookmarks",
    label: "Bookmarked reports",
    where: "Reports sidebar shortcuts",
    deleted: true,
  },
  {
    key: "feedback",
    label: "Feedback submissions",
    where: "Software Feedback page",
    deleted: true,
  },
];

export function UserPurgeDialog({
  open,
  onOpenChange,
  user,
  onDeactivate,
  onPurge,
  isLoading = false
}: UserPurgeDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState("")
  const [activity, setActivity] = useState<UserActivity | null>(null)
  const [loadingActivity, setLoadingActivity] = useState(false)

  const handleOpenChange = (o: boolean) => {
    if (o && user) {
      setLoadingActivity(true)
      setActivity(null)
      fetch(`/api/users/${user.id}/activity`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setActivity(data?.activity ?? null))
        .catch(() => setActivity(null))
        .finally(() => setLoadingActivity(false))
    } else {
      setConfirmEmail("")
      setActivity(null)
    }
    onOpenChange(o)
  }

  const emailMatches =
    !!user && confirmEmail.trim().toLowerCase() === user.email.toLowerCase()

  const totalRecords = activity
    ? ACTIVITY_ROWS.reduce((sum, row) => sum + (activity[row.key] || 0), 0)
    : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Delete {user?.name}?
          </DialogTitle>
          <DialogDescription>
            This user has data across the system. You can deactivate the
            account to keep that history, or permanently delete their records.
          </DialogDescription>
        </DialogHeader>

        {/* Breakdown of the user's data */}
        <div className="rounded-lg border border-neutral-200 dark:border-[#2a2a2a]">
          {loadingActivity ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Loading their activity…
            </div>
          ) : activity ? (
            <>
              <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {totalRecords} related record{totalRecords === 1 ? "" : "s"} found
              </p>
              <ul className="divide-y divide-neutral-200 dark:divide-[#242424]">
                {ACTIVITY_ROWS.map((row) => {
                  const count = activity[row.key] || 0
                  if (count === 0) return null
                  return (
                    <li key={row.key} className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {row.label}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {row.where}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.deleted
                              ? "bg-red-500/10 text-red-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {count} · {row.deleted ? "deleted" : "kept"}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Couldn&apos;t load the activity breakdown — deleting will still
              remove all related records.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="purge-confirm">
            To delete permanently, type <strong>{user?.email}</strong>
          </Label>
          <Input
            id="purge-confirm"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user?.email}
            autoComplete="off"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="sm:mr-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onDeactivate}
            disabled={isLoading}
          >
            {isLoading ? "Working..." : "Deactivate Only"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onPurge(confirmEmail)}
            disabled={!emailMatches || isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
