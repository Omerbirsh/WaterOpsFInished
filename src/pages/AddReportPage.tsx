import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  FileArrowUp,
  FilePdf,
  PencilSimpleLine,
  Plus,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  useEffect,
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { RippleButton } from "../components/animate-ui/RippleButton"
import { Shine } from "../components/animate-ui/Shine"
import { Button } from "../components/ui/Button"
import { PageHeader } from "../components/WorkspaceComponents"
import {
  blankMeasurementDraft,
  isDraftOutsideRange,
  measurementDraftsForSystem,
  type ReportMeasurementDraft,
} from "../lib/reportCapture"
import { useLanguage } from "../state/LanguageContext"
import { useWorkspace } from "../state/WorkspaceContext"
import type { ReportCaptureMethod } from "../types"

type Stage = "method" | "details" | "measurements" | "review"
type ErrorMap = Record<string, string>

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-rose-100"
const textareaClass = "min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"

const progressSteps: Array<{ stage: Stage; label: string }> = [
  { stage: "method", label: "Method" },
  { stage: "details", label: "Report information" },
  { stage: "measurements", label: "Measurements" },
  { stage: "review", label: "Review" },
]

function today() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function AddReportPage() {
  const { company, saveCapturedReport } = useWorkspace()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage>("method")
  const [method, setMethod] = useState<ReportCaptureMethod | null>(null)
  const [customerId, setCustomerId] = useState("")
  const [systemId, setSystemId] = useState("")
  const [technicianId, setTechnicianId] = useState("")
  const [serviceDate, setServiceDate] = useState(today)
  const [title, setTitle] = useState("Water Treatment Service Report")
  const [pageCount, setPageCount] = useState("1")
  const [observations, setObservations] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [measurements, setMeasurements] = useState<ReportMeasurementDraft[]>([])
  const [errors, setErrors] = useState<ErrorMap>({})
  const [processingStep, setProcessingStep] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)

  const customer = company.customers.find((item) => item.id === customerId)
  const systems = customer?.systems ?? []
  const system = systems.find((item) => item.id === systemId)
  const technician = company.users.find((item) => item.id === technicianId)
  const currentStep = progressSteps.findIndex((item) => item.stage === stage)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  useEffect(() => {
    if (!dirty) return
    const interceptNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank") return
      const destination = new URL(target.href, window.location.href)
      if (destination.origin !== window.location.origin || `${destination.pathname}${destination.search}` === `${location.pathname}${location.search}`) return
      const message = language === "he" ? "לבטל את השינויים בדוח הזה?" : "Discard the changes to this report?"
      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener("click", interceptNavigation, true)
    return () => document.removeEventListener("click", interceptNavigation, true)
  }, [dirty, language, location.pathname, location.search])

  const confirmDiscard = () => !dirty || window.confirm(language === "he" ? "לבטל את השינויים בדוח הזה?" : "Discard the changes to this report?")

  const setField = (key: string, value: string, setter: (value: string) => void) => {
    setter(value)
    setDirty(true)
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const showErrors = (next: ErrorMap) => {
    setErrors(next)
    window.requestAnimationFrame(() => errorSummaryRef.current?.focus())
  }

  const validateDetails = () => {
    const next: ErrorMap = {}
    if (!customerId) next.customerId = "Select a customer."
    if (!systemId) next.systemId = "Select a water system."
    if (!technicianId) next.technicianId = "Select a technician."
    if (!serviceDate || Number.isNaN(Date.parse(`${serviceDate}T00:00:00`))) next.serviceDate = "Enter a valid service date."
    if (!title.trim()) next.title = "Enter a report title."
    const pages = Number(pageCount)
    if (!Number.isInteger(pages) || pages < 1 || pages > 99) next.pageCount = "Enter a page count from 1 to 99."
    if (method === "upload" && !file) next.file = "Select a PDF report."
    return next
  }

  const validateDetailField = (key: string) => {
    const message = validateDetails()[key]
    setErrors((current) => {
      const next = { ...current }
      if (message) next[key] = message
      else delete next[key]
      return next
    })
  }

  const validateMeasurements = () => {
    const next: ErrorMap = {}
    if (!measurements.length) next.measurements = "Add at least one measurement."
    const combinations = new Map<string, number>()
    measurements.forEach((measurement) => {
      const prefix = measurement.id
      if (!measurement.parameterName.trim()) next[`${prefix}.parameterName`] = "Enter a parameter name."
      if (!measurement.value.trim() || !Number.isFinite(Number(measurement.value))) next[`${prefix}.value`] = "Enter a numeric result."
      const hasMinimum = Boolean(measurement.minimum.trim())
      const hasMaximum = Boolean(measurement.maximum.trim())
      if (hasMinimum !== hasMaximum) {
        next[`${prefix}.minimum`] = "Enter both range limits or leave both empty."
        next[`${prefix}.maximum`] = "Enter both range limits or leave both empty."
      } else if (hasMinimum && hasMaximum) {
        if (!Number.isFinite(Number(measurement.minimum))) next[`${prefix}.minimum`] = "Enter a numeric minimum."
        if (!Number.isFinite(Number(measurement.maximum))) next[`${prefix}.maximum`] = "Enter a numeric maximum."
        if (Number(measurement.minimum) > Number(measurement.maximum)) next[`${prefix}.maximum`] = "Maximum must be greater than or equal to minimum."
      }
      const combination = `${measurement.parameterName.trim().toLowerCase()}::${measurement.samplePoint.trim().toLowerCase()}`
      if (measurement.parameterName.trim()) combinations.set(combination, (combinations.get(combination) ?? 0) + 1)
    })
    measurements.forEach((measurement) => {
      const combination = `${measurement.parameterName.trim().toLowerCase()}::${measurement.samplePoint.trim().toLowerCase()}`
      if ((combinations.get(combination) ?? 0) > 1) next[`${measurement.id}.parameterName`] = "Use a unique parameter and sampling point combination."
    })
    return next
  }

  const validateMeasurementField = (measurementId: string, field: keyof ReportMeasurementDraft) => {
    const key = `${measurementId}.${field}`
    const message = validateMeasurements()[key]
    setErrors((current) => {
      const next = { ...current }
      if (message) next[key] = message
      else delete next[key]
      return next
    })
  }

  const selectMethod = (nextMethod: ReportCaptureMethod) => {
    if (method && method !== nextMethod && !confirmDiscard()) return
    setMethod(nextMethod)
    setFile(null)
    setMeasurements([])
    setPageCount(nextMethod === "upload" ? "2" : "1")
    setErrors({})
    setDirty(true)
    setStage("details")
  }

  const changeMethod = () => {
    if (!confirmDiscard()) return
    setMethod(null)
    setCustomerId("")
    setSystemId("")
    setTechnicianId("")
    setServiceDate(today())
    setTitle("Water Treatment Service Report")
    setPageCount("1")
    setObservations("")
    setFile(null)
    setMeasurements([])
    setErrors({})
    setDirty(false)
    setStage("method")
  }

  const acceptFile = (selected: File | undefined) => {
    if (!selected) return
    const isPdf = selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      setFile(null)
      setErrors((current) => ({ ...current, file: "Choose a PDF file." }))
      return
    }
    if (selected.size === 0) {
      setFile(null)
      setErrors((current) => ({ ...current, file: "Choose a nonempty PDF file." }))
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null)
      setErrors((current) => ({ ...current, file: "Choose a PDF smaller than 10 MB." }))
      return
    }
    setFile(selected)
    setDirty(true)
    setErrors((current) => {
      const next = { ...current }
      delete next.file
      return next
    })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0])
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    acceptFile(event.dataTransfer.files?.[0])
  }

  const prepareMeasurements = () => {
    if (!system) return
    if (!measurements.length) setMeasurements(measurementDraftsForSystem(system, method === "upload"))
  }

  const continueFromDetails = async (event: FormEvent) => {
    event.preventDefault()
    const next = validateDetails()
    if (Object.keys(next).length) return showErrors(next)
    setErrors({})
    if (method === "upload") {
      const timings = reducedMotion ? [0, 0, 0] : [420, 520, 380]
      for (let index = 0; index < timings.length; index += 1) {
        setProcessingStep(index)
        if (timings[index]) await delay(timings[index])
      }
      prepareMeasurements()
      setProcessingStep(null)
      setStage("measurements")
      return
    }
    prepareMeasurements()
    setStage("measurements")
  }

  const updateMeasurement = (id: string, field: keyof ReportMeasurementDraft, value: string) => {
    setMeasurements((current) => current.map((measurement) => measurement.id === id ? { ...measurement, [field]: value } : measurement))
    setDirty(true)
    setErrors((current) => {
      const key = `${id}.${field}`
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const continueToReview = (event: FormEvent) => {
    event.preventDefault()
    const next = validateMeasurements()
    if (Object.keys(next).length) return showErrors(next)
    setErrors({})
    setStage("review")
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  }

  const saveReport = () => {
    if (!method) return
    const result = saveCapturedReport({
      captureMethod: method,
      title,
      fileName: method === "upload" ? file?.name : undefined,
      fileSize: method === "upload" ? file?.size : undefined,
      customerId,
      systemId,
      technicianId,
      serviceDate,
      pageCount: Number(pageCount),
      observations,
      measurements: measurements.map((measurement) => ({
        id: measurement.id,
        parameterName: measurement.parameterName,
        samplePoint: measurement.samplePoint,
        unit: measurement.unit,
        value: Number(measurement.value),
        minimum: measurement.minimum ? Number(measurement.minimum) : undefined,
        maximum: measurement.maximum ? Number(measurement.maximum) : undefined,
        technicianNote: measurement.technicianNote,
        action: measurement.action || undefined,
      })),
    })
    if (!result.ok || !result.id) return showErrors({ save: result.error ?? "Unable to add the report." })
    setDirty(false)
    navigate(`/reports/${result.id}`)
  }

  const exit = () => {
    if (confirmDiscard()) navigate("/reports")
  }

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-24 lg:pt-9">
      <button onClick={exit} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/25">
        <ArrowLeft size={17} weight="bold" className="rtl:rotate-180" aria-hidden="true" />Source Reports
      </button>
      <PageHeader
        eyebrow="Evidence library"
        title="Add report"
        description="Capture a service report and confirm its structured measurements."
        actions={method ? <Button variant="secondary" onClick={changeMethod}>Change method</Button> : undefined}
      />

      <Progress currentStep={currentStep} />
      {Object.keys(errors).length ? <ErrorSummary ref={errorSummaryRef} errors={errors} /> : null}

      <AnimatePresence mode="wait" initial={false}>
        {stage === "method" ? (
          <motion.section key="method" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-7" aria-labelledby="method-title">
            <div className="mb-5"><h2 id="method-title" className="text-xl font-bold tracking-[-0.03em] text-slate-950">How would you like to add this report?</h2><p className="mt-1 text-sm text-slate-600">Choose an entry method to begin.</p></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <MethodCard icon={<PencilSimpleLine size={28} weight="duotone" />} title="Enter manually" description="Enter report information, measurements, configured ranges, notes, and recorded actions." onClick={() => selectMethod("manual")} />
              <MethodCard icon={<FileArrowUp size={28} weight="duotone" />} title="Upload report" description="Select a PDF, review the structured fields, and confirm the report record." onClick={() => selectMethod("upload")} />
            </div>
          </motion.section>
        ) : null}

        {stage === "details" && processingStep === null ? (
          <motion.form key="details" onSubmit={continueFromDetails} noValidate initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="mt-7 space-y-5">
            {method === "upload" ? <UploadField file={file} error={errors.file} onFile={handleFileChange} onDrop={handleDrop} onRemove={() => { setFile(null); setDirty(true) }} /> : null}
            <section className="card-surface rounded-3xl p-5 sm:p-6" aria-labelledby="report-information-title">
              <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Report context</p><h2 id="report-information-title" className="mt-1 text-xl font-bold text-slate-950">Report information</h2></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Customer" id="customerId" error={errors.customerId} required>
                  <select id="customerId" value={customerId} onChange={(event) => { setField("customerId", event.target.value, setCustomerId); setSystemId(""); setMeasurements([]) }} onBlur={() => validateDetailField("customerId")} aria-invalid={Boolean(errors.customerId)} aria-describedby={errors.customerId ? "customerId-error" : undefined} className={inputClass}>
                    <option value="">Select customer</option>{company.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Water system" id="systemId" error={errors.systemId} required>
                  <select id="systemId" value={systemId} disabled={!customerId} onChange={(event) => { setField("systemId", event.target.value, setSystemId); setMeasurements([]) }} onBlur={() => validateDetailField("systemId")} aria-invalid={Boolean(errors.systemId)} aria-describedby={errors.systemId ? "systemId-error" : undefined} className={inputClass}>
                    <option value="">Select water system</option>{systems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Technician" id="technicianId" error={errors.technicianId} required>
                  <select id="technicianId" value={technicianId} onChange={(event) => setField("technicianId", event.target.value, setTechnicianId)} onBlur={() => validateDetailField("technicianId")} aria-invalid={Boolean(errors.technicianId)} aria-describedby={errors.technicianId ? "technicianId-error" : undefined} className={inputClass}>
                    <option value="">Select technician</option>{company.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Service date" id="serviceDate" error={errors.serviceDate} required>
                  <input id="serviceDate" type="date" value={serviceDate} onChange={(event) => setField("serviceDate", event.target.value, setServiceDate)} onBlur={() => validateDetailField("serviceDate")} aria-invalid={Boolean(errors.serviceDate)} aria-describedby={errors.serviceDate ? "serviceDate-error" : undefined} className={inputClass} />
                </Field>
                <Field label="Report title" id="title" error={errors.title} required className="xl:col-span-2">
                  <input id="title" value={title} onChange={(event) => setField("title", event.target.value, setTitle)} onBlur={() => validateDetailField("title")} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} className={inputClass} />
                </Field>
                <Field label="Page count" id="pageCount" error={errors.pageCount} required>
                  <input id="pageCount" type="number" min="1" max="99" inputMode="numeric" value={pageCount} onChange={(event) => setField("pageCount", event.target.value, setPageCount)} onBlur={() => validateDetailField("pageCount")} aria-invalid={Boolean(errors.pageCount)} aria-describedby={errors.pageCount ? "pageCount-error" : undefined} className={inputClass} />
                </Field>
                <Field label="General observations" id="observations" className="md:col-span-2 xl:col-span-3">
                  <textarea id="observations" value={observations} onChange={(event) => setField("observations", event.target.value, setObservations)} placeholder="Add service observations from the report" className={textareaClass} />
                </Field>
              </div>
            </section>
            <FooterActions onCancel={exit}><RippleButton type="submit">Continue to measurements <ArrowRight size={17} weight="bold" className="rtl:rotate-180" aria-hidden="true" /></RippleButton></FooterActions>
          </motion.form>
        ) : null}

        {stage === "details" && processingStep !== null ? <ProcessingPanel key="processing" step={processingStep} fileName={file?.name ?? "report.pdf"} /> : null}

        {stage === "measurements" ? (
          <motion.form key="measurements" onSubmit={continueToReview} noValidate initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="mt-7 space-y-5">
            <section className="card-surface overflow-hidden rounded-3xl" aria-labelledby="measurement-title">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Structured record</p><h2 id="measurement-title" className="mt-1 text-xl font-bold text-slate-950">{method === "upload" ? "Review extracted measurements" : "Enter measurements"}</h2><p className="mt-1 text-sm text-slate-600">Confirm each result and its configured range before continuing.</p></div><Button variant="secondary" onClick={() => { setMeasurements((current) => [...current, blankMeasurementDraft(system?.name ?? "")]); setDirty(true) }}><Plus size={17} weight="bold" aria-hidden="true" />Add measurement</Button></div>
              {measurements.length ? <MeasurementEditor measurements={measurements} errors={errors} update={updateMeasurement} remove={(id) => { setMeasurements((current) => current.filter((item) => item.id !== id)); setDirty(true) }} onBlur={validateMeasurementField} /> : <div className="p-8 text-center"><p className="text-sm font-semibold text-slate-700">No measurements added.</p><Button className="mt-4" variant="secondary" onClick={() => setMeasurements([blankMeasurementDraft(system?.name ?? "")])}><Plus size={17} />Add measurement</Button></div>}
            </section>
            <FooterActions onCancel={() => { setErrors({}); setStage("details") }} cancelLabel="Back"><RippleButton type="submit">Review report <ArrowRight size={17} weight="bold" className="rtl:rotate-180" aria-hidden="true" /></RippleButton></FooterActions>
          </motion.form>
        ) : null}

        {stage === "review" ? (
          <motion.div key="review" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="mt-7 space-y-5">
            <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
              <div className="card-surface rounded-3xl p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Report summary</p><h2 className="mt-1 text-xl font-bold text-slate-950">Ready to add</h2><dl className="mt-5 space-y-4 text-sm"><ReviewItem label="Customer" value={customer?.name ?? "—"} /><ReviewItem label="Water system" value={system?.name ?? "—"} /><ReviewItem label="Technician" value={technician?.name ?? "—"} /><ReviewItem label="Service date" value={new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${serviceDate}T00:00:00Z`))} /><ReviewItem label="Entry method" value={method === "upload" ? "PDF upload" : "Manual entry"} />{file ? <ReviewItem label="Source file" value={file.name} /> : null}<ReviewItem label="Pages" value={pageCount} /></dl></div>
              <div className="card-surface rounded-3xl p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Measurements</p><h2 className="mt-1 text-xl font-bold text-slate-950">{measurements.length} recorded results</h2></div><CheckCircle size={28} weight="duotone" className="text-teal-700" aria-hidden="true" /></div><div className="mt-5 space-y-3">{measurements.map((measurement) => <ReviewMeasurement key={measurement.id} measurement={measurement} />)}</div>{observations ? <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">General observations</p><p className="mt-2 text-sm leading-6 text-slate-700">{observations}</p></div> : null}</div>
            </section>
            <FooterActions onCancel={() => { setErrors({}); setStage("measurements") }} cancelLabel="Back"><RippleButton onClick={saveReport}><Check size={17} weight="bold" aria-hidden="true" />Add report</RippleButton></FooterActions>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Progress({ currentStep }: { currentStep: number }) {
  return <nav aria-label="Report progress" className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm sm:px-5"><ol className="grid grid-cols-4 gap-1">{progressSteps.map((item, index) => { const complete = index < currentStep; const active = index === currentStep; return <li key={item.stage} aria-current={active ? "step" : undefined} className="relative text-center"><div className="relative flex items-center"><span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : complete || active ? "bg-blue-300" : "bg-slate-200"}`} /><span className={`numeric grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${complete ? "border-blue-600 bg-blue-600 text-white" : active ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50" : "border-slate-200 bg-white text-slate-400"}`}>{complete ? <Check size={14} weight="bold" aria-hidden="true" /> : index + 1}</span><span className={`h-px flex-1 ${index === progressSteps.length - 1 ? "bg-transparent" : complete ? "bg-blue-300" : "bg-slate-200"}`} /></div><span className={`mt-2 block text-[10px] font-semibold sm:text-xs ${active ? "text-blue-700" : complete ? "text-slate-700" : "text-slate-400"}`}>{item.label}</span></li> })}</ol></nav>
}

function MethodCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <motion.button type="button" onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }} className="group relative min-h-52 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-card outline-none transition hover:border-blue-300 hover:shadow-lift focus-visible:ring-3 focus-visible:ring-blue-500/25 motion-reduce:transform-none"><span className="absolute inset-y-0 left-0 w-1 bg-blue-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" /><span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">{icon}</span><span className="mt-6 flex items-center justify-between gap-4"><span><span className="block text-xl font-bold text-slate-950">{title}</span><span className="mt-2 block max-w-lg text-sm leading-6 text-slate-600">{description}</span></span><ArrowRight size={22} weight="bold" className="shrink-0 text-blue-600 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></span></motion.button>
}

function Field({ label, id, error, required, className = "", children }: { label: string; id: string; error?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <div className={className}><label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700">{label}{required ? <><span className="text-blue-700" aria-hidden="true"> *</span><span className="sr-only"> required</span></> : null}</label>{children}{error ? <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-rose-700">{error}</p> : null}</div>
}

function UploadField({ file, error, onFile, onDrop, onRemove }: { file: File | null; error?: string; onFile: (event: ChangeEvent<HTMLInputElement>) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void; onRemove: () => void }) {
  return <section className="card-surface rounded-3xl p-5 sm:p-6" aria-labelledby="upload-title"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Source document</p><h2 id="upload-title" className="mt-1 text-xl font-bold text-slate-950">Upload report PDF</h2></div>{file ? <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:flex-row sm:items-center"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><FilePdf size={24} weight="duotone" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-950">{file.name}</span><span className="numeric mt-1 block text-xs text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</span></span><Button variant="secondary" onClick={onRemove}>Replace file</Button></div> : <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className={`mt-5 rounded-2xl border-2 border-dashed p-7 text-center transition ${error ? "border-rose-300 bg-rose-50/40" : "border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/40"}`}><input id="report-file" type="file" accept="application/pdf,.pdf" onChange={onFile} className="sr-only" aria-invalid={Boolean(error)} aria-describedby={error ? "file-error" : "file-help"} /><label htmlFor="report-file" className="mx-auto flex min-h-28 max-w-md cursor-pointer flex-col items-center justify-center rounded-xl focus-within:ring-3 focus-within:ring-blue-500/25"><span className="grid size-12 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm"><UploadSimple size={24} weight="bold" aria-hidden="true" /></span><span className="mt-3 text-sm font-bold text-slate-950">Choose a PDF or drag it here</span><span id="file-help" className="mt-1 text-xs text-slate-600">One PDF file, up to 10 MB</span></label></div>}{error ? <p id="file-error" className="mt-2 text-xs font-semibold text-rose-700">{error}</p> : null}</section>
}

function ProcessingPanel({ step, fileName }: { step: number; fileName: string }) {
  const labels = ["Reading report", "Structuring measurements", "Ready for review"]
  return <motion.section key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-surface mt-7 overflow-hidden rounded-3xl p-6 sm:p-9" aria-live="polite"><div className="mx-auto max-w-xl text-center"><Shine duration={800} className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FilePdf size={30} weight="duotone" aria-hidden="true" /></Shine><p className="mt-5 truncate text-sm font-bold text-slate-950">{fileName}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">{labels[step]}</h2><div className="mx-auto mt-6 h-1.5 max-w-sm overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" animate={{ width: `${((step + 1) / labels.length) * 100}%` }} transition={{ duration: 0.3, ease: "easeOut" }} /></div><ol className="mt-6 grid grid-cols-3 gap-2">{labels.map((label, index) => <li key={label} className={`text-[10px] font-semibold sm:text-xs ${index <= step ? "text-blue-700" : "text-slate-400"}`}>{index < step ? <CheckCircle size={16} weight="fill" className="mx-auto mb-1 text-teal-600" aria-hidden="true" /> : <span className={`numeric mx-auto mb-1 grid size-4 place-items-center rounded-full text-[9px] ${index === step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>{index + 1}</span>}{label}</li>)}</ol></div></motion.section>
}

function MeasurementEditor({ measurements, errors, update, remove, onBlur }: { measurements: ReportMeasurementDraft[]; errors: ErrorMap; update: (id: string, field: keyof ReportMeasurementDraft, value: string) => void; remove: (id: string) => void; onBlur: (id: string, field: keyof ReportMeasurementDraft) => void }) {
  return <div className="p-4 sm:p-5"><div className="hidden overflow-x-auto xl:block"><table className="w-full min-w-[1100px] border-separate border-spacing-y-2 text-left"><thead><tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"><th className="px-2 pb-1">Parameter</th><th className="px-2 pb-1">Sampling point</th><th className="px-2 pb-1">Result</th><th className="px-2 pb-1">Unit</th><th className="px-2 pb-1">Minimum</th><th className="px-2 pb-1">Maximum</th><th className="px-2 pb-1">Technician note</th><th className="px-2 pb-1">Recorded action</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{measurements.map((measurement, index) => <MeasurementTableRow key={measurement.id} index={index} measurement={measurement} errors={errors} update={update} remove={remove} onBlur={onBlur} />)}</tbody></table></div><div className="space-y-4 xl:hidden">{measurements.map((measurement, index) => <MeasurementCard key={measurement.id} index={index} measurement={measurement} errors={errors} update={update} remove={remove} onBlur={onBlur} />)}</div></div>
}

function MeasurementTableRow({ measurement, index, errors, update, remove, onBlur }: MeasurementRowProps) {
  const fields: Array<keyof ReportMeasurementDraft> = ["parameterName", "samplePoint", "value", "unit", "minimum", "maximum", "technicianNote", "action"]
  return <tr className="align-top">{fields.map((field) => { const error = errors[`${measurement.id}.${field}`]; const numeric = ["value", "minimum", "maximum"].includes(field); const id = `table-${measurement.id}-${field}`; return <td key={field} className="px-1"><label className="sr-only" htmlFor={id}>{`${fieldLabel(field)} for measurement ${index + 1}`}</label>{field === "technicianNote" || field === "action" ? <textarea id={id} value={measurement[field]} onChange={(event) => update(measurement.id, field, event.target.value)} className="min-h-11 w-40 resize-y rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15" /> : <input id={id} type={numeric ? "number" : "text"} step="any" value={measurement[field]} onChange={(event) => update(measurement.id, field, event.target.value)} onBlur={() => onBlur(measurement.id, field)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`h-11 rounded-xl border border-slate-200 px-2.5 text-xs outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 ${field === "parameterName" || field === "samplePoint" ? "w-36" : "w-24"} ${error ? "border-rose-400" : ""}`} />}{error ? <p id={`${id}-error`} className="mt-1 max-w-36 text-[10px] font-semibold leading-4 text-rose-700">{error}</p> : null}</td> })}<td className="px-1"><Button size="icon" variant="ghost" aria-label={`Remove measurement ${index + 1}`} onClick={() => remove(measurement.id)}><Trash size={17} aria-hidden="true" /></Button></td></tr>
}

function MeasurementCard({ measurement, index, errors, update, remove, onBlur }: MeasurementRowProps) {
  return <fieldset className="rounded-2xl border border-slate-200 bg-white p-4"><legend className="sr-only">Measurement {index + 1}</legend><div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-slate-950">Measurement {index + 1}</p><Button size="icon" variant="ghost" aria-label={`Remove measurement ${index + 1}`} onClick={() => remove(measurement.id)}><Trash size={17} aria-hidden="true" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><DraftField field="parameterName" measurement={measurement} error={errors[`${measurement.id}.parameterName`]} update={update} onBlur={onBlur} /><DraftField field="samplePoint" measurement={measurement} error={errors[`${measurement.id}.samplePoint`]} update={update} onBlur={onBlur} /><DraftField field="value" measurement={measurement} error={errors[`${measurement.id}.value`]} update={update} onBlur={onBlur} /><DraftField field="unit" measurement={measurement} error={errors[`${measurement.id}.unit`]} update={update} onBlur={onBlur} /><DraftField field="minimum" measurement={measurement} error={errors[`${measurement.id}.minimum`]} update={update} onBlur={onBlur} /><DraftField field="maximum" measurement={measurement} error={errors[`${measurement.id}.maximum`]} update={update} onBlur={onBlur} /><DraftField field="technicianNote" measurement={measurement} error={errors[`${measurement.id}.technicianNote`]} update={update} onBlur={onBlur} className="sm:col-span-2" /><DraftField field="action" measurement={measurement} error={errors[`${measurement.id}.action`]} update={update} onBlur={onBlur} className="sm:col-span-2" /></div></fieldset>
}

interface MeasurementRowProps { measurement: ReportMeasurementDraft; index: number; errors: ErrorMap; update: (id: string, field: keyof ReportMeasurementDraft, value: string) => void; remove: (id: string) => void; onBlur: (id: string, field: keyof ReportMeasurementDraft) => void }

function DraftField({ field, measurement, error, update, onBlur, className = "" }: { field: keyof ReportMeasurementDraft; measurement: ReportMeasurementDraft; error?: string; update: MeasurementRowProps["update"]; onBlur: MeasurementRowProps["onBlur"]; className?: string }) {
  const numeric = ["value", "minimum", "maximum"].includes(field)
  const multiline = field === "technicianNote" || field === "action"
  const id = `card-${measurement.id}-${field}`
  return <Field id={id} label={fieldLabel(field)} error={error} required={field === "parameterName" || field === "value"} className={className}>{multiline ? <textarea id={id} value={measurement[field]} onChange={(event) => update(measurement.id, field, event.target.value)} className={textareaClass} /> : <input id={id} type={numeric ? "number" : "text"} step="any" value={measurement[field]} onChange={(event) => update(measurement.id, field, event.target.value)} onBlur={() => onBlur(measurement.id, field)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} />}</Field>
}

function fieldLabel(field: keyof ReportMeasurementDraft) {
  const labels: Record<keyof ReportMeasurementDraft, string> = { id: "ID", parameterName: "Parameter", samplePoint: "Sampling point", unit: "Unit", value: "Result", minimum: "Minimum", maximum: "Maximum", technicianNote: "Technician note", action: "Recorded action" }
  return labels[field]
}

function FooterActions({ onCancel, cancelLabel = "Cancel", children }: { onCancel: () => void; cancelLabel?: string; children: React.ReactNode }) {
  return <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-end"><Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>{children}</div>
}

const ErrorSummary = forwardRef<HTMLDivElement, { errors: ErrorMap }>(({ errors }, ref) => {
  const unique = Array.from(new Set(Object.values(errors)))
  return <div ref={ref} role="alert" tabIndex={-1} className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 outline-none focus:ring-3 focus:ring-rose-200"><p className="text-sm font-bold text-rose-900">Check the highlighted fields</p><ul className="mt-2 list-disc space-y-1 ps-5 text-xs text-rose-800">{unique.map((error) => <li key={error}>{error}</li>)}</ul></div>
})

ErrorSummary.displayName = "ErrorSummary"

function ReviewItem({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 font-bold text-slate-900">{value}</dd></div> }

function ReviewMeasurement({ measurement }: { measurement: ReportMeasurementDraft }) {
  const hasRange = Boolean(measurement.minimum && measurement.maximum)
  const outside = isDraftOutsideRange(measurement)
  return <div className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-950">{measurement.parameterName}</p><p className="mt-1 text-xs text-slate-500">{measurement.samplePoint || "No sampling point"}</p></div><div className="text-end"><p className="numeric text-sm font-bold text-slate-950">{measurement.value}{measurement.unit ? ` ${measurement.unit}` : ""}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${!hasRange ? "bg-slate-100 text-slate-600" : outside ? "bg-amber-50 text-amber-900" : "bg-teal-50 text-teal-800"}`}>{!hasRange ? "No configured range" : outside ? "Outside range" : "In range"}</span></div></div>{hasRange ? <p className="numeric mt-3 text-xs text-slate-600">Configured range {measurement.minimum}–{measurement.maximum}{measurement.unit ? ` ${measurement.unit}` : ""}</p> : null}{measurement.technicianNote ? <p className="mt-2 text-xs leading-5 text-slate-600"><strong>Note:</strong> {measurement.technicianNote}</p> : null}{measurement.action ? <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900"><strong>Recorded action:</strong> {measurement.action}</p> : null}</div>
}
