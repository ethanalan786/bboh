"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NumberFlow from "@number-flow/react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function AnimatedNumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  className,
  disabled = false,
}: AnimatedNumberInputProps) {
  const [isPressed, setIsPressed] = useState<"plus" | "minus" | null>(null)

  const handleIncrement = () => {
    if (disabled) return
    const newValue = Math.min(value + step, max)
    if (newValue !== value) {
      onChange(newValue)
      setIsPressed("plus")
      setTimeout(() => setIsPressed(null), 150)
    }
  }

  const handleDecrement = () => {
    if (disabled) return
    const newValue = Math.max(value - step, min)
    if (newValue !== value) {
      onChange(newValue)
      setIsPressed("minus")
      setTimeout(() => setIsPressed(null), 150)
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Minus Button */}
      <motion.button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: disabled || value <= min ? 1 : 1.05 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
          "bg-neutral-800 text-white hover:bg-neutral-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="minus"
            initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Minus className="h-5 w-5" strokeWidth={2.5} />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Animated Number Display */}
      <div className="flex min-w-24 justify-center">
        <motion.div
          animate={{
            scale: isPressed ? 1.15 : 1,
            color: isPressed === "plus" ? "#22c55e" : isPressed === "minus" ? "#ef4444" : "inherit",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-4xl font-bold tabular-nums"
        >
          <NumberFlow value={value} />
        </motion.div>
      </div>

      {/* Plus Button */}
      <motion.button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: disabled || value >= max ? 1 : 1.05 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
          "bg-neutral-800 text-white hover:bg-neutral-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="plus"
            initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
