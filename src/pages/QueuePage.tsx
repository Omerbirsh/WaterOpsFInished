import { ArrowRight, ArrowsClockwise, CaretRight, CheckCircle, ClockCountdown, ListChecks } from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FindingStatusBadge } from "../components/StatusBadges"
import { KpiCard, PageHeader, PriorityBadge } from "../components/WorkspaceComponents"
import { cn } from "../lib/cn"
import { formatShortDate, statusLabels } from "../lib/format"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"
import type { Finding, FindingStatus } from "../types"

type Filter = "all" | FindingStatus
const filters: Filter[] = ["all", "needs_review", "accepted", "resolved", "dismissed"]

function RuleIcon({ finding }: { finding: Finding }) {
  const Icon = finding.ruleId === "rule-1" || finding.ruleId === "rule-5" ? ArrowsClockwise : finding.ruleId === "rule-2" ? ArrowRight : finding.ruleId === "rule-4" ? ListChecks : ClockCountdown
  return <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={20} weight="bold" /></span>
}

export function QueuePage() {
  const { findings } = useDecisions()
  const { company } = useWorkspace()
  const [filter, setFilter] = useState<Filter>("all")
  const [customerId, setCustomerId] = useState("all")
  const filtered = useMemo(() => findings.filter((finding) => (filter === "all" || finding.status === filter) && (customerId === "all" || finding.customerId === customerId)), [customerId, filter, findings])
  const active = findings.filter((item) => item.status === "needs_review").length
  const high = findings.filter((item) => item.status === "needs_review" && item.priority === "high").length
  const countFor = (status: Filter) => status === "all" ? findings.length : findings.filter((item) => item.status === status).length
  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <PageHeader eyebrow="WaterOps Intelligence" title="Review Queue" description="Evidence-backed patterns organized for technical-manager review across all customer accounts." />
    <div className="mt-7 grid gap-3 sm:grid-cols-3"><KpiCard label="Total findings" value={findings.length} note="Across five transparent rules" icon={<ListChecks size={21} weight="duotone" />} /><KpiCard label="Needs review" value={active} note="Awaiting a manager decision" icon={<ClockCountdown size={21} weight="duotone" />} /><KpiCard label="High priority" value={high} note="Repeated or follow-up patterns" icon={<CheckCircle size={21} weight="duotone" />} /></div>
    <section className="mt-7" aria-labelledby="findings-list-heading"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h2 id="findings-list-heading" className="text-xl font-bold text-slate-950">Prioritized findings</h2><p className="mt-1 text-xs text-slate-600">Select a row to inspect the complete evidence chain.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label><span className="sr-only">Filter by customer</span><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 sm:w-56"><option value="all">All customers</option>{company.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1" aria-label="Filter findings by status">{filters.map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)} className={cn("relative min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-semibold", filter === item ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100")}><span className="relative">{item === "all" ? "All" : statusLabels[item]} <span className={filter === item ? "text-slate-300" : "text-slate-500"}>{countFor(item)}</span></span></button>)}</div></div></div>
      <div className="card-surface mt-4 overflow-hidden rounded-3xl"><div className="hidden grid-cols-[1.15fr_0.85fr_1.6fr_0.65fr_0.7fr_24px] gap-4 border-b bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 xl:grid"><span>Finding</span><span>Customer</span><span>Evidence summary</span><span>Visits</span><span>Status</span><span /></div><AnimatePresence mode="popLayout">{filtered.length ? <motion.ul layout>{filtered.map((finding,index) => <QueueRow finding={finding} index={index} key={finding.id} />)}</motion.ul> : <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid min-h-52 place-items-center px-6 text-center"><div><CheckCircle size={30} className="mx-auto text-teal-700" weight="duotone" /><h3 className="mt-3 font-bold text-slate-950">No findings match these filters</h3><p className="mt-1 text-xs text-slate-600">Choose another customer or status.</p></div></motion.div>}</AnimatePresence></div>
    </section>
  </div>
}

function QueueRow({ finding, index }: { finding: Finding; index: number }) {
  const reducedMotion = useReducedMotion()
  return <motion.li layout initial={reducedMotion ? false : {opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2,delay:reducedMotion ? 0 : index*0.025}}><Link to={`/findings/${encodeURIComponent(finding.id)}`} className="group grid gap-4 border-b border-slate-100 bg-white px-4 py-4 hover:bg-blue-50/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-500/20 md:grid-cols-2 xl:grid-cols-[1.15fr_0.85fr_1.6fr_0.65fr_0.7fr_24px] xl:items-center xl:px-5"><div className="flex items-center gap-3"><RuleIcon finding={finding} /><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">{finding.ruleId.replace("rule-","Rule ")}</span><PriorityBadge priority={finding.priority} /></div><p className="mt-1 text-sm font-bold text-slate-950">{finding.findingType}</p></div></div><div><p className="text-xs font-semibold text-slate-900">{finding.customerName}</p><p className="mt-1 text-xs text-slate-500">{finding.systemName}</p></div><div><p className="text-sm leading-5 text-slate-600">{finding.explanation}</p><p className="mt-1 text-xs font-semibold text-slate-500">{finding.parameterName}</p></div><p className="numeric text-xs font-semibold text-slate-600">{finding.evidence.map((row) => formatShortDate(row.date)).join(" → ")}</p><FindingStatusBadge status={finding.status} /><CaretRight size={17} className="hidden text-slate-400 group-hover:translate-x-0.5 xl:block" /></Link></motion.li>
}
