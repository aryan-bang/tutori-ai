// Shared data, types and browser storage for the interactive flows.

export type Question = { cat: string; q: string; o: string[]; a: number; e: string }

export type Diagnostic = {
  score: number
  right: number
  total: number
  cats: Record<string, number>
  secs: number
  at: number
}

export type Signup = {
  plan: string
  billing: 'monthly' | 'annual' | null
  exam: 'GMAT' | 'GRE' | null
  name: string
  email: string
  testDate: string | null
  at: number
}

export type Booking = {
  id: string
  mentor: string
  date: string
  time: string
  name: string
  email: string
  topic: string
  at: number
}

export type Lead = { signups: Signup[]; bookings: Booking[]; diagnostic: Diagnostic | null }

export const CATS = ['Quant', 'Verbal', 'Data Insights', 'Logic'] as const
export const CAT_COLOR: Record<string, string> = {
  Quant: '#7C5CFF',
  Verbal: '#22D3EE',
  'Data Insights': '#FFD93D',
  Logic: '#B6FF3B',
}

export const BANK: Question[] = [
  { cat: 'Quant', q: 'If 3x + 7 = 25, what is the value of x?', o: ['4', '5', '6', '7'], a: 2, e: 'Subtract 7 from both sides: 3x = 18, so x = 6.' },
  { cat: 'Quant', q: 'What is 20% of 150 plus 30% of 50?', o: ['40', '45', '50', '55'], a: 1, e: '20% of 150 is 30 and 30% of 50 is 15, so the total is 45.' },
  { cat: 'Quant', q: 'A train covers 240 km in 3 hours, then 160 km in 2 hours. What is its average speed for the whole trip?', o: ['70 km/h', '75 km/h', '80 km/h', '85 km/h'], a: 2, e: 'Average speed is total distance over total time: 400 km / 5 h = 80 km/h.' },
  { cat: 'Verbal', q: 'A city added bike lanes, and the number of cycling accidents rose the next year. A councilor concludes the lanes are dangerous. Which finding most weakens the conclusion?', o: ['The lanes cost more than planned.', 'Far more people cycled after the lanes opened, and accidents per rider fell.', 'Some lanes were built next to parking.', 'Accidents involving cars also rose.'], a: 1, e: 'The conclusion confuses a count with a rate. If many more people ride, more accidents can occur even while each rider is safer.' },
  { cat: 'Verbal', q: 'Which sentence is correct?', o: ['The committee have reached its decision.', 'The committee has reached its decision.', 'The committee are reaching its decision.', "The committee has reached it's decision."], a: 1, e: '"Committee" is singular here, so it takes "has" and "its". "It\'s" is a contraction of "it is".' },
  { cat: 'Verbal', q: 'Passage: "Researchers found tree-lined streets were up to 4°C cooler than treeless ones, but only where canopy covered at least 30 percent of the street." Which statement is best supported?', o: ['Any tree planting lowers street temperature by 4°C.', 'Streets with canopy below 30 percent may not get the cooling effect.', 'Treeless streets are always 4°C hotter.', 'Canopy above 30 percent makes streets 30°C cooler.'], a: 1, e: 'The passage ties the cooling to at least 30 percent coverage, so lower coverage may not produce it. The other options overstate or misread the numbers.' },
  { cat: 'Data Insights', q: 'Is x > 0?  (1) x² = 9   (2) x > −1', o: ['Statement 1 alone is sufficient', 'Statement 2 alone is sufficient', 'Both together are sufficient, neither alone', 'Neither is sufficient, even together'], a: 2, e: '(1) gives x = 3 or −3. (2) allows x = 0. Together, x = −3 is out and x = 3 remains, so x > 0.' },
  { cat: 'Logic', q: 'If it rains, the match is cancelled. The match was not cancelled. Which must be true?', o: ['It rained but the match was played.', 'It did not rain.', 'The match was moved indoors.', 'Nothing can be inferred.'], a: 1, e: 'The contrapositive of "rain → cancelled" is "not cancelled → no rain".' },
]

export const PRACTICE_TOPIC_CAT: Record<string, string> = {
  Quant: 'Quant',
  Verbal: 'Verbal',
  RC: 'Verbal',
  CR: 'Verbal',
  SC: 'Verbal',
  'Data Insights': 'Data Insights',
}

export const MENTORS = [
  { name: 'Arjun Rao', cred: 'GMAT 780', school: 'Columbia Business School', tag: 'Quant specialist' },
  { name: 'Maya Kline', cred: 'GRE 335', school: 'Harvard Graduate School', tag: 'Verbal & AWA' },
  { name: 'Jonas Lu', cred: 'GMAT 760', school: '5+ yrs tutoring', tag: 'Strategy & timing' },
]

export const SLOTS = ['9:00 AM', '11:00 AM', '2:00 PM', '4:30 PM', '7:00 PM']

export function scoreDiagnostic(answers: number[], secs: number): Diagnostic {
  const right: Record<string, number> = {}
  const total: Record<string, number> = {}
  for (const c of CATS) { right[c] = 0; total[c] = 0 }
  let correct = 0
  BANK.forEach((q, i) => {
    total[q.cat]++
    if (answers[i] === q.a) { right[q.cat]++; correct++ }
  })
  const cats: Record<string, number> = {}
  for (const c of CATS) cats[c] = total[c] ? right[c] / total[c] : 0
  return {
    score: Math.round((505 + (correct / BANK.length) * 220) / 5) * 5,
    right: correct,
    total: BANK.length,
    cats,
    secs,
    at: Date.now(),
  }
}

export function studyPlan(d: Diagnostic): string[] {
  const order = [...CATS].sort((a, b) => d.cats[a] - d.cats[b])
  const [w, w2, w3, w4] = order
  return [
    `Days 1-3: rebuild ${w} fundamentals with 25 untimed questions a day, reading each explanation.`,
    `Days 4-6: mix ${w} and ${w2} in 20-minute timed sets, then review every miss for its cause.`,
    'Day 7: take a full mock, then log each error as concept gap, careless error, time pressure or misread stem.',
    `Week 2: add ${w3} and ${w4} for variety, and repeat your ${w} set on alternate days.`,
  ]
}

// ── Notes → fill-in-the-blank questions, built locally from the student's own sentences ──
const STOP = new Set(['because', 'between', 'through', 'another', 'however', 'although', 'without', 'during', 'before', 'should', 'would', 'could', 'which', 'their', 'there', 'these', 'those', 'where', 'while', 'about', 'after', 'being', 'under', 'every', 'other', 'using', 'within'])

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function questionsFromNotes(text: string): Question[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 220)
  const words = (s: string) => (s.match(/[A-Za-z][A-Za-z-]{5,}/g) ?? []).filter(w => !STOP.has(w.toLowerCase()))
  const pool = [...new Set(sentences.flatMap(words).map(w => w.toLowerCase()))]
  if (sentences.length === 0 || pool.length < 4) return []

  const step = Math.max(1, Math.floor(sentences.length / 6))
  const picked = sentences.filter((_, i) => i % step === 0).slice(0, 6)
  const out: Question[] = []
  for (const s of picked) {
    const cands = words(s).sort((a, b) => b.length - a.length)
    const answer = cands[0]
    if (!answer) continue
    const distractors = shuffle(pool.filter(w => w !== answer.toLowerCase() && Math.abs(w.length - answer.length) <= 4)).slice(0, 3)
    if (distractors.length < 3) continue
    const match = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
    const options = shuffle([answer.toLowerCase(), ...distractors])
    out.push({
      cat: 'Your notes',
      q: `Fill in the blank: ${s.replace(match, '_____')}`,
      o: options,
      a: options.indexOf(answer.toLowerCase()),
      e: `From your notes: "${s}"`,
    })
  }
  return out
}

// ── Browser storage (this site has no server, so leads stay on the device) ──
const KEY = 'tutori.lead.v1'

export function loadLead(): Lead {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (v && typeof v === 'object') {
      return { signups: v.signups ?? [], bookings: v.bookings ?? [], diagnostic: v.diagnostic ?? null }
    }
  } catch { /* storage unavailable or corrupt: start empty */ }
  return { signups: [], bookings: [], diagnostic: null }
}

export function saveLead(lead: Lead): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(lead))
    return true
  } catch {
    return false
  }
}

export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
