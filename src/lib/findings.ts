import type {
  Company,
  Customer,
  EvidenceReason,
  EvidenceRow,
  Finding,
  MeasurementRecord,
  ParameterId,
  Visit,
  WaterSystem,
} from "../types"

export const RULE_TEXT = {
  "rule-1": "If the same parameter is outside its configured range for at least 2 consecutive visits, create a finding.",
  "rule-2": "If an action was recorded on one visit and the same parameter is still outside its configured range on the following visit, create a finding.",
  "rule-3": "If an action exists and there is no later visit or explicit closure evidence, create a finding.",
  "rule-4": "If a historically tracked parameter is missing from a visit between documented readings, create a finding.",
  "rule-5": "If the same parameter is outside its configured range, returns to range, and is later outside range again, create a finding.",
} as const

export function isOutOfRange(measurement: MeasurementRecord): boolean {
  return measurement.value < measurement.minimum || measurement.value > measurement.maximum
}

function findMeasurement(visit: Visit, parameterId: ParameterId) {
  return visit.measurements.find((item) => item.parameterId === parameterId)
}

function makeEvidence(visit: Visit, measurement: MeasurementRecord, reasons: EvidenceReason[]): EvidenceRow {
  return {
    kind: "measurement",
    visitId: visit.id,
    date: visit.date,
    measurement,
    reasons,
  }
}

function makeMissingEvidence(
  visit: Visit,
  measurement: MeasurementRecord,
): EvidenceRow {
  return {
    kind: "missing_measurement",
    visitId: visit.id,
    date: visit.date,
    parameterId: measurement.parameterId,
    parameterName: measurement.parameterName,
    reasons: ["missing_measurement"],
  }
}

function parameterIdsFor(system: WaterSystem): ParameterId[] {
  return Array.from(
    new Set(system.visits.flatMap((visit) => visit.measurements.map((measurement) => measurement.parameterId))),
  )
}

function longDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

function baseFinding(
  customer: Customer,
  system: WaterSystem,
  measurement: MeasurementRecord,
): Pick<
  Finding,
  | "customerId"
  | "customerName"
  | "systemId"
  | "systemName"
  | "parameterId"
  | "parameterName"
  | "status"
> {
  return {
    customerId: customer.id,
    customerName: customer.name,
    systemId: system.id,
    systemName: system.name,
    parameterId: measurement.parameterId,
    parameterName: measurement.parameterName,
    status: "needs_review",
  }
}

function ruleOne(customer: Customer, system: WaterSystem): Finding[] {
  const findings: Finding[] = []
  const parameterIds = parameterIdsFor(system)

  for (const parameterId of parameterIds) {
    let episode: Array<{ visit: Visit; measurement: MeasurementRecord }> = []

    const finishEpisode = () => {
      if (episode.length < 2) {
        episode = []
        return
      }

      const first = episode[0]
      const last = episode[episode.length - 1]
      findings.push({
        ...baseFinding(customer, system, first.measurement),
        id: `rule-1_${customer.id}_${system.id}_${parameterId}_${first.visit.date}_${last.visit.date}`,
        ruleId: "rule-1",
        priority: "high",
        findingType: "Repeated out-of-range measurement",
        ruleText: RULE_TEXT["rule-1"],
        explanation: `${first.measurement.parameterName} was outside its configured range on ${episode.length} consecutive visits.`,
        affectedVisitIds: episode.map((item) => item.visit.id),
        evidence: episode.map((item) => makeEvidence(item.visit, item.measurement, ["out_of_range"])),
      })
      episode = []
    }

    for (const visit of system.visits) {
      const measurement = findMeasurement(visit, parameterId)
      if (measurement && isOutOfRange(measurement)) {
        episode.push({ visit, measurement })
      } else {
        finishEpisode()
      }
    }
    finishEpisode()
  }

  return findings
}

function ruleTwo(customer: Customer, system: WaterSystem): Finding[] {
  const findings: Finding[] = []
  for (let index = 0; index < system.visits.length - 1; index += 1) {
    const visit = system.visits[index]
    const nextVisit = system.visits[index + 1]

    for (const measurement of visit.measurements) {
      if (!measurement.action?.description.trim()) continue
      const nextMeasurement = findMeasurement(nextVisit, measurement.parameterId)
      if (!nextMeasurement || !isOutOfRange(nextMeasurement)) continue

      findings.push({
        ...baseFinding(customer, system, measurement),
        id: `rule-2_${customer.id}_${system.id}_${measurement.parameterId}_${visit.date}_${nextVisit.date}`,
        ruleId: "rule-2",
        priority: "high",
        findingType: "No documented return after action",
        ruleText: RULE_TEXT["rule-2"],
        explanation: "No documented return to configured range after the recorded action.",
        affectedVisitIds: [visit.id, nextVisit.id],
        evidence: [
          makeEvidence(visit, measurement, ["recorded_action", ...(isOutOfRange(measurement) ? ["out_of_range" as const] : [])]),
          makeEvidence(nextVisit, nextMeasurement, ["next_out_of_range"]),
        ],
      })
    }
  }
  return findings
}

function ruleThree(customer: Customer, system: WaterSystem): Finding[] {
  const finalVisit = system.visits.at(-1)
  if (!finalVisit) return []

  return finalVisit.measurements.flatMap((measurement): Finding[] => {
    const action = measurement.action
    if (!action?.description.trim() || action.closureEvidence?.trim()) return []

    return [
      {
        ...baseFinding(customer, system, measurement),
        id: `rule-3_${customer.id}_${system.id}_${measurement.parameterId}_${finalVisit.date}`,
        ruleId: "rule-3",
        priority: "medium",
        findingType: "Follow-up not yet verified",
        ruleText: RULE_TEXT["rule-3"],
        explanation: "Follow-up has not yet been verified.",
        affectedVisitIds: [finalVisit.id],
        evidence: [makeEvidence(finalVisit, measurement, ["unverified_action", ...(isOutOfRange(measurement) ? ["out_of_range" as const] : [])])],
      },
    ]
  })
}

function ruleFour(customer: Customer, system: WaterSystem): Finding[] {
  const findings: Finding[] = []

  for (const parameterId of parameterIdsFor(system)) {
    const presentIndices = system.visits.flatMap((visit, index) =>
      findMeasurement(visit, parameterId) ? [index] : [],
    )

    for (let presentPosition = 1; presentPosition < presentIndices.length; presentPosition += 1) {
      const previousIndex = presentIndices[presentPosition - 1]
      const nextIndex = presentIndices[presentPosition]
      const missingVisits = system.visits.slice(previousIndex + 1, nextIndex)

      if (presentPosition < 2 || missingVisits.length === 0) continue

      const previousVisit = system.visits[previousIndex]
      const nextVisit = system.visits[nextIndex]
      const previousMeasurement = findMeasurement(previousVisit, parameterId)
      const nextMeasurement = findMeasurement(nextVisit, parameterId)
      if (!previousMeasurement || !nextMeasurement) continue

      const missingDates = missingVisits.map((visit) => longDate(visit.date))
      const explanation = missingVisits.length === 1
        ? `${previousMeasurement.parameterName} was not recorded on the ${missingDates[0]} service visit between documented readings.`
        : `${previousMeasurement.parameterName} was not recorded on ${missingVisits.length} service visits between documented readings.`

      findings.push({
        ...baseFinding(customer, system, previousMeasurement),
        id: `rule-4_${customer.id}_${system.id}_${parameterId}_${missingVisits[0].date}_${missingVisits.at(-1)?.date}`,
        ruleId: "rule-4",
        priority: "low",
        findingType: "Measurement coverage gap",
        ruleText: RULE_TEXT["rule-4"],
        explanation,
        affectedVisitIds: [previousVisit.id, ...missingVisits.map((visit) => visit.id), nextVisit.id],
        evidence: [
          makeEvidence(previousVisit, previousMeasurement, []),
          ...missingVisits.map((visit) => makeMissingEvidence(visit, previousMeasurement)),
          makeEvidence(nextVisit, nextMeasurement, []),
        ],
      })
    }
  }

  return findings
}

function ruleFive(customer: Customer, system: WaterSystem): Finding[] {
  const findings: Finding[] = []

  for (const parameterId of parameterIdsFor(system)) {
    let previousOutside: { visit: Visit; measurement: MeasurementRecord } | undefined
    let intervening: Array<{ visit: Visit; measurement: MeasurementRecord }> = []

    for (const visit of system.visits) {
      const measurement = findMeasurement(visit, parameterId)
      if (!measurement) continue

      if (isOutOfRange(measurement)) {
        if (previousOutside && intervening.length > 0) {
          findings.push({
            ...baseFinding(customer, system, measurement),
            id: `rule-5_${customer.id}_${system.id}_${parameterId}_${previousOutside.visit.date}_${visit.date}`,
            ruleId: "rule-5",
            priority: "medium",
            findingType: "Recurring out-of-range pattern",
            ruleText: RULE_TEXT["rule-5"],
            explanation: `${measurement.parameterName} was outside its configured range again after a documented return to range.`,
            affectedVisitIds: [
              previousOutside.visit.id,
              ...intervening.map((item) => item.visit.id),
              visit.id,
            ],
            evidence: [
              makeEvidence(previousOutside.visit, previousOutside.measurement, ["previous_out_of_range"]),
              ...intervening.map((item) => makeEvidence(item.visit, item.measurement, ["intervening_in_range"])),
              makeEvidence(visit, measurement, ["recurring_out_of_range"]),
            ],
          })
        }

        previousOutside = { visit, measurement }
        intervening = []
      } else if (previousOutside) {
        intervening.push({ visit, measurement })
      }
    }
  }

  return findings
}

export function evaluateFindings(customer: Customer): Finding[] {
  return customer.systems
    .flatMap((system) => [
      ...ruleOne(customer, system),
      ...ruleTwo(customer, system),
      ...ruleThree(customer, system),
      ...ruleFour(customer, system),
      ...ruleFive(customer, system),
    ])
    .sort((a, b) => {
      const aDate = a.evidence.at(-1)?.date ?? ""
      const bDate = b.evidence.at(-1)?.date ?? ""
      return bDate.localeCompare(aDate) || a.ruleId.localeCompare(b.ruleId)
    })
}

export function evaluateCompanyFindings(company: Company): Finding[] {
  return company.customers
    .flatMap(evaluateFindings)
    .sort((a, b) => {
      const priorities = { high: 0, medium: 1, low: 2 }
      const priorityDifference = priorities[a.priority] - priorities[b.priority]
      if (priorityDifference) return priorityDifference
      const aDate = a.evidence.at(-1)?.date ?? ""
      const bDate = b.evidence.at(-1)?.date ?? ""
      return bDate.localeCompare(aDate) || a.id.localeCompare(b.id)
    })
}
