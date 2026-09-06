import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"

export const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary: "border-blue-600 bg-blue-600 px-4 text-white shadow-[0_8px_22px_rgba(37,99,235,0.2)] hover:border-blue-700 hover:bg-blue-700 active:bg-blue-800",
        secondary: "border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
        ghost: "border-transparent bg-transparent px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        positive: "border-teal-700 bg-teal-700 px-4 text-white shadow-[0_8px_22px_rgba(15,118,110,0.16)] hover:bg-teal-800",
        quiet: "border-slate-200 bg-slate-50 px-4 text-slate-700 hover:bg-slate-100",
      },
      size: {
        default: "h-11",
        small: "h-9 min-h-9 rounded-lg px-3 text-xs",
        icon: "size-11 min-h-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)

Button.displayName = "Button"
