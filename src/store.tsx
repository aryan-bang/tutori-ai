import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadLead, saveLead, type Booking, type Diagnostic, type Lead, type Signup } from './data'
import { AccountModal, AuthModal, BookingModal, DiagnosticModal, NoticeModal, NotesModal, PracticeModal, SessionsModal, SignupModal, WatchModal } from './modals'
import { authEnabled, supabase } from './supabase'

type PlanSlug = 'pro' | 'mentor'
type Notice = { title: string; body: string; action?: string; onAction?: () => void }

type Overlay =
  | { kind: 'diagnostic' }
  | { kind: 'practice'; topic: string }
  | { kind: 'notes'; fileName: string; text: string }
  | { kind: 'booking'; mentor: number }
  | { kind: 'signup'; plan: string; price: number; annual: boolean }
  | { kind: 'watch' }
  | { kind: 'sessions' }
  | { kind: 'auth'; reason?: string }
  | { kind: 'account' }
  | { kind: 'notice'; notice: Notice }
  | null

type Ctx = {
  diagnostic: Diagnostic | null
  signedEmail: string | null
  authEnabled: boolean
  userEmail: string | null
  planName: string | null
  openDiagnostic: () => void
  openPractice: (topic: string) => void
  openNotes: (fileName: string, text: string) => void
  openBooking: (mentor?: number) => void
  openSignup: (plan: string, price: number, annual: boolean) => void
  openWatch: () => void
  openSessions: () => void
  openAuth: () => void
  openAccount: () => void
  startCheckout: (plan: PlanSlug, annual: boolean) => void
  canUseNotes: () => boolean
  saveEmail: (email: string) => boolean
}

const AppCtx = createContext<Ctx | null>(null)

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside AppProvider')
  return c
}

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', mentor: 'Pro + Mentor' }

export function AppProvider({ children }: { children: ReactNode }) {
  const [lead, setLead] = useState<Lead>(() => loadLead())
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const pending = useRef<{ plan: PlanSlug; annual: boolean } | null>(null)
  const close = useCallback(() => setOverlay(null), [])
  const notify = useCallback((n: Notice) => setOverlay({ kind: 'notice', notice: n }), [])

  const update = useCallback((fn: (l: Lead) => Lead) => {
    let ok = true
    setLead(prev => {
      const next = fn(prev)
      ok = saveLead(next)
      return next
    })
    return ok
  }, [])

  // ── Session ──
  useEffect(() => {
    if (!supabase) return
    const apply = (s: { user: { id: string; email?: string } } | null) =>
      setUser(s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null)
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => apply(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const loadPlan = useCallback(async (id: string) => {
    if (!supabase) return null
    const { data } = await supabase.from('entitlements').select('plan,status').eq('user_id', id).maybeSingle()
    const active = data?.status === 'active' ? (data.plan as string) : null
    setPlan(active)
    return active
  }, [])

  useEffect(() => {
    if (!user) { setPlan(null); return }
    loadPlan(user.id)
  }, [user, loadPlan])

  // ── Checkout ──
  const goToCheckout = useCallback(async (slug: PlanSlug, annual: boolean) => {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return setOverlay({ kind: 'auth', reason: 'Sign in to continue to checkout.' })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: slug, billing: annual ? 'annual' : 'monthly' }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.url) { window.location.href = body.url; return }
      notify({ title: 'Checkout unavailable', body: body.error ?? 'Something went wrong. Please try again.' })
    } catch {
      notify({ title: 'Checkout unavailable', body: 'Could not reach the server. Check your connection and try again.' })
    }
  }, [notify])

  const startCheckout = useCallback((slug: PlanSlug, annual: boolean) => {
    if (!user) {
      pending.current = { plan: slug, annual }
      setOverlay({ kind: 'auth', reason: 'Create an account so your plan is attached to you, then continue to checkout.' })
      return
    }
    setOverlay({ kind: 'notice', notice: { title: 'Taking you to checkout…', body: 'You will pay on Dodo Payments’ secure page.' } })
    goToCheckout(slug, annual)
  }, [user, goToCheckout])

  // Resume a checkout that was waiting for sign-in.
  useEffect(() => {
    if (user && pending.current) {
      const p = pending.current
      pending.current = null
      setOverlay({ kind: 'notice', notice: { title: 'Taking you to checkout…', body: 'You will pay on Dodo Payments’ secure page.' } })
      goToCheckout(p.plan, p.annual)
    }
  }, [user, goToCheckout])

  // Back from the payment page: the webhook grants access, so wait for it.
  const returned = useRef(false)
  useEffect(() => {
    if (returned.current || !user) return
    const q = new URLSearchParams(window.location.search)
    if (q.get('checkout') !== 'return') return
    returned.current = true
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    notify({ title: 'Confirming your payment…', body: 'This usually takes a few seconds.' })
    let tries = 0
    const id = setInterval(async () => {
      tries++
      const active = await loadPlan(user.id)
      if (active) {
        clearInterval(id)
        notify({ title: `You're on ${PLAN_LABEL[active] ?? active}`, body: 'Thanks. Your plan is active and all its features are unlocked.' })
      } else if (tries >= 15) {
        clearInterval(id)
        notify({ title: 'Still confirming', body: 'Your payment may still be processing. Refresh in a minute. If your plan is still missing, contact support with your receipt email.' })
      }
    }, 2000)
    return () => clearInterval(id)
  }, [user, loadPlan, notify])

  const signIn = async (mode: 'signin' | 'signup', email: string, password: string) => {
    if (!supabase) return 'Accounts are not available yet.'
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      if (!data.session) return 'CONFIRM'
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
    }
    setOverlay(o => (o?.kind === 'auth' ? null : o))
    return null
  }

  const ctx = useMemo<Ctx>(() => ({
    diagnostic: lead.diagnostic,
    signedEmail: lead.signups.at(-1)?.email ?? null,
    authEnabled,
    userEmail: user?.email ?? null,
    planName: plan ? PLAN_LABEL[plan] ?? plan : null,
    openDiagnostic: () => setOverlay({ kind: 'diagnostic' }),
    openPractice: topic => setOverlay({ kind: 'practice', topic }),
    openNotes: (fileName, text) => setOverlay({ kind: 'notes', fileName, text }),
    openBooking: (mentor = 0) => setOverlay({ kind: 'booking', mentor }),
    openSignup: (p, price, annual) => setOverlay({ kind: 'signup', plan: p, price, annual }),
    openWatch: () => setOverlay({ kind: 'watch' }),
    openSessions: () => setOverlay({ kind: 'sessions' }),
    openAuth: () => setOverlay({ kind: 'auth' }),
    openAccount: () => setOverlay({ kind: 'account' }),
    startCheckout,
    // Notes upload is a Pro feature once accounts are switched on.
    canUseNotes: () => {
      if (!authEnabled || plan) return true
      const goPricing = () => { setOverlay(null); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }
      notify({ title: 'Notes upload is a Pro feature', body: 'Upgrade to Pro to turn your own notes into practice questions.', action: 'See plans', onAction: goPricing })
      return false
    },
    saveEmail: email => update(l => ({
      ...l,
      signups: [...l.signups, { plan: 'Early access', billing: null, exam: null, name: '', email, testDate: null, at: Date.now() } as Signup],
    })),
  }), [lead, update, user, plan, startCheckout, notify])

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
      {overlay?.kind === 'auth' && <AuthModal onClose={() => { pending.current = null; close() }} onSubmit={signIn} reason={overlay.reason} />}
      {overlay?.kind === 'account' && user && (
        <AccountModal email={user.email} plan={ctx.planName} onClose={close}
          onSignOut={() => { supabase?.auth.signOut(); close() }} />
      )}
      {overlay?.kind === 'notice' && (
        <NoticeModal {...overlay.notice} onClose={close} onAction={overlay.notice.onAction} />
      )}
    </AppCtx.Provider>
  )
}
