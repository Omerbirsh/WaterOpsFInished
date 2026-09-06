import { EnvelopeSimple, Wrench } from "@phosphor-icons/react"
import { UserEditorDialog } from "../components/EntityDialogs"
import { PageHeader } from "../components/WorkspaceComponents"
import { allSystems, roleLabels } from "../lib/workspace"
import { useWorkspace } from "../state/WorkspaceContext"

export function TeamPage() {
  const { company } = useWorkspace()
  const systems = allSystems(company)
  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><PageHeader eyebrow="ClearFlow Water Services" title="Team" description="Staff profiles, roles, and active system assignments." actions={<UserEditorDialog />} />
    <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{company.users.map((user) => { const assigned = systems.filter(({system}) => system.assignedTechnicianId === user.id); const accounts = company.customers.filter((customer) => customer.accountOwnerId === user.id); return <article key={user.id} className="card-surface rounded-3xl p-5"><div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-sm font-bold text-white">{user.initials}</span><UserEditorDialog user={user} /></div><h2 className="mt-4 text-lg font-bold text-slate-950">{user.name}</h2><p className="mt-1 text-xs font-semibold text-blue-700">{roleLabels[user.role]}</p><p className="mt-4 flex items-center gap-2 text-xs text-slate-600"><EnvelopeSimple size={16} />{user.email}</p><div className="mt-5 border-t border-slate-100 pt-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-500"><Wrench size={15} />Assignments</div><p className="mt-2 text-sm font-semibold text-slate-900">{assigned.length} water systems · {accounts.length} owned accounts</p>{assigned.length ? <div className="mt-3 flex flex-wrap gap-1.5">{assigned.map(({system}) => <span key={system.id} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{system.name}</span>)}</div> : <p className="mt-2 text-xs text-slate-500">No direct system assignments.</p>}</div></article> })}</div>
  </div>
}
