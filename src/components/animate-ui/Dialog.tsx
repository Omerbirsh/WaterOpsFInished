import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { createContext, useContext, type ComponentProps } from "react"
import { cn } from "../../lib/cn"

const OpenContext = createContext(false)

export function Dialog({ open, children, ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <OpenContext.Provider value={Boolean(open)}>
      <DialogPrimitive.Root open={open} {...props}>{children}</DialogPrimitive.Root>
    </OpenContext.Provider>
  )
}

export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export function DialogContent({
  children,
  className,
  showCloseButton = true,
  side = "center",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean; side?: "center" | "right" }) {
  const open = useContext(OpenContext)
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {open ? (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-slate-950/62 backdrop-blur-[3px] data-[state=closed]:invisible data-[state=closed]:pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              className={cn(
                "fixed z-50 overflow-y-auto border border-slate-200 bg-white text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.3)] focus:outline-none data-[state=closed]:invisible data-[state=closed]:pointer-events-none",
                side === "center"
                  ? "left-1/2 top-1/2 max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 sm:p-7"
                  : "bottom-0 right-0 top-0 h-screen w-full max-w-md rounded-none border-y-0 border-r-0 p-0",
                className,
              )}
              initial={reducedMotion ? { opacity: 0 } : side === "center" ? { opacity: 0, y: 14, scale: 0.97 } : { opacity: 0, x: 32 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : side === "center" ? { opacity: 0, y: 8, scale: 0.98 } : { opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 180, damping: 24, duration: reducedMotion ? 0 : undefined }}
            >
              {children}
              {showCloseButton ? (
                <DialogPrimitive.Close className="absolute right-4 top-4 grid size-10 cursor-pointer place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/25">
                  <X size={18} weight="bold" aria-hidden="true" />
                  <span className="sr-only">Close dialog</span>
                </DialogPrimitive.Close>
              ) : null}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-2 pr-10", className)} {...props} />
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}
