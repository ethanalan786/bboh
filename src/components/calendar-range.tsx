"use client"

import * as React from "react"
import { type DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"

interface CalendarRangeProps {
  dateRange?: DateRange
  setDateRange: (range: DateRange | undefined) => void
  onApply?: () => void
}

export function CalendarRange({ dateRange, setDateRange, onApply }: CalendarRangeProps) {
  return (
    <div className="flex flex-col gap-2">
      <Calendar
        mode="range"
        defaultMonth={dateRange?.from || new Date()}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        className="rounded-lg border"
      />
    </div>
  )
}
