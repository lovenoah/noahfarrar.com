"use client"

import { useRef, useEffect, useMemo, useCallback, useState } from "react"

const CHARACTER_BOTTOM = "/assets/pfp-skeleton.png"
const CHARACTER_TOP = "/assets/pfp.png"

const PHOTO_W = 160
const PHOTO_H = 160
const PHOTO_COLS = 16
const PHOTO_ROWS = 16
const PHOTO_CELL_COUNT = PHOTO_COLS * PHOTO_ROWS

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

function computePhotoReveal(radius, mx, my, time, photoDitherPattern) {
  if (radius < 1) return null
  const revealed = new Map()
  const maxDist = radius
  const maxDistCheck = maxDist * 2.2
  const maxDistCheckSq = maxDistCheck * maxDistCheck
  const globalPulse = Math.sin(time * 2) * 0.06 + Math.sin(time * 3.7) * 0.04
  const breathe = 1 + Math.sin(time * 1.5) * 0.15
  const breatheRadius = maxDist * breathe * 2.2

  for (let i = 0; i < photoDitherPattern.length; i++) {
    const cell = photoDitherPattern[i]
    const dx = cell.cx - mx
    const dy = cell.cy - my
    const distSq = dx * dx + dy * dy
    if (distSq > maxDistCheckSq) continue
    const dist = Math.sqrt(distSq)
    const cellPulse = Math.sin(time * cell.speed * 0.7 + cell.phase) * 0.12
    const normalizedDist = dist / breatheRadius
    const falloff = Math.exp(-normalizedDist * normalizedDist * 1.2)
    if (falloff < 0.02) continue
    const angle = Math.atan2(dy, dx)
    const flowWobble = Math.sin(angle * 3 + time * 0.3 + dist * 0.06) * 0.15 +
                       Math.cos(angle * 5 + time * 0.18 - dist * 0.04) * 0.1 +
                       Math.sin(angle * 2 - time * 0.15 + dist * 0.08) * 0.08
    const threshold = (falloff + globalPulse + cellPulse * falloff) * (1.3 + flowWobble)
    const revealStrength = Math.max(0, Math.min(1, (threshold - cell.dither) * 2.5))
    if (revealStrength < 0.02) continue
    const baseOpacity = falloff * 0.9
    const individualVariation = 0.75 + cell.dither * 0.5
    const opacity = Math.min(1, baseOpacity * individualVariation * revealStrength)
    if (opacity < 0.02) continue
    revealed.set(i, opacity)
  }
  return revealed
}

export default function Profile_reveal() {
  const containerRef = useRef(null)
  const [containerW, setContainerW] = useState(440)
  const photoMouseRef = useRef({ x: 0, y: 0, active: false })
  const photoGlowRadiusRef = useRef(0)
  const timeRef = useRef(0)
  const glowAnimRef = useRef(null)
  const startGlowLoopRef = useRef(null)
  const photoOverlayRefs = useRef([])
  const lastPhotoOpacity = useRef(new Float32Array(PHOTO_CELL_COUNT))
  const photoContainerRef = useRef(null)
  const cachedRectRef = useRef(null)

  // Ambient sweep refs
  const ambientTimerRef = useRef(null)
  const ambientAnimRef = useRef(null)
  const scheduleAmbientRef = useRef(null)

  const photoDitherPattern = useMemo(() => generateDitherPattern(PHOTO_COLS, PHOTO_ROWS), [])

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

  // Glow animation loop (exact from IDCardWeb)
  useEffect(() => {
    const pdp = photoDitherPattern

    const startGlowLoop = () => {
      if (glowAnimRef.current) return
      let lastTime = performance.now()
      let frameCount = 0

      const animate = (now) => {
        const delta = (now - lastTime) / 1000
        lastTime = now
        frameCount++
        timeRef.current += delta

        const photoTargetRadius = photoMouseRef.current.active ? 85 : 0
        const photoDiff = photoTargetRadius - photoGlowRadiusRef.current
        if (Math.abs(photoDiff) >= 0.5) {
          photoGlowRadiusRef.current += photoDiff * (photoTargetRadius > photoGlowRadiusRef.current ? 0.14 : 0.08)
        } else {
          photoGlowRadiusRef.current = photoTargetRadius
        }

        if (frameCount % 2 === 0) {
          const photoRevealed = computePhotoReveal(
            photoGlowRadiusRef.current, photoMouseRef.current.x, photoMouseRef.current.y,
            timeRef.current, pdp
          )

          for (let i = 0; i < PHOTO_CELL_COUNT; i++) {
            const el = photoOverlayRefs.current[i]
            if (!el) continue
            const newOpacity = photoRevealed ? (photoRevealed.get(i) ?? 0) : 0
            const quantized = Math.round(newOpacity * 50) / 50
            if (quantized === lastPhotoOpacity.current[i]) continue
            lastPhotoOpacity.current[i] = quantized
            el.style.opacity = newOpacity
          }
        }

        const stillAnimating = Math.abs(photoTargetRadius - photoGlowRadiusRef.current) >= 0.5 || photoTargetRadius !== 0
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
  }, [photoDitherPattern])

  // Ambient photo sweep (exact from IDCardWeb)
  useEffect(() => {
    function scheduleNextSweep() {
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current)
      const delay = 3000 + Math.random() * 4000
      ambientTimerRef.current = setTimeout(runSweep, delay)
    }

    scheduleAmbientRef.current = scheduleNextSweep

    function runSweep() {
      if (ambientAnimRef.current) return

      const edge = Math.floor(Math.random() * 4)
      let startX, startY, endX, endY
      const w = PHOTO_COLS * 10
      const h = PHOTO_ROWS * 10
      if (edge === 0) { startX = -10; startY = 20 + Math.random() * (h - 40); endX = w + 10; endY = 20 + Math.random() * (h - 40) }
      else if (edge === 1) { startX = 20 + Math.random() * (w - 40); startY = -10; endX = 20 + Math.random() * (w - 40); endY = h + 10 }
      else if (edge === 2) { startX = w + 10; startY = 20 + Math.random() * (h - 40); endX = -10; endY = 20 + Math.random() * (h - 40) }
      else { startX = 20 + Math.random() * (w - 40); startY = h + 10; endX = 20 + Math.random() * (w - 40); endY = -10 }

      const duration = 1500 + Math.random() * 1000
      const sweepStart = performance.now()
      let started = false

      function animateSweep(now) {
        const elapsed = now - sweepStart
        const rawT = Math.min(1, elapsed / duration)
        const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2

        const pm = photoMouseRef.current
        pm.x = startX + (endX - startX) * t
        pm.y = startY + (endY - startY) * t
        pm.active = true

        if (!started) { startGlowLoopRef.current?.(); started = true }

        if (rawT < 1) {
          ambientAnimRef.current = requestAnimationFrame(animateSweep)
        } else {
          pm.active = false
          startGlowLoopRef.current?.()
          ambientAnimRef.current = null
          scheduleNextSweep()
        }
      }

      ambientAnimRef.current = requestAnimationFrame(animateSweep)
    }

    const initTimer = setTimeout(() => { scheduleNextSweep() }, 1500)

    return () => {
      clearTimeout(initTimer)
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current)
      if (ambientAnimRef.current) cancelAnimationFrame(ambientAnimRef.current)
    }
  }, [])

  const handlePointerMove = useCallback((e) => {
    const container = photoContainerRef.current
    if (!container) return
    const rect = cachedRectRef.current || container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Cancel ambient when user interacts
    if (ambientAnimRef.current) { cancelAnimationFrame(ambientAnimRef.current); ambientAnimRef.current = null }
    if (ambientTimerRef.current) { clearTimeout(ambientTimerRef.current); ambientTimerRef.current = null }

    const pm = photoMouseRef.current
    pm.x = (x / rect.width) * (PHOTO_COLS * 10)
    pm.y = (y / rect.height) * (PHOTO_ROWS * 10)
    pm.active = true
    startGlowLoopRef.current?.()
  }, [])

  const handlePointerDown = useCallback(() => {
    if (photoContainerRef.current) cachedRectRef.current = photoContainerRef.current.getBoundingClientRect()
  }, [])

  const handlePointerEnd = useCallback(() => {
    cachedRectRef.current = null
    photoMouseRef.current.active = false
    startGlowLoopRef.current?.()
    if (!ambientTimerRef.current) scheduleAmbientRef.current?.()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: 240,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={photoContainerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        style={{
          position: "relative",
          width: Math.min(PHOTO_W, containerW - 40),
          height: PHOTO_H,
          overflow: "hidden",
          border: "0.5px solid #EAECF2",
          boxSizing: "border-box",
          cursor: "pointer",
          touchAction: "none",
        }}
      >
        <img src={CHARACTER_BOTTOM} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: 0, width: PHOTO_W, height: PHOTO_H, transform: "translateX(-50%)" }} />
        <img src={CHARACTER_TOP} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: 0, width: PHOTO_W, height: PHOTO_H, transform: "translateX(-50%)" }} />
        {/* Dither overlay cells */}
        {photoDitherPattern.map((cell, i) => {
          const scale = PHOTO_W / (PHOTO_COLS * 10)
          const clipW = Math.min(PHOTO_W, containerW - 40)
          const offset = (PHOTO_W - clipW) / 2
          return (
            <div
              key={`photo-reveal-${i}`}
              ref={el => { photoOverlayRefs.current[i] = el }}
              style={{
                position: "absolute",
                left: cell.x * scale - offset,
                top: cell.y * scale,
                width: PHOTO_W / PHOTO_COLS,
                height: PHOTO_H / PHOTO_ROWS,
                pointerEvents: "none",
                backgroundImage: `url("${CHARACTER_BOTTOM}")`,
                backgroundSize: `${PHOTO_W}px ${PHOTO_H}px`,
                backgroundPosition: `${-cell.x * scale}px ${-cell.y * scale}px`,
                opacity: 0,
                transition: "opacity 0.15s ease",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
