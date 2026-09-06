import { describe, expect, it } from "vitest"
import { seedCompany } from "../data/workspace"
import type { Customer } from "../types"
import { evaluateCompanyFindings, evaluateFindings, isOutOfRange } from "./findings"

function fixture(): Customer {
  const customer = structuredClone(seedCompany.customers[0])
  customer.systems = [customer.systems[0]]
  return customer
}

function removeActions(customer: Customer) {
  for (const visit of customer.systems[0].visits) {
    for (const measurement of visit.measurements) measurement.action = undefined
  }
}

describe("deterministic finding engine", () => {
  it("generates exactly one finding for each demo rule", () => {
    const findings = evaluateFindings(fixture())
    expect(findings).toHaveLength(5)
    expect(findings.map((finding) => finding.ruleId).sort()).toEqual(["rule-1", "rule-2", "rule-3", "rule-4", "rule-5"])
    expect(findings.find((finding) => finding.ruleId === "rule-1")?.affectedVisitIds).toHaveLength(3)
    expect(findings.find((finding) => finding.ruleId === "rule-2")?.explanation).toBe(
      "No documented return to configured range after the recorded action.",
    )
    expect(findings.find((finding) => finding.ruleId === "rule-3")?.explanation).toBe(
      "Follow-up has not yet been verified.",
    )
    expect(findings.find((finding) => finding.ruleId === "rule-4")?.explanation).toBe(
      "Oxidant residual was not recorded on the April 16, 2026 service visit between documented readings.",
    )
    expect(findings.find((finding) => finding.ruleId === "rule-5")?.explanation).toBe(
      "pH was outside its configured range again after a documented return to range.",
    )
  })

  it("generates the complete ClearFlow hierarchy and eight scoped findings", () => {
    const findings = evaluateCompanyFindings(seedCompany)
    expect(seedCompany.users).toHaveLength(3)
    expect(seedCompany.customers).toHaveLength(3)
    expect(seedCompany.customers.flatMap((customer) => customer.systems)).toHaveLength(5)
    expect(seedCompany.reports).toHaveLength(20)
    expect(seedCompany.customers.flatMap((customer) => customer.systems.flatMap((system) => system.visits.flatMap((visit) => visit.measurements)))).toHaveLength(70)
    expect(findings).toHaveLength(8)
    expect(new Set(findings.map((finding) => finding.id)).size).toBe(8)
    expect(findings.every((finding) => finding.id.includes(finding.customerId) && finding.id.includes(finding.systemId))).toBe(true)
  })

  it("keeps the primary fixture totals internally consistent", () => {
    const visits = seedCompany.customers[0].systems[0].visits
    expect(visits).toHaveLength(8)
    expect(visits.flatMap((visit) => visit.measurements)).toHaveLength(31)
    expect(visits.flatMap((visit) => visit.measurements).filter(isOutOfRange)).toHaveLength(5)
  })

  it("treats values equal to either configured boundary as in range", () => {
    const customer = fixture()
    removeActions(customer)
    const visits = customer.systems[0].visits
    visits.forEach((visit, index) => {
      const measurement = visit.measurements[0]
      measurement.value = index % 2 ? measurement.minimum : measurement.maximum
      expect(isOutOfRange(measurement)).toBe(false)
    })
    expect(evaluateFindings(customer).filter((finding) => finding.parameterId === "conductivity")).toHaveLength(0)
  })

  it("groups contiguous runs and splits separated episodes", () => {
    const customer = fixture()
    removeActions(customer)
    const values = [1900, 1910, 1700, 1920, 1930, 1700, 1700, 1700]
    customer.systems[0].visits.forEach((visit, index) => {
      visit.measurements[0].value = values[index]
    })
    const ruleOneFindings = evaluateFindings(customer).filter(
      (finding) => finding.ruleId === "rule-1" && finding.parameterId === "conductivity",
    )
    expect(ruleOneFindings).toHaveLength(2)
    expect(ruleOneFindings.every((finding) => finding.evidence.length === 2)).toBe(true)
  })

  it("does not create Rule 2 when the following reading returns to range", () => {
    const customer = fixture()
    customer.systems[0].visits[2].measurements[0].value = 1750
    expect(evaluateFindings(customer).some((finding) => finding.ruleId === "rule-2")).toBe(false)
  })

  it("does not create action findings when no action is recorded", () => {
    const customer = fixture()
    removeActions(customer)
    const findings = evaluateFindings(customer)
    expect(findings.some((finding) => finding.ruleId === "rule-2" || finding.ruleId === "rule-3")).toBe(false)
  })

  it("suppresses Rule 3 when explicit closure evidence exists", () => {
    const customer = fixture()
    const finalAction = customer.systems[0].visits.at(-1)?.measurements[1].action
    if (!finalAction) throw new Error("Expected final pH action in fixture")
    finalAction.closureEvidence = "Same-visit closure note recorded."
    expect(evaluateFindings(customer).some((finding) => finding.ruleId === "rule-3")).toBe(false)
  })

  it("groups a contiguous measurement coverage gap into one finding", () => {
    const customer = fixture()
    const visits = customer.systems[0].visits
    visits[4].measurements = visits[4].measurements.filter((item) => item.parameterId !== "oxidant-residual")
    const finding = evaluateFindings(customer).find((item) => item.ruleId === "rule-4")
    expect(finding).toBeDefined()
    expect(finding?.evidence.filter((row) => row.kind === "missing_measurement")).toHaveLength(2)
    expect(evaluateFindings(customer).filter((item) => item.ruleId === "rule-4")).toHaveLength(1)
  })

  it("does not treat initial or final absence as an internal coverage gap", () => {
    const customer = fixture()
    const visits = customer.systems[0].visits
    const source = structuredClone(visits[2].measurements.find((item) => item.parameterId === "oxidant-residual")!)
    source.id = `${visits[3].id}-oxidant-residual`
    source.value = 0.27
    visits[3].measurements.push(source)
    visits[0].measurements = visits[0].measurements.filter((item) => item.parameterId !== "oxidant-residual")
    visits.at(-1)!.measurements = visits.at(-1)!.measurements.filter((item) => item.parameterId !== "oxidant-residual")
    expect(evaluateFindings(customer).some((finding) => finding.ruleId === "rule-4")).toBe(false)
  })

  it("creates Rule 5 only when an in-range reading separates outside readings", () => {
    const finding = evaluateFindings(fixture()).find((item) => item.ruleId === "rule-5")
    expect(finding?.evidence.map((row) => row.reasons[0])).toEqual([
      "previous_out_of_range",
      "intervening_in_range",
      "recurring_out_of_range",
    ])

    const consecutiveOnly = fixture()
    const values = [7.8, 8.4, 8.5, 8.6, 7.9, 7.8, 7.9, 8.0]
    consecutiveOnly.systems[0].visits.forEach((visit, index) => {
      visit.measurements.find((item) => item.parameterId === "ph")!.value = values[index]
    })
    expect(evaluateFindings(consecutiveOnly).some((item) => item.ruleId === "rule-5" && item.parameterId === "ph")).toBe(false)
  })

  it("creates stable IDs for the same structured history", () => {
    const first = evaluateFindings(fixture()).map((finding) => finding.id)
    const second = evaluateFindings(fixture()).map((finding) => finding.id)
    expect(second).toEqual(first)
    expect(new Set(first).size).toBe(first.length)
  })
})
