import { describe, expect, it } from "vitest"
import { seedCompany } from "../data/workspace"
import type { WaterSystem } from "../types"
import { isDraftOutsideRange, measurementDraftsForSystem, nextSourceReportId } from "./reportCapture"

describe("report capture templates", () => {
  it("preloads a system's latest parameters and ranges for manual entry", () => {
    const system = seedCompany.customers[0].systems[0]
    const measurements = measurementDraftsForSystem(system, false)
    expect(measurements.map((measurement) => measurement.parameterName)).toEqual([
      "Conductivity",
      "pH",
      "Inhibitor residual",
      "Oxidant residual",
    ])
    expect(measurements.every((measurement) => measurement.value === "")).toBe(true)
    expect(measurements[0]).toMatchObject({ minimum: "1200", maximum: "1800" })
  })

  it("provides deterministic extracted values for a system with no history", () => {
    const system: WaterSystem = {
      id: "new-boiler",
      name: "Boiler 2",
      type: "boiler",
      serviceInterval: "monthly",
      assignedTechnicianId: "alex-morgan",
      visits: [],
    }
    const measurements = measurementDraftsForSystem(system, true)
    expect(measurements).toHaveLength(3)
    expect(measurements[0]).toMatchObject({ parameterName: "Conductivity", value: "2790", samplePoint: "Boiler 2" })
  })

  it("treats range boundaries as in range", () => {
    expect(isDraftOutsideRange({ value: "10", minimum: "10", maximum: "20" })).toBe(false)
    expect(isDraftOutsideRange({ value: "20", minimum: "10", maximum: "20" })).toBe(false)
    expect(isDraftOutsideRange({ value: "21", minimum: "10", maximum: "20" })).toBe(true)
  })

  it("generates the next collision-free report ID for the service year", () => {
    expect(nextSourceReportId("2026-09-04", ["SR-2026-001", "SR-2026-020", "SR-2025-099"])).toBe("SR-2026-021")
    expect(nextSourceReportId("2027-01-03", ["SR-2026-020"])).toBe("SR-2027-001")
  })
})
