import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import {
  BANK, CATS, CAT_COLOR, MENTORS, PRACTICE_TOPIC_CAT, SLOTS,
  emailOk, questionsFromNotes, scoreDiagnostic, studyPlan,
  type Booking, type Diagnostic, type Question, type Signup,
} from './data'

const MONO = 'JetBrains Mono, monospace'
const SORA = 'Sora, sans-serif'

// ═══════════════════════════════════════════════════════════════════
// SHELL
// ═══════════════════════════════════════════════════════════════════

export function Modal({ onClose, wide, label, children }: { onClose: () => void; wide?: boolean; label: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    box.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !box.current) return
      const f = box.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href]')
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="m-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={box} className={`m-card${wide ? ' m-wide' : ''}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <button className="m-x" onClick={onClose} aria-label="Close dialog">×</button>
        {children}
      </div>
    </div>
  )
}

const Title = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div style={{ marginBottom: 22, paddingRight: 36 }}>
    <h3 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: '#F5F7FF', margin: 0 }}>{children}</h3>
    {sub && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', marginTop: 8, lineHeight: 1.6 }}>{sub}</p>}
  </div>
)

const Mono = ({ children, color = '#9AA3B8' }: { children: ReactNode; color?: string }) => (
  <span style={{ fontFamily: MONO, fontSize: 11, color }}>{children}</span>
)

const Field = ({ id, label, children }: { id: string; label: string; children: ReactNode }) => (
  <div className="m-field">
    <label htmlFor={id}>{label}</label>
    {children}
  </div>
)

function Saved({ ok }: { ok: boolean }) {
  return (
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8', marginTop: 12 }}>
      {ok ? 'Saved on this device.' : 'Could not save on this device. Your browser may be blocking storage.'}
    </p>
  )
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ (diagnostic, topic practice, notes)
// ═══════════════════════════════════════════════════════════════════

function Quiz({ questions, feedback, onDone }: { questions: Question[]; feedback: boolean; onDone: (answers: number[], secs: number) => void }) {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const t0 = useRef(Date.now())
  const q = questions[i]

  const record = (choice: number) => {
    const next = [...answers]
    next[i] = choice
    setAnswers(next)
    return next
  }
  const advance = (next: number[]) => {
    if (i + 1 < questions.length) { setI(i + 1); setPicked(null) }
    else onDone(next, Math.round((Date.now() - t0.current) / 1000))
  }
  const choose = (n: number) => {
    const next = record(n)
    if (feedback) setPicked(n)
    else advance(next)
  }

  return (
    <div>
      <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 22 }} aria-hidden="true">
        <div style={{ height: '100%', width: `${(i / questions.length) * 100}%`, background: 'linear-gradient(90deg,#7C5CFF,#22D3EE)', transition: 'width .3s' }} />
      </div>
      <Mono color="#7C5CFF">Question {i + 1} of {questions.length} · {q.cat}</Mono>
      <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 18, lineHeight: 1.5, color: '#F5F7FF', margin: '10px 0 20px', paddingRight: 24 }}>{q.q}</h3>
      <div>
        {q.o.map((o, n) => {
          const state = picked === null ? '' : n === q.a ? ' ok' : n === picked ? ' bad' : ''
          return (
            <button key={n} className={`m-opt${state}`} disabled={picked !== null} onClick={() => choose(n)}>
              <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.6 }}>{'ABCDEF'[n]}</span>{o}
            </button>
          )
        })}
      </div>
      {feedback && picked !== null && (
        <div className="m-inset" style={{ marginTop: 8 }}>
          <Mono color="#7C5CFF">// Aria</Mono>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', marginTop: 6, lineHeight: 1.6 }}>{q.e}</p>
          <button className="btn-primary" style={{ fontSize: 13, padding: '9px 18px', marginTop: 12 }} onClick={() => advance(answers)}>
            {i + 1 < questions.length ? 'Next question' : 'See result'}
          </button>
        </div>
      )}
      {!feedback && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => advance(record(-1))}>Skip</button>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8' }}>Pick an answer to continue</span>
        </div>
      )}
    </div>
  )
}

function ScoreBars({ cats }: { cats: Record<string, number> }) {
  return (
    <div>
      {CATS.map(c => (
        <div key={c} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F5F7FF' }}>
            <span>{c}</span><span style={{ fontFamily: MONO, fontSize: 10, color: CAT_COLOR[c] }}>{Math.round(cats[c] * 100)}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${cats[c] * 100}%`, background: CAT_COLOR[c], borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Review({ answers, onBack }: { answers: number[]; onBack: () => void }) {
  return (
    <div>
      <Title sub="Your pick is marked, and the right answer is in green.">Answer review</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {BANK.map((q, qi) => (
          <div key={qi} className="m-inset">
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#F5F7FF', marginBottom: 10, lineHeight: 1.5 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#7C5CFF' }}>Q{qi + 1}</span> {q.q}
            </p>
            {q.o.map((o, oi) => (
              <div key={oi} className={`m-opt static${oi === q.a ? ' ok' : oi === answers[qi] ? ' bad' : ''}`}>
                <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.6 }}>{'ABCD'[oi]}</span>{o}
              </div>
            ))}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8', marginTop: 6 }}>{q.e}</p>
          </div>
        ))}
      </div>
      <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={onBack}>Back to results</button>
    </div>
  )
}

export function DiagnosticModal({ onClose, onResult, onRoadmap }: { onClose: () => void; onResult: (d: Diagnostic) => boolean; onRoadmap: (d: Diagnostic) => void }) {
  const [result, setResult] = useState<{ d: Diagnostic; answers: number[]; saved: boolean } | null>(null)
  const [review, setReview] = useState(false)

  return (
    <Modal onClose={onClose} label="Free diagnostic">
      {!result && (
        <Quiz
          questions={BANK}
          feedback={false}
          onDone={(answers, secs) => {
            const d = scoreDiagnostic(answers, secs)
            setResult({ d, answers, saved: onResult(d) })
          }}
        />
      )}
      {result && review && <Review answers={result.answers} onBack={() => setReview(false)} />}
      {result && !review && (
        <div>
          <Mono color="#B6FF3B">Diagnostic complete</Mono>
          <h3 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: '#F5F7FF', margin: '8px 0 6px' }}>
            Projected score: <span className="shimmer-text">{result.d.score}</span>
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.6, marginBottom: 20 }}>
            {result.d.right} of {result.d.total} correct in {Math.floor(result.d.secs / 60)}m {result.d.secs % 60}s. This is a rough estimate from a short sample, not a prediction of your official score.
          </p>
          <ScoreBars cats={result.d.cats} />
          <div className="m-inset" style={{ margin: '18px 0' }}>
            <Mono>YOUR FIRST TWO WEEKS</Mono>
            {studyPlan(result.d).map((p, i) => (
              <p key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', marginTop: 8, lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-lime" style={{ fontSize: 13, padding: '10px 20px' }} onClick={() => onRoadmap(result.d)}>Get my full roadmap</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }} onClick={() => setReview(true)}>Review answers</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }} onClick={onClose}>See my dashboard</button>
          </div>
          <Saved ok={result.saved} />
        </div>
      )}
    </Modal>
  )
}

function QuizResult({ right, total, onDiagnostic, onClose, intro }: { right: number; total: number; onDiagnostic: () => void; onClose: () => void; intro: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <h3 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 28, color: '#F5F7FF', margin: '0 0 8px' }}>{right} of {total} correct</h3>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.6, marginBottom: 22 }}>{intro}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-lime" style={{ fontSize: 13, padding: '10px 20px' }} onClick={onDiagnostic}>Take the diagnostic</button>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export function PracticeModal({ topic, onClose, onDiagnostic }: { topic: string; onClose: () => void; onDiagnostic: () => void }) {
  const [score, setScore] = useState<number | null>(null)
  const cat = PRACTICE_TOPIC_CAT[topic]
  const questions = BANK.filter(q => q.cat === cat)

  if (!cat) {
    return (
      <Modal onClose={onClose} label={`${topic} practice`}>
        <Title sub="AWA is scored on a written essay, which needs the essay reviewer. For now, Verbal questions are available.">Analytical Writing</Title>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</button>
      </Modal>
    )
  }
  return (
    <Modal onClose={onClose} label={`${topic} practice`}>
      {score === null ? (
        <Quiz questions={questions} feedback onDone={a => setScore(a.filter((x, i) => x === questions[i].a).length)} />
      ) : (
        <QuizResult right={score} total={questions.length} onDiagnostic={onDiagnostic} onClose={onClose}
          intro="The full diagnostic turns a mix of sections into a projected score and a study plan." />
      )}
    </Modal>
  )
}

export function NotesModal({ fileName, text, onClose, onDiagnostic }: { fileName: string; text: string; onClose: () => void; onDiagnostic: () => void }) {
  const [questions] = useState(() => questionsFromNotes(text))
  const [score, setScore] = useState<number | null>(null)

  return (
    <Modal onClose={onClose} label="Questions from your notes">
      {questions.length < 2 ? (
        <div>
          <Title sub={fileName}>Not enough to work with</Title>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.6, marginBottom: 18 }}>
            Tutori builds fill-in-the-blank questions from full sentences. Try a file with several complete sentences of notes, such as a written summary of a topic.
          </p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</button>
        </div>
      ) : score === null ? (
        <div>
          <Mono>{fileName} · {questions.length} questions built from your notes</Mono>
          <div style={{ height: 14 }} />
          <Quiz questions={questions} feedback onDone={a => setScore(a.filter((x, i) => x === questions[i].a).length)} />
        </div>
      ) : (
        <QuizResult right={score} total={questions.length} onDiagnostic={onDiagnostic} onClose={onClose}
          intro="Questions come from your own sentences. The diagnostic shows how you do on GMAT-style questions." />
      )}
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════
// BOOKING
// ═══════════════════════════════════════════════════════════════════

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function BookingModal({ initialMentor, onClose, onSave, onDone }: { initialMentor: number; onClose: () => void; onSave: (b: Booking) => boolean; onDone?: () => void }) {
  const tomorrow = toIso(new Date(Date.now() + 864e5))
  const [mentor, setMentor] = useState(initialMentor)
  const [date, setDate] = useState(tomorrow)
  const [slot, setSlot] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ b: Booking; saved: boolean } | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!date || date < tomorrow) return setErr('Choose a date from tomorrow onward.')
    if (!slot) return setErr('Choose a time slot.')
    if (!name.trim()) return setErr('Enter your name.')
    if (!emailOk(email.trim())) return setErr('Enter a valid email address.')
    const b: Booking = { id: 'b' + Date.now().toString(36), mentor: MENTORS[mentor].name, date, time: slot, name: name.trim(), email: email.trim(), topic: topic.trim(), at: Date.now() }
    setDone({ b, saved: onSave(b) })
  }

  if (done) {
    const pretty = new Date(done.b.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    return (
      <Modal onClose={onClose} label="Session requested">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Tick />
          <h3 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 22, color: '#F5F7FF', margin: '0 0 8px' }}>Session requested</h3>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#9AA3B8', marginBottom: 6 }}>{done.b.mentor} · {pretty} at {done.b.time}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8', marginBottom: 20 }}>
            Mentor sessions are confirmed by email to {done.b.email}. {done.saved ? 'Your request is saved on this device.' : 'Could not save on this device.'}
          </p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onClose(); onDone?.() }}>Done</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} label="Book a mentor session">
      <Title sub="50 minutes, one-to-one. Times are shown in your local time zone.">Book a mentor session</Title>
      <form onSubmit={submit} noValidate>
        <Field id="bk-mentor" label="MENTOR">
          <select id="bk-mentor" value={mentor} onChange={e => setMentor(+e.target.value)}>
            {MENTORS.map((m, i) => <option key={m.name} value={i}>{m.name} · {m.tag}</option>)}
          </select>
        </Field>
        <Field id="bk-date" label="DATE">
          <input id="bk-date" type="date" min={tomorrow} value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <div className="m-field">
          <span className="m-label">TIME</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Time slot">
            {SLOTS.map(s => (
              <button type="button" key={s} className="m-slot" aria-pressed={slot === s} onClick={() => setSlot(s)}>{s}</button>
            ))}
          </div>
        </div>
        <Field id="bk-name" label="YOUR NAME"><input id="bk-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma" /></Field>
        <Field id="bk-email" label="EMAIL"><input id="bk-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
        <Field id="bk-topic" label="WHAT SHOULD WE COVER? (OPTIONAL)"><textarea id="bk-topic" rows={2} maxLength={300} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Mock debrief, Data Sufficiency timing…" /></Field>
        <div className="m-err" role="alert">{err}</div>
        <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Request session</button>
      </form>
    </Modal>
  )
}

const Tick = () => (
  <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(182,255,59,0.12)', border: '1px solid rgba(182,255,59,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="24" height="24" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4 6-6" stroke="#B6FF3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// SIGNUP
// ═══════════════════════════════════════════════════════════════════

export function SignupModal({ plan, price, annual, onClose, onSave, onDiagnostic, hasDiagnostic }: {
  plan: string; price: number; annual: boolean; onClose: () => void; onSave: (s: Signup) => boolean; onDiagnostic: () => void; hasDiagnostic: boolean
}) {
  const [exam, setExam] = useState<'GMAT' | 'GRE'>('GMAT')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [testDate, setTestDate] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ saved: boolean } | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Enter your name.')
    if (!emailOk(email.trim())) return setErr('Enter a valid email address.')
    const saved = onSave({ plan, billing: price ? (annual ? 'annual' : 'monthly') : null, exam, name: name.trim(), email: email.trim(), testDate: testDate || null, at: Date.now() })
    setDone({ saved })
  }

  if (done) {
    return (
      <Modal onClose={onClose} label="You're on the list">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Tick />
          <h3 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 22, color: '#F5F7FF', margin: '0 0 8px' }}>You're on the list</h3>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#9AA3B8', marginBottom: 6 }}>{plan} · {exam}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8', marginBottom: 20 }}>
            We'll write to {email.trim()} when your spot opens. {done.saved ? 'Saved on this device.' : 'Could not save on this device.'}
          </p>
          {!hasDiagnostic && <button className="btn-lime" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={onDiagnostic}>Take the free diagnostic now</button>}
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} label={`Reserve ${plan}`}>
      <Title sub={`${price ? `$${price}/mo, billed ${annual ? 'annually' : 'monthly'}. ` : ''}Payments are not switched on yet, so nothing is charged. We'll email you when your spot opens.`}>Reserve {plan}</Title>
      <form onSubmit={submit} noValidate>
        <div className="m-seg" role="group" aria-label="Exam">
          {(['GMAT', 'GRE'] as const).map(x => <button type="button" key={x} aria-pressed={exam === x} onClick={() => setExam(x)}>{x === 'GMAT' ? 'GMAT Focus' : 'GRE'}</button>)}
        </div>
        <Field id="su-name" label="YOUR NAME"><input id="su-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma" /></Field>
        <Field id="su-email" label="EMAIL"><input id="su-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
        <Field id="su-date" label="TEST DATE (OPTIONAL)"><input id="su-date" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} /></Field>
        <div className="m-err" role="alert">{err}</div>
        <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Reserve my spot</button>
      </form>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════
// WATCH + SESSIONS
// ═══════════════════════════════════════════════════════════════════

const SCRIPT: [string, string][] = [
  ['Aria', "Let's solve x² − 5x + 6 = 0 together. First, what kind of equation is this?"],
  ['Board', 'ax² + bx + c = 0   →   a = 1, b = −5, c = 6'],
  ['Aria', 'We need two numbers that multiply to 6 and add to −5. Try the factor pairs of 6.'],
  ['Board', '(−2) × (−3) = 6   and   (−2) + (−3) = −5'],
  ['Aria', 'So the equation factors as (x − 2)(x − 3) = 0.'],
  ['Board', 'x − 2 = 0  or  x − 3 = 0   →   x = 2, x = 3'],
  ['Aria', "Notice you didn't need the formula. Next time, check the factor pairs first. Want a harder one?"],
]

export function WatchModal({ onClose, onDiagnostic }: { onClose: () => void; onDiagnostic: () => void }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(reduced ? SCRIPT.length : 1)
  const [playing, setPlaying] = useState(!reduced)

  useEffect(() => {
    if (!playing || shown >= SCRIPT.length) return
    const id = setTimeout(() => setShown(s => s + 1), 2800)
    return () => clearTimeout(id)
  }, [playing, shown])

  return (
    <Modal onClose={onClose} wide label="The tutor in action">
      <Title sub="A short walkthrough of how Aria teaches a quadratic.">The tutor in action</Title>
      <div className="m-inset" style={{ minHeight: 260, display: 'flex', flexDirection: 'column', gap: 10 }} aria-live="polite">
        {SCRIPT.slice(0, shown).map(([who, text], i) => who === 'Board' ? (
          <div key={i} style={{ fontFamily: MONO, fontSize: 13, color: '#B6FF3B', padding: '8px 12px', borderLeft: '2px solid #B6FF3B', animation: 'slide-in-left .4s both' }}>{text}</div>
        ) : (
          <div key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F5F7FF', padding: '10px 14px', borderRadius: 14, background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.2)', animation: 'slide-in-left .4s both' }}>{text}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '9px 18px' }} onClick={() => setPlaying(p => !p)} disabled={shown >= SCRIPT.length}>{playing ? 'Pause' : 'Play'}</button>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '9px 18px' }} onClick={() => { setShown(1); setPlaying(true) }}>Restart</button>
        <button className="btn-lime" style={{ fontSize: 13, padding: '9px 18px', marginLeft: 'auto' }} onClick={onDiagnostic}>Try the diagnostic</button>
      </div>
    </Modal>
  )
}

export function SessionsModal({ onClose, onBook }: { onClose: () => void; onBook: () => void }) {
  const steps = [
    ['Request a slot', 'Pick a mentor, a date and a time. Requests are confirmed by email.'],
    ['Share your context', 'Your diagnostic, mistake log and latest mock are available to your mentor beforehand.'],
    ['50 minutes, one topic', 'Mock debrief, strategy, timing or a stuck concept. You leave with a written action list.'],
    ['Aria picks up', 'Your roadmap updates from what the mentor flagged.'],
  ]
  return (
    <Modal onClose={onClose} label="How sessions work">
      <Title sub="Aria handles daily practice. Mentors handle the moments that need a person.">How sessions work</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map(([t, d], i) => (
          <div key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, color: '#7C5CFF', fontWeight: 700 }}>{i + 1}</div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F7FF' }}>{t}</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', lineHeight: 1.6 }}>{d}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={onBook}>Book a session</button>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT, SIGN-IN AND NOTICES
// ═══════════════════════════════════════════════════════════════════

export function NoticeModal({ title, body, action, onAction, onClose }: { title: string; body: string; action?: string; onAction?: () => void; onClose: () => void }) {
  return (
    <Modal onClose={onClose} label={title}>
      <Title sub={body}>{title}</Title>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {action && <button className="btn-primary" onClick={onAction}>{action}</button>}
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}

export function AuthModal({ onClose, onSubmit, reason }: {
  onClose: () => void
  onSubmit: (mode: 'signin' | 'signup', email: string, password: string) => Promise<string | null>
  reason?: string
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailOk(email.trim())) return setErr('Enter a valid email address.')
    if (password.length < 8) return setErr('Use a password of at least 8 characters.')
    setBusy(true); setErr('')
    const problem = await onSubmit(mode, email.trim(), password)
    setBusy(false)
    if (problem === 'CONFIRM') setSent(true)
    else if (problem) setErr(problem)
  }

  if (sent) {
    return (
      <Modal onClose={onClose} label="Check your email">
        <Title sub={`We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`}>Check your email</Title>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSent(false); setMode('signin') }}>Go to sign in</button>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} label={mode === 'signup' ? 'Create your account' : 'Sign in'}>
      <Title sub={reason ?? 'Your plan and progress follow your account.'}>{mode === 'signup' ? 'Create your account' : 'Sign in'}</Title>
      <form onSubmit={submit} noValidate>
        <Field id="au-email" label="EMAIL"><input id="au-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
        <Field id="au-pass" label="PASSWORD"><input id="au-pass" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></Field>
        <div className="m-err" role="alert">{err}</div>
        <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      </form>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', marginTop: 16, textAlign: 'center' }}>
        {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
        <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setErr('') }}
          style={{ background: 'none', border: 0, padding: 0, color: '#B6FF3B', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>
          {mode === 'signup' ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </Modal>
  )
}

export function AccountModal({ email, plan, onSignOut, onClose }: { email: string; plan: string | null; onSignOut: () => void; onClose: () => void }) {
  return (
    <Modal onClose={onClose} label="Your account">
      <Title sub={email}>Your account</Title>
      <div className="m-inset" style={{ marginBottom: 18 }}>
        <Mono>PLAN</Mono>
        <p style={{ fontFamily: SORA, fontWeight: 700, fontSize: 18, color: plan ? '#B6FF3B' : '#F5F7FF', marginTop: 6 }}>{plan ?? 'Free'}</p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={onSignOut}>Sign out</button>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}
