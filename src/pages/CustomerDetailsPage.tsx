import { ArrowLeft, FileText, ListChecks, MapPin, Wrench } from "@phosphor-icons/react"
import { motion } from "motion/react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CustomerEditorDialog, SystemEditorDialog } from "../components/EntityDialogs"
import { EmptyState, IntelligenceCard, PageHeader, PriorityBadge } from "../components/WorkspaceComponents"
import { FindingStatusBadge } from "../components/StatusBadges"
import { formatShortDate } from "../lib/format"
import { customerIntelligence, latestVisit, serviceIntervalLabels, systemTypeLabels } from "../lib/workspace"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"

type Tab = "overview" | "systems" | "findings" | "reports"

export function CustomerDetailsPage() {
  const { customerId } = useParams()
  const { company } = useWorkspace()
  const { findings } = useDecisions()
  const [tab, setTab] = useState<Tab>("overview")
  const customer = company.customers.find((item) => item.id === customerId)
  if (!customer) return <NotFound label="customer" to="/customers" />
  const relatedFindings = findings.filter((finding) => finding.customerId === customer.id)
  const reports = company.reports.filter((report) => report.customerId === customer.id).sort((a,b) => b.serviceDate.localeCompare(a.serviceDate))
  const owner = company.users.find((user) => user.id === customer.accountOwnerId)
  const summary = customerIntelligence(company, customer, findings)
  const tabs: Array<[Tab,string,number]> = [["overview","Overview",0],["systems","Systems",customer.systems.length],["findings","Findings",relatedFindings.length],["reports","Reports",reports.length]]

  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <Link to="/customers" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950"><ArrowLeft size={17} weight="bold" />Customers</Link>
    <PageHeader eyebrow={customer.industry} title={customer.name} description={`${customer.location} · Account owner ${owner?.name ?? "Unassigned"}`} actions={<><CustomerEditorDialog customer={customer} /><SystemEditorDialog customer={customer} /></>} />
    <div className="mt-6 flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5" role="tablist" aria-label="Customer sections">{tabs.map(([value,label,count]) => <button role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)} className={`relative min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold ${tab === value ? "text-blue-800" : "text-slate-600 hover:text-slate-950"}`}>{tab === value ? <motion.span layoutId="customer-tab" className="absolute inset-0 rounded-xl bg-blue-50" /> : null}<span className="relative">{label}{count ? <span className="ml-1.5 text-xs text-slate-500">{count}</span> : null}</span></button>)}</div>

    <div className="mt-5">
      {tab === "overview" ? <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><IntelligenceCard summary={summary} company={company} /><section className="card-surface rounded-3xl p-5"><h2 className="text-lg font-bold text-slate-950">Account details</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs font-medium text-slate-500">Location</dt><dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900"><MapPin size={16} />{customer.location}</dd></div><div><dt className="text-xs font-medium text-slate-500">Account owner</dt><dd className="mt-1 font-semibold text-slate-900">{owner?.name ?? "Unassigned"}</dd></div><div><dt className="text-xs font-medium text-slate-500">Portfolio</dt><dd className="mt-1 font-semibold text-slate-900">{customer.systems.length} systems · {reports.length} reports</dd></div></dl></section></div> : null}
      {tab === "systems" ? customer.systems.length ? <SystemGrid customer={customer} company={company} findings={findings} /> : <EmptyState title="No water systems yet" description="Add the first water system to begin organizing this account." action={<SystemEditorDialog customer={customer} />} /> : null}
      {tab === "findings" ? relatedFindings.length ? <div className="space-y-3">{relatedFindings.map((finding) => <Link key={finding.id} to={`/findings/${finding.id}`} className="card-surface flex flex-col gap-3 rounded-2xl p-4 hover:border-blue-200 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><PriorityBadge priority={finding.priority} /><span className="text-xs text-slate-500">{finding.systemName}</span></div><h3 className="mt-2 font-bold text-slate-950">{finding.findingType}</h3><p className="mt-1 text-xs text-slate-600">{finding.explanation}</p></div><FindingStatusBadge status={finding.status} /></Link>)}</div> : <EmptyState title="No findings" description="No evidence patterns are present in this customer’s available history." /> : null}
      {tab === "reports" ? reports.length ? <div className="card-surface overflow-hidden rounded-2xl"><div className="divide-y divide-slate-100">{reports.map((report) => { const system = customer.systems.find((item) => item.id === report.systemId); return <Link key={report.id} to={`/reports/${report.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50"><FileText size={20} className="text-blue-700" /><span className="min-w-0 flex-1"><span className="numeric block text-sm font-bold text-slate-950">{report.id}</span><span className="block truncate text-xs text-slate-500">{system?.name} · {report.fileName}</span></span><span className="text-xs font-semibold text-slate-500">{formatShortDate(report.serviceDate)}</span></Link>})}</div></div> : <EmptyState title="No source reports" description="Reports linked to service visits will appear here." /> : null}
    </div>
  </div>
}

function SystemGrid({ customer, company, findings }: { customer: import("../types").Customer; company: import("../types").Company; findings: import("../types").Finding[] }) {
  return <div className="grid gap-4 md:grid-cols-2">{customer.systems.map((system) => { const tech = company.users.find((u) => u.id === system.assignedTechnicianId); const open = findings.filter((f) => f.systemId === system.id && f.status === "needs_review").length; const latest = latestVisit(system); return <div key={system.id} className="card-surface rounded-3xl p-5"><div className="flex items-start justify-between gap-3"><Link to={`/customers/${customer.id}/systems/${system.id}`} className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Wrench size={22} weight="duotone" /></Link><SystemEditorDialog customer={customer} system={system} /></div><Link to={`/customers/${customer.id}/systems/${system.id}`}><h3 className="mt-4 text-lg font-bold text-slate-950 hover:text-blue-700">{system.name}</h3><p className="mt-1 text-xs text-slate-600">{systemTypeLabels[system.type]} · {serviceIntervalLabels[system.serviceInterval]} service</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{tech?.name ?? "Unassigned"}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${open ? "bg-amber-50 text-amber-900" : "bg-teal-50 text-teal-800"}`}>{open ? `${open} open` : "Current"}</span></div><p className="mt-4 text-xs text-slate-500">Last service {latest ? formatShortDate(latest.date) : "not recorded"}</p></Link></div>})}</div>
}

export function NotFound({ label, to }: { label: string; to: string }) {
  return <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><ListChecks size={26} /></span><h1 className="mt-5 text-2xl font-bold text-slate-950">{label[0].toUpperCase()+label.slice(1)} not found</h1><p className="mt-2 text-sm text-slate-600">This record is not available in the ClearFlow workspace.</p><Link to={to} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"><ArrowLeft size={17} />Go back</Link></div></div>
}
