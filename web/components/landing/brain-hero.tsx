'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface BrainHeroProps {
  lang?: 'vi' | 'en'
}

const T = {
  vi: {
    badge: 'Ứng dụng trị liệu ù tai #1 Việt Nam',
    title1: 'Não bộ bạn',
    title2: 'đang tạo ra âm thanh không có thật',
    title3: 'Chúng tôi giúp bạn tắt nó',
    desc: 'Tiếng ù tai không phát sinh từ tai — mà từ vùng vỏ não thính giác bị "đói" tín hiệu. Khi tai không nghe, não bộ tự sinh ra âm thanh giả để bù đắp. TinniMate phá vỡ vòng xoắn này.',
    cta1: '💬 Tư vấn miễn phí với Tinni',
    cta2: 'Tìm hiểu cơ chế',
    online: 'Tinni đang online 24/7 · Phản hồi tức thì',
    stat1: 'Người dùng',
    stat2: 'Cải thiện sau 3 tháng',
    stat3: 'Đánh giá',
    cardSignal: '🔇 Tín hiệu bị gián đoạn',
    cardSignalDesc: 'Ốc tai tổn thương → não mất tín hiệu → tự tạo âm thanh bù đắp',
    cardSource: '🔴 Nguồn gốc tiếng ù',
    cardSourceDesc: 'Vỏ não thính giác tăng hoạt động và tự tạo tiếng ù giả',
    phantomSound: 'Phantom Sound',
    phantomOrigin: 'Vỏ não sinh ra',
    freqLabel: '🎵 Tần số ù tai',
  },
  en: {
    badge: '#1 Tinnitus Therapy App',
    title1: 'Your brain',
    title2: "is generating sounds that don't exist",
    title3: "We help you silence it",
    desc: "Tinnitus doesn't come from your ears — it comes from the auditory cortex being 'starved' of input. When the ear goes silent, the brain generates phantom sounds to compensate. TinniMate breaks this cycle.",
    cta1: '💬 Free Consultation with Tinni',
    cta2: 'Learn the mechanism',
    online: 'Tinni is online 24/7 · Instant response',
    stat1: 'Users',
    stat2: 'Improved in 3 months',
    stat3: 'Rating',
    cardSignal: '🔇 Broken input signal',
    cardSignalDesc: 'Damaged cochlea → brain loses signal → brain generates phantom sounds',
    cardSource: '🔴 Source of tinnitus',
    cardSourceDesc: 'Auditory cortex hyperactivity generates the phantom ringing',
    phantomSound: 'Phantom Sound',
    phantomOrigin: 'Brain-generated',
    freqLabel: '🎵 Tinnitus frequency',
  },
}

/* ─────────────────────────────────────────────
   Frequency visualizer sub-component
───────────────────────────────────────────── */
function FreqBars() {
  const heights = [20, 35, 55, 70, 90, 100, 88, 72, 55, 38, 24, 14]
  const durations = [0.6, 0.8, 0.7, 0.9, 0.65, 0.75, 0.85, 0.7, 0.9, 0.8, 0.65, 0.95]
  return (
    <div className="flex items-end gap-[3px] h-9">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[6px] rounded-t-sm"
          style={{
            height: `${h * 0.36}px`,
            background: (i >= 4 && i <= 6)
              ? 'linear-gradient(to top, #ff6b6b, #ff9966)'
              : 'linear-gradient(to top, #fbbc00, #ffa726)',
            boxShadow: (i >= 4 && i <= 6) ? '0 0 8px rgba(255,107,107,0.5)' : 'none',
            animation: `brain-bar-dance ${durations[i]}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function BrainHero({ lang = 'vi' }: BrainHeroProps) {
  const t = T[lang]
  const containerRef = useRef<HTMLDivElement>(null)
  const [hz, setHz] = useState(4200)
  const hzRef = useRef(4200)
  const dirRef = useRef(1)

  /* Animated Hz counter */
  useEffect(() => {
    const tick = () => {
      hzRef.current += dirRef.current * (Math.random() * 30 - 15)
      if (hzRef.current > 6000) dirRef.current = -1
      if (hzRef.current < 3500) dirRef.current = 1
      setHz(Math.round(hzRef.current))
    }
    const id = setInterval(tick, 900)
    return () => clearInterval(id)
  }, [])

  /* 3D tilt on mouse move */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / rect.width
      const dy = (e.clientY - cy) / rect.height
      el.style.transform = `perspective(900px) rotateY(${dx * 10}deg) rotateX(${-dy * 6}deg)`
    }
    const onMouseLeave = () => {
      el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)'
    }
    el.style.transition = 'transform 0.18s ease'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  const hzDisplay = hz.toLocaleString('en-US')

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

        {/* ── LEFT: Copy ── */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FBBC00]/10 border border-[#FBBC00]/25 text-[#FBBC00] text-xs font-semibold mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC00] animate-pulse" />
            🧠 {t.badge}
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(26px,7vw,64px)] font-black leading-[1.08] mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-100 bg-clip-text text-transparent block">
              {t.title1}
            </span>
            <span className="text-[#938F9C] font-semibold text-[0.62em] block mt-1">
              {t.title2}
            </span>
            <span
              className="block mt-1"
              style={{
                background: 'linear-gradient(90deg, #ff6b6b 0%, #ff9966 40%, #fbbc00 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              }}
            >
              {t.title3}
            </span>
          </h1>

          {/* Body */}
          <p className="text-base text-[#938F9C] mb-9 max-w-full sm:max-w-[440px] leading-[1.7]">
            <span className="text-[#C7BFFF] font-medium">Tiếng ù tai</span> không phát sinh từ tai — mà từ vùng{' '}
            <span className="text-[#C7BFFF] font-medium">vỏ não thính giác bị "đói" tín hiệu</span>.
            Khi tai không nghe, não bộ tự sinh ra âm thanh giả để bù đắp. TinniMate phá vỡ vòng xoắn này.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Link
              href="/chat"
              className="group flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-[#402D00] text-[15px] transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #fbbc00, #ffa726)',
                boxShadow: '0 4px 24px rgba(251,188,0,0.35)',
              }}
            >
              {t.cta1}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a
              href="#education"
              className="px-6 py-3.5 border border-white/10 hover:border-[#C7BFFF]/40 text-[#CAC5CC] hover:text-white rounded-full text-sm transition-all hover:bg-[#C7BFFF]/5"
            >
              {t.cta2} →
            </a>
          </div>

          {/* Online badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-xs font-medium">{t.online}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/5">
            {[
              { value: '10K+', label: t.stat1 },
              { value: '89%', label: t.stat2 },
              { value: '4.8★', label: t.stat3 },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-[#615d6b] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: 3D Brain Knowledge Graph ── */}
        <div className="relative flex items-center justify-center w-full">
          <div
            ref={containerRef}
            className="relative overflow-hidden lg:overflow-visible"
            style={{
              width: 'min(500px, calc(100vw - 48px))',
              height: 'min(500px, calc(100vw - 48px))',
            }}
          >
            {/* Outer glow rings */}
            {['-20px', '-50px', '-85px'].map((inset, i) => (
              <div
                key={i}
                className="absolute rounded-full border"
                style={{
                  inset,
                  borderColor: [
                    'rgba(124,58,237,0.22)',
                    'rgba(99,102,241,0.13)',
                    'rgba(251,188,0,0.08)',
                  ][i],
                  animation: `brain-ring-pulse 3s ease-in-out infinite`,
                  animationDelay: `${i}s`,
                }}
              />
            ))}

            {/* ── SVG: Brain shape + edges ── */}
            <svg
              viewBox="0 0 500 500"
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 5 }}
            >
              <defs>
                {/* Brain fill — brighter, more visible */}
                <radialGradient id="bh-brainGrad" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#3d2a7a" stopOpacity="1" />
                  <stop offset="55%" stopColor="#261856" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#18103a" stopOpacity="0.85" />
                </radialGradient>
                {/* Cortex highlight */}
                <radialGradient id="bh-cortexGrad" cx="42%" cy="42%" r="60%">
                  <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                </radialGradient>
                {/* Brain outer glow */}
                <filter id="bh-brainGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Glow filters */}
                <filter id="bh-glowRed" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="bh-glowPurple" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Arrow markers */}
                <marker id="bh-arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,107,107,0.7)" />
                </marker>
                <marker id="bh-arrowGray" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(107,114,128,0.4)" />
                </marker>
              </defs>

              {/* Brain outer glow ring */}
              <ellipse cx="250" cy="220" rx="176" ry="156"
                fill="none"
                stroke="rgba(124,58,237,0.5)" strokeWidth="2"
                filter="url(#bh-brainGlow)" />

              {/* Brain body */}
              <ellipse cx="250" cy="220" rx="170" ry="150"
                fill="url(#bh-brainGrad)"
                stroke="rgba(167,139,250,0.55)" strokeWidth="2" />

              {/* Inner highlight — top-left specular 3D effect */}
              <ellipse cx="195" cy="168" rx="70" ry="42"
                fill="rgba(199,191,255,0.07)" />

              {/* Cortex glowing zone */}
              <ellipse cx="250" cy="192" rx="78" ry="58"
                fill="url(#bh-cortexGrad)" filter="url(#bh-glowRed)" />

              {/* Brain sulci / fold lines — more visible */}
              <path d="M 148 135 Q 188 106 228 126 Q 258 108 298 126 Q 328 106 368 140"
                fill="none" stroke="rgba(167,139,250,0.38)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 135 170 Q 170 152 205 167 Q 235 148 265 162 Q 295 144 330 158 Q 358 143 386 170"
                fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 122 210 Q 157 196 188 207 Q 218 192 248 203 Q 272 190 302 198 Q 332 188 368 207 Q 394 195 415 212"
                fill="none" stroke="rgba(167,139,250,0.25)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 145 245 Q 188 235 232 244 Q 262 233 296 242 Q 334 230 378 244"
                fill="none" stroke="rgba(167,139,250,0.28)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 150 278 Q 185 271 222 278 Q 248 269 282 276"
                fill="none" stroke="rgba(167,139,250,0.22)" strokeWidth="1.3" strokeLinecap="round" />
              {/* Extra temporal fold */}
              <path d="M 155 310 Q 190 302 225 310 Q 248 300 275 308"
                fill="none" stroke="rgba(167,139,250,0.18)" strokeWidth="1.2" strokeLinecap="round" />

              {/* ── EDGES ── */}

              {/* Cortex → Amygdala (red, hyperactive signal) */}
              <path d="M 205 200 Q 152 228 158 278"
                fill="none" stroke="rgba(255,107,107,0.45)" strokeWidth="2"
                strokeDasharray="6,4" markerEnd="url(#bh-arrowRed)">
                <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="1.5s" repeatCount="indefinite" />
              </path>

              {/* Cortex → Prefrontal (purple) */}
              <path d="M 238 158 Q 222 128 218 108"
                fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="2"
                strokeDasharray="5,4" markerEnd="url(#bh-arrowRed)">
                <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="1.2s" repeatCount="indefinite" />
              </path>

              {/* Cortex → Limbic (stress loop) */}
              <path d="M 290 210 Q 325 240 305 288"
                fill="none" stroke="rgba(255,107,107,0.32)" strokeWidth="1.5"
                strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="2s" repeatCount="indefinite" />
              </path>

              {/* Cortex → Hippocampus */}
              <path d="M 284 188 Q 318 172 308 177"
                fill="none" stroke="rgba(251,146,60,0.4)" strokeWidth="1.5"
                strokeDasharray="4,4">
                <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.8s" repeatCount="indefinite" />
              </path>

              {/* Thalamus → Cortex (faded: broken relay) */}
              <path d="M 148 222 Q 183 208 212 199"
                fill="none" stroke="rgba(107,114,128,0.27)" strokeWidth="1.5"
                strokeDasharray="3,7" markerEnd="url(#bh-arrowGray)">
                <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="2.5s" repeatCount="indefinite" />
              </path>

              {/* Cochlea → stem (silent) */}
              <path d="M 242 365 Q 208 375 192 390"
                fill="none" stroke="rgba(107,114,128,0.15)" strokeWidth="1.2"
                strokeDasharray="2,9" />

              {/* ── SIGNAL SPARKS (moving dots on paths) ── */}
              {/* Cortex → Amygdala */}
              <circle r="3" fill="#ff6b6b" filter="url(#bh-glowRed)">
                <animateMotion dur="1.8s" repeatCount="indefinite"
                  path="M 205 200 Q 152 228 158 278" />
                <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
              </circle>

              {/* Cortex → Prefrontal */}
              <circle r="3" fill="#ff6b6b" filter="url(#bh-glowRed)">
                <animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite"
                  path="M 238 158 Q 222 128 218 108" />
                <animate attributeName="opacity" values="0;1;0" dur="1.4s" begin="0.5s" repeatCount="indefinite" />
              </circle>

              {/* Cortex → Limbic */}
              <circle r="2.5" fill="#a78bfa" filter="url(#bh-glowPurple)">
                <animateMotion dur="2.1s" begin="0.3s" repeatCount="indefinite"
                  path="M 290 210 Q 325 240 305 288" />
                <animate attributeName="opacity" values="0;0.85;0" dur="2.1s" begin="0.3s" repeatCount="indefinite" />
              </circle>

              {/* Cochlea (broken — faint) */}
              <circle r="2" fill="rgba(156,163,175,0.4)">
                <animateMotion dur="3.5s" repeatCount="indefinite"
                  path="M 242 365 Q 208 375 192 390" />
                <animate attributeName="opacity" values="0;0.3;0" dur="3.5s" repeatCount="indefinite" />
              </circle>
            </svg>

            {/* ── Sound waves from cortex ── */}
            {[0, 0.55, 1.1, 1.65].map((delay, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: 150,
                  height: 95,
                  left: '50%',
                  top: '38%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `2px solid rgba(255,107,107,${0.65 - i * 0.14})`,
                  animation: 'brain-wave-expand 2.4s ease-out infinite',
                  animationDelay: `${delay}s`,
                  pointerEvents: 'none',
                  zIndex: 6,
                }}
              />
            ))}

            {/* ── NEURON NODES ── */}

            {/* Auditory Cortex — primary, RED */}
            <div
              className="absolute flex flex-col items-center justify-center text-center cursor-pointer select-none group"
              style={{
                width: 86, height: 86,
                top: '36%', left: '50%',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 38%, rgba(255,107,107,0.95), rgba(220,38,38,0.65))',
                border: '2px solid rgba(255,107,107,0.85)',
                boxShadow: '0 0 40px rgba(255,107,107,0.55), 0 0 80px rgba(220,38,38,0.2)',
                animation: 'brain-cortex-pulse 2s ease-in-out infinite',
                zIndex: 20,
                transition: 'transform 0.3s',
              }}
              title="Vỏ não thính giác (nguồn gốc tiếng ù)"
            >
              <span className="text-lg leading-none">🧠</span>
              <span className="text-[8px] font-bold text-white/90 leading-tight mt-0.5">VỎ NÃO<br/>THÍNH GIÁC</span>
              {/* sublabel */}
              <span
                className="absolute whitespace-nowrap text-[9px] font-semibold"
                style={{
                  bottom: -22,
                  color: '#ff6b6b',
                  background: 'rgba(12,10,20,0.75)',
                  padding: '1px 7px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,107,107,0.3)',
                }}
              >
                ⚡ Hoạt động quá mức
              </span>
            </div>

            {/* Prefrontal */}
            <NodeBubble
              style={{ top: '14%', left: '40%', width: 60, height: 60 }}
              bg="radial-gradient(circle at 38% 38%, rgba(167,139,250,0.85), rgba(124,58,237,0.5))"
              border="rgba(167,139,250,0.55)"
              glow="rgba(124,58,237,0.3)"
              label="Tiền Trán"
              labelPos="top"
              anim={{ dur: '4s', delay: '0s' }}
            >💭</NodeBubble>

            {/* Amygdala */}
            <NodeBubble
              style={{ top: '53%', left: '18%', width: 52, height: 52 }}
              bg="radial-gradient(circle at 38% 38%, rgba(251,188,0,0.85), rgba(245,158,11,0.4))"
              border="rgba(251,188,0,0.55)"
              glow="rgba(251,188,0,0.3)"
              label="Amygdala"
              labelPos="bottom"
              labelColor="#fbbc00"
              anim={{ dur: '4.5s', delay: '0.4s' }}
            >😰</NodeBubble>

            {/* Limbic */}
            <NodeBubble
              style={{ top: '53%', right: '18%', width: 48, height: 48 }}
              bg="radial-gradient(circle at 38% 38%, rgba(6,182,212,0.85), rgba(14,116,144,0.4))"
              border="rgba(6,182,212,0.55)"
              glow="rgba(6,182,212,0.3)"
              label="Limbic"
              labelPos="bottom"
              labelColor="#06b6d4"
              anim={{ dur: '3.8s', delay: '0.9s' }}
            >🔄</NodeBubble>

            {/* Thalamus */}
            <NodeBubble
              style={{ top: '32%', left: '15%', width: 44, height: 44 }}
              bg="radial-gradient(circle at 38% 38%, rgba(52,211,153,0.8), rgba(16,185,129,0.4))"
              border="rgba(52,211,153,0.5)"
              glow="rgba(52,211,153,0.25)"
              label="Đồi Thị"
              labelPos="left"
              anim={{ dur: '5s', delay: '0.2s' }}
            >📡</NodeBubble>

            {/* Hippocampus */}
            <NodeBubble
              style={{ top: '32%', right: '14%', width: 46, height: 46 }}
              bg="radial-gradient(circle at 38% 38%, rgba(251,146,60,0.8), rgba(234,88,12,0.4))"
              border="rgba(251,146,60,0.5)"
              glow="rgba(251,146,60,0.25)"
              label="Hải Mã"
              labelPos="right"
              anim={{ dur: '4.7s', delay: '0.5s' }}
            >📚</NodeBubble>

            {/* Cochlea — silent/broken */}
            <NodeBubble
              style={{ top: '70%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, opacity: 0.5 }}
              bg="radial-gradient(circle at 38% 38%, rgba(156,163,175,0.6), rgba(75,85,99,0.3))"
              border="rgba(156,163,175,0.3)"
              glow="rgba(107,114,128,0.15)"
              label="Ốc Tai ×"
              labelPos="bottom"
              anim={{ dur: '4.5s', delay: '0.7s' }}
            >🐚</NodeBubble>

            {/* ── Floating Info Cards ── */}

            {/* Card: Broken signal — top left */}
            <div
              className="absolute z-40 hidden lg:block"
              style={{
                top: '3%', left: '-10%',
                background: 'rgba(12,10,20,0.82)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(199,191,255,0.18)',
                borderRadius: 14,
                padding: '11px 15px',
                minWidth: 158,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <div className="text-[11px] font-bold text-white mb-1">{t.cardSignal}</div>
              <div className="text-[10px] text-[#938f9c] leading-[1.5] mb-2">{t.cardSignalDesc}</div>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px', borderRadius: 100,
                fontSize: 9, fontWeight: 600,
                background: 'rgba(199,191,255,0.1)',
                border: '1px solid rgba(199,191,255,0.2)',
                color: '#c7bfff',
              }}>Maladaptive Plasticity</span>
            </div>

            {/* Card: Source — bottom right */}
            <div
              className="absolute z-40 hidden lg:block"
              style={{
                bottom: '3%', right: '-8%',
                background: 'rgba(12,10,20,0.82)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,107,107,0.25)',
                borderRadius: 14,
                padding: '11px 15px',
                minWidth: 158,
                boxShadow: '0 4px 24px rgba(255,107,107,0.12)',
              }}
            >
              <div className="text-[11px] font-bold text-white mb-1">{t.cardSource}</div>
              <div className="text-[10px] text-[#938f9c] leading-[1.5] mb-2">{t.cardSourceDesc}</div>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px', borderRadius: 100,
                fontSize: 9, fontWeight: 600,
                background: 'rgba(255,107,107,0.12)',
                border: '1px solid rgba(255,107,107,0.28)',
                color: '#ff6b6b',
              }}>Cortical Hyperactivity</span>
            </div>

            {/* Card: Freq — mid left */}
            <div
              className="absolute z-40 hidden lg:block"
              style={{
                top: '44%', left: '-12%',
                background: 'rgba(12,10,20,0.82)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(251,188,0,0.2)',
                borderRadius: 14,
                padding: '11px 15px',
                width: 152,
                boxShadow: '0 4px 20px rgba(251,188,0,0.1)',
              }}
            >
              <div style={{ fontSize: 9, color: '#fbbc00', fontWeight: 700, marginBottom: 7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t.freqLabel}
              </div>
              <FreqBars />
              <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginTop: 6 }}>
                {hzDisplay} <span style={{ fontSize: 11, color: '#938f9c', fontWeight: 500 }}>Hz</span>
              </div>
              <div style={{ fontSize: 9, color: '#938f9c' }}>Phantom signal</div>
            </div>

            {/* Hz label — top right */}
            <div
              className="absolute z-40 hidden lg:block"
              style={{ top: '8%', right: '-6%' }}
            >
              <div style={{ fontSize: 10, color: '#ff6b6b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t.phantomSound}
              </div>
              <div
                style={{
                  fontSize: 30, fontWeight: 900, lineHeight: 1,
                  background: 'linear-gradient(90deg, #ff6b6b, #ffb347)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}
              >
                {hzDisplay}<span style={{ fontSize: 14, WebkitTextFillColor: '#938f9c', fontWeight: 500 }}> Hz</span>
              </div>
              <div style={{ fontSize: 10, color: '#938f9c' }}>{t.phantomOrigin}</div>
            </div>

          </div>{/* /brain-container */}
        </div>{/* /hero-right */}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   NodeBubble helper
───────────────────────────────────────────── */
function NodeBubble({
  children,
  style,
  bg,
  border,
  glow,
  label,
  labelPos,
  labelColor = 'rgba(255,255,255,0.65)',
  anim,
}: {
  children: React.ReactNode
  style: React.CSSProperties
  bg: string
  border: string
  glow: string
  label: string
  labelPos: 'top' | 'bottom' | 'left' | 'right'
  labelColor?: string
  anim: { dur: string; delay: string }
}) {
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    whiteSpace: 'nowrap',
    fontSize: 9,
    fontWeight: 600,
    color: labelColor,
    background: 'rgba(12,10,20,0.75)',
    padding: '1px 7px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    ...(labelPos === 'top' ? { top: -19, left: '50%', transform: 'translateX(-50%)' } :
      labelPos === 'bottom' ? { bottom: -19, left: '50%', transform: 'translateX(-50%)' } :
      labelPos === 'left' ? { left: -55, top: '50%', transform: 'translateY(-50%)' } :
      { right: -52, top: '50%', transform: 'translateY(-50%)' }),
  }

  return (
    <div
      className="absolute flex items-center justify-center text-base cursor-pointer"
      style={{
        ...style,
        borderRadius: '50%',
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: `0 0 20px ${glow}`,
        animation: `brain-node-float ${anim.dur} ease-in-out infinite`,
        animationDelay: anim.delay,
        zIndex: 20,
        transition: 'transform 0.3s',
      }}
      title={label}
    >
      {children}
      <span style={labelStyle}>{label}</span>
    </div>
  )
}

export default BrainHero
