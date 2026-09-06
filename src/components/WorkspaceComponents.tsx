import {
  CheckCircle,
  ClockCountdown,
  FileText,
  Sparkle,
} from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { CountingNumber } from "./animate-ui/CountingNumber"
import { Shine } from "./animate-ui/Shine"
import { cn } from "../lib/cn"
import { formatShortDate } from "../lib/format"
import { priorityLabels } from "../lib/workspace"
import type { Company, Finding, FindingPriority, IntelligenceSummary } from "../types"

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function KpiCard({ label, value, note, icon }: { label: string; value: number; note: string; icon: React.ReactNode }) {
  return (
    <div className="card-surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="numeric text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl"><CountingNumber number={value} /></p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 text-xs text-slate-600">{note}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700" aria-hidden="true">{icon}</span>
      </div>
    </div>
  )
}

const priorityStyles: Record<FindingPriority, string> = {
  high: "border-amber-200 bg-amber-50 text-amber-900",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  low: "border-slate-200 bg-slate-100 text-slate-700",
}

export function PriorityBadge({ priority }: { priority: FindingPriority }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", priorityStyles[priority])}>
      {priorityLabels[priority]}
    </span>
  )
}

export function AvatarGroup({ names }: { names: Array<{ id: string; name: string; initials: string }> }) {
  const reducedMotion = useReducedMotion()
  return (
    <div className="flex -space-x-2" role="group" aria-label={`${names.length} assigned staff`}>
      {names.map((person, index) => (
        <motion.span
          key={person.id}
          title={person.name}
          role="img"
          aria-label={person.name}
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={reducedMotion ? undefined : { y: -3, zIndex: 10 }}
          transition={{ delay: reducedMotion ? 0 : index * 0.06, type: "spring", stiffness: 280, damping: 22 }}
          className="grid size-9 place-items-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white shadow-sm"
        >
          {person.initials}
        </motion.span>
      ))}
    </div>
  )
}

export function IntelligenceCard({ summary, company, compact = false }: { summary: IntelligenceSummary; company: Company; compact?: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)] sm:p-6" aria-labelledby="intelligence-title">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cyan-300">
            <Sparkle size={18} weight="fill" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.14em]">WaterOps Intelligence</p>
          </div>
          <Shine delay={350} duration={800} className="rounded-full">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/25 bg-teal-300/10 px-2.5 py-1 text-xs font-semibold text-teal-200">
              <CheckCircle size={14} weight="fill" aria-hidden="true" />Analysis complete
            </span>
          </Shine>
        </div>
        <h2 id="intelligence-title" className="mt-5 max-w-3xl text-xl font-bold tracking-[-0.03em] sm:text-2xl">{summary.headline}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{summary.narrative}</p>
        {!compact ? (
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {summary.observations.map((observation) => (
              <li key={observation} className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-xs leading-5 text-slate-300">{observation}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><FileText size={14} aria-hidden="true" />Evidence sources</span>
          {summary.sourceReportIds.length ? summary.sourceReportIds.slice(0, 4).map((id) => (
            <Link key={id} to={`/reports/${id}`} className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-blue-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">{id}</Link>
          )) : <span className="text-xs text-slate-400">No linked source reports</span>}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-slate-400"><ClockCountdown size={13} aria-hidden="true" />Updated {formatShortDate(summary.completedAt.slice(0, 10))}</span>
        </div>
      </div>
    </section>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/65 px-6 py-10 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600"><FileText size={24} weight="duotone" aria-hidden="true" /></span>
        <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-600">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  )
}
