import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { cloneSeedCompany } from "../data/workspace"
import { nextSourceReportId } from "../lib/reportCapture"
import { initialsFor } from "../lib/workspace"
import type {
  CapturedReportInput,
  CapturedSourceReport,
  Company,
  CustomerEditorInput,
  SystemEditorInput,
  UserEditorInput,
} from "../types"

export const WORKSPACE_STORAGE_KEY = "waterops.workspace.v1"

interface WorkspaceNotification {
  id: number
  message: string
}

interface SaveResult {
  ok: boolean
  error?: string
  id?: string
}

interface WorkspaceContextValue {
  company: Company
  notification: WorkspaceNotification | null
  saveUser: (input: UserEditorInput) => SaveResult
  saveCustomer: (input: CustomerEditorInput) => SaveResult
  saveSystem: (input: SystemEditorInput) => SaveResult
  saveCapturedReport: (input: CapturedReportInput) => SaveResult
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function isCompany(value: unknown): value is Company {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<Company>
  const hasStrings = (item: unknown, keys: string[]) => Boolean(item && typeof item === "object" && keys.every((key) => typeof (item as Record<string, unknown>)[key] === "string"))
  const validUsers = Array.isArray(candidate.users) && candidate.users.every((user) => hasStrings(user, ["id", "name", "email", "role", "initials"]))
  const validCustomers = Array.isArray(candidate.customers) && candidate.customers.every((customer) =>
    hasStrings(customer, ["id", "name", "industry", "location", "accountOwnerId"])
    && Array.isArray(customer.systems)
    && customer.systems.every((system) =>
      hasStrings(system, ["id", "name", "type", "serviceInterval", "assignedTechnicianId"])
      && Array.isArray(system.visits)
      && system.visits.every((visit) =>
        hasStrings(visit, ["id", "date", "sourceReportId", "technicianId"])
        && Array.isArray(visit.measurements)
        && visit.measurements.every((measurement) =>
          hasStrings(measurement, ["id", "parameterId", "parameterName", "unit", "technicianNote"])
          && typeof measurement.value === "number"
          && typeof measurement.minimum === "number"
          && typeof measurement.maximum === "number",
        ),
      ),
    ),
  )
  const validReports = Array.isArray(candidate.reports) && candidate.reports.every((report) =>
    hasStrings(report, ["id", "fileName", "customerId", "systemId", "visitId", "technicianId", "serviceDate", "receivedAt", "analysisCompletedAt", "analysisStatus"])
    && typeof report.pageCount === "number",
  )
  return typeof candidate.id === "string" && typeof candidate.name === "string" && validUsers && validCustomers && validReports
}

function isCapturedReport(value: unknown): value is CapturedSourceReport {
  if (!value || typeof value !== "object") return false
  const report = value as Partial<CapturedSourceReport>
  const validMeasurements = Array.isArray(report.measurements) && report.measurements.every((measurement) => {
    if (!measurement || typeof measurement !== "object") return false
    const row = measurement as unknown as Record<string, unknown>
    const validRange = (row.minimum === undefined && row.maximum === undefined)
      || (typeof row.minimum === "number" && typeof row.maximum === "number")
    return ["id", "parameterName", "samplePoint", "unit", "technicianNote"].every((key) => typeof row[key] === "string")
      && typeof row.value === "number"
      && validRange
      && (row.action === undefined || typeof row.action === "string")
  })
  return ["id", "captureMethod", "title", "fileName", "customerId", "systemId", "technicianId", "serviceDate", "receivedAt", "analysisCompletedAt", "analysisStatus", "observations"].every((key) => typeof (report as Record<string, unknown>)[key] === "string")
    && (report.captureMethod === "manual" || report.captureMethod === "upload")
    && report.analysisStatus === "ready"
    && typeof report.pageCount === "number"
    && (report.fileSize === undefined || typeof report.fileSize === "number")
    && validMeasurements
}

function loadWorkspace(): Company {
  try {
    const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (!stored) return cloneSeedCompany()
    const parsed: unknown = JSON.parse(stored)
    if (!isCompany(parsed)) return cloneSeedCompany()
    const capturedReports = Array.isArray((parsed as Partial<Company>).capturedReports)
      ? (parsed as Partial<Company>).capturedReports?.filter(isCapturedReport) ?? []
      : []
    return { ...parsed, capturedReports }
  } catch {
    return cloneSeedCompany()
  }
}

function entityId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${id}`
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company>(loadWorkspace)
  const [notification, setNotification] = useState<WorkspaceNotification | null>(null)
  const notificationTimer = useRef<number | undefined>(undefined)

  const notify = useCallback((message: string) => {
    window.clearTimeout(notificationTimer.current)
    setNotification({ id: Date.now(), message })
    notificationTimer.current = window.setTimeout(() => setNotification(null), 3200)
  }, [])

  const persist = useCallback((next: Company) => {
    setCompany(next)
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(next))
  }, [])

  const saveUser = useCallback((input: UserEditorInput): SaveResult => {
    const duplicate = company.users.find((user) => user.email.toLowerCase() === input.email.trim().toLowerCase() && user.id !== input.id)
    if (duplicate) return { ok: false, error: "A staff profile already uses this email address." }
    const id = input.id ?? entityId("user")
    const nextUser = { id, name: input.name.trim(), email: input.email.trim(), role: input.role, initials: initialsFor(input.name) }
    const users = input.id
      ? company.users.map((user) => user.id === input.id ? nextUser : user)
      : [...company.users, nextUser]
    persist({ ...company, users })
    notify(input.id ? "Staff profile updated." : "Staff profile added.")
    return { ok: true, id }
  }, [company, notify, persist])

  const saveCustomer = useCallback((input: CustomerEditorInput): SaveResult => {
    const id = input.id ?? entityId("customer")
    const existing = company.customers.find((customer) => customer.id === input.id)
    const nextCustomer = {
      id,
      name: input.name.trim(),
      industry: input.industry.trim(),
      location: input.location.trim(),
      accountOwnerId: input.accountOwnerId,
      systems: existing?.systems ?? [],
    }
    const customers = input.id
      ? company.customers.map((customer) => customer.id === input.id ? nextCustomer : customer)
      : [...company.customers, nextCustomer]
    persist({ ...company, customers })
    notify(input.id ? "Customer updated." : "Customer added.")
    return { ok: true, id }
  }, [company, notify, persist])

  const saveSystem = useCallback((input: SystemEditorInput): SaveResult => {
    const customer = company.customers.find((item) => item.id === input.customerId)
    if (!customer) return { ok: false, error: "Customer could not be found." }
    const duplicate = customer.systems.find((system) => system.name.toLowerCase() === input.name.trim().toLowerCase() && system.id !== input.id)
    if (duplicate) return { ok: false, error: "This customer already has a system with that name." }
    const id = input.id ?? entityId("system")
    const existing = customer.systems.find((system) => system.id === input.id)
    const nextSystem = {
      id,
      name: input.name.trim(),
      type: input.type,
      serviceInterval: input.serviceInterval,
      assignedTechnicianId: input.assignedTechnicianId,
      visits: existing?.visits ?? [],
    }
    const customers = company.customers.map((item) => item.id === customer.id
      ? {
          ...item,
          systems: input.id
            ? item.systems.map((system) => system.id === input.id ? nextSystem : system)
            : [...item.systems, nextSystem],
        }
      : item)
    persist({ ...company, customers })
    notify(input.id ? "Water system updated." : "Water system added.")
    return { ok: true, id }
  }, [company, notify, persist])

  const saveCapturedReport = useCallback((input: CapturedReportInput): SaveResult => {
    const customer = company.customers.find((item) => item.id === input.customerId)
    const system = customer?.systems.find((item) => item.id === input.systemId)
    const technician = company.users.find((item) => item.id === input.technicianId)
    if (!customer || !system || !technician) return { ok: false, error: "Report context could not be found." }

    const id = nextSourceReportId(input.serviceDate, [...company.reports, ...company.capturedReports].map((report) => report.id))
    const capturedAt = new Date().toISOString()
    const fileName = input.fileName?.trim() || `Water_Treatment_Report_${id}.pdf`
    const report: CapturedSourceReport = {
      id,
      captureMethod: input.captureMethod,
      title: input.title.trim(),
      fileName,
      fileSize: input.fileSize,
      customerId: customer.id,
      systemId: system.id,
      technicianId: technician.id,
      serviceDate: input.serviceDate,
      receivedAt: capturedAt,
      analysisCompletedAt: capturedAt,
      pageCount: input.pageCount,
      analysisStatus: "ready",
      observations: input.observations.trim(),
      measurements: input.measurements.map((measurement, index) => ({
        ...measurement,
        id: `${id}-measurement-${index + 1}`,
        parameterName: measurement.parameterName.trim(),
        samplePoint: measurement.samplePoint.trim(),
        unit: measurement.unit.trim(),
        technicianNote: measurement.technicianNote.trim(),
        action: measurement.action?.trim() || undefined,
      })),
    }
    persist({ ...company, capturedReports: [...company.capturedReports, report] })
    notify("Report added.")
    return { ok: true, id }
  }, [company, notify, persist])

  const value = useMemo(
    () => ({ company, notification, saveUser, saveCustomer, saveSystem, saveCapturedReport }),
    [company, notification, saveUser, saveCustomer, saveSystem, saveCapturedReport],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider")
  return value
}
