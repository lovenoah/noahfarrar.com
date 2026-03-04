"use client"

import { useRef, useEffect, useMemo, useCallback, useState } from "react"

// ─── Color Palettes (exact from IDCardWeb) ──────────────────────────────────
const PALETTE = [
  "#F983CE", "#09885E", "#5CA466", "#A1C8CC", "#544434", "#FA8D11", "#F6E08C", "#6C541C",
  "#965103", "#B2D4AF", "#7A5F20", "#E49C2A", "#FCA874", "#AC6C0E", "#544CAC", "#C7BFDC",
  "#513827", "#0484D4", "#FCFCE4", "#0A847F", "#5AA46C", "#B4D0AC", "#0B8E89", "#FACA27",
  "#FADD8B", "#826503", "#D4D4D4", "#967403", "#B2C81B", "#F18B91", "#647424", "#788712",
  "#F4F4EB", "#5C3C3C", "#11BBC1", "#92E1F4", "#048C84", "#80A258", "#A4C4CE", "#26464C", "#2F52BA"
]

const SUBTLE_PALETTE = [
  "#DFE1E8", "#E8EBF2", "#D8DAE2", "#EEF1F8", "#D5D8E0",
  "#F2F5FC", "#D2D5DD", "#E5E9F1", "#DCDFEA", "#EBEFF7",
  "#D9DCE6", "#F0F3FA", "#D6D9E3", "#E3E7F0", "#DEE2EC",
  "#F4F7FE", "#D3D6DF", "#E6EAF3", "#DADEE8", "#ECF0F9",
  "#D7DBE5", "#F1F4FB", "#D4D7E1", "#E4E8F2", "#DDE1EB"
]

const shuffleArray = (arr) => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ─── Flower Pattern (exact from IDCardWeb) ──────────────────────────────────
const FLOWER_PIXELS = [
  [0, 0], [10, 10], [0, 20], [10, 30], [20, 20], [30, 30], [30, 0], [40, 10],
  [40, 20], [50, 10], [50, 20], [40, 30], [50, 30], [40, 40], [30, 50], [40, 50],
  [50, 40], [50, 50], [60, 30], [60, 0], [70, 20], [80, 10], [90, 10], [80, 20],
  [70, 40], [80, 50], [90, 40], [80, 70], [90, 80], [90, 90], [80, 80], [10, 80],
  [10, 50], [0, 40], [0, 50], [20, 60], [70, 60], [10, 70], [20, 90], [30, 80],
  [60, 80], [30, 90], [60, 90], [40, 60], [50, 60], [40, 70], [50, 70], [40, 80], [50, 80]
]

// ─── Strip dimensions — shortened to fit card with padding ──────────────────
const STRIP_W = 280
const STRIP_H = 50
const STRIP_COLS = 28
const STRIP_ROWS = 5
const STRIP_CELL_COUNT = STRIP_COLS * STRIP_ROWS

// ─── Dither Pattern Generation (exact) ──────────────────────────────────────
function generateDitherPattern(cols, rows) {
  const pattern = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * 10
      const y = row * 10
      const dither1 = ((x * 7 + y * 13) % 17) / 17
      const dither2 = ((x * 11 + y * 23) % 19) / 19
      const dither3 = ((x * 3 + y * 7) % 13) / 13
      const dither = (dither1 + dither2 + dither3) / 3
      const phase = ((x * 17 + y * 31) % 100) / 100 * Math.PI * 2
      const speed = 0.8 + ((x * 13 + y * 7) % 20) / 20 * 0.6
      pattern.push({ x, y, cx: x + 5, cy: y + 5, dither, phase, speed })
    }
  }
  return pattern
}

// ─── Reveal Computation (exact) ─────────────────────────────────────────────
function computeStripReveal(radius, mx, my, time, ditherPattern) {
  if (radius < 1) return null
  const revealed = new Map()
  const maxDist = radius
  const maxDistCheck = maxDist * 2.2
  const maxDistCheckSq = maxDistCheck * maxDistCheck
  const globalPulse = Math.sin(time * 2) * 0.06 + Math.sin(time * 3.7) * 0.04
  const breathe = 1 + Math.sin(time * 1.5) * 0.15
  const breatheRadius = maxDist * breathe * 2.2

  for (let i = 0; i < ditherPattern.length; i++) {
    const cell = ditherPattern[i]
    const dx = cell.cx - mx
    const dy = cell.cy - my
    const distSq = dx * dx + dy * dy
    if (distSq > maxDistCheckSq) continue
    const dist = Math.sqrt(distSq)
    const cellPulse = Math.sin(time * cell.speed + cell.phase) * 0.2
    const normalizedDist = dist / breatheRadius
    const falloff = Math.exp(-normalizedDist * normalizedDist * 1.5)
    if (falloff < 0.02) continue
    const angle = Math.atan2(dy, dx)
    const flowWobble = Math.sin(angle * 3 + time * 0.4 + dist * 0.08) * 0.2 +
                       Math.cos(angle * 5 + time * 0.25 - dist * 0.05) * 0.15 +
                       Math.sin(angle * 2 - time * 0.2 + dist * 0.12) * 0.12 +
                       Math.cos(angle * 7 + time * 0.5) * 0.08
    const threshold = (falloff + globalPulse + cellPulse * falloff) * (1.3 + flowWobble)
    const revealStrength = Math.max(0, Math.min(1, (threshold - cell.dither) * 4))
    if (revealStrength < 0.02) continue
    const edgeFalloff = Math.pow(falloff, 0.6)
    const opacity = Math.min(1, edgeFalloff * 1.1 * revealStrength)
    revealed.set(i, opacity)
  }
  return revealed
}

// ─── Keyframes + Cell Animations (exact) ────────────────────────────────────
function generateCellAnimations(count) {
  const animations = []
  for (let i = 0; i < count; i++) {
    const shuffledVibrant = shuffleArray(PALETTE)
    const shuffledSubtle = shuffleArray(SUBTLE_PALETTE)
    const duration = 60 + Math.random() * 40
    const delay = Math.random() * -duration
    animations.push({ colorsVibrant: shuffledVibrant, colorsSubtle: shuffledSubtle, duration, delay })
  }
  return animations
}

function generateKeyframesCSS(cellAnimations) {
  const prefix = "ds"

  const subtleCellKeyframes = cellAnimations.map((anim, i) => {
    const looped = [...anim.colorsSubtle, anim.colorsSubtle[0]]
    const steps = looped.map((c, idx) => `${(idx / (looped.length - 1)) * 100}% { background-color: ${c}; }`).join(" ")
    return `@keyframes ${prefix}cellSubtle${i} { ${steps} }`
  }).join("\n")

  const vibrantCellKeyframes = cellAnimations.map((anim, i) => {
    const looped = [...anim.colorsVibrant, anim.colorsVibrant[0]]
    const steps = looped.map((c, idx) => `${(idx / (looped.length - 1)) * 100}% { background-color: ${c}; }`).join(" ")
    return `@keyframes ${prefix}cellVibrant${i} { ${steps} }`
  }).join("\n")

  const subtleStripShuffled = shuffleArray(SUBTLE_PALETTE)
  const loopedSubtle = [...subtleStripShuffled, subtleStripShuffled[0]]
  const subtleStripSteps = loopedSubtle.map((c, idx) => `${(idx / (loopedSubtle.length - 1)) * 100}% { background-color: ${c}; }`).join(" ")
  const subtleStripKf = `@keyframes ${prefix}stripSubtle { ${subtleStripSteps} }`

  const vibrantStripShuffled = shuffleArray(PALETTE)
  const loopedVibrant = [...vibrantStripShuffled, vibrantStripShuffled[0]]
  const vibrantStripSteps = loopedVibrant.map((c, idx) => `${(idx / (loopedVibrant.length - 1)) * 100}% { background-color: ${c}; }`).join(" ")
  const vibrantStripKf = `@keyframes ${prefix}stripVibrant { ${vibrantStripSteps} }`

  return [subtleCellKeyframes, vibrantCellKeyframes, subtleStripKf, vibrantStripKf].join("\n")
}

// ─── Component ──────────────────────────────────────────────────────────────
const CARD_W = 440
const CARD_H = 240

export default function Colorstrip() {
  const outerRef = useRef(null)
  const [containerW, setContainerW] = useState(CARD_W)

  useEffect(() => {
    const el = outerRef.current
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

  // Strip display width — keeps 80px margin each side, matching original layout
  const stripDisplayW = Math.floor(Math.min(STRIP_W, Math.max(40, containerW - 160)) / 10) * 10

  const stripMouseRef = useRef({ x: 0, y: 0, active: false })
  const glowRadiusRef = useRef(0)
  const timeRef = useRef(0)
  const glowAnimRef = useRef(null)
  const startGlowLoopRef = useRef(null)
  const stripVibrantRefs = useRef([])
  const flowerVibrantData = useRef([])
  const lastStripOpacity = useRef(new Float32Array(STRIP_CELL_COUNT))
  const stripRevealedSet = useRef(new Set())
  const stripContainerRef = useRef(null)
  const cachedRectRef = useRef(null)

  const ditherPattern = useMemo(() => generateDitherPattern(STRIP_COLS, STRIP_ROWS), [])
  const cellAnimations = useMemo(() => generateCellAnimations(STRIP_CELL_COUNT), [])
  const keyframesCSS = useMemo(() => generateKeyframesCSS(cellAnimations), [cellAnimations])

  // Glow animation loop (exact from IDCardWeb)
  useEffect(() => {
    const dp = ditherPattern

    const startGlowLoop = () => {
      if (glowAnimRef.current) return
      let lastTime = performance.now()
      let frameCount = 0

      const animate = (now) => {
        const delta = (now - lastTime) / 1000
        lastTime = now
        frameCount++
        timeRef.current += delta

        const targetRadius = stripMouseRef.current.active ? 85 : 0
        const glowDiff = targetRadius - glowRadiusRef.current
        if (Math.abs(glowDiff) >= 0.5) {
          glowRadiusRef.current += glowDiff * (targetRadius > glowRadiusRef.current ? 0.08 : 0.06)
        } else {
          glowRadiusRef.current = targetRadius
        }

        if (frameCount % 2 === 0) {
          const stripRevealed = computeStripReveal(
            glowRadiusRef.current, stripMouseRef.current.x, stripMouseRef.current.y,
            timeRef.current, dp
          )

          for (let i = 0; i < STRIP_CELL_COUNT; i++) {
            const el = stripVibrantRefs.current[i]
            if (!el) continue
            const newOpacity = stripRevealed ? (stripRevealed.get(i) ?? 0) : 0
            const quantized = Math.round(newOpacity * 50) / 50
            if (quantized === lastStripOpacity.current[i]) continue
            lastStripOpacity.current[i] = quantized

            if (newOpacity > 0 && !stripRevealedSet.current.has(i)) {
              el.style.transition = "opacity 0.3s ease"
              stripRevealedSet.current.add(i)
            } else if (newOpacity === 0 && stripRevealedSet.current.has(i)) {
              el.style.transition = "opacity 0.12s ease"
              stripRevealedSet.current.delete(i)
            }
            el.style.opacity = newOpacity
          }

          for (const entry of flowerVibrantData.current) {
            if (!entry?.el) continue
            const opacity = stripRevealed ? (stripRevealed.get(entry.cellIndex) ?? 0) : 0
            const quantized = Math.round(opacity * 50) / 50
            if (quantized === entry.lastOpacity) continue
            entry.lastOpacity = quantized
            if (opacity > 0 && !entry.wasRevealed) {
              entry.el.style.transition = "opacity 0.3s ease"
              entry.wasRevealed = true
            } else if (opacity === 0 && entry.wasRevealed) {
              entry.el.style.transition = "opacity 0.12s ease"
              entry.wasRevealed = false
            }
            entry.el.style.opacity = opacity
          }
        }

        const stillAnimating = Math.abs(targetRadius - glowRadiusRef.current) >= 0.5 || targetRadius !== 0
        if (stillAnimating) {
          glowAnimRef.current = requestAnimationFrame(animate)
        } else {
          glowAnimRef.current = null
        }
      }

      glowAnimRef.current = requestAnimationFrame(animate)
    }

    startGlowLoopRef.current = startGlowLoop

    return () => {
      if (glowAnimRef.current) { cancelAnimationFrame(glowAnimRef.current); glowAnimRef.current = null }
    }
  }, [ditherPattern])

  const handlePointerMove = useCallback((e) => {
    const container = stripContainerRef.current
    if (!container) return
    const rect = cachedRectRef.current || container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const sm = stripMouseRef.current
    sm.x = x
    sm.y = y
    sm.active = x >= 0 && x <= STRIP_W && y >= 0 && y <= STRIP_H
    startGlowLoopRef.current?.()
  }, [])

  const handlePointerDown = useCallback(() => {
    if (stripContainerRef.current) cachedRectRef.current = stripContainerRef.current.getBoundingClientRect()
  }, [])

  const handlePointerEnd = useCallback(() => {
    cachedRectRef.current = null
    stripMouseRef.current.active = false
    startGlowLoopRef.current?.()
  }, [])

  // Strip gradient cells
  const stripGradientCells = useMemo(() => {
    const cells = []
    for (let i = 0; i < STRIP_CELL_COUNT; i++) {
      const x = (i % STRIP_COLS) * 10
      const y = Math.floor(i / STRIP_COLS) * 10
      const anim = cellAnimations[i]
      cells.push(
        <div key={`strip-${i}`} style={{ position: "absolute", left: x, top: y, width: 10, height: 10, contain: "strict", transform: "translate3d(0,0,0)" }}>
          <div style={{ position: "absolute", inset: 0, animation: `dscellSubtle${i} ${anim.duration}s linear infinite`, animationDelay: `${anim.delay}s` }} />
          <div ref={el => { stripVibrantRefs.current[i] = el }} style={{ position: "absolute", inset: 0, animation: `dscellVibrant${i} ${anim.duration}s linear infinite`, animationDelay: `${anim.delay}s`, opacity: 0, transition: "opacity 0.12s ease" }} />
        </div>
      )
    }
    return cells
  }, [cellAnimations])

  // Flower pattern
  const flowerPattern = useMemo(() => {
    const flowers = []
    const offsets = [0, 100, 200, 260]
    let flowerIdx = 0
    offsets.forEach((offsetX, groupIdx) => {
      FLOWER_PIXELS.forEach((p, i) => {
        const scaledX = Math.floor(p[0] / 5) * 10
        const scaledY = Math.floor(p[1] / 5) * 10
        if (offsetX + scaledX < STRIP_W && scaledY < STRIP_H) {
          const col = Math.floor((offsetX + scaledX) / 10)
          const row = Math.floor(scaledY / 10)
          const cellIndex = row * STRIP_COLS + col
          const idx = flowerIdx++
          flowers.push(
            <div key={`flower-${groupIdx}-${i}`} style={{ position: "absolute", left: offsetX + scaledX, top: scaledY, width: 10, height: 10, contain: "strict", transform: "translate3d(0,0,0)" }}>
              <div style={{ position: "absolute", inset: 0, animation: "dsstripSubtle 80s linear infinite" }} />
              <div ref={el => { if (el) flowerVibrantData.current[idx] = { cellIndex, el, lastOpacity: 0, wasRevealed: false } }} style={{ position: "absolute", inset: 0, animation: "dsstripVibrant 80s linear infinite", opacity: 0, transition: "opacity 0.12s ease" }} />
            </div>
          )
        }
      })
    })
    return flowers
  }, [])

  return (
    <div ref={outerRef} style={{
      width: "100%",
      height: CARD_H,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <style>{keyframesCSS}</style>

      <div
        ref={stripContainerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        style={{
          position: "relative",
          width: stripDisplayW,
          height: STRIP_H,
          overflow: "hidden",
          cursor: "pointer",
          touchAction: "none",
        }}
      >
        {stripGradientCells}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {flowerPattern}
        </div>
        {/* Grid overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.7,
          backgroundImage: "linear-gradient(to right, #EAECF2 0.5px, transparent 0.5px), linear-gradient(to bottom, #EAECF2 0.5px, transparent 0.5px)",
          backgroundSize: "10px 10px",
        }} />
      </div>
    </div>
  )
}
