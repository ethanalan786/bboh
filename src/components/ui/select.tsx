"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const Select = React.forwardRef<
  HTMLSelectElement,
  SelectProps
>(({ className, children, value, onValueChange, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c8f135] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    value={value}
    onChange={(e) => {
      onValueChange?.(e.target.value)
    }}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  >
    {children}
  </div>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-[#111] border border-[#1f1f1f] text-white", className)}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => (
  <option
    ref={ref}
    className={cn("bg-[#111] text-white hover:bg-[#1a1a1a]", className)}
    {...props}
  >
    {children}
  </option>
))
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
