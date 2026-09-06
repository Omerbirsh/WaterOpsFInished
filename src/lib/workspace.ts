import type {
  Company,
  Customer,
  Finding,
  IntelligenceSummary,
  ServiceInterval,
  SystemType,
  UserRole,
  WaterSystem,
} from "../types"

export const roleLabels: Record<UserRole, string> = {
  technical_manager: "Technical Manager",
  senior_technician: "Senior Service Technician",
  service_technician: "Service Technician",
  account_manager: "Account Manager",
}

export const systemTypeLabels: Record<SystemType, string> = {
  cooling_tower: "Cooling tower",
  boiler: "Steam boiler",
  closed_loop: "Closed loop",
  process_cooling: "Process cooling loop",
}

export const serviceIntervalLabels: Record<ServiceInterval, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
}

export const priorityLabels = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
} as const

export function allSystems(company: Company) {
  return company.customers.flatMap((customer) =>
    customer.systems.map((system) => ({ customer, system })),
  )
}

export function allVisits(company: Company) {
  return allSystems(company).flatMap(({ customer, system }) =>
    system.visits.map((visit) => ({ customer, system, visit })),
  )
}

export function latestVisit(system: WaterSystem) {
  return [...system.visits].sort((a, b) => b.date.localeCompare(a.date))[0]
}

export function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "WO"
}

function reportIdsFor(company: Company, findings: Finding[]) {
  const visitIds = new Set(findings.flatMap((finding) => finding.affectedVisitIds))
  return company.reports.filter((report) => visitIds.has(report.visitId)).map((report) => report.id)
}

function completedAt(company: Company, reportIds: string[]) {
  const selected = company.reports.filter((report) => reportIds.includes(report.id))
  const reports = selected.length ? selected : company.reports
  return [...reports].sort((a, b) => b.analysisCompletedAt.localeCompare(a.analysisCompletedAt))[0]?.analysisCompletedAt
    ?? "2026-09-03T09:42:00Z"
}

export function companyIntelligence(company: Company, findings: Finding[]): IntelligenceSummary {
  const open = findings.filter((finding) => finding.status === "needs_review")
  const affectedSystems = new Set(open.map((finding) => finding.systemId))
  const affectedCustomers = new Set(open.map((finding) => finding.customerId))
  const highPriority = open.filter((finding) => finding.priority === "high")
  const sourceReportIds = reportIdsFor(company, open).slice(0, 6)

  return {
    headline: `${affectedSystems.size} systems have review items across ${affectedCustomers.size} customer accounts`,
    narrative: `${company.name} has ${open.length} open evidence-backed findings. ${highPriority.length} are prioritized for manager review based on repeated readings or documented follow-up patterns.`,
    observations: [
      `${highPriority.length} high-priority findings are ready for review.`,
      `${company.reports.length} source reports have completed analysis.`,
      `${allSystems(company).length - affectedSystems.size} systems have no open evidence patterns.`,
    ],
    sourceReportIds,
    relatedFindingIds: open.map((finding) => finding.id),
    completedAt: completedAt(company, sourceReportIds),
  }
}

export function customerIntelligence(company: Company, customer: Customer, findings: Finding[]): IntelligenceSummary {
  const related = findings.filter((finding) => finding.customerId === customer.id && finding.status === "needs_review")
  const affectedSystems = new Set(related.map((finding) => finding.systemId))
  const sourceReportIds = reportIdsFor(company, related).slice(0, 5)
  const latest = customer.systems.map(latestVisit).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date))[0]

  return {
    headline: related.length ? `${related.length} findings across ${affectedSystems.size} systems` : "No open evidence patterns",
    narrative: related.length
      ? `${customer.name} has documented patterns ready for manager review. Each item is linked to the underlying measurements and source reports.`
      : `${customer.name} has no open evidence patterns across its available service history.`,
    observations: [
      `${customer.systems.length} water systems are tracked for this account.`,
      latest ? `Latest documented service visit: ${latest.date}.` : "No service visits are recorded yet.",
      `${company.reports.filter((report) => report.customerId === customer.id).length} source reports are on file.`,
    ],
    sourceReportIds,
    relatedFindingIds: related.map((finding) => finding.id),
    completedAt: completedAt(company, sourceReportIds),
  }
}

export function systemIntelligence(company: Company, system: WaterSystem, findings: Finding[]): IntelligenceSummary {
  const related = findings.filter((finding) => finding.systemId === system.id && finding.status === "needs_review")
  const sourceReportIds = reportIdsFor(company, related).slice(0, 5)
  const latest = latestVisit(system)

  return {
    headline: related.length ? `${related.length} evidence patterns require review` : "Service history is current",
    narrative: related.length
      ? `${system.name} has recurring or unresolved documentation patterns across ${system.visits.length} service visits. The review is grounded in configured ranges, visit sequence, recorded actions, and coverage.`
      : system.visits.length
        ? `${system.name} has no open evidence patterns in the available service history.`
        : `${system.name} is ready for its first service record.`,
    observations: related.length
      ? related.slice(0, 3).map((finding) => finding.explanation)
      : [latest ? `Latest documented service visit: ${latest.date}.` : "No service visits are recorded yet."],
    sourceReportIds,
    relatedFindingIds: related.map((finding) => finding.id),
    completedAt: completedAt(company, sourceReportIds),
  }
}
