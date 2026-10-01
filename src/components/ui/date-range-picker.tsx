"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: { from: Date | undefined; to: Date | undefined }
  onChange?: (value: { from: Date | undefined; to: Date | undefined }) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Pick a date"
    return format(date, "MMM d, yyyy")
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger>
          <button
            id="date"
            className={cn(
              "w-full inline-flex items-center justify-start gap-2 rounded-4xl border border-input/30 bg-input/30 px-3 py-2 text-sm font-medium hover:bg-input/50 transition-all",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {value?.from ? (
              value?.to ? (
                <>
                  {formatDate(value.from)} - {formatDate(value.to)}
                </>
              ) : (
                formatDate(value.from)
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: value?.from,
              to: value?.to,
            }}
            onSelect={(range) => {
              onChange?.({ from: range?.from, to: range?.to })
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
