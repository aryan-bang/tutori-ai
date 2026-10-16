import { useState, useEffect, useRef, useCallback } from 'react'
import { AppProvider, useApp } from './store'
import { MENTORS } from './data'

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

function useCountUp(to: number, enabled: boolean, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      setVal(Math.round((1 - (1 - p) ** 3) * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [enabled, to, duration])
  return val
}

function useTypewriter(text: string, enabled: boolean, speed = 42, delay = 0) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!enabled) return
    setDisplayed('')
    let i = 0
    let tid: ReturnType<typeof setTimeout>
    let iid: ReturnType<typeof setInterval>
    tid = setTimeout(() => {
      iid = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(iid)
      }, speed)
    }, delay)
    return () => { clearTimeout(tid); clearInterval(iid) }
  }, [enabled, text, speed, delay])
  return displayed
}

function useTilt(maxAngle = 6) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2
      el.style.transform = `perspective(900px) rotateX(${-y * maxAngle}deg) rotateY(${x * maxAngle}deg) translateZ(6px)`
      el.style.transition = 'transform 0.1s ease'
    }
    const leave = () => {
      el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)'
      el.style.transition = 'transform 0.6s ease'
    }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [maxAngle])
  return ref
}

function useScrollFill(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const el = ref.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const vh = window.innerHeight
      setProgress(Math.max(0, Math.min(1, (vh - top) / (vh + height * 0.2))))
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [ref])
  return progress
}

// ═══════════════════════════════════════════════════════════════════
// SMALL UTILITIES
// ═══════════════════════════════════════════════════════════════════

function AnimateIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function MonoLabel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.06em',
      color: accent || '#9AA3B8',
    }}>
      {children}
    </span>
  )
}

function Dot({ color = '#22D3EE', pulse = true }: { color?: string; pulse?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}>
      <span style={{
        display: 'block', width: 8, height: 8, borderRadius: '50%', background: color,
        animation: pulse ? 'thinking 1.4s ease-in-out infinite' : undefined,
      }} />
      {pulse && <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        animation: 'ring-out 1.4s ease-out infinite',
      }} />}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SVG VISUALS
// ═══════════════════════════════════════════════════════════════════

function RadarChart() {
  const categories = ['Quant', 'Verbal', 'DI', 'Vocab', 'RC', 'Logic']
  const values = [0.82, 0.61, 0.74, 0.55, 0.78, 0.90]
  const n = categories.length
  const cx = 80, cy = 80, r = 58

  const pt = (i: number, v: number) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2
    return { x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a) }
  }

  const outerPts = categories.map((_, i) => pt(i, 1))
  const dataPts = values.map((v, i) => pt(i, v))
  const gridPath = (v: number) => categories.map((_, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}` }).join(' ') + ' Z'
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%">
      {[0.25, 0.5, 0.75, 1].map((v, j) => (
        <path key={j} d={gridPath(v)} stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" fill="none" />
      ))}
      {outerPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      ))}
      <path d={dataPath} fill="rgba(124,92,255,0.18)" stroke="#7C5CFF" strokeWidth="1.5" strokeLinejoin="round" />
      {dataPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#7C5CFF" />)}
      {categories.map((cat, i) => {
        const p = pt(i, 1.3)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Inter, sans-serif">{cat}</text>
        )
      })}
    </svg>
  )
}

function ScoreLineChart({ target, baseline = 560 }: { target: number; baseline?: number }) {
  const [ref, inView] = useInView()
  const w = 280, h = 100, wMin = 490, wMax = 800

  const pts = [
    { wk: 0, f: 0 }, { wk: 2, f: 0.15 }, { wk: 4, f: 0.35 },
    { wk: 6, f: 0.6 }, { wk: 8, f: 0.8 }, { wk: 12, f: 1 },
  ].map(p => ({ wk: p.wk, s: baseline + (target - baseline) * p.f })).map(p => ({
    x: (p.wk / 12) * w,
    y: h - ((p.s - wMin) / (wMax - wMin)) * h,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`
  const ty = h - ((target - wMin) / (wMax - wMin)) * h

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${h + 16}`} width="100%" preserveAspectRatio="none" style={{ height: 90 }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chart-clip">
            <rect x="0" y="0" width={w} height={h + 16} />
          </clipPath>
        </defs>
        <path d={areaD} fill="url(#ag)" clipPath="url(#chart-clip)" />
        <path d={pathD} stroke="url(#sg)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
          style={inView ? { strokeDasharray: 1000, strokeDashoffset: 0, transition: 'stroke-dashoffset 2s ease 0.3s' }
            : { strokeDasharray: 1000, strokeDashoffset: 1000 }}
        />
        <line x1={0} y1={ty} x2={w} y2={ty} stroke="#B6FF3B" strokeWidth="1" strokeDasharray="4 3" opacity={0.55} />
        <text x={w - 2} y={ty - 4} textAnchor="end" fill="#B6FF3B" fontSize="7" fontFamily="JetBrains Mono, monospace">
          Target {target}
        </text>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#7C5CFF"
            style={inView ? { opacity: 1, transition: `opacity 0.3s ease ${0.3 + i * 0.15}s` } : { opacity: 0 }}
          />
        ))}
      </svg>
    </div>
  )
}

function ScoreGauge({ score, max = 800 }: { score: number; max?: number }) {
  const [ref, inView] = useInView()
  const r = 72, cx = 100, cy = 95
  const pct = (score - 400) / (max - 400)
  const arcLen = Math.PI * r
  const dash = pct * arcLen

  const polarToCart = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  })
  const s = polarToCart(180, r), e = polarToCart(0, r)

  return (
    <div ref={ref}>
      <svg viewBox="0 0 200 115" width="100%">
        <defs>
          <linearGradient id="gauge-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`}
          stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`}
          stroke="url(#gauge-g)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={inView ? arcLen - dash : arcLen}
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1) 0.2s' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#F5F7FF" fontSize="30"
          fontWeight="700" fontFamily="Sora, sans-serif" letterSpacing="-1">{score}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#9AA3B8" fontSize="9" fontFamily="Inter, sans-serif">
          Projected score
        </text>
      </svg>
    </div>
  )
}

function WhiteboardSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 240 130" width="100%" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <defs>
        <linearGradient id="wb-eq" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F5F7FF" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <text x="8" y="22" fill="rgba(245,247,255,0.85)" fontSize="12">ax² + bx + c = 0</text>
      <path d="M 8 30 L 232 30" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      <text x="8" y="50" fill="rgba(182,255,59,0.9)" fontSize="10">x = (−b ± √(b²−4ac)) / 2a</text>
      {active && (
        <path d="M 8 56 L 222 56" stroke="#7C5CFF" strokeWidth="1" pathLength="1"
          strokeDasharray="1" strokeDashoffset="0"
          style={{ animation: 'draw-stroke 1.4s ease forwards' }} />
      )}
      <path d="M 24 125 L 60 75 L 96 125 Z" stroke="rgba(34,211,238,0.7)" strokeWidth="1.2" fill="none"
        pathLength="1" strokeDasharray="1"
        strokeDashoffset={active ? '0' : '1'}
        style={{ transition: active ? 'stroke-dashoffset 1.8s ease 1s' : 'none' }}
      />
      <path d="M 24 119 L 30 119 L 30 125" stroke="rgba(34,211,238,0.6)" strokeWidth="0.8" fill="none" />
      <text x="53" y="73" fill="rgba(255,255,255,0.45)" fontSize="7.5">h</text>
      <text x="55" y="128" fill="rgba(255,255,255,0.45)" fontSize="7.5">b</text>
      <circle cx="170" cy="100" r="24" stroke="rgba(124,92,255,0.6)" strokeWidth="1.2" fill="none"
        pathLength="1" strokeDasharray="1"
        strokeDashoffset={active ? '0' : '1'}
        style={{ transition: active ? 'stroke-dashoffset 1.6s ease 0.6s' : 'none' }}
      />
      <line x1="170" y1="100" x2="194" y2="100" stroke="rgba(182,255,59,0.6)" strokeWidth="0.8" />
      <text x="177" y="97" fill="rgba(182,255,59,0.6)" fontSize="6">r</text>
    </svg>
  )
}

function WaveformSVG() {
  const bars = [0.3, 0.55, 0.9, 0.7, 1, 0.6, 0.85, 0.45, 0.75, 1, 0.5, 0.8, 0.35, 0.65, 0.9, 0.55]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 999,
          background: `linear-gradient(to top, #7C5CFF, #22D3EE)`,
          height: `${h * 100}%`,
          transformOrigin: 'center',
          animation: `wave ${0.5 + (i % 5) * 0.12}s ease-in-out ${i * 0.04}s infinite alternate`,
        }} />
      ))}
    </div>
  )
}

function StatCount({ n, suffix, label, enabled }: { n: number; suffix: string; label: string; unit: string; enabled: boolean }) {
  const count = useCountUp(n, enabled, 2000)
  return (
    <div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: '#F5F7FF', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {n >= 1000 ? `${Math.round(count / 1000)}k` : count}{suffix}
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function WeaknessBar({ subject, pct, color, index }: { subject: string; pct: number; color: string; index: number }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F5F7FF' }}>{subject}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color }}>{Math.round(pct * 100)}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999, background: color,
          width: inView ? `${pct * 100}%` : '0%',
          transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s`,
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  )
}

function MentorCard({ mentor, onBook }: { mentor: { name: string; cred: string; school: string; tag: string }; onBook: () => void }) {
  const tiltRef = useTilt(4)
  return (
    <div ref={tiltRef} className="grad-border" style={{ padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: `rgba(124,92,255,0.15)`, border: '1px solid rgba(124,92,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: '#7C5CFF',
      }}>
        {mentor.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>{mentor.name}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B6FF3B', background: 'rgba(182,255,59,0.1)', border: '1px solid rgba(182,255,59,0.2)', padding: '2px 8px', borderRadius: 999 }}>{mentor.cred}</span>
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8' }}>{mentor.school}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7C5CFF', marginTop: 4 }}>{mentor.tag}</div>
      </div>
      <button className="btn-ghost" style={{ fontSize: 12, padding: '8px 16px', flexShrink: 0 }} onClick={onBook} aria-label={`Book ${mentor.name}`}>Book</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const { openDiagnostic } = useApp()
  const navLinks = ['How it works', 'Features', 'Mentors', 'Pricing']

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
      backdropFilter: scrolled ? 'blur(24px)' : 'blur(0)',
      WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'blur(0)',
      backgroundColor: scrolled ? 'rgba(5,6,10,0.88)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(24px, 8vw, 120px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 28, height: 28 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #7C5CFF, #22D3EE 80%)',
              boxShadow: '0 0 14px rgba(124,92,255,0.65), 0 0 28px rgba(124,92,255,0.3)',
              animation: 'thinking 2.8s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '20%', borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.45), transparent)',
            }} />
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#F5F7FF', letterSpacing: '-0.02em' }}>
            Tutori <span style={{ color: '#7C5CFF' }}>AI</span>
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="nav-links">
          {navLinks.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              style={{ color: '#9AA3B8', fontSize: 14, fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F7FF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9AA3B8')}
            >{l}</a>
          ))}
        </div>

        <button className="btn-lime nav-cta" style={{ fontSize: 13, padding: '10px 20px' }} onClick={openDiagnostic}>
          Start Free Diagnostic
        </button>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen(o => !o)} className="nav-burger" aria-label="Toggle menu" aria-expanded={menuOpen}
          style={{ background: 'none', border: 'none', color: '#9AA3B8', cursor: 'pointer', padding: 8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {menuOpen
              ? <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              : <>
                <line x1="3" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{ background: 'rgba(5,6,10,0.96)', backdropFilter: 'blur(24px)', padding: '12px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          className="md:hidden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navLinks.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMenuOpen(false)}
                style={{ color: '#9AA3B8', fontSize: 15, fontFamily: 'Inter, sans-serif', textDecoration: 'none', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {l}
              </a>
            ))}
            <button className="btn-lime" style={{ marginTop: 16, justifyContent: 'center' }} onClick={() => { setMenuOpen(false); openDiagnostic() }}>Start Free Diagnostic</button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════

function HeroSection() {
  const { openDiagnostic, openWatch } = useApp()
  const [ref, inView] = useInView(0.05)
  const t1 = useTypewriter("Let's break this down step by step…", inView, 40, 800)
  const t2 = useTypewriter('Want me to explain it another way?', inView, 38, 3500)

  const stats = [
    { n: 50000, suffix: '+', label: 'Practice questions', unit: '' },
    { n: 500, suffix: '+', label: 'Unlimited mocks', unit: '' },
    { n: 24, suffix: '/7', label: 'AI tutoring', unit: '' },
  ]

  return (
    <section ref={ref} style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 100 }}>
      {/* Aurora blobs */}
      <div className="aurora" style={{ width: 700, height: 700, top: -200, left: -150, background: 'radial-gradient(circle, rgba(124,92,255,0.22), transparent 70%)', animation: 'aurora-1 18s ease-in-out infinite' }} />
      <div className="aurora" style={{ width: 600, height: 600, top: -100, right: -200, background: 'radial-gradient(circle, rgba(34,211,238,0.14), transparent 70%)', animation: 'aurora-2 22s ease-in-out infinite' }} />
      <div className="aurora" style={{ width: 400, height: 400, bottom: 0, left: '40%', background: 'radial-gradient(circle, rgba(124,92,255,0.1), transparent 70%)', animation: 'aurora-3 15s ease-in-out infinite' }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(24px, 8vw, 120px)', position: 'relative', zIndex: 1 }}>
        {/* Eyebrow */}
        <AnimateIn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'flex-start' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
            }}>
              <Dot color="#22D3EE" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#22D3EE', letterSpacing: '0.05em', fontWeight: 500 }}>
                Now teaching live: GMAT Focus & GRE
              </span>
            </div>
          </div>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="r-grid-2">
          {/* Left: copy */}
          <div>
            <AnimateIn delay={100}>
              <h1 style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 800, lineHeight: 1.04,
                letterSpacing: '-0.03em', marginBottom: 24,
                fontSize: 'clamp(44px, 5.5vw, 80px)', color: '#F5F7FF',
              }}>
                Your GMAT & GRE tutor never sleeps.{' '}
                <span>It{' '}
                  <span className="shimmer-text">teaches</span>
                  , not just tells.
                </span>
              </h1>
            </AnimateIn>
            <AnimateIn delay={220}>
              <p style={{ fontSize: 18, color: '#9AA3B8', lineHeight: 1.65, marginBottom: 36, fontFamily: 'Inter, sans-serif', maxWidth: 480 }}>
                An AI tutor that appears on screen, talks you through concepts, draws on a whiteboard, and adapts to every mistake you make. Backed by human mentors.
              </p>
            </AnimateIn>
            <AnimateIn delay={340}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button className="btn-lime" onClick={openDiagnostic}>Start Free Diagnostic</button>
                <button className="btn-ghost" onClick={openWatch}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6.5 5.5L11 8l-4.5 2.5V5.5Z" fill="currentColor" />
                  </svg>
                  Watch the tutor in action
                </button>
              </div>
            </AnimateIn>

            {/* Trust row */}
            <AnimateIn delay={500}>
              <div style={{ display: 'flex', gap: 32, marginTop: 52, flexWrap: 'wrap' }}>
                {stats.map((s, i) => <StatCount key={i} {...s} enabled={inView} />)}
              </div>
            </AnimateIn>
          </div>

          {/* Right: visual */}
          <AnimateIn delay={200} className="r-hide-sm">
            <div style={{ position: 'relative', height: 460 }}>
              {/* AI orb avatar */}
              <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-55%)', width: 220, height: 220 }}>
                {/* Outer rings */}
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    position: 'absolute', inset: i * 16, borderRadius: '50%',
                    border: '1px solid rgba(124,92,255,0.2)',
                    animation: `ring-out ${2 + i * 0.6}s ease-out ${i * 0.7}s infinite`,
                    pointerEvents: 'none',
                  }} />
                ))}
                {/* Orb */}
                <div style={{
                  position: 'absolute', inset: 24, borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 32%, #9B7FFF, #22D3EE 55%, #05060A 90%)',
                  animation: 'orb-pulse 3.5s ease-in-out infinite',
                }}>
                  <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', width: '55%', height: '28%', background: 'radial-gradient(circle, rgba(255,255,255,0.32), transparent)', borderRadius: '50%' }} />
                </div>
                {/* Particles */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                    background: i % 2 === 0 ? '#7C5CFF' : '#22D3EE',
                    top: `${20 + (i * 13) % 60}%`, left: `${8 + (i * 17) % 84}%`,
                    animation: `particle ${2.2 + i * 0.4}s ease-in-out ${i * 0.35}s infinite`,
                    boxShadow: `0 0 6px ${i % 2 === 0 ? 'rgba(124,92,255,0.7)' : 'rgba(34,211,238,0.7)'}`,
                  }} />
                ))}
              </div>

              {/* Whiteboard card */}
              <div className="glass" style={{
                position: 'absolute', right: 0, top: 20, width: 260, padding: '20px',
                animation: 'float 5s ease-in-out infinite',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B6FF3B' }} />
                  <MonoLabel>// whiteboard.live</MonoLabel>
                </div>
                <WhiteboardSVG active={inView} />
              </div>

              {/* Waveform chip */}
              <div className="glass-sm" style={{
                position: 'absolute', left: 200, bottom: 60, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                animation: 'float2 4s ease-in-out infinite',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B6FF3B', animation: 'thinking 1.2s ease-in-out infinite' }} />
                <WaveformSVG />
              </div>

              {/* Chat bubbles */}
              <div style={{ position: 'absolute', right: 10, bottom: 80, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 220 }}>
                <div className="glass-sm" style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(124,92,255,0.12)', borderColor: 'rgba(124,92,255,0.25)' }}>
                  <div style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#F5F7FF', lineHeight: 1.5 }}>
                    {t1}
                    {t1.length < 'Let\'s break this down step by step…'.length && (
                      <span style={{ display: 'inline-block', width: 2, height: 12, background: '#7C5CFF', marginLeft: 2, animation: 'blink 0.7s infinite', verticalAlign: 'middle' }} />
                    )}
                  </div>
                </div>
                {t1.length >= 'Let\'s break this down step by step…'.length && (
                  <div className="glass-sm" style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(124,92,255,0.08)', borderColor: 'rgba(124,92,255,0.15)' }}>
                    <div style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#9AA3B8', lineHeight: 1.5 }}>
                      {t2}
                      {t2.length < 'Want me to explain it another way?'.length && (
                        <span style={{ display: 'inline-block', width: 2, height: 12, background: '#9AA3B8', marginLeft: 2, animation: 'blink 0.7s infinite', verticalAlign: 'middle' }} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal label */}
              <div style={{
                position: 'absolute', left: 0, bottom: 10,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7C5CFF',
                padding: '4px 10px', borderRadius: 6, background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)',
              }}>
                <span style={{ animation: 'thinking 1.4s ease-in-out infinite' }}>▶</span> analyzing weak areas…
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PROBLEM / SOLUTION
// ═══════════════════════════════════════════════════════════════════

function ProblemSolution() {
  const tiltL = useTilt(4)
  const tiltR = useTilt(4)

  const traditional = [
    'Pre-recorded lectures that can\'t respond to you',
    'Generic problem sets with no context',
    'No adaptation when you get stuck',
    'Test tomorrow? Same plan as day one.',
    'You don\'t know what you don\'t know',
  ]
  const tutori = [
    'Live interactive AI that responds to your mistakes',
    'Personalized question mix based on your history',
    'Instantly pivots when you\'re confused',
    'Adaptive roadmap that rebuilds every session',
    'Continuously maps your blind spots in real time',
  ]

  return (
    <section id="features" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7C5CFF', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>The problem</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1, maxWidth: 680, margin: '0 auto' }}>
              Static video courses don't know you're stuck.{' '}
              <span style={{ color: '#7C5CFF' }}>Tutori does.</span>
            </h2>
          </div>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="r-grid-2">
          {/* Traditional */}
          <AnimateIn delay={100}>
            <div ref={tiltL} className="grad-border" style={{ padding: 32, filter: 'saturate(0.4)', opacity: 0.65 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 28 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#F5F7FF' }}>Traditional prep</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {traditional.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                      <path d="M5 8L7 10L11 6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* Tutori */}
          <AnimateIn delay={200}>
            <div ref={tiltR} className="grad-border" style={{ padding: 32, boxShadow: '0 0 40px rgba(124,92,255,0.12), 0 0 80px rgba(124,92,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 28 }}>
                <div style={{ position: 'relative', width: 10, height: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#B6FF3B', animation: 'thinking 1.6s ease-in-out infinite' }} />
                </div>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#F5F7FF' }}>Tutori AI</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B6FF3B', background: 'rgba(182,255,59,0.1)', border: '1px solid rgba(182,255,59,0.2)', padding: '2px 8px', borderRadius: 999 }}>
                  LIVE
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tutori.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="8" cy="8" r="7" stroke="#7C5CFF" strokeWidth="1.2" />
                      <path d="M5 8L7 10L11 6" stroke="#7C5CFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F5F7FF', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TUTOR DEMO
// ═══════════════════════════════════════════════════════════════════

function TutorDemo() {
  const [activeTab, setActiveTab] = useState<'Voice' | 'Whiteboard' | 'Examples' | 'Step-by-step'>('Whiteboard')
  const tabs = ['Voice', 'Whiteboard', 'Examples', 'Step-by-step'] as const

  const exampleQ = {
    q: 'If x² − 5x + 6 = 0, what are the possible values of x?',
    opts: ['x = 2 or x = 3', 'x = −2 or x = −3', 'x = 1 or x = 6', 'x = −1 or x = −6'],
    correct: 0,
    explanation: 'Factor: (x − 2)(x − 3) = 0, giving x = 2 or x = 3. The product of roots is +6 and sum is +5.',
  }

  const steps = [
    { n: 1, text: 'Identify the equation type: quadratic ax² + bx + c = 0' },
    { n: 2, text: 'Look for two numbers that multiply to c = 6 and add to b = −5' },
    { n: 3, text: 'Those numbers are −2 and −3 → factor as (x − 2)(x − 3)' },
    { n: 4, text: 'Set each factor to zero: x = 2 and x = 3' },
  ]

  return (
    <section id="how-it-works" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 600, height: 600, top: '30%', right: -200, background: 'radial-gradient(circle, rgba(34,211,238,0.1), transparent 70%)', animation: 'aurora-1 20s ease-in-out infinite' }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#22D3EE', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>Live demo</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 }}>Meet your AI tutor</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9AA3B8', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
              Not a voiceover. Not a solution dump. A tutor that teaches through voice, visuals, live whiteboard drawings, and worked examples.
            </p>
          </div>
        </AnimateIn>

        {/* Tab switcher */}
        <AnimateIn delay={100}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13,
                padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === tab ? 'rgba(124,92,255,1)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#F5F7FF' : '#9AA3B8',
                boxShadow: activeTab === tab ? '0 0 20px rgba(124,92,255,0.4)' : 'none',
              }}>
                {tab}
              </button>
            ))}
          </div>
        </AnimateIn>

        {/* Demo mockup */}
        <AnimateIn delay={200}>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 20, minHeight: 360 }} className="grad-border r-demo" key={activeTab}>

            {/* Avatar panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-inset" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  {activeTab === 'Voice' && (
                    <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid rgba(182,255,59,0.4)', animation: 'ring-out 1.2s ease-out infinite' }} />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'radial-gradient(circle at 38% 32%, #9B7FFF, #22D3EE 55%, #1a0a3a 90%)',
                    boxShadow: '0 0 30px rgba(124,92,255,0.5)',
                    animation: 'orb-pulse 3s ease-in-out infinite',
                  }}>
                    <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', width: '50%', height: '25%', background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)', borderRadius: '50%' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F7FF' }}>Aria</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8', marginTop: 3 }}>AI Tutor · GMAT</div>
                </div>
                {activeTab === 'Voice' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B6FF3B', animation: 'thinking 1.2s infinite' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B6FF3B' }}>speaking…</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="glass-inset" style={{ padding: 24, animation: 'tab-fade 0.35s ease' }}>
              {activeTab === 'Whiteboard' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#B6FF3B', animation: 'thinking 1.4s infinite' }} />
                    <MonoLabel>// live.whiteboard · drawing…</MonoLabel>
                  </div>
                  <WhiteboardSVG active />
                </>
              )}

              {activeTab === 'Voice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <WaveformSVG />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', marginTop: 20, lineHeight: 1.6 }}>
                      "Now, let's think about this differently. What if we factor out the common term first? Take a moment — what do you notice about the coefficients?"
                    </p>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22D3EE', marginTop: 16, animation: 'thinking 1.8s infinite' }}>
                      &gt; adapting to your response pattern…
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Examples' && (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
                    <MonoLabel accent="#22D3EE">// worked example · GMAT Quant</MonoLabel>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F5F7FF', marginBottom: 18, lineHeight: 1.6, fontWeight: 500 }}>{exampleQ.q}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {exampleQ.opts.map((o, i) => (
                      <div key={i} style={{
                        padding: '10px 14px', borderRadius: 12,
                        background: i === exampleQ.correct ? 'rgba(182,255,59,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${i === exampleQ.correct ? 'rgba(182,255,59,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        fontFamily: 'Inter, sans-serif', fontSize: 13,
                        color: i === exampleQ.correct ? '#B6FF3B' : '#9AA3B8',
                        display: 'flex', gap: 10, alignItems: 'center',
                      }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, opacity: 0.6 }}>{'ABCD'[i]}</span>
                        {o}
                        {i === exampleQ.correct && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="glass-inset" style={{ padding: '12px 14px', marginTop: 16, borderRadius: 14 }}>
                    <MonoLabel accent="#7C5CFF">// AI explanation</MonoLabel>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8', marginTop: 8, lineHeight: 1.6 }}>{exampleQ.explanation}</p>
                  </div>
                </div>
              )}

              {activeTab === 'Step-by-step' && (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                    <MonoLabel accent="#B6FF3B">// step-by-step breakdown</MonoLabel>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {steps.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        animation: `slide-in-left 0.4s ease ${i * 0.12}s both`,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7C5CFF', fontWeight: 700,
                        }}>{s.n}</div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F5F7FF', lineHeight: 1.6, paddingTop: 5 }}>{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat panel */}
            <div className="glass-inset" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'flex-end' }}>
              <MonoLabel>// live chat</MonoLabel>
              {[
                { from: 'ai', text: 'I noticed you hesitated on prime factorization. Let me show you a shortcut.' },
                { from: 'user', text: "That makes more sense, but I'm still confused about the remainder." },
                { from: 'ai', text: "Great question — let's use the dividend theorem to see why." },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 14,
                  background: m.from === 'ai' ? 'rgba(124,92,255,0.12)' : 'rgba(255,255,255,0.05)',
                  borderColor: m.from === 'ai' ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.07)',
                  border: '1px solid',
                  fontFamily: 'Inter, sans-serif', fontSize: 11.5,
                  color: m.from === 'ai' ? '#F5F7FF' : '#9AA3B8',
                  lineHeight: 1.55,
                }}>
                  {m.text}
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FEATURES BENTO GRID
// ═══════════════════════════════════════════════════════════════════

function FeaturesBento() {
  const { openPractice, openNotes, openSessions, openBooking } = useApp()
  const [fileErr, setFileErr] = useState('')
  const readNotes = (f: File | undefined) => {
    setFileErr('')
    if (!f) return
    if (!/\.(txt|md|csv)$/i.test(f.name) && !f.type.startsWith('text/')) return setFileErr('Upload a .txt or .md notes file. PDF and Word files are not supported yet.')
    if (f.size > 500_000) return setFileErr('That file is over 500 KB. Try a shorter one.')
    f.text().then(t => openNotes(f.name, t)).catch(() => setFileErr('Could not read that file.'))
  }
  const mistakeTags = ['Concept gap', 'Careless error', 'Time pressure', 'Misread stem']

  const mentorAvatars = [
    { init: 'AR', color: '#7C5CFF' }, { init: 'MK', color: '#22D3EE' }, { init: 'JL', color: '#B6FF3B' },
    { init: 'SP', color: '#FF6B6B' }, { init: 'TW', color: '#FFD93D' },
  ]

  const calendarData = [
    { d: 'M', t: 'S', c: '#7C5CFF' }, { d: 'T', t: 'P', c: '#22D3EE' }, { d: 'W', t: 'R', c: '#B6FF3B' },
    { d: 'T', t: 'S', c: '#7C5CFF' }, { d: 'F', t: 'P', c: '#22D3EE' }, { d: 'S', t: null, c: '' }, { d: 'S', t: null, c: '' },
  ]

  const notifications = [
    { text: 'Time for your daily practice quiz', time: '2 min ago', accent: '#7C5CFF' },
    { text: 'You improved 12 pts in Data Insights!', time: '1h ago', accent: '#22D3EE' },
    { text: 'Mock test scheduled: Saturday 10am', time: '3h ago', accent: '#B6FF3B' },
  ]

  return (
    <section id="features-grid" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7C5CFF', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>Everything in one place</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Your complete prep system
            </h2>
          </div>
        </AnimateIn>

        {/* Bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 16 }}>

          {/* 1: Unlimited Practice – col 1-7 */}
          <AnimateIn delay={0} className="col-span-12 md:col-span-7">
            <div className="grad-border" style={{ padding: 32, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#7C5CFF" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="#7C5CFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#F5F7FF' }}>Unlimited Practice & Mocks</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.6, marginBottom: 20 }}>Question-by-question AI coaching after each answer. No generic feedback — specific, contextual explanations.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Quant', 'Verbal', 'Data Insights', 'RC', 'CR', 'SC', 'AWA'].map(tag => (
                  <button key={tag} onClick={() => openPractice(tag)} style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                    background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.25)', color: '#7C5CFF',
                  }}>{tag}</button>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* 2: Adaptive Difficulty – col 8-12 */}
          <AnimateIn delay={80} className="col-span-12 md:col-span-5">
            <div className="grad-border" style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13L5 8l3 3 4-6 4 3" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>Adaptive Difficulty</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', lineHeight: 1.6, marginBottom: 16 }}>The AI recalibrates question difficulty in real time based on your last 20 responses.</p>
              <svg viewBox="0 0 200 70" width="100%" style={{ height: 60 }}>
                <defs><linearGradient id="diff-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#22D3EE"/><stop offset="100%" stopColor="#7C5CFF"/></linearGradient></defs>
                <path d="M 0 60 Q 40 55 70 40 Q 100 25 130 20 Q 160 15 200 22" stroke="url(#diff-g)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <circle cx="200" cy="22" r="4" fill="#22D3EE"/>
              </svg>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22D3EE', marginTop: 8, animation: 'thinking 1.6s infinite' }}>&gt; difficulty: calibrating…</div>
            </div>
          </AnimateIn>

          {/* 3: Mistake Intelligence – col 1-4 */}
          <AnimateIn delay={160} className="col-span-12 md:col-span-4">
            <div className="grad-border" style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v6M9 12v.5" stroke="#B6FF3B" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="7.5" stroke="#B6FF3B" strokeWidth="1.3"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>Mistake Intelligence</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', lineHeight: 1.6, marginBottom: 16 }}>Every error is categorised automatically.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mistakeTags.map((t, i) => {
                  const colors = ['#FF6B6B', '#FFD93D', '#22D3EE', '#7C5CFF']
                  return (
                    <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i], flexShrink: 0 }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#F5F7FF' }}>{t}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </AnimateIn>

          {/* 4: Score Projection – col 5-12 */}
          <AnimateIn delay={240} className="col-span-12 md:col-span-8">
            <div className="grad-border" style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14L6 9l3 3 7-8" stroke="#7C5CFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>Score Projection</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22D3EE', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', padding: '2px 8px', borderRadius: 999 }}>GMAT 680→740</span>
              </div>
              <ScoreLineChart target={740} />
            </div>
          </AnimateIn>

          {/* 5: Upload Material – col 1-4 */}
          <AnimateIn delay={320} className="col-span-12 md:col-span-4">
            <div className="grad-border" style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 12V4M5 7l4-4 4 4M3 14h12" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>Upload Your Material</span>
              </div>
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); readNotes(e.dataTransfer.files[0]) }}
                style={{ display: 'block', border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 14, cursor: 'pointer' }}>
                <input type="file" accept=".txt,.md,.csv,text/plain" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                  onChange={e => { readNotes(e.target.files?.[0]); e.target.value = '' }} />
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F5F7FF' }}>Drop a .txt or .md notes file, or click to choose</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7C5CFF', marginTop: 8 }}>&gt; stays in your browser</div>
              </label>
              <div role="alert" style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#FF8FA3', marginBottom: 8, minHeight: fileErr ? 16 : 0 }}>{fileErr}</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9AA3B8', lineHeight: 1.6 }}>Turns the sentences in your notes into fill-in-the-blank practice questions.</p>
            </div>
          </AnimateIn>

          {/* 6: Strength Map – col 5-8 */}
          <AnimateIn delay={400} className="col-span-12 md:col-span-4">
            <div className="grad-border" style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="9,2 17,16 1,16" stroke="#7C5CFF" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>Strength Map</span>
              </div>
              <div style={{ height: 160 }}><RadarChart /></div>
            </div>
          </AnimateIn>

          {/* 7: Day Roadmap – col 9-12 */}
          <AnimateIn delay={480} className="col-span-12 md:col-span-4">
            <div className="grad-border" style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="12" rx="2" stroke="#B6FF3B" strokeWidth="1.5"/><path d="M6 2v2M12 2v2M2 8h14" stroke="#B6FF3B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#F5F7FF' }}>Day-by-Day Plan</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {calendarData.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8', marginBottom: 4 }}>{d.d}</div>
                    <div style={{
                      height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: d.t ? `${d.c}1A` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${d.t ? `${d.c}40` : 'rgba(255,255,255,0.06)'}`,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: d.t ? d.c : 'transparent',
                    }}>{d.t}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {[['S', '#7C5CFF', 'Study'], ['P', '#22D3EE', 'Practice'], ['R', '#B6FF3B', 'Revise']].map(([k, c, l]) => (
                  <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* 8: Smart Reminders – col 1-3 */}
          <AnimateIn delay={560} className="col-span-12 md:col-span-3">
            <div className="grad-border" style={{ padding: 24, height: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a6 6 0 016 6c0 3-1 4.5-2 6H5c-1-1.5-2-3-2-6a6 6 0 016-6z" stroke="#22D3EE" strokeWidth="1.5"/><path d="M7 14a2 2 0 004 0" stroke="#22D3EE" strokeWidth="1.5"/></svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F7FF' }}>Smart Reminders</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifications.map((n, i) => (
                  <div key={i} className="glass-inset" style={{ padding: '10px 12px', borderRadius: 14, borderLeft: `2px solid ${n.accent}` }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F5F7FF', lineHeight: 1.5, marginBottom: 3 }}>{n.text}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* 9: Human Mentors – col 4-12 */}
          <AnimateIn delay={640} className="col-span-12 md:col-span-9">
            <div className="grad-border" style={{ padding: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="3" stroke="#B6FF3B" strokeWidth="1.5"/><path d="M1 16c0-3 2.5-5 6-5" stroke="#B6FF3B" strokeWidth="1.5" strokeLinecap="round"/><circle cx="13" cy="8" r="2.5" stroke="#B6FF3B" strokeWidth="1.5"/><path d="M10 16c0-2.5 1.5-4 3-4s3 1.5 3 4" stroke="#B6FF3B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#F5F7FF' }}>Human Mentors on demand</span>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.6, maxWidth: 380 }}>Real GMAT/GRE experts available to review your mocks, refine your strategy, and help when the AI isn't enough.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex' }}>
                  {mentorAvatars.map((a, i) => (
                    <div key={i} style={{
                      width: 42, height: 42, borderRadius: '50%', border: '2px solid #05060A',
                      background: `${a.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11, color: a.color,
                      marginLeft: i > 0 ? -10 : 0, boxShadow: `0 0 12px ${a.color}33`,
                    }}>{a.init}</div>
                  ))}
                </div>
                <button className="btn-primary" style={{ fontSize: 13, padding: '10px 20px' }} onClick={() => openBooking(0)}>Book a session</button>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════

function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const progress = useScrollFill(sectionRef as React.RefObject<HTMLElement>)

  const steps = [
    {
      n: '01', icon: '⊙', title: 'Assess', color: '#7C5CFF',
      desc: 'A short diagnostic pinpoints every gap across all GMAT/GRE domains. We go deeper than a practice test.',
    },
    {
      n: '02', icon: '▶', title: 'Teach', color: '#22D3EE',
      desc: 'Aria, your AI tutor, explains concepts interactively via voice, whiteboard, and worked examples — never just dumps answers.',
    },
    {
      n: '03', icon: '↻', title: 'Adapt', color: '#B6FF3B',
      desc: 'After every session, the difficulty curve, question mix, and weekly roadmap rebuild around what you struggled with today.',
    },
    {
      n: '04', icon: '↗', title: 'Track & Guide', color: '#7C5CFF',
      desc: 'A live dashboard shows your projected score, strengths, and what to tackle next. Human mentors step in at key moments.',
    },
  ]

  return (
    <section ref={sectionRef} id="how-it-works-section" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 500, height: 500, left: -150, top: '20%', background: 'radial-gradient(circle, rgba(124,92,255,0.12), transparent 70%)', animation: 'aurora-2 20s ease-in-out infinite' }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#22D3EE', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>The loop</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 12 }}>
              One loop. Continuously learning you.
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9AA3B8' }}>Four steps. One engine. Endlessly adaptive.</p>
          </div>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2px 1fr', gap: '0 40px', maxWidth: 800, margin: '0 auto' }} className="r-hiw">
          {/* Steps column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((s, i) => {
              const stepProgress = Math.max(0, Math.min(1, (progress - i * 0.22) / 0.22))
              return (
                <AnimateIn key={i} delay={i * 120} className="col-span-1">
                  <div style={{
                    padding: '28px 0', borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    opacity: stepProgress > 0.3 ? 1 : 0.35, transition: 'opacity 0.4s ease',
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                        background: stepProgress > 0.3 ? `${s.color}20` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${stepProgress > 0.3 ? s.color : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.5s ease',
                        boxShadow: stepProgress > 0.3 ? `0 0 20px ${s.color}33` : 'none',
                      }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: stepProgress > 0.3 ? s.color : '#9AA3B8' }}>{s.icon}</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: s.color }}>{s.n}</span>
                          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#F5F7FF', letterSpacing: '-0.02em' }}>{s.title}</span>
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.65 }}>{s.desc}</p>
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              )
            })}
          </div>

          {/* Center line */}
          <div style={{ position: 'relative' }} className="r-hide-sm">
            <div style={{ position: 'absolute', inset: '0 0', background: 'rgba(255,255,255,0.07)', borderRadius: 999 }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 999,
              background: 'linear-gradient(to bottom, #7C5CFF, #22D3EE, #B6FF3B)',
              height: `${progress * 100}%`,
              transition: 'height 0.1s ease',
              boxShadow: '0 0 12px rgba(124,92,255,0.5)',
            }} />
          </div>

          {/* Right column: decorative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }} className="r-hide-sm">
            {steps.map((s, i) => {
              const stepProgress = Math.max(0, Math.min(1, (progress - i * 0.22) / 0.22))
              return (
                <div key={i} style={{ padding: '28px 0', borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: stepProgress > 0.3 ? 1 : 0.2, transition: 'opacity 0.5s ease' }}>
                  <div className="glass-inset" style={{ padding: '16px 20px', borderRadius: 16 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: s.color, marginBottom: 8 }}>&gt; {s.title.toLowerCase()}.run()</div>
                    <div style={{ width: `${stepProgress * 100}%`, height: 2, background: `linear-gradient(to right, ${s.color}, transparent)`, borderRadius: 999, transition: 'width 0.6s ease', marginBottom: 8, minWidth: stepProgress > 0 ? 4 : 0 }} />
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>{stepProgress > 0.8 ? '✓ complete' : stepProgress > 0.3 ? '⟳ running…' : '○ pending'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SCORE DASHBOARD
// ═══════════════════════════════════════════════════════════════════

function ScoreDashboard() {
  const { diagnostic, openDiagnostic } = useApp()
  const [target, setTarget] = useState(720)
  const current = diagnostic?.score ?? 600
  const lo = Math.min(600, current)
  const catColors: Record<string, string> = { Quant: '#7C5CFF', Verbal: '#22D3EE', 'Data Insights': '#FFD93D', Logic: '#B6FF3B' }

  const sampleAreas = [
    { subject: 'Data Sufficiency', pct: 0.45, color: '#FF6B6B' },
    { subject: 'Reading Comprehension', pct: 0.62, color: '#FFD93D' },
    { subject: 'Critical Reasoning', pct: 0.71, color: '#22D3EE' },
    { subject: 'Problem Solving', pct: 0.80, color: '#7C5CFF' },
    { subject: 'Sentence Correction', pct: 0.68, color: '#B6FF3B' },
  ]

  const weakAreas = diagnostic
    ? Object.entries(diagnostic.cats).map(([subject, pct]) => ({ subject, pct: Math.max(pct, 0.05), color: catColors[subject] ?? '#7C5CFF' }))
    : sampleAreas

  const weeksNeeded = Math.max(1, Math.round(((target - current) / 15) + 6))
  const hoursPerWeek = target > 720 ? 14 : target > 690 ? 11 : 8

  return (
    <section id="roadmap" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 700, height: 700, right: -200, top: '10%', background: 'radial-gradient(circle, rgba(124,92,255,0.14), transparent 70%)', animation: 'aurora-1 22s ease-in-out infinite' }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7C5CFF', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>Live dashboard</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Score projection & roadmap
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', marginTop: 14 }}>
              {diagnostic
                ? `Based on your diagnostic: ${diagnostic.right} of ${diagnostic.total} correct.`
                : 'Sample numbers shown. Take the free diagnostic to see yours.'}
              {' '}<button onClick={openDiagnostic} style={{ background: 'none', border: 0, color: '#B6FF3B', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', textDecoration: 'underline', padding: 0 }}>
                {diagnostic ? 'Retake' : 'Start'}
              </button>
            </p>
          </div>
        </AnimateIn>

        {/* Target score slider */}
        <AnimateIn delay={100}>
          <div className="grad-border" style={{ padding: '24px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9AA3B8', marginBottom: 6 }}>&gt; set target score</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: '#F5F7FF', letterSpacing: '-0.03em' }}>
                {target} <span style={{ fontSize: 14, color: '#7C5CFF', fontWeight: 600 }}>GMAT</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <MonoLabel>{lo}</MonoLabel>
                <MonoLabel>805</MonoLabel>
              </div>
              <input type="range" aria-label="Target score" min={lo} max={805} step={5} value={target} onChange={e => setTarget(Number(e.target.value))}
                style={{ accentColor: '#7C5CFF' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8', marginBottom: 4 }}>Timeline</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: '#22D3EE' }}>{weeksNeeded}w</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8', marginBottom: 4 }}>hrs/week</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: '#B6FF3B' }}>{hoursPerWeek}</div>
              </div>
            </div>
          </div>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="r-grid-3">
          {/* Gauge */}
          <AnimateIn delay={200}>
            <div className="grad-border" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8', marginBottom: 16 }}>&gt; score.projection()</div>
              <ScoreGauge score={Math.round(current + (target - current) * 0.85)} />
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 16 }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>Current</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#F5F7FF' }}>{current}</div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>Target</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#B6FF3B' }}>{target}</div>
                </div>
              </div>
            </div>
          </AnimateIn>

          {/* Score line chart */}
          <AnimateIn delay={300}>
            <div className="grad-border" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8', marginBottom: 16 }}>&gt; score.trajectory()</div>
              <ScoreLineChart target={target} baseline={current} />
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 16, height: 2, background: 'linear-gradient(to right, #7C5CFF, #22D3EE)', borderRadius: 999 }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>Projected</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 16, height: 2, borderTop: '1.5px dashed #B6FF3B', opacity: 0.6 }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B8' }}>Target</span>
                </div>
              </div>
            </div>
          </AnimateIn>

          {/* Weaknesses heatmap */}
          <AnimateIn delay={400}>
            <div className="grad-border" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8', marginBottom: 16 }}>&gt; weaknesses.scan()</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {weakAreas.map((a, i) => (
                  <WeaknessBar key={i} subject={a.subject} pct={a.pct} color={a.color} index={i} />
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MENTORSHIP
// ═══════════════════════════════════════════════════════════════════

function Mentorship() {
  const { openBooking, openSessions } = useApp()
  const mentors = MENTORS

  return (
    <section id="mentors" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="r-grid-2">
          <AnimateIn>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#B6FF3B', letterSpacing: '0.08em', marginBottom: 20, textTransform: 'uppercase' }}>AI + Human</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.08, marginBottom: 24 }}>
              AI for scale.<br /><span style={{ color: '#B6FF3B' }}>Humans for nuance.</span>
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9AA3B8', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Aria handles 95% of your prep 24/7. When you hit a wall — a complex strategy question, a mock debrief, or a crisis of confidence — a human expert steps in. Book a 50-minute session. Walk away with clarity.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => openBooking(0)}>Book a mentor</button>
              <button className="btn-ghost" onClick={openSessions}>How sessions work</button>
            </div>
          </AnimateIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mentors.map((m, i) => (
              <AnimateIn key={i} delay={i * 130}>
                <MentorCard mentor={m} onBook={() => openBooking(i)} />
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════

function Testimonials() {
  const cards = [
    { init: 'AK', name: 'Amara K.', badge: '+92 pts', score: 'GMAT 620 → 712', text: "The whiteboard explanations are genuinely different. I'd watched dozens of YouTube videos on DS and never clicked — Aria showed me once and it stuck." },
    { init: 'RN', name: 'Rohan N.', badge: 'GRE 318 → 333', score: '+15 pts', text: "I'd been stuck at 318 for two attempts. Three months with Tutori and I finally broke 330. The adaptive questions are uncanny — it always finds your weak spots." },
    { init: 'SF', name: 'Sophie F.', badge: '+80 pts', score: 'GMAT 650 → 730', text: 'Scheduled a mentor session the week before my test. 50 minutes with Jonas completely changed my timing strategy. Worth every minute.' },
    { init: 'DM', name: 'Daniel M.', badge: 'GRE 321 → 330', score: '+9 pts', text: "The score projection was accurate to within 2 points. It told me I'd hit 330 in week 10, and I did it in week 9." },
    { init: 'LP', name: 'Lena P.', badge: '+68 pts', score: 'GMAT 672 → 740', text: "I uploaded all my MBA prep notes and Tutori turned them into practice questions in minutes. I didn't know AI could do that." },
    { init: 'JC', name: 'James C.', badge: 'GRE 325 → 336', score: '+11 pts', text: 'The voice mode is surreal. Having Aria talk me through a tough RC passage felt exactly like having a tutor in the room.' },
    { init: 'MB', name: 'Maya B.', badge: '+110 pts', score: 'GMAT 590 → 700', text: 'From 590 to 700 in 14 weeks. I studied part-time around a full-time job. The roadmap told me exactly what to do each day.' },
    { init: 'TK', name: 'Takuya K.', badge: 'GRE 310 → 328', score: '+18 pts', text: "Best decision I made for GRE prep. Mistake intelligence showed me it was always time pressure, not concept gaps, costing me points." },
  ]

  const doubled = [...cards, ...cards]

  return (
    <section style={{ padding: 'clamp(80px,10vw,160px) 0', overflow: 'hidden' }}>
      <AnimateIn>
        <div style={{ textAlign: 'center', marginBottom: 60, padding: '0 clamp(24px,8vw,120px)' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#22D3EE', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>Student stories</p>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Real scores. Real people.
          </h2>
        </div>
      </AnimateIn>

      <div className="marquee-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Row 1 — forward */}
        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-track marquee-track-fwd">
            {doubled.map((c, i) => (
              <div key={i} className="grad-border" style={{ width: 320, flexShrink: 0, padding: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: '#7C5CFF', flexShrink: 0 }}>{c.init}</div>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F7FF' }}>{c.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8' }}>{c.score}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B6FF3B', background: 'rgba(182,255,59,0.1)', border: '1px solid rgba(182,255,59,0.2)', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>{c.badge}</div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', lineHeight: 1.6 }}>"{c.text}"</p>
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 — reverse */}
        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-track marquee-track-rev">
            {[...doubled].reverse().map((c, i) => (
              <div key={i} className="grad-border" style={{ width: 320, flexShrink: 0, padding: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: '#22D3EE', flexShrink: 0 }}>{c.init}</div>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F7FF' }}>{c.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B8' }}>{c.score}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22D3EE', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>{c.badge}</div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', lineHeight: 1.6 }}>"{c.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PRICING
// ═══════════════════════════════════════════════════════════════════

function Pricing() {
  const { openDiagnostic, openSignup } = useApp()
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      name: 'Free Diagnostic',
      price: 0,
      annualPrice: 0,
      desc: 'Start here. No credit card.',
      features: ['Free diagnostic test', 'Score projection report', 'Weakness summary', '10 AI-coached practice Qs', 'One roadmap preview'],
      cta: 'Start free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: 39,
      annualPrice: 29,
      desc: 'Everything for serious prep.',
      features: ['Unlimited practice questions', 'Live AI tutor (voice + whiteboard)', 'Adaptive difficulty engine', 'Mistake intelligence tagging', 'Full score projection dashboard', 'Upload your own notes', 'Unlimited mock tests', '24/7 access'],
      cta: 'Start Pro',
      highlight: true,
      tag: 'Most popular',
    },
    {
      name: 'Pro + Mentor',
      price: 89,
      annualPrice: 69,
      desc: 'Everything in Pro, plus humans.',
      features: ['All Pro features', '4 mentor sessions/month', 'Priority session booking', 'Mentor-reviewed mock debriefs', 'Personalised strategy call', 'Slack access to mentors', 'Score guarantee program'],
      cta: 'Get Pro + Mentor',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 500, height: 500, left: '30%', bottom: -100, background: 'radial-gradient(circle, rgba(124,92,255,0.12), transparent 70%)', animation: 'aurora-3 18s ease-in-out infinite' }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7C5CFF', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>Pricing</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,52px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 32 }}>
              Simple, honest pricing
            </h2>
            {/* Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 8px' }}>
              <button onClick={() => setAnnual(false)} style={{
                padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14,
                background: !annual ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: !annual ? '#F5F7FF' : '#9AA3B8',
                transition: 'all 0.2s ease',
              }}>Monthly</button>
              <button onClick={() => setAnnual(true)} style={{
                padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14,
                background: annual ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: annual ? '#F5F7FF' : '#9AA3B8',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Annual
                {annual && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B6FF3B', background: 'rgba(182,255,59,0.12)', border: '1px solid rgba(182,255,59,0.25)', padding: '2px 6px', borderRadius: 999 }}>Save 25%</span>}
              </button>
            </div>
          </div>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }} className="r-grid-3">
          {plans.map((p, i) => (
            <AnimateIn key={p.name} delay={i * 120}>
              <div className={p.highlight ? 'accent-border' : 'grad-border'} style={{
                padding: 32,
                boxShadow: p.highlight ? '0 0 60px rgba(124,92,255,0.15)' : 'none',
              }}>
                {p.highlight && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7C5CFF', background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', padding: '3px 10px', borderRadius: 999 }}>
                      ★ {p.tag}
                    </span>
                  </div>
                )}
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#F5F7FF', marginBottom: 8 }}>{p.name}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 44, color: '#F5F7FF', letterSpacing: '-0.03em' }}>
                    {p.price === 0 ? 'Free' : `$${annual ? p.annualPrice : p.price}`}
                  </span>
                  {p.price > 0 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', marginLeft: 4 }}>/mo</span>}
                </div>
                {p.price > 0 && annual && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B6FF3B', marginBottom: 8 }}>
                    Billed as ${p.annualPrice * 12}/yr
                  </div>
                )}
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', marginBottom: 24 }}>{p.desc}</p>
                <button className={p.highlight ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center', marginBottom: 28 }}
                  onClick={() => p.price === 0 ? openDiagnostic() : openSignup(p.name, annual ? p.annualPrice : p.price, annual)}>{p.cta}</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="7.5" cy="7.5" r="6.5" stroke={p.highlight ? '#7C5CFF' : 'rgba(255,255,255,0.2)'} strokeWidth="1.2"/>
                        <path d="M4.5 7.5L6.5 9.5L10.5 5.5" stroke={p.highlight ? '#7C5CFF' : 'rgba(255,255,255,0.35)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: p.highlight ? '#F5F7FF' : '#9AA3B8', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  const faqs = [
    {
      q: 'Does it cover both GMAT and GRE?',
      a: 'Yes. Tutori AI supports the GMAT Focus Edition (Quant, Verbal, Data Insights) and the GRE revised General Test (Quantitative Reasoning, Verbal Reasoning, Analytical Writing). Your diagnostic, roadmap, and practice questions are fully exam-specific.',
    },
    {
      q: 'Can I upload my own study notes?',
      a: "Yes. Upload a .txt or .md file of your notes and Tutori turns your own sentences into fill-in-the-blank practice questions, right in your browser. PDF and Word support is planned.",
    },
    {
      q: 'How accurate are the score projections?',
      a: 'The free diagnostic gives a rough estimate from a short sample of questions, so treat it as a starting point rather than a prediction of your official score. The more you practise, the better the picture of where you stand.',
    },
    {
      q: 'Do I get access to real people?',
      a: 'On the Pro + Mentor plan, yes. You get 4 × 50-minute sessions per month with a verified human expert who scored 760+ (GMAT) or 330+ (GRE). You can also book additional sessions à la carte. On the Pro plan, our human support team is available via chat for technical issues.',
    },
    {
      q: "What if I don't improve?",
      a: "Pro + Mentor subscribers who follow their roadmap (80%+ task completion) and don't improve their official score within their target window are eligible for a full refund under our Score Guarantee.",
    },
  ]

  return (
    <section id="faq" style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <AnimateIn>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7C5CFF', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>FAQ</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,48px)', color: '#F5F7FF', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Questions we actually get
            </h2>
          </div>
        </AnimateIn>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {faqs.map((f, i) => (
            <AnimateIn key={i} delay={i * 60}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', gap: 16,
                  }}
                >
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: open === i ? '#F5F7FF' : '#C5CADB', lineHeight: 1.4, transition: 'color 0.2s ease' }}>
                    {f.q}
                  </span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: open === i ? 'rgba(124,92,255,0.15)' : 'transparent',
                    transition: 'all 0.25s ease',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                      style={{ transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
                      <path d="M6 1v10M1 6h10" stroke={open === i ? '#7C5CFF' : '#9AA3B8'} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
                <div className="accordion-body" style={{ maxHeight: open === i ? 400 : 0, opacity: open === i ? 1 : 0 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9AA3B8', lineHeight: 1.7, paddingBottom: 22 }}>
                    {f.a}
                  </p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FINAL CTA
// ═══════════════════════════════════════════════════════════════════

function FinalCTA() {
  const { saveEmail, openDiagnostic } = useApp()
  const [email, setEmail] = useState('')
  const [saveFailed, setSaveFailed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ref, inView] = useInView(0.2)

  return (
    <section ref={ref} style={{ padding: 'clamp(80px,10vw,160px) clamp(24px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
      {/* Large glowing orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(124,92,255,0.18) 0%, rgba(34,211,238,0.08) 40%, transparent 70%)',
        animation: inView ? 'orb-pulse 4s ease-in-out infinite' : 'none',
      }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none', border: '1px solid rgba(124,92,255,0.15)', animation: inView ? 'ring-out 3s ease-out infinite' : 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, borderRadius: '50%', pointerEvents: 'none', border: '1px solid rgba(124,92,255,0.2)', animation: inView ? 'ring-out 3s ease-out 1s infinite' : 'none' }} />

      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <AnimateIn>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', marginBottom: 28 }}>
            <Dot color="#7C5CFF" />
            <MonoLabel accent="#7C5CFF">Free to start · No credit card</MonoLabel>
          </div>
        </AnimateIn>
        <AnimateIn delay={100}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(36px,5vw,72px)', color: '#F5F7FF', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
            Your target score is closer than you think.
          </h2>
        </AnimateIn>
        <AnimateIn delay={200}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#9AA3B8', lineHeight: 1.65, marginBottom: 40 }}>
            Take the free diagnostic. Get a projected score, your weakest areas and a two-week starting plan, today.
          </p>
        </AnimateIn>
        <AnimateIn delay={300}>
          {submitted ? (
            <div className="glass-sm" style={{ padding: '20px 32px', borderRadius: 20, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(182,255,59,0.15)', border: '1px solid rgba(182,255,59,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4 6-6" stroke="#B6FF3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#F5F7FF' }}>You're in!</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8' }}>{saveFailed ? 'Could not save your email on this device.' : 'Your email is saved on this device.'} You can take the diagnostic right now.</span>
              <button className="btn-lime" style={{ marginTop: 6 }} onClick={openDiagnostic}>Start Free Diagnostic</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); if (email) { setSaveFailed(!saveEmail(email.trim())); setSubmitted(true) } }}
              style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address" aria-label="Email address" autoComplete="email"
                required
                style={{
                  flex: 1, minWidth: 240, padding: '13px 20px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#F5F7FF', fontFamily: 'Inter, sans-serif', fontSize: 14,
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(124,92,255,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
              <button type="submit" className="btn-lime">Start Free Diagnostic</button>
            </form>
          )}
        </AnimateIn>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════

function Footer() {
  const { openDiagnostic, openBooking, openWatch } = useApp()
  const links: Record<string, { label: string; href?: string; onClick?: () => void }[]> = {
    Product: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Features', href: '#features-grid' },
      { label: 'Score projection', href: '#roadmap' },
      { label: 'Pricing', href: '#pricing' },
    ],
    'Try it': [
      { label: 'Free diagnostic', onClick: openDiagnostic },
      { label: 'Watch the tutor', onClick: openWatch },
      { label: 'Book a mentor', onClick: () => openBooking(0) },
    ],
    Help: [
      { label: 'FAQ', href: '#faq' },
      { label: 'Mentors', href: '#mentors' },
    ],
  }
  const linkStyle = { fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8', textDecoration: 'none', background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' as const }

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(60px,6vw,100px) clamp(24px,8vw,120px) 40px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(3, 1fr)', gap: 48, marginBottom: 64 }} className="r-footer">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 28, height: 28 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #7C5CFF, #22D3EE 80%)', boxShadow: '0 0 14px rgba(124,92,255,0.5)' }} />
                <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.4), transparent)' }} />
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#F5F7FF', letterSpacing: '-0.02em' }}>Tutori <span style={{ color: '#7C5CFF' }}>AI</span></span>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', lineHeight: 1.7, maxWidth: 240, marginBottom: 24 }}>
              Built with AI. Guided by humans.
            </p>
          </div>

          {Object.entries(links).map(([col, items]) => (
            <div key={col}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 13, color: '#F5F7FF', marginBottom: 16 }}>{col}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => item.href ? (
                  <a key={item.label} href={item.href} style={linkStyle}>{item.label}</a>
                ) : (
                  <button key={item.label} onClick={item.onClick} style={linkStyle}>{item.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9AA3B8' }}>
            © 2026 Tutori AI
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9AA3B8', opacity: 0.7 }}>
            Built with AI. Guided by humans.
          </span>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <AppProvider>
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolution />
        <TutorDemo />
        <FeaturesBento />
        <HowItWorks />
        <ScoreDashboard />
        <Mentorship />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
    </AppProvider>
  )
}
