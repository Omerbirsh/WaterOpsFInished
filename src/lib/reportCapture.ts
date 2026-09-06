import type { SystemType, WaterSystem } from "../types"

export interface ReportMeasurementDraft {
  id: string
  parameterName: string
  samplePoint: string
  unit: string
  value: string
  minimum: string
  maximum: string
  technicianNote: string
  action: string
}

interface ParameterTemplate {
  parameterName: string
  unit: string
  minimum: number
  maximum: number
  extractedValue: number
}

const templates: Record<SystemType, ParameterTemplate[]> = {
  cooling_tower: [
    { parameterName: "Conductivity", unit: "µS/cm", minimum: 1200, maximum: 1800, extractedValue: 1710 },
    { parameterName: "pH", unit: "", minimum: 7.2, maximum: 8.2, extractedValue: 7.8 },
    { parameterName: "Inhibitor residual", unit: "mg/L", minimum: 25, maximum: 40, extractedValue: 32 },
    { parameterName: "Oxidant residual", unit: "mg/L", minimum: 0.2, maximum: 0.5, extractedValue: 0.31 },
  ],
  boiler: [
    { parameterName: "Conductivity", unit: "µS/cm", minimum: 2200, maximum: 3200, extractedValue: 2790 },
    { parameterName: "pH", unit: "", minimum: 10.5, maximum: 11.5, extractedValue: 11.1 },
    { parameterName: "Sulfite residual", unit: "mg/L", minimum: 20, maximum: 40, extractedValue: 29 },
  ],
  closed_loop: [
    { parameterName: "pH", unit: "", minimum: 8.5, maximum: 10.5, extractedValue: 9.2 },
    { parameterName: "Nitrite residual", unit: "mg/L", minimum: 800, maximum: 1200, extractedValue: 990 },
    { parameterName: "Iron", unit: "mg/L", minimum: 0, maximum: 1, extractedValue: 0.25 },
  ],
  process_cooling: [
    { parameterName: "Conductivity", unit: "µS/cm", minimum: 500, maximum: 1500, extractedValue: 960 },
    { parameterName: "pH", unit: "", minimum: 6.5, maximum: 8.5, extractedValue: 7.5 },
    { parameterName: "Inhibitor residual", unit: "mg/L", minimum: 15, maximum: 30, extractedValue: 22 },
  ],
}

let draftSequence = 0

export function draftId() {
  draftSequence += 1
  return `report-row-${Date.now()}-${draftSequence}`
}

export function blankMeasurementDraft(samplePoint = ""): ReportMeasurementDraft {
  return {
    id: draftId(),
    parameterName: "",
    samplePoint,
    unit: "",
    value: "",
    minimum: "",
    maximum: "",
    technicianNote: "",
    action: "",
  }
}

export function measurementDraftsForSystem(system: WaterSystem, extracted: boolean): ReportMeasurementDraft[] {
  const latestVisit = [...system.visits].sort((a, b) => b.date.localeCompare(a.date))[0]
  if (latestVisit?.measurements.length) {
    return latestVisit.measurements.map((measurement) => ({
      id: draftId(),
      parameterName: measurement.parameterName,
      samplePoint: system.name,
      unit: measurement.unit,
      value: extracted ? String(measurement.value) : "",
      minimum: String(measurement.minimum),
      maximum: String(measurement.maximum),
      technicianNote: extracted ? measurement.technicianNote : "",
      action: extracted ? measurement.action?.description ?? "" : "",
    }))
  }

  return templates[system.type].map((template) => ({
    id: draftId(),
    parameterName: template.parameterName,
    samplePoint: system.name,
    unit: template.unit,
    value: extracted ? String(template.extractedValue) : "",
    minimum: String(template.minimum),
    maximum: String(template.maximum),
    technicianNote: extracted ? "Reading captured from the source report." : "",
    action: "",
  }))
}

export function isDraftOutsideRange(measurement: Pick<ReportMeasurementDraft, "value" | "minimum" | "maximum">) {
  const value = Number(measurement.value)
  const minimum = Number(measurement.minimum)
  const maximum = Number(measurement.maximum)
  if (!measurement.value || !measurement.minimum || !measurement.maximum) return false
  return value < minimum || value > maximum
}

export function nextSourceReportId(serviceDate: string, existingIds: string[]) {
  const year = serviceDate.slice(0, 4)
  const pattern = new RegExp(`^SR-${year}-(\\d+)$`)
  const sequence = existingIds
    .map((id) => id.match(pattern))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .reduce((maximum, match) => Math.max(maximum, Number(match[1])), 0) + 1
  return `SR-${year}-${String(sequence).padStart(3, "0")}`
}
