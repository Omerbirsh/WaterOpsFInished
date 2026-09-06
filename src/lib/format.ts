import type { FindingStatus, MeasurementRecord } from "../types"

const fullDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

export function formatDate(date: string) {
  return fullDate.format(new Date(`${date}T00:00:00Z`))
}

export function formatShortDate(date: string) {
  return shortDate.format(new Date(`${date}T00:00:00Z`))
}

export function formatValue(value: number) {
  if (Number.isInteger(value)) return value.toLocaleString("en-US")
  return value.toLocaleString("en-US", { maximumFractionDigits: Math.abs(value) < 1 ? 2 : 1 })
}

export function formatMeasurement(measurement: MeasurementRecord) {
  return `${formatValue(measurement.value)}${measurement.unit ? ` ${measurement.unit}` : ""}`
}

export function formatRange(measurement: MeasurementRecord) {
  return `${formatValue(measurement.minimum)}–${formatValue(measurement.maximum)}${measurement.unit ? ` ${measurement.unit}` : ""}`
}

export const statusLabels: Record<FindingStatus, string> = {
  needs_review: "Needs review",
  accepted: "Accepted",
  dismissed: "Dismissed",
  resolved: "Resolved",
}
