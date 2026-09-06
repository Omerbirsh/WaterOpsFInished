import {
  ArrowRight,
  CheckCircle,
  CircleNotch,
  Eye,
  EyeSlash,
  FileText,
  ListChecks,
  Waves,
} from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Effect } from "../components/animate-ui/Effect"
import { RippleButton } from "../components/animate-ui/RippleButton"
import { LanguageToggle } from "../components/LanguageToggle"
import { useAuth } from "../state/AuthContext"

const inputClass = "mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const returnTo = (location.state as { from?: string } | null)?.from ?? new URLSearchParams(location.search).get("returnTo") ?? undefined
    const data = new FormData(event.currentTarget)
    const username = String(data.get("username") ?? "")
    const password = String(data.get("password") ?? "")
    if (!username.trim() || !password) {
      setError("Enter your username and password.")
      return
    }
    setBusy(true)
    const accepted = await signIn(username, password)
    setBusy(false)
    if (!accepted) {
      setError("Incorrect username or password.")
      return
    }
    navigate(returnTo && returnTo !== "/login" ? returnTo : "/", { replace: true })
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(420px,0.82fr)_1.18fr]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute -left-24 top-12 size-72 rounded-full bg-blue-200/45 blur-3xl" aria-hidden="true" />
        <LanguageToggle className="absolute end-5 top-5 z-10 sm:end-8 sm:top-7" />
        <Effect blur slide className="relative w-full max-w-md">
          <div className="mb-9 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_28px_rgba(37,99,235,0.25)]"><Waves size={25} weight="bold" aria-hidden="true" /></span>
            <div><p className="text-xl font-bold tracking-[-0.035em] text-slate-950">WaterOps</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">AI service intelligence</p></div>
          </div>

          <div className="card-surface rounded-[28px] p-6 sm:p-8">
            <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to the ClearFlow Water Services workspace.</p>
            <form className="mt-7" onSubmit={submit} noValidate>
              <div>
                <label htmlFor="username" className="text-sm font-semibold text-slate-800">Username</label>
                <input id="username" name="username" autoComplete="username" autoCapitalize="none" className={inputClass} />
              </div>
              <div className="mt-5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-800">Password</label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute bottom-0 right-1 grid size-11 cursor-pointer place-items-center rounded-xl text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/20">{showPassword ? <EyeSlash size={19} weight="bold" aria-hidden="true" /> : <Eye size={19} weight="bold" aria-hidden="true" />}</button>
                </div>
              </div>
              {error ? <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900">{error}</p> : null}
              <RippleButton type="submit" disabled={busy} className="mt-6 w-full">
                {busy ? <CircleNotch className="animate-spin" size={19} weight="bold" aria-hidden="true" /> : null}
                {busy ? "Signing in…" : "Sign in"}
                {!busy ? <ArrowRight size={18} weight="bold" aria-hidden="true" /> : null}
              </RippleButton>
            </form>
            <p className="mt-5 text-center text-xs font-medium text-slate-600">Demo access · <span className="numeric font-bold text-slate-800">demo / demo</span></p>
          </div>
        </Effect>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:items-center lg:justify-center" aria-label="ClearFlow workspace snapshot">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-blue-500/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 left-8 size-96 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden="true" />
        <div className="relative w-full max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">ClearFlow Water Services</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Operations workspace</h2></div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-200"><CheckCircle size={15} weight="fill" aria-hidden="true" />Analysis complete</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[{ value: 3, label: "Customers" }, { value: 5, label: "Water systems" }, { value: 8, label: "Open findings" }, { value: 20, label: "Source reports" }].map((item, index) => (
              <motion.div key={item.label} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : 0.2 + index * 0.07 }} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"><p className="numeric text-2xl font-bold">{item.value}</p><p className="mt-1 text-xs text-slate-400">{item.label}</p></motion.div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
              <div className="flex items-center gap-2 text-cyan-300"><ListChecks size={18} weight="bold" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.13em]">Priority review</p></div>
              <div className="mt-4 space-y-3">{["Repeated conductivity readings", "Follow-up verification", "Boiler pH history"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-900/60 px-3 py-3"><span className="grid size-7 place-items-center rounded-lg bg-blue-400/10 text-[10px] font-bold text-blue-200">0{index + 1}</span><p className="text-sm font-semibold text-slate-200">{item}</p></div>)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
              <div className="flex items-center gap-2 text-blue-200"><FileText size={18} weight="bold" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.13em]">Recent reports</p></div>
              <div className="mt-5 space-y-4">{["SR-2026-020", "SR-2026-018", "SR-2026-015"].map((id) => <div key={id}><p className="numeric text-sm font-bold text-white">{id}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" initial={reducedMotion ? { width: "100%" } : { width: 0 }} animate={{ width: "100%" }} transition={{ duration: reducedMotion ? 0 : 0.7, delay: 0.35 }} /></div></div>)}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
