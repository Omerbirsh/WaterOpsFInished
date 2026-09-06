import { useEffect, useState, type ComponentProps } from "react"
import { animate, useReducedMotion } from "motion/react"

export interface CountingNumberProps extends ComponentProps<"span"> {
  number: number
  fromNumber?: number
  delay?: number
  decimalPlaces?: number
}

export function CountingNumber({
  number,
  fromNumber = 0,
  delay = 0,
  decimalPlaces = 0,
  ...props
}: CountingNumberProps) {
  const reducedMotion = useReducedMotion()
  const [display, setDisplay] = useState(reducedMotion ? number : fromNumber)

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(number)
      return
    }

    const controls = animate(fromNumber, number, {
      duration: 0.8,
      delay: delay / 1000,
      ease: "easeOut",
      onUpdate: setDisplay,
    })
    return () => controls.stop()
  }, [delay, fromNumber, number, reducedMotion])

  const formatted = display.toFixed(decimalPlaces)
  return (
    <span {...props}>
      <span className="sr-only">{number.toFixed(decimalPlaces)}</span>
      <span aria-hidden="true">{formatted}</span>
    </span>
  )
}
