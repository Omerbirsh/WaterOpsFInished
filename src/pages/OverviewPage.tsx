import { ArrowRight, Buildings, FileText, ListChecks, TrendUp, UsersThree, Wrench } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { AvatarGroup, IntelligenceCard, KpiCard, PageHeader, PriorityBadge } from "../components/WorkspaceComponents"
import { FindingStatusBadge } from "../components/StatusBadges"
import { formatShortDate } from "../lib/format"
import { allSystems, allVisits, companyIntelligence } from "../lib/workspace"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"

export function OverviewPage() {
  const { company } = useWorkspace()
  const { findings } = useDecisions()
  const reducedMotion = useReducedMotion()
  const open = findings.filter((finding) => finding.status === "needs_review")
  const systems = allSystems(company)
  const recentReports = [...company.reports].sort((a, b) => b.serviceDate.localeCompare(a.serviceDate)).slice(0, 5)
  const recentVisits = allVisits(company).sort((a, b) => b.visit.date.localeCompare(a.visit.date)).slice(0, 5)
  const summary = companyIntelligence(company, findings)

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <PageHeader eyebrow="Operations overview" title="Good morning, Maya" description="Current service activity, evidence patterns, and source-report analysis across ClearFlow accounts." />

      <motion.div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: reducedMotion ? 0 : 0.06 } } }}>
        {[
          <KpiCard key="customers" label="Active customers" value={company.customers.length} note="Across the ClearFlow portfolio" icon={<Buildings size={21} weight="duotone" />} />,
          <KpiCard key="systems" label="Water systems" value={systems.length} note="With structured service histories" icon={<Wrench size={21} weight="duotone" />} />,
          <KpiCard key="findings" label="Open findings" value={open.length} note={`${open.filter((item) => item.priority === "high").length} high priority`} icon={<ListChecks size={21} weight="duotone" />} />,
          <KpiCard key="reports" label="Analyzed reports" value={company.reports.length} note="Evidence available for review" icon={<FileText size={21} weight="duotone" />} />,
        ].map((card, index) => <motion.div key={index} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>{card}</motion.div>)}
      </motion.div>

      <div className="mt-6"><IntelligenceCard summary={summary} company={company} /></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="card-surface rounded-3xl p-5 sm:p-6" aria-labelledby="priority-findings-title">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Manager review</p><h2 id="priority-findings-title" className="mt-1 text-xl font-bold tracking-[-0.03em] text-slate-950">Priority findings</h2></div><Link to="/findings" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">View queue <ArrowRight size={16} weight="bold" /></Link></div>
          <div className="mt-5 space-y-2.5">
            {open.slice(0, 4).map((finding) => (
              <Link key={finding.id} to={`/findings/${finding.id}`} className="group grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:grid-cols-[1fr_auto]">
                <div><div className="flex flex-wrap items-center gap-2"><PriorityBadge priority={finding.priority} /><span className="text-xs font-semibold text-slate-500">{finding.customerName} · {finding.systemName}</span></div><h3 className="mt-2 text-sm font-bold text-slate-950 group-hover:text-blue-700">{finding.findingType}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{finding.explanation}</p></div>
                <div className="self-center"><FindingStatusBadge status={finding.status} /></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card-surface rounded-3xl p-5 sm:p-6" aria-labelledby="recent-reports-title">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Source evidence</p><h2 id="recent-reports-title" className="mt-1 text-xl font-bold tracking-[-0.03em] text-slate-950">Recent reports</h2></div><Link to="/reports" className="text-sm font-semibold text-blue-700">View all</Link></div>
          <div className="mt-5 divide-y divide-slate-100">
            {recentReports.map((report) => {
              const customer = company.customers.find((item) => item.id === report.customerId)
              const system = customer?.systems.find((item) => item.id === report.systemId)
              return <Link key={report.id} to={`/reports/${report.id}`} className="flex min-h-16 items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText size={19} weight="duotone" /></span><span className="min-w-0 flex-1"><span className="block numeric text-sm font-bold text-slate-950">{report.id}</span><span className="block truncate text-xs text-slate-600">{customer?.name} · {system?.name}</span></span><span className="text-xs font-semibold text-slate-500">{formatShortDate(report.serviceDate)}</span></Link>
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card-surface rounded-3xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Service activity</p><h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-slate-950">Latest field visits</h2></div><TrendUp size={22} className="text-blue-600" weight="duotone" /></div><div className="mt-5 space-y-3">{recentVisits.map(({ customer, system, visit }) => <Link key={visit.id} to={`/customers/${customer.id}/systems/${system.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 hover:border-blue-200 hover:bg-blue-50/40"><span className="numeric grid size-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">{new Date(`${visit.date}T00:00:00Z`).getUTCDate()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{system.name}</span><span className="block truncate text-xs text-slate-500">{customer.name}</span></span><span className="text-xs font-medium text-slate-500">{formatShortDate(visit.date)}</span></Link>)}</div></section>
        <section className="card-surface rounded-3xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Coverage</p><h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-slate-950">Team presence</h2></div><AvatarGroup names={company.users} /></div><div className="mt-6 grid grid-cols-3 gap-3">{company.users.map((user) => { const assigned = systems.filter(({ system }) => system.assignedTechnicianId === user.id).length; const visits = allVisits(company).filter(({ visit }) => visit.technicianId === user.id).length; return <div key={user.id} className="rounded-2xl bg-slate-50 p-3 text-center"><span className="mx-auto grid size-10 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{user.initials}</span><p className="mt-2 truncate text-xs font-bold text-slate-900">{user.name}</p><p className="mt-1 text-[10px] text-slate-500">{assigned ? `${assigned} assigned systems` : `${visits} recorded visits`}</p></div> })}</div><Link to="/team" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"><UsersThree size={18} />Manage team</Link></section>
      </div>
    </div>
  )
}
