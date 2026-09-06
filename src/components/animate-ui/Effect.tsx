import { Children, type ReactElement } from "react"
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react"

export interface EffectProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate"> {
  delay?: number
  blur?: boolean
  slide?: boolean
  fade?: boolean
  zoom?: boolean
  inView?: boolean
}

export function Effect({
  delay = 0,
  blur = false,
  slide = false,
  fade = true,
  zoom = false,
  inView = false,
  transition,
  ...props
}: EffectProps) {
  const reducedMotion = useReducedMotion()
  const initial = reducedMotion
    ? false
    : {
        opacity: fade ? 0 : 1,
        y: slide ? 14 : 0,
        scale: zoom ? 0.97 : 1,
        filter: blur ? "blur(8px)" : "blur(0px)",
      }
  const visible = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }

  return (
    <motion.div
      initial={initial}
      animate={inView ? undefined : visible}
      whileInView={inView ? visible : undefined}
      viewport={inView ? { once: true, margin: "-40px" } : undefined}
      transition={{ duration: reducedMotion ? 0 : 0.48, delay: reducedMotion ? 0 : delay, ease: "easeOut", ...transition }}
      {...props}
    />
  )
}

export function Effects({
  children,
  holdDelay = 0.1,
  ...props
}: EffectProps & { children: ReactElement | ReactElement[]; holdDelay?: number }) {
  return Children.map(children, (child, index) => (
    <Effect {...props} delay={(props.delay ?? 0) + index * holdDelay}>
      {child}
    </Effect>
  ))
}
