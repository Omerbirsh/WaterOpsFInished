import type {
  Company,
  Customer,
  MeasurementRecord,
  ParameterId,
  SourceReport,
  Visit,
  WaterSystem,
} from "../types"

type ParameterTemplate = {
  id: ParameterId
  name: string
  unit: string
  minimum: number
  maximum: number
}

const parameterTemplates = {
  coolingConductivity: { id: "conductivity", name: "Conductivity", unit: "µS/cm", minimum: 1200, maximum: 1800 },
  coolingPh: { id: "ph", name: "pH", unit: "", minimum: 7.2, maximum: 8.2 },
  inhibitor: { id: "inhibitor-residual", name: "Inhibitor residual", unit: "mg/L", minimum: 25, maximum: 40 },
  oxidant: { id: "oxidant-residual", name: "Oxidant residual", unit: "mg/L", minimum: 0.2, maximum: 0.5 },
  boilerConductivity: { id: "conductivity", name: "Conductivity", unit: "µS/cm", minimum: 2200, maximum: 3200 },
  boilerPh: { id: "ph", name: "pH", unit: "", minimum: 10.5, maximum: 11.5 },
  sulfite: { id: "sulfite", name: "Sulfite residual", unit: "mg/L", minimum: 20, maximum: 40 },
  loopPh: { id: "ph", name: "pH", unit: "", minimum: 8.5, maximum: 10.5 },
  nitrite: { id: "nitrite", name: "Nitrite residual", unit: "mg/L", minimum: 800, maximum: 1200 },
  iron: { id: "iron", name: "Iron", unit: "mg/L", minimum: 0, maximum: 1 },
  processConductivity: { id: "conductivity", name: "Conductivity", unit: "µS/cm", minimum: 500, maximum: 1500 },
  processPh: { id: "ph", name: "pH", unit: "", minimum: 6.5, maximum: 8.5 },
  processInhibitor: { id: "inhibitor-residual", name: "Inhibitor residual", unit: "mg/L", minimum: 15, maximum: 30 },
} satisfies Record<string, ParameterTemplate>

function reading(
  visitId: string,
  template: ParameterTemplate,
  value: number,
  note: string,
  action?: string,
): MeasurementRecord {
  return {
    id: `${visitId}-${template.id}`,
    parameterId: template.id,
    parameterName: template.name,
    unit: template.unit,
    value,
    minimum: template.minimum,
    maximum: template.maximum,
    technicianNote: note,
    action: action ? { description: action } : undefined,
  }
}

function visit(
  systemId: string,
  date: string,
  reportNumber: number,
  technicianId: string,
  buildMeasurements: (visitId: string) => MeasurementRecord[],
): Visit {
  const visitId = `visit-${systemId}-${date}`
  return {
    id: visitId,
    date,
    sourceReportId: `SR-2026-${String(reportNumber).padStart(3, "0")}`,
    technicianId,
    measurements: buildMeasurements(visitId),
  }
}

const coolingTowerOneVisits: Visit[] = [
  visit("cooling-tower-1", "2026-01-15", 1, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1650, "Baseline reading documented within the configured range."),
    reading(id, parameterTemplates.coolingPh, 7.8, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 30, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.32, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-02-12", 2, "jordan-lee", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1980, "Reading documented above the configured maximum during routine service.", "Conductivity probe cleaned and controller setpoint checked."),
    reading(id, parameterTemplates.coolingPh, 7.9, "Reading remained within the configured range."),
    reading(id, parameterTemplates.inhibitor, 31, "Residual reading remained within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.28, "Oxidant residual remained within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-03-12", 3, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 2050, "The next scheduled reading remained above the configured maximum."),
    reading(id, parameterTemplates.coolingPh, 8, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 29, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.25, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-04-16", 4, "jordan-lee", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1920, "Reading remained above the configured maximum for a third visit."),
    reading(id, parameterTemplates.coolingPh, 7.7, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 33, "Residual reading documented within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-05-14", 5, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1760, "Reading documented back within the configured range."),
    reading(id, parameterTemplates.coolingPh, 7.9, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 32, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.3, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-06-11", 6, "jordan-lee", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1740, "Reading remained within the configured range."),
    reading(id, parameterTemplates.coolingPh, 8.4, "Reading documented above the configured maximum during routine service."),
    reading(id, parameterTemplates.inhibitor, 34, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.34, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-07-16", 7, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1720, "Reading remained within the configured range."),
    reading(id, parameterTemplates.coolingPh, 7.8, "Reading documented back within the configured range."),
    reading(id, parameterTemplates.inhibitor, 35, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.29, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-1", "2026-08-13", 8, "jordan-lee", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1750, "Reading remained within the configured range."),
    reading(id, parameterTemplates.coolingPh, 8.5, "Reading documented above the configured maximum on the latest scheduled visit.", "Sample line flushed; follow-up reading scheduled."),
    reading(id, parameterTemplates.inhibitor, 33, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.31, "Oxidant residual documented within the configured range."),
  ]),
]

const boilerVisits: Visit[] = [
  visit("boiler-plant-1", "2026-05-08", 9, "jordan-lee", (id) => [
    reading(id, parameterTemplates.boilerConductivity, 2740, "Reading documented within the configured range."),
    reading(id, parameterTemplates.boilerPh, 10.9, "Boiler water pH documented within the configured range."),
    reading(id, parameterTemplates.sulfite, 28, "Sulfite residual documented within the configured range."),
  ]),
  visit("boiler-plant-1", "2026-06-05", 10, "jordan-lee", (id) => [
    reading(id, parameterTemplates.boilerConductivity, 2810, "Reading documented within the configured range."),
    reading(id, parameterTemplates.boilerPh, 11.8, "Reading documented above the configured maximum.", "Controller setpoint reviewed and sample line flushed."),
    reading(id, parameterTemplates.sulfite, 30, "Sulfite residual documented within the configured range."),
  ]),
  visit("boiler-plant-1", "2026-07-10", 11, "jordan-lee", (id) => [
    reading(id, parameterTemplates.boilerConductivity, 2890, "Reading documented within the configured range."),
    reading(id, parameterTemplates.boilerPh, 11.7, "The following scheduled reading remained above the configured maximum."),
    reading(id, parameterTemplates.sulfite, 31, "Sulfite residual documented within the configured range."),
  ]),
  visit("boiler-plant-1", "2026-08-07", 12, "jordan-lee", (id) => [
    reading(id, parameterTemplates.boilerConductivity, 2760, "Reading documented within the configured range."),
    reading(id, parameterTemplates.boilerPh, 11.2, "Reading documented back within the configured range."),
    reading(id, parameterTemplates.sulfite, 29, "Sulfite residual documented within the configured range."),
  ]),
]

const medicalCoolingVisits: Visit[] = [
  visit("cooling-tower-east", "2026-06-18", 13, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1750, "Reading documented within the configured range."),
    reading(id, parameterTemplates.coolingPh, 7.8, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 32, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.27, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-east", "2026-07-17", 14, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1900, "Reading documented above the configured maximum."),
    reading(id, parameterTemplates.coolingPh, 7.9, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 31, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.3, "Oxidant residual documented within the configured range."),
  ]),
  visit("cooling-tower-east", "2026-08-14", 15, "alex-morgan", (id) => [
    reading(id, parameterTemplates.coolingConductivity, 1950, "The next scheduled reading remained above the configured maximum."),
    reading(id, parameterTemplates.coolingPh, 8, "Reading documented within the configured range."),
    reading(id, parameterTemplates.inhibitor, 33, "Residual reading documented within the configured range."),
    reading(id, parameterTemplates.oxidant, 0.29, "Oxidant residual documented within the configured range."),
  ]),
]

const closedLoopVisits: Visit[] = [
  visit("chilled-water-loop", "2026-06-18", 16, "jordan-lee", (id) => [
    reading(id, parameterTemplates.loopPh, 9.2, "Closed-loop pH documented within the configured range."),
    reading(id, parameterTemplates.nitrite, 980, "Nitrite residual documented within the configured range."),
    reading(id, parameterTemplates.iron, 0.24, "Iron reading documented within the configured range."),
  ]),
  visit("chilled-water-loop", "2026-07-17", 17, "jordan-lee", (id) => [
    reading(id, parameterTemplates.loopPh, 9.1, "Closed-loop pH remained within the configured range."),
    reading(id, parameterTemplates.nitrite, 960, "Nitrite residual remained within the configured range."),
    reading(id, parameterTemplates.iron, 0.27, "Iron reading remained within the configured range."),
  ]),
  visit("chilled-water-loop", "2026-08-14", 18, "jordan-lee", (id) => [
    reading(id, parameterTemplates.loopPh, 9.3, "Closed-loop pH documented within the configured range."),
    reading(id, parameterTemplates.nitrite, 1010, "Nitrite residual documented within the configured range."),
    reading(id, parameterTemplates.iron, 0.22, "Iron reading documented within the configured range."),
  ]),
]

const processCoolingVisits: Visit[] = [
  visit("process-cooling-loop", "2026-07-24", 19, "alex-morgan", (id) => [
    reading(id, parameterTemplates.processConductivity, 920, "Reading documented within the configured range."),
    reading(id, parameterTemplates.processPh, 7.4, "Process-loop pH documented within the configured range."),
    reading(id, parameterTemplates.processInhibitor, 22, "Inhibitor residual documented within the configured range."),
  ]),
  visit("process-cooling-loop", "2026-08-21", 20, "alex-morgan", (id) => [
    reading(id, parameterTemplates.processConductivity, 980, "Reading documented within the configured range."),
    reading(id, parameterTemplates.processPh, 7.5, "Process-loop pH documented within the configured range."),
    reading(id, parameterTemplates.processInhibitor, 21, "Inhibitor residual documented within the configured range."),
  ]),
]

const customers: Customer[] = [
  {
    id: "harbor-grand-hotel",
    name: "Harbor Grand Hotel",
    industry: "Hospitality",
    location: "Miami, FL",
    accountOwnerId: "maya-chen",
    systems: [
      { id: "cooling-tower-1", name: "Cooling Tower 1", type: "cooling_tower", serviceInterval: "monthly", assignedTechnicianId: "alex-morgan", visits: coolingTowerOneVisits },
      { id: "boiler-plant-1", name: "Boiler Plant 1", type: "boiler", serviceInterval: "monthly", assignedTechnicianId: "jordan-lee", visits: boilerVisits },
    ],
  },
  {
    id: "meridian-medical-center",
    name: "Meridian Medical Center",
    industry: "Healthcare",
    location: "Orlando, FL",
    accountOwnerId: "maya-chen",
    systems: [
      { id: "cooling-tower-east", name: "Cooling Tower East", type: "cooling_tower", serviceInterval: "monthly", assignedTechnicianId: "alex-morgan", visits: medicalCoolingVisits },
      { id: "chilled-water-loop", name: "Chilled Water Loop", type: "closed_loop", serviceInterval: "monthly", assignedTechnicianId: "jordan-lee", visits: closedLoopVisits },
    ],
  },
  {
    id: "summit-foods-plant",
    name: "Summit Foods Plant",
    industry: "Food processing",
    location: "Tampa, FL",
    accountOwnerId: "maya-chen",
    systems: [
      { id: "process-cooling-loop", name: "Process Cooling Loop", type: "process_cooling", serviceInterval: "monthly", assignedTechnicianId: "alex-morgan", visits: processCoolingVisits },
    ],
  },
]

function createReports(sourceCustomers: Customer[]): SourceReport[] {
  return sourceCustomers.flatMap((customer) =>
    customer.systems.flatMap((system) =>
      system.visits.map((item, index) => ({
        id: item.sourceReportId,
        fileName: `${customer.name.replaceAll(" ", "_")}_${item.sourceReportId}.pdf`,
        customerId: customer.id,
        systemId: system.id,
        visitId: item.id,
        technicianId: item.technicianId,
        serviceDate: item.date,
        receivedAt: `${item.date}T17:20:00Z`,
        analysisCompletedAt: `${item.date}T17:22:00Z`,
        pageCount: 2 + (index % 2),
        analysisStatus: "analyzed" as const,
      })),
    ),
  )
}

export const seedCompany: Company = {
  id: "clearflow-water-services",
  name: "ClearFlow Water Services",
  users: [
    { id: "maya-chen", name: "Maya Chen", email: "maya@clearflow.example", role: "technical_manager", initials: "MC" },
    { id: "alex-morgan", name: "Alex Morgan", email: "alex@clearflow.example", role: "senior_technician", initials: "AM" },
    { id: "jordan-lee", name: "Jordan Lee", email: "jordan@clearflow.example", role: "service_technician", initials: "JL" },
  ],
  customers,
  reports: createReports(customers),
  capturedReports: [],
}

export function cloneSeedCompany(): Company {
  return JSON.parse(JSON.stringify(seedCompany)) as Company
}

export function findSystem(company: Company, systemId: string): { customer: Customer; system: WaterSystem } | undefined {
  for (const customer of company.customers) {
    const system = customer.systems.find((item) => item.id === systemId)
    if (system) return { customer, system }
  }
  return undefined
}

export function findVisit(company: Company, visitId: string) {
  for (const customer of company.customers) {
    for (const system of customer.systems) {
      const foundVisit = system.visits.find((item) => item.id === visitId)
      if (foundVisit) return { customer, system, visit: foundVisit }
    }
  }
  return undefined
}
