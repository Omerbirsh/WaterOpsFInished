import { Buildings, CheckCircle, FileText, House, ListChecks, Sparkle, UsersThree, Waves, X } from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { lazy, Suspense, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "../lib/cn"
import { roleLabels } from "../lib/workspace"
import { useDecisions } from "../state/DecisionContext"
import { useWorkspace } from "../state/WorkspaceContext"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./animate-ui/Dialog"
import { LanguageToggle } from "./LanguageToggle"

const AssistantPanel = lazy(() => import("./AssistantPanel"))

const navigation = [
  { to: "/", label: "Overview", icon: House, end: true },
  { to: "/findings", label: "Review Queue", icon: ListChecks, end: false },
  { to: "/customers", label: "Customers", icon: Buildings, end: false },
  { to: "/reports", label: "Source Reports", icon: FileText, end: false },
  { to: "/team", label: "Team", icon: UsersThree, end: false },
]

function Brand() { return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.24)]"><Waves size={23} weight="bold" /></span><div><p className="text-[17px] font-bold tracking-[-0.03em] text-slate-950">WaterOps</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">AI service intelligence</p></div></div> }

function Navigation({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const { findings } = useDecisions()
  const count = findings.filter((finding) => finding.status === "needs_review").length
  return <nav aria-label={mobile ? "Mobile primary" : "Primary"} className="space-y-1.5">{navigation.map((item) => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({isActive}) => cn("relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/25", isActive ? "text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
    {({isActive}) => <>{isActive ? <motion.span layoutId={mobile ? "mobile-active-nav" : "desktop-active-nav"} className="absolute inset-0 rounded-xl border border-blue-100 bg-blue-50" transition={{type:"spring",stiffness:330,damping:30}} /> : null}<Icon className="relative" size={19} weight={isActive ? "fill" : "bold"} /><span className="relative flex-1">{item.label}</span>{item.to === "/findings" && count ? <span className="relative grid min-w-6 place-items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">{count}</span> : null}</>}
  </NavLink>})}</nav>
}

function Toast() {
  const { notification: decision } = useDecisions()
  const { notification: workspace } = useWorkspace()
  const notification = decision ?? workspace
  return <AnimatePresence>{notification ? <motion.div key={notification.id} role="status" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}} className="fixed bottom-20 left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-2xl lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"><CheckCircle size={18} weight="fill" className="text-teal-300" />{notification.message}</motion.div> : null}</AnimatePresence>
}

function UserPanel({ compact = false }: { compact?: boolean }) {
  const { company } = useWorkspace()
  const user = company.users.find((item) => item.id === "maya-chen") ?? company.users[0]
  if (!user) return null
  return <div className={cn("rounded-2xl border border-slate-200 bg-slate-50", compact ? "p-3" : "p-3.5")}><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-[10px] font-bold text-white">{user.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-950">{user.name}</p><p className="truncate text-[10px] text-slate-500">{roleLabels[user.role]}</p></div></div></div>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { company } = useWorkspace()
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className="min-h-screen bg-canvas text-slate-900"><a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white focus:translate-y-0">Skip to content</a>
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="absolute -right-40 -top-48 size-[34rem] rounded-full bg-blue-200/30 blur-3xl" /><div className="absolute -bottom-64 left-[16%] size-[32rem] rounded-full bg-cyan-100/40 blur-3xl" /></div>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl lg:flex"><Brand /><div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Current tenant</p><p className="mt-1 text-xs font-bold text-slate-900">{company.name}</p></div><div className="mt-5"><Navigation /></div><div className="mt-auto space-y-3"><div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 ps-3"><span className="text-xs font-semibold text-slate-600">Language</span><LanguageToggle /></div><UserPanel /></div></aside>
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-7xl items-center justify-between gap-2"><Brand /><div className="flex items-center gap-2"><LanguageToggle /><button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800"><span className="space-y-1"><span className="block h-0.5 w-5 bg-current" /><span className="block h-0.5 w-5 bg-current" /><span className="block h-0.5 w-5 bg-current" /></span></button></div></div></header>
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogContent side="right" showCloseButton={false} className="max-w-[330px]"><DialogTitle className="sr-only">Navigation</DialogTitle><DialogDescription className="sr-only">Navigate the WaterOps workspace</DialogDescription><div className="flex h-full flex-col p-5"><div className="flex items-center justify-between"><Brand /><button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><X size={20} weight="bold" /></button></div><div className="mt-7 rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Current tenant</p><p className="mt-1 text-xs font-bold text-slate-900">{company.name}</p></div><div className="mt-5"><Navigation mobile onNavigate={() => setMobileOpen(false)} /></div><div className="mt-auto"><UserPanel compact /></div></div></DialogContent></Dialog>
    <main id="main-content" tabIndex={-1} className="relative min-h-screen focus:outline-none lg:pl-[252px]"><motion.div key={location.pathname} initial={reducedMotion ? false : {opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:reducedMotion ? 0 : 0.2}}>{children}</motion.div></main>
    <Suspense fallback={null}><div data-assistant-wrapper><AssistantPanel /></div></Suspense><Toast />
  </div>
}
