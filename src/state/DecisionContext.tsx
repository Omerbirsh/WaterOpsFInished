import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { evaluateCompanyFindings } from "../lib/findings"
import { statusLabels } from "../lib/format"
import type { Finding, FindingDecisionMap, FindingStatus } from "../types"
import { useWorkspace } from "./WorkspaceContext"

export const DECISION_STORAGE_KEY = "waterops.finding-decisions.v1"

interface Notification {
  id: number
  message: string
}

interface DecisionContextValue {
  findings: Finding[]
  notification: Notification | null
  setStatus: (findingId: string, status: FindingStatus) => void
}

const DecisionContext = createContext<DecisionContextValue | null>(null)

function loadDecisions(): FindingDecisionMap {
  try {
    const value = window.localStorage.getItem(DECISION_STORAGE_KEY)
    if (!value) return {}
    const parsed = JSON.parse(value) as FindingDecisionMap
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function DecisionProvider({ children }: { children: ReactNode }) {
  const { company } = useWorkspace()
  const [decisions, setDecisions] = useState<FindingDecisionMap>(loadDecisions)
  const [notification, setNotification] = useState<Notification | null>(null)
  const notificationTimer = useRef<number | undefined>(undefined)

  const notify = useCallback((message: string) => {
    window.clearTimeout(notificationTimer.current)
    setNotification({ id: Date.now(), message })
    notificationTimer.current = window.setTimeout(() => setNotification(null), 3200)
  }, [])

  const persist = useCallback((next: FindingDecisionMap) => {
    setDecisions(next)
    window.localStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(next))
  }, [])

  const setStatus = useCallback(
    (findingId: string, status: FindingStatus) => {
      persist({
        ...decisions,
        [findingId]: { status, updatedAt: new Date().toISOString() },
      })
      notify(`Finding status updated to ${statusLabels[status]}.`)
    },
    [decisions, notify, persist],
  )

  const findings = useMemo(
    () =>
      evaluateCompanyFindings(company).map((finding) => ({
        ...finding,
        status: decisions[finding.id]?.status ?? "needs_review",
      })),
    [company, decisions],
  )

  return (
    <DecisionContext.Provider value={{ findings, notification, setStatus }}>
      {children}
    </DecisionContext.Provider>
  )
}

export function useDecisions() {
  const value = useContext(DecisionContext)
  if (!value) throw new Error("useDecisions must be used inside DecisionProvider")
  return value
}
