import { ArrowLeft, CalendarBlank, FileText, NotePencil, Wrench } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { SystemEditorDialog } from "../components/EntityDialogs"
import { ParameterTrend } from "../components/ParameterTrend"
import { FindingStatusBadge, MeasurementStatus } from "../components/StatusBadges"
import { EmptyState, IntelligenceCard, PageHeader, PriorityBadge } from "../components/WorkspaceComponents"
import { formatDate, formatMeasurement, formatRange } from "../lib/format"
import { isOutOfRange } from "../lib/findings"
import { serviceIntervalLabels, systemIntelligence, systemTypeLabels } from "../lib/workspace"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"
import { NotFound } from "./CustomerDetailsPage"

export function SystemDetailsPage() {
  const { customerId, systemId } = useParams()
  const { company } = useWorkspace()
  const { findings } = useDecisions()
  const customer = company.customers.find((item) => item.id === customerId)
  const system = customer?.systems.find((item) => item.id === systemId)
  const parameterOptions = useMemo(() => system ? Array.from(new Map(system.visits.flatMap((v) => v.measurements).map((m) => [m.parameterId, m])).values()) : [], [system])
  const [selected, setSelected] = useState<string | undefined>(undefined)
  if (!customer || !system) return <NotFound label="water system" to={customer ? `/customers/${customer.id}` : "/customers"} />
  const parameterId = selected ?? parameterOptions[0]?.parameterId
  const points = system.visits.map((visit) => ({ date: visit.date, measurement: visit.measurements.find((m) => m.parameterId === parameterId) }))
  const relatedFindings = findings.filter((finding) => finding.systemId === system.id)
  const assigned = company.users.find((user) => user.id === system.assignedTechnicianId)
  const summary = systemIntelligence(company, system, findings)

  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <Link to={`/customers/${customer.id}`} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950"><ArrowLeft size={17} weight="bold" />{customer.name}</Link>
    <PageHeader eyebrow={`${systemTypeLabels[system.type]} · ${serviceIntervalLabels[system.serviceInterval]} service`} title={system.name} description={`Assigned to ${assigned?.name ?? "Unassigned"} · ${system.visits.length} service visits · ${customer.name}`} actions={<SystemEditorDialog customer={customer} system={system} />} />
    <div className="mt-6"><IntelligenceCard summary={summary} company={company} /></div>

    <section className="mt-6 card-surface rounded-3xl p-5 sm:p-6" aria-labelledby="history-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Measurement history</p><h2 id="history-title" className="mt-1 text-xl font-bold text-slate-950">Parameter trend</h2></div><label className="text-xs font-semibold text-slate-600">Parameter<select value={parameterId} onChange={(e) => setSelected(e.target.value)} className="mt-1 block h-11 min-w-52 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500">{parameterOptions.map((option) => <option key={option.parameterId} value={option.parameterId}>{option.parameterName}</option>)}</select></label></div>
      <div className="mt-5"><ParameterTrend points={points} /></div>
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-4" aria-labelledby="visits-title"><div className="flex items-center justify-between"><h2 id="visits-title" className="text-xl font-bold text-slate-950">Visit timeline</h2><span className="text-xs font-semibold text-slate-500">Oldest to newest</span></div>{system.visits.length ? system.visits.map((visit) => { const tech = company.users.find((u) => u.id === visit.technicianId); return <article key={visit.id} className="card-surface rounded-3xl p-5"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><CalendarBlank size={19} weight="duotone" /></span><div><h3 className="text-sm font-bold text-slate-950">{formatDate(visit.date)}</h3><p className="text-xs text-slate-500">{tech?.name ?? "Unknown technician"}</p></div></div><Link to={`/reports/${visit.sourceReportId}`} className="numeric inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"><FileText size={15} />{visit.sourceReportId}</Link></div><div className="mt-4 space-y-3">{visit.measurements.map((measurement) => <div key={measurement.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold text-slate-950">{measurement.parameterName}</p><p className="numeric mt-0.5 text-xs text-slate-500">Configured {formatRange(measurement)}</p></div><div className="flex items-center gap-2"><span className="numeric text-sm font-bold text-slate-950">{formatMeasurement(measurement)}</span><MeasurementStatus outOfRange={isOutOfRange(measurement)} /></div></div><p className="mt-3 flex gap-2 text-xs leading-5 text-slate-600"><NotePencil size={15} className="mt-0.5 shrink-0" />{measurement.technicianNote}</p>{measurement.action ? <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900"><span className="font-bold">Recorded action:</span> {measurement.action.description}</p> : null}</div>)}</div></article> }) : <EmptyState title="No service visits" description="This system is ready for its first linked service report." />}</section>

      <aside><div className="sticky top-6 space-y-5"><section className="card-surface rounded-3xl p-5"><div className="flex items-center gap-2"><Wrench size={19} className="text-blue-700" /><h2 className="font-bold text-slate-950">System profile</h2></div><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-slate-500">Type</dt><dd className="mt-1 font-semibold text-slate-900">{systemTypeLabels[system.type]}</dd></div><div><dt className="text-xs text-slate-500">Service interval</dt><dd className="mt-1 font-semibold text-slate-900">{serviceIntervalLabels[system.serviceInterval]}</dd></div><div><dt className="text-xs text-slate-500">Assigned technician</dt><dd className="mt-1 font-semibold text-slate-900">{assigned?.name ?? "Unassigned"}</dd></div></dl></section><section className="card-surface rounded-3xl p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-slate-950">Related findings</h2><span className="numeric text-xs font-bold text-slate-500">{relatedFindings.length}</span></div>{relatedFindings.length ? <div className="mt-4 space-y-3">{relatedFindings.map((finding) => <Link key={finding.id} to={`/findings/${finding.id}`} className="block rounded-2xl border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/30"><div className="flex flex-wrap gap-2"><PriorityBadge priority={finding.priority} /><FindingStatusBadge status={finding.status} /></div><p className="mt-2 text-sm font-bold text-slate-950">{finding.findingType}</p><p className="mt-1 text-xs leading-5 text-slate-600">{finding.parameterName}</p></Link>)}</div> : <p className="mt-3 text-xs leading-5 text-slate-600">No evidence patterns are present in the available history.</p>}</section></div></aside>
    </div>
  </div>
}
