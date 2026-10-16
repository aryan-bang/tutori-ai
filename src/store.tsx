import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { loadLead, saveLead, type Booking, type Diagnostic, type Lead, type Signup } from './data'
import { BookingModal, DiagnosticModal, NotesModal, PracticeModal, SessionsModal, SignupModal, WatchModal } from './modals'

type Overlay =
  | { kind: 'diagnostic' }
  | { kind: 'practice'; topic: string }
  | { kind: 'notes'; fileName: string; text: string }
  | { kind: 'booking'; mentor: number }
  | { kind: 'signup'; plan: string; price: number; annual: boolean }
  | { kind: 'watch' }
  | { kind: 'sessions' }
  | null

type Ctx = {
  diagnostic: Diagnostic | null
  signedEmail: string | null
  openDiagnostic: () => void
  openPractice: (topic: string) => void
  openNotes: (fileName: string, text: string) => void
  openBooking: (mentor?: number) => void
  openSignup: (plan: string, price: number, annual: boolean) => void
  openWatch: () => void
  openSessions: () => void
  saveEmail: (email: string) => boolean
}

const AppCtx = createContext<Ctx | null>(null)

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside AppProvider')
  return c
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lead, setLead] = useState<Lead>(() => loadLead())
  const [overlay, setOverlay] = useState<Overlay>(null)
  const close = useCallback(() => setOverlay(null), [])

  const update = useCallback((fn: (l: Lead) => Lead) => {
    let ok = true
    setLead(prev => {
      const next = fn(prev)
      ok = saveLead(next)
      return next
    })
    return ok
  }, [])

  const ctx = useMemo<Ctx>(() => ({
    diagnostic: lead.diagnostic,
    signedEmail: lead.signups.at(-1)?.email ?? null,
    openDiagnostic: () => setOverlay({ kind: 'diagnostic' }),
    openPractice: topic => setOverlay({ kind: 'practice', topic }),
    openNotes: (fileName, text) => setOverlay({ kind: 'notes', fileName, text }),
    openBooking: (mentor = 0) => setOverlay({ kind: 'booking', mentor }),
    openSignup: (plan, price, annual) => setOverlay({ kind: 'signup', plan, price, annual }),
    openWatch: () => setOverlay({ kind: 'watch' }),
    openSessions: () => setOverlay({ kind: 'sessions' }),
    saveEmail: email => update(l => ({
      ...l,
      signups: [...l.signups, { plan: 'Early access', billing: null, exam: null, name: '', email, testDate: null, at: Date.now() } as Signup],
    })),
  }), [lead, update])

  const saveBooking = (b: Booking) => update(l => ({ ...l, bookings: [...l.bookings, b] }))
  const saveSignup = (s: Signup) => update(l => ({ ...l, signups: [...l.signups, s] }))
  const saveDiagnostic = (d: Diagnostic) => update(l => ({ ...l, diagnostic: d }))
  const diag = () => setOverlay({ kind: 'diagnostic' })

  return (
    <AppCtx.Provider value={ctx}>
      {children}
      {overlay?.kind === 'diagnostic' && (
        <DiagnosticModal
          onClose={close}
          onResult={saveDiagnostic}
          onRoadmap={() => setOverlay({ kind: 'signup', plan: 'Early access', price: 0, annual: false })}
        />
      )}
      {overlay?.kind === 'practice' && <PracticeModal topic={overlay.topic} onClose={close} onDiagnostic={diag} />}
      {overlay?.kind === 'notes' && <NotesModal fileName={overlay.fileName} text={overlay.text} onClose={close} onDiagnostic={diag} />}
      {overlay?.kind === 'booking' && <BookingModal initialMentor={overlay.mentor} onClose={close} onSave={saveBooking} />}
      {overlay?.kind === 'signup' && (
        <SignupModal plan={overlay.plan} price={overlay.price} annual={overlay.annual} onClose={close}
          onSave={saveSignup} onDiagnostic={diag} hasDiagnostic={!!lead.diagnostic} />
      )}
      {overlay?.kind === 'watch' && <WatchModal onClose={close} onDiagnostic={diag} />}
      {overlay?.kind === 'sessions' && <SessionsModal onClose={close} onBook={() => setOverlay({ kind: 'booking', mentor: 0 })} />}
    </AppCtx.Provider>
  )
}
