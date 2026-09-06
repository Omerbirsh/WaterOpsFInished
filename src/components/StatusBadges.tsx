import { CheckCircle, ClockCountdown, SealCheck, WarningCircle, XCircle } from "@phosphor-icons/react"
import { cn } from "../lib/cn"
import { statusLabels } from "../lib/format"
import type { FindingStatus } from "../types"

export function MeasurementStatus({ outOfRange }: { outOfRange: boolean }) {
  const Icon = outOfRange ? WarningCircle : CheckCircle
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        outOfRange
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-teal-200 bg-teal-50 text-teal-800",
      )}
    >
      <Icon size={15} weight="fill" aria-hidden="true" />
      {outOfRange ? "Out of range" : "In range"}
    </span>
  )
}

const findingStyles: Record<FindingStatus, string> = {
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  accepted: "border-blue-200 bg-blue-50 text-blue-800",
  dismissed: "border-slate-200 bg-slate-100 text-slate-700",
  resolved: "border-teal-200 bg-teal-50 text-teal-800",
}

const findingIcons = {
  needs_review: ClockCountdown,
  accepted: CheckCircle,
  dismissed: XCircle,
  resolved: SealCheck,
} satisfies Record<FindingStatus, typeof ClockCountdown>

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const Icon = findingIcons[status]
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", findingStyles[status])}>
      <Icon size={15} weight="fill" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}
