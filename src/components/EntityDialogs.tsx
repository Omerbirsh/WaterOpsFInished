import { PencilSimple, Plus } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { useWorkspace } from "../state/WorkspaceContext"
import type { CompanyUser, Customer, ServiceInterval, SystemType, UserRole, WaterSystem } from "../types"
import { roleLabels, serviceIntervalLabels, systemTypeLabels } from "../lib/workspace"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./animate-ui/Dialog"
import { RippleButton } from "./animate-ui/RippleButton"
import { Button } from "./ui/Button"

const fieldClass = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"

function FormError({ message }: { message: string }) {
  return <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">{message}</p>
}

function EditorTrigger({ editing, label, onClick }: { editing: boolean; label: string; onClick: () => void }) {
  return (
    <Button variant={editing ? "secondary" : "primary"} size={editing ? "small" : "default"} onClick={onClick}>
      {editing ? <PencilSimple size={15} weight="bold" aria-hidden="true" /> : <Plus size={18} weight="bold" aria-hidden="true" />}
      {label}
    </Button>
  )
}

export function UserEditorDialog({ user }: { user?: CompanyUser }) {
  const { saveUser } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()
    const role = String(data.get("role") ?? "") as UserRole
    if (name.length < 2) return setError("Enter the staff member’s full name.")
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid work email address.")
    const result = saveUser({ id: user?.id, name, email, role })
    if (!result.ok) return setError(result.error ?? "Unable to save the staff profile.")
    setOpen(false)
  }

  return (
    <>
      <EditorTrigger editing={Boolean(user)} label={user ? "Edit" : "Add staff member"} onClick={() => { setError(""); setOpen(true) }} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-950">{user ? "Edit staff profile" : "Add staff member"}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-600">Staff profiles can be assigned to customers, systems, and service visits.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-6">
            <div>
              <label htmlFor={`user-name-${user?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Full name</label>
              <input id={`user-name-${user?.id ?? "new"}`} name="name" defaultValue={user?.name} autoComplete="name" className={fieldClass} />
            </div>
            <div className="mt-4">
              <label htmlFor={`user-email-${user?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Work email</label>
              <input id={`user-email-${user?.id ?? "new"}`} name="email" type="email" defaultValue={user?.email} autoComplete="email" className={fieldClass} />
            </div>
            <div className="mt-4">
              <label htmlFor={`user-role-${user?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Role</label>
              <select id={`user-role-${user?.id ?? "new"}`} name="role" defaultValue={user?.role ?? "service_technician"} className={fieldClass}>
                {(Object.keys(roleLabels) as UserRole[]).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </select>
            </div>
            {error ? <FormError message={error} /> : null}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <RippleButton type="submit">Save staff profile</RippleButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CustomerEditorDialog({ customer }: { customer?: Customer }) {
  const { company, saveCustomer } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const industry = String(data.get("industry") ?? "").trim()
    const location = String(data.get("location") ?? "").trim()
    const accountOwnerId = String(data.get("owner") ?? "")
    if (name.length < 2) return setError("Enter a customer name.")
    if (!industry || !location || !accountOwnerId) return setError("Complete every customer field.")
    const result = saveCustomer({ id: customer?.id, name, industry, location, accountOwnerId })
    if (!result.ok) return setError(result.error ?? "Unable to save the customer.")
    setOpen(false)
  }

  return (
    <>
      <EditorTrigger editing={Boolean(customer)} label={customer ? "Edit customer" : "Add customer"} onClick={() => { setError(""); setOpen(true) }} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-950">{customer ? "Edit customer" : "Add customer"}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-600">Keep the account information used throughout the review workspace current.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-6">
            <div>
              <label htmlFor={`customer-name-${customer?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Customer name</label>
              <input id={`customer-name-${customer?.id ?? "new"}`} name="name" defaultValue={customer?.name} className={fieldClass} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={`customer-industry-${customer?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Industry</label><input id={`customer-industry-${customer?.id ?? "new"}`} name="industry" defaultValue={customer?.industry} className={fieldClass} /></div>
              <div><label htmlFor={`customer-location-${customer?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Location</label><input id={`customer-location-${customer?.id ?? "new"}`} name="location" defaultValue={customer?.location} className={fieldClass} /></div>
            </div>
            <div className="mt-4">
              <label htmlFor={`customer-owner-${customer?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Account owner</label>
              <select id={`customer-owner-${customer?.id ?? "new"}`} name="owner" defaultValue={customer?.accountOwnerId ?? company.users[0]?.id} className={fieldClass}>
                {company.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </div>
            {error ? <FormError message={error} /> : null}
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><RippleButton type="submit">Save customer</RippleButton></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function SystemEditorDialog({ customer, system }: { customer: Customer; system?: WaterSystem }) {
  const { company, saveSystem } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    if (name.length < 2) return setError("Enter a system name.")
    const result = saveSystem({
      id: system?.id,
      customerId: customer.id,
      name,
      type: String(data.get("type")) as SystemType,
      serviceInterval: String(data.get("interval")) as ServiceInterval,
      assignedTechnicianId: String(data.get("technician")),
    })
    if (!result.ok) return setError(result.error ?? "Unable to save the water system.")
    setOpen(false)
  }

  return (
    <>
      <EditorTrigger editing={Boolean(system)} label={system ? "Edit system" : "Add water system"} onClick={() => { setError(""); setOpen(true) }} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-950">{system ? "Edit water system" : "Add water system"}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-600">{customer.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-6">
            <div><label htmlFor={`system-name-${system?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">System name</label><input id={`system-name-${system?.id ?? "new"}`} name="name" defaultValue={system?.name} className={fieldClass} /></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={`system-type-${system?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">System type</label><select id={`system-type-${system?.id ?? "new"}`} name="type" defaultValue={system?.type ?? "cooling_tower"} className={fieldClass}>{(Object.keys(systemTypeLabels) as SystemType[]).map((type) => <option key={type} value={type}>{systemTypeLabels[type]}</option>)}</select></div>
              <div><label htmlFor={`system-interval-${system?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Service interval</label><select id={`system-interval-${system?.id ?? "new"}`} name="interval" defaultValue={system?.serviceInterval ?? "monthly"} className={fieldClass}>{(Object.keys(serviceIntervalLabels) as ServiceInterval[]).map((interval) => <option key={interval} value={interval}>{serviceIntervalLabels[interval]}</option>)}</select></div>
            </div>
            <div className="mt-4"><label htmlFor={`system-tech-${system?.id ?? "new"}`} className="text-sm font-semibold text-slate-800">Assigned technician</label><select id={`system-tech-${system?.id ?? "new"}`} name="technician" defaultValue={system?.assignedTechnicianId ?? company.users[1]?.id ?? company.users[0]?.id} className={fieldClass}>{company.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>
            {error ? <FormError message={error} /> : null}
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><RippleButton type="submit">Save water system</RippleButton></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
