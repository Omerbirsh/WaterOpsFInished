import axe from "axe-core"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { App } from "./App"
import { seedCompany } from "./data/workspace"
import { LANGUAGE_STORAGE_KEY } from "./state/LanguageContext"
import { WORKSPACE_STORAGE_KEY } from "./state/WorkspaceContext"

function open(path: string) {
  window.history.pushState({}, "", path)
  return render(<App />)
}

beforeEach(() => { window.localStorage.clear(); window.history.pushState({}, "", "/") })

describe("WaterOps production workspace", () => {
  it("opens deep links directly in the ClearFlow workspace", async () => {
    open("/reports/SR-2026-001")
    expect(await screen.findByRole("heading", { name: "SR-2026-001" }, { timeout: 3000 })).toBeInTheDocument()
  })

  it("switches between English and Hebrew, persists the choice, and applies RTL", async () => {
    const user = userEvent.setup(); open("/")
    await user.click((await screen.findAllByRole("button", { name: "Switch to Hebrew" }))[0])
    expect(await screen.findByRole("heading", { name: "בוקר טוב, מאיה" })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute("lang", "he")
    expect(document.documentElement).toHaveAttribute("dir", "rtl")
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("he")

    await user.click(screen.getByRole("button", { name: "החלפה לאנגלית" }))
    expect(await screen.findByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute("lang", "en")
    expect(document.documentElement).toHaveAttribute("dir", "ltr")
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en")
  })

  it("shows the complete operational overview", async () => {
    open("/")
    expect(await screen.findByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument()
    expect(screen.getByText("Active customers")).toBeInTheDocument()
    expect(screen.getByText("Analyzed reports")).toBeInTheDocument()
    expect(screen.getByText("WaterOps Intelligence")).toBeInTheDocument()
  })

  it("ignores corrupted captured reports without discarding the workspace", async () => {
    const stored = structuredClone(seedCompany) as unknown as Record<string, unknown>
    stored.capturedReports = [{ id: "broken-report" }]
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(stored))
    open("/reports")
    expect(await screen.findByRole("heading", { name: "Source Reports" })).toBeInTheDocument()
    expect(screen.getByText("Showing 20 of 20 reports")).toBeInTheDocument()
  })

  it("navigates the customer and source-report hierarchy", async () => {
    const user = userEvent.setup(); open("/customers")
    await user.click(await screen.findByRole("link", { name: /Harbor Grand Hotel/ }))
    expect(await screen.findByRole("heading", { name: "Harbor Grand Hotel" })).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: /Systems/ }))
    await user.click(screen.getByRole("link", { name: /Cooling Tower 1/ }))
    expect(await screen.findByRole("heading", { name: "Cooling Tower 1" })).toBeInTheDocument()
    await user.click(screen.getByRole("link", { name: "SR-2026-001" }))
    expect(await screen.findByRole("heading", { name: "SR-2026-001" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Report preview" })).toBeInTheDocument()
  })

  it("adds a manual report without changing service history", async () => {
    const user = userEvent.setup(); open("/reports")
    await user.click(await screen.findByRole("link", { name: "Add report" }))
    expect(await screen.findByRole("heading", { name: "Add report" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Enter manually/ }))
    expect(await screen.findByRole("heading", { name: "Report information" })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/Customer/), "harbor-grand-hotel")
    await user.selectOptions(screen.getByLabelText(/Water system/), "cooling-tower-1")
    await user.selectOptions(screen.getByLabelText(/Technician/), "alex-morgan")
    await user.click(screen.getByRole("button", { name: /Continue to measurements/ }))
    expect(await screen.findByRole("heading", { name: "Enter measurements" })).toBeInTheDocument()

    const resultInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[id^="card-"][id$="-value"]'))
    expect(resultInputs).toHaveLength(4)
    ;["1700", "7.8", "31", "0.3"].forEach((value, index) => fireEvent.change(resultInputs[index], { target: { value } }))
    await user.click(screen.getByRole("button", { name: /Review report/ }))
    await user.click(await screen.findByRole("button", { name: "Add report" }))

    expect(await screen.findByRole("heading", { name: "SR-2026-021" })).toBeInTheDocument()
    const stored = JSON.parse(window.localStorage.getItem(WORKSPACE_STORAGE_KEY) ?? "{}")
    expect(stored.capturedReports).toHaveLength(1)
    expect(stored.capturedReports[0].measurements).toHaveLength(4)
    expect(stored.customers[0].systems[0].visits).toHaveLength(8)
    expect(stored.reports).toHaveLength(20)
  })

  it("reviews a PDF upload locally and stores no file bytes", async () => {
    const user = userEvent.setup(); open("/reports/new")
    expect(await screen.findByRole("heading", { name: "Add report" })).toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: /Upload report/ }))
    expect(await screen.findByRole("heading", { name: "Upload report PDF" })).toBeInTheDocument()
    await user.upload(screen.getByLabelText(/Choose a PDF or drag it here/), new File(["local-pdf-content"], "September_Service_Report.pdf", { type: "application/pdf" }))
    await user.selectOptions(screen.getByLabelText(/Customer/), "meridian-medical-center")
    await user.selectOptions(screen.getByLabelText(/Water system/), "cooling-tower-east")
    await user.selectOptions(screen.getByLabelText(/Technician/), "jordan-lee")
    await user.click(screen.getByRole("button", { name: /Continue to measurements/ }))
    expect(await screen.findByRole("heading", { name: "Review extracted measurements" }, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getAllByDisplayValue("Cooling Tower East").length).toBeGreaterThan(0)
  })

  it("validates report context and moves focus to the error summary", async () => {
    const user = userEvent.setup(); open("/reports/new")
    await user.click(await screen.findByRole("button", { name: /Enter manually/ }))
    await user.click(await screen.findByRole("button", { name: /Continue to measurements/ }))
    const summary = await screen.findByRole("alert")
    expect(summary).toHaveTextContent("Select a customer.")
    await waitFor(() => expect(summary).toHaveFocus())
  })

  it("guards in-app navigation while report changes are unsaved", async () => {
    const user = userEvent.setup(); open("/reports/new")
    await user.click(await screen.findByRole("button", { name: /Enter manually/ }))
    await screen.findByRole("heading", { name: "Report information" })
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    await user.click(screen.getAllByRole("link", { name: "Overview" })[0])
    expect(window.location.pathname).toBe("/reports/new")
    confirm.mockReturnValue(true)
    await user.click(screen.getAllByRole("link", { name: "Overview" })[0])
    expect(await screen.findByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument()
    confirm.mockRestore()
  })

  it("localizes the new report workflow in Hebrew", async () => {
    const user = userEvent.setup(); open("/reports/new")
    expect(await screen.findByRole("heading", { name: "Add report" })).toBeInTheDocument()
    await user.click(screen.getAllByRole("button", { name: "Switch to Hebrew" })[0])
    expect(await screen.findByRole("heading", { name: "הוספת דוח" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /הזנה ידנית/ }))
    expect(await screen.findByRole("heading", { name: "פרטי הדוח" })).toBeInTheDocument()
    expect(screen.getByLabelText(/לקוח/)).toBeInTheDocument()
  })

  it("opens a finding, records a decision, and reopens it", async () => {
    const user = userEvent.setup(); open("/findings")
    expect(await screen.findByRole("heading", { name: "Review Queue" })).toBeInTheDocument()
    await user.click(screen.getAllByRole("link").find((link) => link.getAttribute("href")?.startsWith("/findings/"))!)
    expect(await screen.findByRole("button", { name: "Accept finding" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Accept finding" }))
    expect(screen.getByRole("button", { name: "Accepted now" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Reopen for review" }))
    expect(screen.getByRole("button", { name: "Accept finding" })).toBeEnabled()
  })

  it("accepts assistant text and performs no network work", async () => {
    const user = userEvent.setup(); open("/")
    await user.click(await screen.findByRole("button", { name: "Ask WaterOps" }))
    await user.type(screen.getByLabelText("Ask WaterOps a question"), "What needs review?")
    await user.click(screen.getByRole("button", { name: "Send question" }))
    expect(await screen.findByText(/No API key configured yet/)).toBeInTheDocument()
  })

  it("has no structural accessibility violations on the queue", async () => {
    const { container } = open("/findings")
    await screen.findByRole("heading", { name: "Review Queue" })
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })

  it("has no structural accessibility violations on report entry", async () => {
    const user = userEvent.setup()
    const { container } = open("/reports/new")
    await user.click(await screen.findByRole("button", { name: /Enter manually/ }))
    await screen.findByRole("heading", { name: "Report information" })
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })

  it("redirects the former login route to the workspace", async () => {
    open("/login")
    expect(await screen.findByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument()
  })
})
