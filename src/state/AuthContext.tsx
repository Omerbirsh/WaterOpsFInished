import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

export const AUTH_STORAGE_KEY = "waterops.auth-session.v1"

interface AuthSession {
  username: "demo"
  authenticatedAt: string
}

interface AuthContextValue {
  session: AuthSession | null
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): AuthSession | null {
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as Partial<AuthSession>
    return parsed.username === "demo" && typeof parsed.authenticatedAt === "string"
      ? { username: "demo", authenticatedAt: parsed.authenticatedAt }
      : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession)

  const signIn = useCallback(async (username: string, password: string) => {
    await new Promise((resolve) => window.setTimeout(resolve, 360))
    if (username.trim() !== "demo" || password !== "demo") return false
    const next: AuthSession = { username: "demo", authenticatedAt: new Date().toISOString() }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    return true
  }, [])

  const signOut = useCallback(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
