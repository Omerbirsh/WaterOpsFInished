export type ParameterId =
  | "conductivity"
  | "ph"
  | "inhibitor-residual"
  | "oxidant-residual"
  | "sulfite"
  | "nitrite"
  | "iron"

export type UserRole = "technical_manager" | "senior_technician" | "service_technician" | "account_manager"
export type SystemType = "cooling_tower" | "boiler" | "closed_loop" | "process_cooling"
export type ServiceInterval = "monthly" | "quarterly"
export type FindingPriority = "high" | "medium" | "low"

export interface CompanyUser {
  id: string
  name: string
  email: string
  role: UserRole
  initials: string
}

export interface ActionRecord {
  description: string
  closureEvidence?: string
}

export interface MeasurementRecord {
  id: string
  parameterId: ParameterId
  parameterName: string
  unit: string
  value: number
  minimum: number
  maximum: number
  technicianNote: string
  action?: ActionRecord
}

export interface Visit {
  id: string
  date: string
  sourceReportId: string
  technicianId: string
  measurements: MeasurementRecord[]
}

export interface WaterSystem {
  id: string
  name: string
  type: SystemType
  serviceInterval: ServiceInterval
  assignedTechnicianId: string
  visits: Visit[]
}

export interface Customer {
  id: string
  name: string
  industry: string
  location: string
  accountOwnerId: string
  systems: WaterSystem[]
}

export interface SourceReport {
  id: string
  fileName: string
  customerId: string
  systemId: string
  visitId: string
  technicianId: string
  serviceDate: string
  receivedAt: string
  analysisCompletedAt: string
  pageCount: number
  analysisStatus: "analyzed"
}

export type ReportCaptureMethod = "manual" | "upload"

export interface CapturedReportMeasurement {
  id: string
  parameterName: string
  samplePoint: string
  unit: string
  value: number
  minimum?: number
  maximum?: number
  technicianNote: string
  action?: string
}

export interface CapturedSourceReport {
  id: string
  captureMethod: ReportCaptureMethod
  title: string
  fileName: string
  fileSize?: number
  customerId: string
  systemId: string
  technicianId: string
  serviceDate: string
  receivedAt: string
  analysisCompletedAt: string
  pageCount: number
  analysisStatus: "ready"
  observations: string
  measurements: CapturedReportMeasurement[]
}

export interface CapturedReportInput {
  captureMethod: ReportCaptureMethod
  title: string
  fileName?: string
  fileSize?: number
  customerId: string
  systemId: string
  technicianId: string
  serviceDate: string
  pageCount: number
  observations: string
  measurements: CapturedReportMeasurement[]
}

export interface Company {
  id: string
  name: string
  users: CompanyUser[]
  customers: Customer[]
  reports: SourceReport[]
  capturedReports: CapturedSourceReport[]
}

export type RuleId = "rule-1" | "rule-2" | "rule-3" | "rule-4" | "rule-5"
export type FindingStatus = "needs_review" | "accepted" | "dismissed" | "resolved"
export type EvidenceReason =
  | "out_of_range"
  | "recorded_action"
  | "next_out_of_range"
  | "unverified_action"
  | "missing_measurement"
  | "previous_out_of_range"
  | "intervening_in_range"
  | "recurring_out_of_range"

interface EvidenceRowBase {
  visitId: string
  date: string
  reasons: EvidenceReason[]
}

export interface MeasurementEvidenceRow extends EvidenceRowBase {
  kind: "measurement"
  measurement: MeasurementRecord
}

export interface MissingMeasurementEvidenceRow extends EvidenceRowBase {
  kind: "missing_measurement"
  parameterId: ParameterId
  parameterName: string
}

export type EvidenceRow = MeasurementEvidenceRow | MissingMeasurementEvidenceRow

export interface Finding {
  id: string
  ruleId: RuleId
  priority: FindingPriority
  findingType: string
  ruleText: string
  explanation: string
  customerId: string
  customerName: string
  systemId: string
  systemName: string
  parameterId: ParameterId
  parameterName: string
  affectedVisitIds: string[]
  evidence: EvidenceRow[]
  status: FindingStatus
}

export interface IntelligenceSummary {
  headline: string
  narrative: string
  observations: string[]
  sourceReportIds: string[]
  relatedFindingIds: string[]
  completedAt: string
}

export interface FindingDecision {
  status: FindingStatus
  updatedAt: string
}

export type FindingDecisionMap = Record<string, FindingDecision>

export interface UserEditorInput {
  id?: string
  name: string
  email: string
  role: UserRole
}

export interface CustomerEditorInput {
  id?: string
  name: string
  industry: string
  location: string
  accountOwnerId: string
}

export interface SystemEditorInput {
  id?: string
  customerId: string
  name: string
  type: SystemType
  serviceInterval: ServiceInterval
  assignedTechnicianId: string
}
