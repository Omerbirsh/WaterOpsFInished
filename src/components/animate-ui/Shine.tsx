import { motion, useReducedMotion } from "motion/react"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

export interface ShineProps extends ComponentProps<"div"> {
  color?: string
  opacity?: number
  delay?: number
  duration?: number
  enabled?: boolean
}

export function Shine({
  children,
  className,
  color = "#ffffff",
  opacity = 0.28,
  delay = 0,
  duration = 900,
  enabled = true,
  ...props
}: ShineProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {children}
      {enabled && !reducedMotion ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[-40%] left-0 w-1/2 -skew-x-12 blur-sm"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity }}
          initial={{ x: "-180%" }}
          animate={{ x: "320%" }}
          transition={{ duration: duration / 1000, delay: delay / 1000, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  )
}
