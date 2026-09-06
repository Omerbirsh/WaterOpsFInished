import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react"

export type Language = "en" | "he"

export const LANGUAGE_STORAGE_KEY = "waterops.language.v1"

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function loadLanguage(): Language {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "he" ? "he" : "en"
  } catch {
    return "en"
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadLanguage)

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    } catch {
      // The selected language still applies for this session when storage is unavailable.
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === "he" ? "rtl" : "ltr"
    document.documentElement.dataset.language = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider")
  return value
}
