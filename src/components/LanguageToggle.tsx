import { cn } from "../lib/cn"
import { useLanguage, type Language } from "../state/LanguageContext"

export function LanguageToggle({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { language, setLanguage } = useLanguage()
  const options: Array<{ value: Language; label: string; englishName: string }> = [
    { value: "en", label: "EN", englishName: "English" },
    { value: "he", label: "HE", englishName: "Hebrew" },
  ]

  return (
    <div
      className={cn(
        "inline-flex min-h-11 items-center rounded-xl border p-1",
        dark ? "border-white/15 bg-white/[0.06]" : "border-slate-200 bg-slate-100",
        className,
      )}
      role="group"
      aria-label="Choose language"
    >
      {options.map((option) => {
        const active = language === option.value
        return (
          <button
            key={option.value}
            type="button"
            lang={option.value}
            dir="ltr"
            aria-label={`Switch to ${option.englishName}`}
            aria-pressed={active}
            onClick={() => setLanguage(option.value)}
            className={cn(
              "grid min-h-9 min-w-10 cursor-pointer place-items-center rounded-lg px-2 text-[11px] font-bold tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/25",
              active
                ? dark ? "bg-white text-slate-950 shadow-sm" : "bg-white text-blue-800 shadow-sm"
                : dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
