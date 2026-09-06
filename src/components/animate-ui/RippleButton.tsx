import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { forwardRef, useState, type PointerEvent } from "react"
import { Button, type ButtonProps } from "../ui/Button"
import { cn } from "../../lib/cn"

interface Ripple {
  id: number
  x: number
  y: number
}

export const RippleButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, onPointerDown, ...props }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([])
    const reducedMotion = useReducedMotion()

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event)
      if (reducedMotion) return
      const rect = event.currentTarget.getBoundingClientRect()
      const ripple = { id: Date.now(), x: event.clientX - rect.left, y: event.clientY - rect.top }
      setRipples((items) => [...items, ripple])
      window.setTimeout(() => setRipples((items) => items.filter((item) => item.id !== ripple.id)), 650)
    }

    return (
      <Button ref={ref} className={cn("relative isolate overflow-hidden", className)} onPointerDown={handlePointerDown} {...props}>
        <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              aria-hidden="true"
              className="pointer-events-none absolute size-8 rounded-full bg-white/35"
              style={{ left: ripple.x - 16, top: ripple.y - 16 }}
              initial={{ opacity: 0.7, scale: 0 }}
              animate={{ opacity: 0, scale: 12 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      </Button>
    )
  },
)

RippleButton.displayName = "RippleButton"
