'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

const InputOTPContext = React.createContext<{
  value: string
  maxLength: number
  onChange: (value: string) => void
} | null>(null)

const InputOTP = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
    maxLength?: number
    value?: string
    onChange?: (value: string) => void
    containerClassName?: string
  }
>(({ className, maxLength = 6, value = "", onChange, containerClassName, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    if (newValue.length <= maxLength) {
      setInternalValue(newValue)
      onChange?.(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && internalValue.length > 0) {
      handleChange(internalValue.slice(0, -1))
    }
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const newValue = target.value.replace(/[^0-9]/g, '').slice(0, maxLength)
    handleChange(newValue)
    target.value = ''
  }

  return (
    <InputOTPContext.Provider value={{ value: internalValue, maxLength, onChange: handleChange }}>
      <div ref={ref} className={cn("flex items-center gap-2", className, containerClassName)} {...props}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={maxLength}
          className="sr-only"
          value={internalValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoComplete="one-time-code"
        />
        {props.children}
      </div>
    </InputOTPContext.Provider>
  )
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-2", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    index: number
    'data-valid'?: boolean
  }
>(({ index, className, ...props }, ref) => {
  const context = React.useContext(InputOTPContext)
  if (!context) throw new Error("InputOTPSlot must be used within InputOTP")

  const { value, onChange, maxLength } = context
  const char = value[index] || ""
  const isActive = index === value.length
  const [isInvalid, setIsInvalid] = React.useState(false)
  const [isValid, setIsValid] = React.useState(false)

  React.useEffect(() => {
    if (props["aria-invalid"]) {
      setIsInvalid(true)
      setIsValid(false)
      const timer = setTimeout(() => setIsInvalid(false), 500)
      return () => clearTimeout(timer)
    }
  }, [props["aria-invalid"]])

  React.useEffect(() => {
    if (props["data-valid"] === true) {
      setIsValid(true)
      setIsInvalid(false)
    } else if (props["data-valid"] === false) {
      setIsValid(false)
    }
  }, [props["data-valid"]])

  const handleClick = () => {
    // Find the hidden input and focus it
    const input = document.querySelector('input.sr-only') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn(
        "relative flex h-10 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "hover:bg-accent hover:text-accent-foreground",
        isInvalid && "border-destructive focus:ring-destructive animate-shake",
        isValid && "border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
        isActive && "border-ring",
        char && "bg-muted",
        className
      )}
      {...props}
    >
      <span className="text-center">{char}</span>
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-3 h-0.5 bg-muted-foreground/30", className)} {...props} />
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
