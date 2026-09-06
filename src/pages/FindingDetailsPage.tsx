import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ClipboardText,
  Info,
  SealCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import { ParameterTrend } from "../components/ParameterTrend"
import { FindingStatusBadge, MeasurementStatus } from "../components/StatusBadges"
import { Button, buttonVariants } from "../components/ui/Button"
import { PriorityBadge } from "../components/WorkspaceComponents"
import { cn } from "../lib/cn"
import { isOutOfRange } from "../lib/findings"
import { formatDate, formatMeasurement, formatRange, formatShortDate, statusLabels } from "../lib/format"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"
import type { EvidenceReason, FindingStatus } from "../types"

const reasonLabels: Record<EvidenceReason, string> = {
  out_of_range: "Outside configured range",
  recorded_action: "Action recorded here",
  next_out_of_range: "Following reading still outside range",
  unverified_action: "No later verification recorded",
  missing_measurement: "Measurement not recorded",
  previous_out_of_range: "Earlier reading outside range",
  intervening_in_range: "Documented return to range",
  recurring_out_of_range: "Later reading outside range again",
}

function DecisionPanel({ findingId, status }: { findingId: string; status: FindingStatus }) {
  const { setStatus } = useDecisions()
  const actions = [
    { status: "accepted" as const, label: "Accept finding", icon: Check, variant: "primary" as const, note: "Keep this prompt in the review workflow." },
    { status: "dismissed" as const, label: "Dismiss", icon: X, variant: "secondary" as const, note: "Remove this prompt from active review." },
    { status: "resolved" as const, label: "Mark resolved", icon: SealCheck, variant: "positive" as const, note: "Record that review is complete." },
  ]

  return (
    <aside aria-labelledby="decision-heading" className="card-surface rounded-2xl p-5 xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">Review decision</p>
          <h2 id="decision-heading" className="mt-1.5 text-lg font-bold tracking-[-0.02em] text-slate-950">Set finding status</h2>
        </div>
        <FindingStatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">Decisions are stored only in this browser and can be changed at any time.</p>
      <div className="mt-5 space-y-3">
        {actions.map(({ status: nextStatus, label, icon: Icon, variant, note }) => (
          <div key={nextStatus}>
            <Button
              variant={variant}
              className="w-full"
              disabled={status === nextStatus}
              aria-pressed={status === nextStatus}
              onClick={() => setStatus(findingId, nextStatus)}
            >
              <Icon size={18} weight="bold" aria-hidden="true" />
              {status === nextStatus ? `${statusLabels[nextStatus]} now` : label}
            </Button>
            <p className="mt-1.5 px-1 text-[11px] leading-4 text-slate-600">{note}</p>
          </div>
        ))}
      </div>
      {status !== "needs_review" ? (
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setStatus(findingId, "needs_review")}>
          <ArrowCounterClockwise size={17} weight="bold" aria-hidden="true" />
          Reopen for review
        </Button>
      ) : null}
    </aside>
  )
}

export function FindingDetailsPage() {
  const { findingId } = useParams()
  const { findings } = useDecisions()
  const { company } = useWorkspace()
  const finding = findings.find((item) => item.id === findingId)

  if (!finding) {
    return (
      <div className="mx-auto grid min-h-screen max-w-2xl place-items-center px-5 py-12">
        <div className="card-surface w-full rounded-3xl p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Info size={28} weight="duotone" aria-hidden="true" /></span>
          <h1 className="mt-5 text-2xl font-bold tracking-[-0.035em] text-slate-950">Finding not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">This finding is not available in the ClearFlow workspace.</p>
          <Link to="/findings" className={cn(buttonVariants({ variant: "primary" }), "mt-6")}>
            <ArrowLeft size={18} weight="bold" aria-hidden="true" />
            Back to review queue
          </Link>
        </div>
      </div>
    )
  }

  const customer = company.customers.find((item) => item.id === finding.customerId)
  const system = customer?.systems.find((item) => item.id === finding.systemId)
  if (!customer || !system) return null
  const parameterHistory = system.visits.map((visit) => {
    const measurement = visit.measurements.find((item) => item.parameterId === finding.parameterId)
    const technicianName = company.users.find((item) => item.id === visit.technicianId)?.name ?? "Unknown technician"
    return { date: visit.date, visitId: visit.id, reportId: visit.sourceReportId, technicianName, measurement }
  })
  const measuredHistory = parameterHistory.flatMap((item) => item.measurement ? [{ ...item, measurement: item.measurement }] : [])
  const evidenceMeasurementIds = new Set(
    finding.evidence.flatMap((item) => item.kind === "measurement" ? [item.measurement.id] : []),
  )
  const missingEvidenceVisitIds = new Set(
    finding.evidence.flatMap((item) => item.kind === "missing_measurement" ? [item.visitId] : []),
  )

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10 xl:py-10">
      <Link to="/findings" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/25">
        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        Review queue
      </Link>

      <header className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{finding.ruleId.replace("rule-", "Rule ")}</span>
            <PriorityBadge priority={finding.priority} />
            <FindingStatusBadge status={finding.status} />
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-4xl">{finding.findingType}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{finding.explanation}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{finding.customerName} <span className="font-normal text-slate-300">/</span> {finding.systemName} <span className="font-normal text-slate-300">/</span> {finding.parameterName}</p>
        </div>
      </header>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="rule-heading" className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50/60 p-5 sm:p-6">
            <div className="absolute right-4 top-4 text-blue-200" aria-hidden="true"><CheckCircle size={64} weight="duotone" /></div>
            <div className="relative max-w-3xl">
              <div className="flex items-center gap-2 text-blue-800"><ClipboardText size={19} weight="bold" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.13em]">Exact triggering rule</p></div>
              <h2 id="rule-heading" className="mt-3 text-lg font-bold leading-7 text-slate-950">{finding.ruleText}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">WaterOps traces this result directly to visit order, configured ranges, measurements, recorded actions, and documented coverage.</p>
            </div>
          </section>

          <section aria-labelledby="trend-heading">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-700">Across time</p>
                <h2 id="trend-heading" className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-950">{`${finding.parameterName} history`}</h2>
              </div>
              <p className="numeric text-xs font-semibold text-slate-600">Configured range: {formatRange(measuredHistory[0].measurement)}</p>
            </div>
            <div className="mt-4"><ParameterTrend points={parameterHistory} /></div>
          </section>

          <section aria-labelledby="evidence-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-700">Evidence chain</p>
              <h2 id="evidence-heading" className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-950">Why this was surfaced</h2>
            </div>
            <ol className={cn("mt-4 grid gap-3", finding.evidence.length === 1 ? "max-w-md" : "sm:grid-cols-2 xl:grid-cols-3")}>
              {finding.evidence.map((row, index) => (
                <li key={`${row.kind}-${row.visitId}-${index}`} className={cn("card-surface rounded-2xl p-5", row.kind === "missing_measurement" && "border-dashed bg-slate-50/90")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="numeric text-xs font-bold uppercase tracking-[0.1em] text-blue-700">Evidence {index + 1}</p>
                      <p className="mt-1.5 text-sm font-bold text-slate-950">{formatDate(row.date)}</p>
                    </div>
                    {row.kind === "measurement" ? (
                      <MeasurementStatus outOfRange={isOutOfRange(row.measurement)} />
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <Info size={14} weight="fill" aria-hidden="true" />Not recorded
                      </span>
                    )}
                  </div>
                  <p className="numeric mt-4 text-2xl font-bold tracking-[-0.03em] text-slate-950">{row.kind === "measurement" ? formatMeasurement(row.measurement) : "Not recorded"}</p>
                  <p className="numeric mt-1 text-xs text-slate-600">{row.kind === "measurement" ? `Range ${formatRange(row.measurement)}` : `${row.parameterName} · coverage gap`}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {row.reasons.map((reason) => <span key={reason} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{reasonLabels[reason]}</span>)}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-600">
                    {row.kind === "measurement" ? (
                      <>
                        <p>{row.measurement.technicianNote}</p>
                        <p className="mt-2"><strong className="font-semibold text-slate-700">Action: </strong>{row.measurement.action?.description ?? "No action recorded"}</p>
                      </>
                    ) : (
                      <p>{`No ${row.parameterName.toLowerCase()} measurement appears in this service report.`}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="history-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-700">Source record</p>
              <h2 id="history-heading" className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-950">Complete parameter history</h2>
            </div>
            <div className="card-surface mt-4 overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[0.8fr_0.8fr_1fr_2fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 md:grid">
                <span>Visit</span><span>Measurement</span><span>Range / status</span><span>Service record</span>
              </div>
              <div className="divide-y divide-slate-200/80">
                {parameterHistory.map(({ date, visitId, reportId, technicianName, measurement }) => {
                  const evidence = measurement ? evidenceMeasurementIds.has(measurement.id) : missingEvidenceVisitIds.has(visitId)
                  return (
                    <div key={visitId} className={cn("grid gap-4 px-5 py-4 md:grid-cols-[0.8fr_0.8fr_1fr_2fr] md:items-start", evidence && "bg-blue-50/45", !measurement && "bg-slate-50/80")}>
                      <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600 md:hidden">Visit</p><p className="numeric mt-1 text-sm font-semibold text-slate-800 md:mt-0">{formatShortDate(date)}</p><Link to={`/reports/${reportId}`} className="mt-1 block text-[10px] font-semibold text-blue-700 hover:underline">{reportId}</Link>{evidence ? <span className="mt-1 inline-flex rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-800">Evidence row</span> : null}</div>
                      <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600 md:hidden">Measurement</p><p className="numeric mt-1 text-sm font-bold text-slate-950 md:mt-0">{measurement ? formatMeasurement(measurement) : "Not recorded"}</p></div>
                      <div>{measurement ? <><p className="numeric text-xs text-slate-600">{formatRange(measurement)}</p><div className="mt-2"><MeasurementStatus outOfRange={isOutOfRange(measurement)} /></div></> : <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">Coverage gap</span>}</div>
                      <div className="text-xs leading-5 text-slate-600">{measurement ? <><p>{measurement.technicianNote}</p><p className="mt-1.5"><strong className="font-semibold text-slate-700">Action: </strong>{measurement.action?.description ?? "No action recorded"}</p></> : <p>{`No ${finding.parameterName.toLowerCase()} measurement appears in this report.`}</p>}<p className="mt-1.5 text-[10px] text-slate-500">Technician: {technicianName}</p></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        <DecisionPanel findingId={finding.id} status={finding.status} />
      </div>

      <footer className="mt-8 flex items-start gap-2 border-t border-slate-200 py-6 text-xs leading-5 text-slate-600">
        <WarningCircle className="mt-0.5 shrink-0" size={16} weight="bold" aria-hidden="true" />
        Informational review prompt only. The finding does not assess technical root cause, action correctness, safety, compliance, or treatment recommendations.
      </footer>
    </div>
  )
}
