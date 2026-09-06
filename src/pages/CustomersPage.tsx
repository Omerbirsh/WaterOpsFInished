import { Buildings, MagnifyingGlass, MapPin } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CustomerEditorDialog } from "../components/EntityDialogs"
import { EmptyState, PageHeader } from "../components/WorkspaceComponents"
import { formatShortDate } from "../lib/format"
import { latestVisit } from "../lib/workspace"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"

export function CustomersPage() {
  const { company } = useWorkspace()
  const { findings } = useDecisions()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "review" | "current">("all")
  const customers = useMemo(() => company.customers.filter((customer) => {
    const open = findings.filter((finding) => finding.customerId === customer.id && finding.status === "needs_review").length
    const matches = `${customer.name} ${customer.industry} ${customer.location}`.toLowerCase().includes(query.toLowerCase())
    return matches && (filter === "all" || (filter === "review" ? open > 0 : open === 0))
  }), [company.customers, findings, filter, query])

  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <PageHeader eyebrow="Account portfolio" title="Customers" description="Customer accounts, assigned ownership, service coverage, and open review work." actions={<CustomerEditorDialog />} />
    <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
      <label className="relative flex-1"><span className="sr-only">Search customers</span><MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers, industry, or location" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15" /></label>
      <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Customer status filter">{([['all','All'],['review','Needs review'],['current','Current']] as const).map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition ${filter === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>{label}</button>)}</div>
    </div>
    {customers.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => {
      const open = findings.filter((finding) => finding.customerId === customer.id && finding.status === "needs_review").length
      const owner = company.users.find((user) => user.id === customer.accountOwnerId)
      const last = customer.systems.map(latestVisit).filter(Boolean).sort((a,b) => b.date.localeCompare(a.date))[0]
      return <Link key={customer.id} to={`/customers/${customer.id}`} className="card-surface group rounded-3xl p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lift"><div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Buildings size={22} weight="duotone" /></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${open ? "bg-amber-50 text-amber-900" : "bg-teal-50 text-teal-800"}`}>{open ? `${open} open finding${open === 1 ? "" : "s"}` : "Current"}</span></div><h2 className="mt-5 text-lg font-bold tracking-[-0.025em] text-slate-950 group-hover:text-blue-700">{customer.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><MapPin size={14} />{customer.location} · {customer.industry}</p><div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><div><p className="numeric text-sm font-bold text-slate-950">{customer.systems.length}</p><p className="text-[10px] text-slate-500">Systems</p></div><div><p className="text-sm font-bold text-slate-950">{last ? formatShortDate(last.date) : "—"}</p><p className="text-[10px] text-slate-500">Last service</p></div><div><p className="truncate text-sm font-bold text-slate-950">{owner?.name.split(" ")[0] ?? "—"}</p><p className="text-[10px] text-slate-500">Account owner</p></div></div></Link>
    })}</div> : <div className="mt-5"><EmptyState title="No matching customers" description="Adjust the search or status filter to see customer accounts." /></div>}
  </div>
}
