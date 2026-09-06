import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AppShell } from "./components/AppShell"
import { LocalizationBoundary } from "./components/LocalizationBoundary"
import { DecisionProvider } from "./state/DecisionContext"
import { LanguageProvider } from "./state/LanguageContext"
import { WorkspaceProvider } from "./state/WorkspaceContext"

const OverviewPage = lazy(() => import("./pages/OverviewPage").then((m) => ({ default: m.OverviewPage })))
const QueuePage = lazy(() => import("./pages/QueuePage").then((m) => ({ default: m.QueuePage })))
const FindingDetailsPage = lazy(() => import("./pages/FindingDetailsPage").then((m) => ({ default: m.FindingDetailsPage })))
const CustomersPage = lazy(() => import("./pages/CustomersPage").then((m) => ({ default: m.CustomersPage })))
const CustomerDetailsPage = lazy(() => import("./pages/CustomerDetailsPage").then((m) => ({ default: m.CustomerDetailsPage })))
const SystemDetailsPage = lazy(() => import("./pages/SystemDetailsPage").then((m) => ({ default: m.SystemDetailsPage })))
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })))
const AddReportPage = lazy(() => import("./pages/AddReportPage").then((m) => ({ default: m.AddReportPage })))
const ReportDetailsPage = lazy(() => import("./pages/ReportDetailsPage").then((m) => ({ default: m.ReportDetailsPage })))
const TeamPage = lazy(() => import("./pages/TeamPage").then((m) => ({ default: m.TeamPage })))

function Loading() { return <div className="grid min-h-[70vh] place-items-center"><div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="size-2 animate-pulse rounded-full bg-blue-600" />Loading workspace…</div></div> }

function WorkspaceRoutes() {
  const location = useLocation()
  return <WorkspaceProvider><DecisionProvider><AppShell><Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={<OverviewPage />} />
    <Route path="/findings" element={<QueuePage />} />
    <Route path="/findings/:findingId" element={<FindingDetailsPage />} />
    <Route path="/customers" element={<CustomersPage />} />
    <Route path="/customers/:customerId" element={<CustomerDetailsPage />} />
    <Route path="/customers/:customerId/systems/:systemId" element={<SystemDetailsPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/reports/new" element={<AddReportPage />} />
    <Route path="/reports/:reportId" element={<ReportDetailsPage />} />
    <Route path="/team" element={<TeamPage />} />
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AppShell></DecisionProvider></WorkspaceProvider>
}

export function App() {
  return (
    <LanguageProvider>
      <LocalizationBoundary>
        <BrowserRouter><WorkspaceRoutes /></BrowserRouter>
      </LocalizationBoundary>
    </LanguageProvider>
  )
}
