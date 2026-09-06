import { ArrowUp, ChatCircleDots, Sparkle } from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useRef, useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./animate-ui/Dialog"
import { Button } from "./ui/Button"

type Message = { id: number; role: "user" | "assistant"; text: string }

const suggestions = [
  "Which systems need manager review?",
  "Summarize recurring conductivity patterns",
  "Which customers have open follow-up?",
]

export default function AssistantPanel() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const launcherRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()

  const submitQuestion = (question: string) => {
    const value = question.trim()
    if (!value || thinking) return
    setMessages((items) => [...items, { id: Date.now(), role: "user", text: value }])
    setInput("")
    setThinking(true)
    window.setTimeout(() => {
      setMessages((items) => [...items, {
        id: Date.now() + 1,
        role: "assistant",
        text: "No API key configured yet. Connect a model provider to enable answers grounded in the ClearFlow workspace.",
      }])
      setThinking(false)
    }, reducedMotion ? 0 : 480)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitQuestion(input)
  }

  return (
    <>
      <motion.button
        data-assistant-launcher
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        className="fixed bottom-5 right-4 z-40 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-blue-500 bg-slate-950 px-4 text-sm font-bold text-white shadow-[0_14px_38px_rgba(15,23,42,0.28)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/30 sm:right-6"
      >
        <Sparkle size={18} weight="fill" className="text-cyan-300" aria-hidden="true" />
        Ask WaterOps
      </motion.button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          side="right"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            launcherRef.current?.focus()
          }}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-5 pr-16">
              <DialogHeader className="pr-0">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white"><Sparkle size={20} weight="fill" aria-hidden="true" /></span>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-950">WaterOps Assistant</DialogTitle>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />API key required</div>
                  </div>
                </div>
                <DialogDescription className="pt-3 text-sm leading-6 text-slate-600">Ask about customers, water systems, visits, measurements, and findings.</DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
              {!messages.length ? (
                <div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center gap-2 text-blue-800"><ChatCircleDots size={18} weight="bold" aria-hidden="true" /><p className="text-sm font-bold">Start with a workspace question</p></div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">Answers will be grounded in the current ClearFlow records when a model provider is connected.</p>
                  </div>
                  <div className="mt-5 space-y-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => submitQuestion(suggestion)} className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/20">{suggestion}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white" : "mr-6 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"}>{message.text}</div>
                  ))}
                  <AnimatePresence>
                    {thinking ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mr-24 flex w-fit gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" aria-label="Assistant is responding">{[0, 1, 2].map((item) => <motion.span key={item} className="size-1.5 rounded-full bg-slate-500" animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 0.7, delay: item * 0.12 }} />)}</motion.div> : null}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-4">
              <label htmlFor="assistant-question" className="sr-only">Ask WaterOps a question</label>
              <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/15">
                <textarea id="assistant-question" value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder="Ask about system history…" className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none" />
                <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim() || thinking}><ArrowUp size={18} weight="bold" aria-hidden="true" /></Button>
              </div>
              <p className="mt-2 px-1 text-[10px] leading-4 text-slate-500">Questions are not sent or stored until an API key is configured.</p>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
