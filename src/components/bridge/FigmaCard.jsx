"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240

// Mini ID card dimensions (same as LoadingRevealCard)
const MINI_W = 220
const MINI_H = 155
const MINI_R = 20
const BORDER_W = 10

// Figma tool colors
const FIGMA_BLUE = "#0C8CE9"
const SPACING_PINK = "#FF69B4"
const HANDLE_SIZE = 6
const HANDLE_BORDER = 1

// Animation
const CYCLE_DURATION = 7000

// Easing & interpolation
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const pulse = (t) => Math.sin(clamp(t, 0, 1) * Math.PI)

// Phase timeline
const PHASES = [
  { end: 500 },     // 0: idle
  { end: 2500 },    // 1: select photo
  { end: 3000 },    // 2: transition photo -> strip
  { end: 5500 },    // 3: select + resize strip
  { end: 6500 },    // 4: fade out
  { end: 7000 },    // 5: dead space
]

function getPhase(elapsed) {
  let start = 0
  for (let i = 0; i < PHASES.length; i++) {
    const end = PHASES[i].end
    if (elapsed < end) return { phase: i, t: (elapsed - start) / (end - start) }
    start = end
  }
  return { phase: PHASES.length - 1, t: 1 }
}

export default function Figma() {
  const containerRef = useRef(null)
  const selectionRef = useRef(null)
  const handleRefs = useRef([])
  const dimBadgeRef = useRef(null)
  const spacingRef = useRef(null)
  const spacingLabelRef = useRef(null)
  const cursorRef = useRef(null)
  const stripRef = useRef(null)
  const elementsRef = useRef([])
  const miniOffsRef = useRef({ x: 0, y: 0 })
  const [containerW, setContainerW] = useState(440)

  // Track container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerW(Math.round(el.offsetWidth))
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width)
        if (w > 0) setContainerW(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Responsive horizontal dimensions
  const miniW = Math.min(MINI_W, Math.max(100, containerW * 0.5))
  const innerRight = miniW - BORDER_W - 8
  const clampW = (orig, left) => { const a = innerRight - left; return a >= 6 ? Math.min(orig, a) : 0 }
  const photoW = clampW(50, 20)
  const label1W = clampW(28, 80)
  const value1W = clampW(56, 80)
  const label2W = clampW(36, 80)
  const value2W = clampW(44, 80)
  const stripW = miniW - 2 * BORDER_W

  // Mini card offset within outer card
  const miniOffX = (containerW - miniW) / 2
  const miniOffY = (CARD_H - MINI_H) / 2
  miniOffsRef.current = { x: miniOffX, y: miniOffY }

  // Build element registry for animation
  elementsRef.current = [
    photoW > 0 && { id: "photo", left: 20, top: 20, width: photoW, height: 50 },
    label1W > 0 && { id: "label1", left: 80, top: 20, width: label1W, height: 7 },
    value1W > 0 && { id: "value1", left: 80, top: 33, width: value1W, height: 9 },
    label2W > 0 && { id: "label2", left: 80, top: 48, width: label2W, height: 7 },
    value2W > 0 && { id: "value2", left: 80, top: 61, width: value2W, height: 9 },
    { id: "strip", left: BORDER_W, top: MINI_H - BORDER_W - 25, width: stripW, height: 25 },
  ].filter(Boolean)

  // Animation loop
  useEffect(() => {
    const startTime = performance.now()
    let rafId

    const animate = () => {
      const elapsed = (performance.now() - startTime) % CYCLE_DURATION
      const { phase, t } = getPhase(elapsed)
      const offs = miniOffsRef.current
      const elements = elementsRef.current

      // Find elements by id
      const photo = elements.find(e => e.id === "photo")
      const value2 = elements.find(e => e.id === "value2")
      const strip = elements.find(e => e.id === "strip")

      // --- Determine current selection target and opacity ---
      let selElem = null
      let selOpacity = 0
      let selHeightMod = 0 // for strip resize animation
      let selTopMod = 0

      if (phase === 1) {
        selElem = photo
        selOpacity = clamp(t / 0.15, 0, 1)
      } else if (phase === 2) {
        selElem = photo
        selOpacity = 1 - easeOutQuad(t)
      } else if (phase === 3) {
        selElem = strip
        selOpacity = clamp(t / 0.08, 0, 1)
        // Resize: ramp up then back
        if (t > 0.2 && t < 0.7) {
          const resizeT = (t - 0.2) / 0.5
          const resizeAmount = resizeT < 0.5
            ? easeOutQuad(resizeT / 0.5) * 12
            : lerp(12, 0, easeInOutCubic((resizeT - 0.5) / 0.5))
          selHeightMod = resizeAmount
          selTopMod = -resizeAmount
        }
      } else if (phase === 4) {
        selElem = strip
        selOpacity = 1 - easeOutQuad(t)
      }

      // --- Compute selection rect (element bounds in overlay space) ---
      let selL = 0, selT = 0, selW = 0, selH = 0
      if (selElem) {
        selL = offs.x + selElem.left
        selT = offs.y + selElem.top + selTopMod
        selW = selElem.width
        selH = selElem.height + selHeightMod
      }

      // --- Update selection outline ---
      const sel = selectionRef.current
      if (sel) {
        if (selElem && selOpacity > 0) {
          sel.style.transform = `translate3d(${selL}px, ${selT}px, 0)`
          sel.style.width = selW + "px"
          sel.style.height = selH + "px"
          sel.style.opacity = selOpacity
        } else {
          sel.style.opacity = 0
        }
      }

      // --- Update handles at corners and edge midpoints ---
      if (selElem && selOpacity > 0) {
        const r = selL + selW
        const b = selT + selH
        const cx = selL + selW / 2
        const cy = selT + selH / 2
        // Slight sub-pixel nudge so handles visually sit on the stroke
        const leftX = selL - 0.5
        const rightX = r + 0.5
        const positions = [
          [leftX, selT], [cx, selT], [rightX, selT],
          [leftX, cy],                [rightX, cy],
          [leftX, b],   [cx, b],      [rightX, b],
        ]
        for (let i = 0; i < 8; i++) {
          const h = handleRefs.current[i]
          if (!h) continue
          const hx = Math.round(positions[i][0] * 2) / 2
          const hy = Math.round(positions[i][1] * 2) / 2
          h.style.transform = `translate3d(${hx}px, ${hy}px, 0) translate(-50%, -50%)`
          h.style.opacity = selOpacity
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const h = handleRefs.current[i]
          if (h) h.style.opacity = 0
        }
      }

      // --- Update dimension badge ---
      const badge = dimBadgeRef.current
      if (badge) {
        if (selElem && selOpacity > 0) {
          const bh = Math.round(selH)
          badge.textContent = `${selW} \u00D7 ${bh}`
          const bx = selL + selW / 2
          const by = selT + selH + 8
          badge.style.transform = `translate3d(${bx}px, ${by}px, 0) translateX(-50%)`
          badge.style.opacity = selOpacity
        } else {
          badge.style.opacity = 0
        }
      }

      // --- Update cursor ---
      const cursor = cursorRef.current
      if (cursor) {
        let cx = 0, cy = 0, cOpacity = 0

        const photoCenter = photo ? { x: offs.x + photo.left + photo.width / 2, y: offs.y + photo.top + photo.height / 2 } : { x: offs.x + 45, y: offs.y + 45 }
        const stripTop = strip ? { x: offs.x + strip.left + strip.width / 2, y: offs.y + strip.top } : photoCenter
        const restPos = { x: offs.x + 10, y: offs.y + 10 }

        if (phase === 0) {
          cx = lerp(restPos.x, photoCenter.x, easeInOutCubic(t))
          cy = lerp(restPos.y, photoCenter.y, easeInOutCubic(t))
          cOpacity = easeOutQuad(t)
        } else if (phase === 1) {
          cx = photoCenter.x + Math.sin(t * 4) * 1.5
          cy = photoCenter.y + Math.cos(t * 3) * 1
          cOpacity = 1
        } else if (phase === 2) {
          cx = lerp(photoCenter.x, stripTop.x, easeInOutCubic(t))
          cy = lerp(photoCenter.y, stripTop.y, easeInOutCubic(t))
          cOpacity = 1
        } else if (phase === 3) {
          cx = stripTop.x
          cy = stripTop.y + selTopMod
          cOpacity = 1
        } else if (phase === 4) {
          cx = stripTop.x
          cy = stripTop.y
          cOpacity = 1 - easeOutQuad(t)
        } else {
          cOpacity = 0
        }

        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
        cursor.style.opacity = cOpacity
      }

      // --- Update strip element height during resize (bottom-anchored, so height change grows upward) ---
      const stripEl = stripRef.current
      if (stripEl) {
        if (selHeightMod !== 0) {
          stripEl.style.height = 25 + selHeightMod + "px"
        } else {
          stripEl.style.height = "25px"
        }
      }

      // --- Update spacing indicator ---
      const sp = spacingRef.current
      const spLabel = spacingLabelRef.current
      if (sp && spLabel && value2 && strip) {
        if (phase === 3 && t > 0.25 && t < 0.7) {
          const gt = (t - 0.25) / 0.45
          const margin = 3
          const rawTop = offs.y + value2.top + value2.height
          const rawBottom = offs.y + strip.top + selTopMod
          const spTop = rawTop + margin
          const spBottom = rawBottom - margin
          const gap = Math.max(0, Math.round(spBottom - spTop))
          const spX = offs.x + miniW / 2
          sp.style.transform = `translate3d(${spX}px, ${spTop}px, 0)`
          sp.style.height = gap + "px"
          sp.style.opacity = pulse(gt) * 0.8
          spLabel.textContent = gap
        } else {
          sp.style.opacity = 0
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: CARD_H,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <style>{`
        @keyframes figmaShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Static mini ID card (same as LoadingRevealCard post-reveal) */}
      <div style={{
        position: "relative",
        width: miniW,
        height: MINI_H,
        borderRadius: MINI_R,
        overflow: "hidden",
        backgroundColor: "white",
        boxShadow: "0px 16px 28px -8px rgba(0,0,0,0.15)",
      }}>
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.6,
          backgroundImage: "linear-gradient(to right, #EAECF2 0.5px, transparent 0.5px), linear-gradient(to bottom, #EAECF2 0.5px, transparent 0.5px)",
          backgroundSize: "10px 10px",
        }} />

        {/* Photo frame */}
        {photoW > 0 && <div style={{
          position: "absolute", left: 20, top: 20, width: photoW, height: 50,
          borderRadius: 4, backgroundColor: "#F0F1F5", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            filter: "blur(8px)", animation: "figmaShimmer 2.4s ease-in-out infinite",
          }} />
        </div>}

        {/* Label 1 */}
        {label1W > 0 && <div style={{
          position: "absolute", left: 80, top: 20, width: label1W, height: 7,
          borderRadius: 3, backgroundColor: "#ECEDF2", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)", animation: "figmaShimmer 2.4s ease-in-out infinite", animationDelay: "0.15s",
          }} />
        </div>}

        {/* Value 1 */}
        {value1W > 0 && <div style={{
          position: "absolute", left: 80, top: 33, width: value1W, height: 9,
          borderRadius: 4, backgroundColor: "#E8E9EF", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)", animation: "figmaShimmer 2.4s ease-in-out infinite", animationDelay: "0.25s",
          }} />
        </div>}

        {/* Label 2 */}
        {label2W > 0 && <div style={{
          position: "absolute", left: 80, top: 48, width: label2W, height: 7,
          borderRadius: 3, backgroundColor: "#ECEDF2", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)", animation: "figmaShimmer 2.4s ease-in-out infinite", animationDelay: "0.35s",
          }} />
        </div>}

        {/* Value 2 */}
        {value2W > 0 && <div style={{
          position: "absolute", left: 80, top: 61, width: value2W, height: 9,
          borderRadius: 4, backgroundColor: "#E8E9EF", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)", animation: "figmaShimmer 2.4s ease-in-out infinite", animationDelay: "0.45s",
          }} />
        </div>}

        {/* Bottom strip */}
        <div
          ref={stripRef}
          style={{
            position: "absolute",
            left: BORDER_W,
            bottom: BORDER_W,
            right: BORDER_W,
            height: 25,
            overflow: "hidden",
            backgroundColor: "#ECEDF2",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
            filter: "blur(12px)", animation: "figmaShimmer 2.8s ease-in-out infinite", animationDelay: "0.2s",
          }} />
        </div>

        {/* Gradient border overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: MINI_R, pointerEvents: "none",
          boxSizing: "border-box", zIndex: 15,
          background: "linear-gradient(to bottom, #ffffff, #E9ECF0) border-box",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor", maskComposite: "exclude", padding: BORDER_W,
        }} />

        {/* Inner shadow */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: MINI_R, pointerEvents: "none",
          boxSizing: "border-box", boxShadow: "inset 0 -1px 3px rgba(0,0,0,0.12)", zIndex: 16,
        }} />
      </div>

      {/* Figma overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
        {/* Selection outline — box-shadow so it doesn't affect box dimensions */}
        <div ref={selectionRef} style={{
          position: "absolute", left: 0, top: 0,
          boxShadow: `0 0 0 1px ${FIGMA_BLUE}`,
          opacity: 0, pointerEvents: "none",
        }} />

        {/* 8 control handles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} ref={el => { handleRefs.current[i] = el }} style={{
            position: "absolute", left: 0, top: 0,
            width: HANDLE_SIZE, height: HANDLE_SIZE,
            backgroundColor: "white",
            border: `${HANDLE_BORDER}px solid ${FIGMA_BLUE}`,
            borderRadius: 1, opacity: 0, pointerEvents: "none",
          }} />
        ))}

        {/* Dimension badge */}
        <div ref={dimBadgeRef} style={{
          position: "absolute", left: 0, top: 0,
          backgroundColor: FIGMA_BLUE, color: "white",
          fontSize: 8, fontFamily: "'Geist Mono', monospace",
          padding: "2px 5px", borderRadius: 3, whiteSpace: "nowrap",
          lineHeight: "10px", letterSpacing: "-0.2px",
          opacity: 0, pointerEvents: "none",
        }} />

        {/* Spacing indicator */}
        <div ref={spacingRef} style={{
          position: "absolute", left: 0, top: 0, width: 1,
          opacity: 0, pointerEvents: "none",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{ width: 0.5, flex: 1, backgroundColor: SPACING_PINK }} />
          <span ref={spacingLabelRef} style={{
            fontSize: 7, color: SPACING_PINK,
            fontFamily: "'Geist Mono', monospace",
            padding: "0 2px", lineHeight: "9px",
          }} />
          <div style={{ width: 0.5, flex: 1, backgroundColor: SPACING_PINK }} />
        </div>

        {/* macOS cursor */}
        <div ref={cursorRef} style={{
          position: "absolute", left: 0, top: 0,
          opacity: 0, pointerEvents: "none", width: 11, height: 16,
        }}>
          <svg width="11" height="16" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 0.5L1.5 13.5L4.25 10.25L7 15L9 14L6.25 9L10.5 8.5L1.5 0.5Z" fill="black" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
