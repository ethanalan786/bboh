import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"

type SpinnerProps = {
  className?: string
}

function Spinner({ className }: SpinnerProps) {
  return (
    <HugeiconsIcon icon={Loading03Icon} data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} />
  )
}

export { Spinner }
