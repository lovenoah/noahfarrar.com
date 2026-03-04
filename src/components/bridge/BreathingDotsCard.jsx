"use client"

import { useEffect, useRef } from "react"

const CARD_W = 440
const CARD_H = 240

const DOT_SPACING = 20
const DOT_PADDING = 12
const REVEAL_RADIUS = 120
const TRAIL_LENGTH = 10
const TRAIL_FALLOFF = 0.7
const DOT_COLOR = "#BBBBBB"
const BREATHE_SPEED = 0.0006
const BREATHE_AMOUNT = 0.12
const HOVER_FADE_IN = 0.06
const HOVER_FADE_OUT = 0.025
const HEART_COUNT = 5
const HEART_RADIUS = 50
const HEART_FADE_SPEED = 0.04
const SPRING_STIFFNESS = 0.02
const SPRING_DAMPING = 0.9
const DOT_SIZE = 1.5

const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const simplex2D = (x, y) => {
  const n =
    Math.sin(x * 0.5 + y * 0.3) * Math.cos(y * 0.5 - x * 0.2) +
    Math.sin(x * 0.3 - y * 0.5) * 0.5 +
    Math.cos(x * 0.2 + y * 0.4) * 0.3
  return (n + 1) / 2
}

export default function Breathingdots() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const mousePos = useRef({ x: -1000, y: -1000 })
  const realMousePos = useRef({ x: -1000, y: -1000 })
  const mouseTrail = useRef([])
  const time = useRef(0)
  const dotsRef = useRef([])
  const sweepRef = useRef(null)
  const sweepActive = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    let isHovering = false
    let sweepTimer = null

    const initDots = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = CARD_W * dpr
      canvas.height = CARD_H * dpr
      canvas.style.width = CARD_W + "px"
      canvas.style.height = CARD_H + "px"
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      dotsRef.current = []
      const cols = Math.floor((CARD_W - 2 * DOT_PADDING) / DOT_SPACING) + 1
      const rows = Math.floor((CARD_H - 2 * DOT_PADDING) / DOT_SPACING) + 1
      const offsetX = (CARD_W - (cols - 1) * DOT_SPACING) / 2
      const offsetY = (CARD_H - (rows - 1) * DOT_SPACING) / 2

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const bx = offsetX + col * DOT_SPACING
          const by = offsetY + row * DOT_SPACING
          dotsRef.current.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            opacity: 0,
            heartAmount: 0,
            heartUntil: 0,
            noiseOffsetX: Math.random() * 1000,
            noiseOffsetY: Math.random() * 1000,
          })
        }
      }
      mouseTrail.current = []
    }

    function runSweep() {
      if (isHovering) { scheduleSweep(); return }

      const edge = Math.floor(Math.random() * 4)
      let startX, startY, endX, endY
      if (edge === 0) { startX = -20; startY = 30 + Math.random() * (CARD_H - 60); endX = CARD_W + 20; endY = 30 + Math.random() * (CARD_H - 60) }
      else if (edge === 1) { startX = 30 + Math.random() * (CARD_W - 60); startY = -20; endX = 30 + Math.random() * (CARD_W - 60); endY = CARD_H + 20 }
      else if (edge === 2) { startX = CARD_W + 20; startY = 30 + Math.random() * (CARD_H - 60); endX = -20; endY = 30 + Math.random() * (CARD_H - 60) }
      else { startX = 30 + Math.random() * (CARD_W - 60); startY = CARD_H + 20; endX = 30 + Math.random() * (CARD_W - 60); endY = -20 }

      const duration = 2000 + Math.random() * 1500
      const sweepStart = performance.now()
      let blendT = 0

      sweepActive.current = true

      function animateSweep(now) {
        const elapsed = now - sweepStart
        const rawT = Math.min(1, elapsed / duration)
        const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2
        const sweepX = startX + (endX - startX) * t
        const sweepY = startY + (endY - startY) * t

        if (isHovering) {
          // Smoothly blend sweep position toward the real cursor
          blendT = Math.min(1, blendT + 0.06)
          const eased = blendT * blendT * (3 - 2 * blendT) // smoothstep
          mousePos.current.x = sweepX + (realMousePos.current.x - sweepX) * eased
          mousePos.current.y = sweepY + (realMousePos.current.y - sweepY) * eased

          if (blendT >= 1) {
            // Fully handed off to cursor
            sweepActive.current = false
            return
          }
          sweepRef.current = requestAnimationFrame(animateSweep)
        } else {
          mousePos.current.x = sweepX
          mousePos.current.y = sweepY
          if (rawT < 1) { sweepRef.current = requestAnimationFrame(animateSweep) }
          else { mousePos.current = { x: -1000, y: -1000 }; sweepActive.current = false; scheduleSweep() }
        }
      }
      sweepRef.current = requestAnimationFrame(animateSweep)
    }

    function scheduleSweep() {
      if (sweepTimer) clearTimeout(sweepTimer)
      sweepTimer = setTimeout(runSweep, 2500 + Math.random() * 3000)
    }
    scheduleSweep()

    const render = () => {
      time.current += 16
      ctx.clearRect(0, 0, CARD_W, CARD_H)

      // When hovering and sweep has fully blended out, track cursor directly
      if (isHovering && !sweepActive.current && realMousePos.current.x > -500) {
        mousePos.current.x = realMousePos.current.x
        mousePos.current.y = realMousePos.current.y
      }

      if (mousePos.current.x > -500) {
        mouseTrail.current.unshift({ x: mousePos.current.x, y: mousePos.current.y })
        if (mouseTrail.current.length > TRAIL_LENGTH) mouseTrail.current.pop()
      } else {
        if (mouseTrail.current.length > 0) mouseTrail.current.pop()
      }

      const dots = dotsRef.current

      let nearestDots = []
      if (mousePos.current.x > -500) {
        dots.forEach((dot, index) => {
          const dx = dot.x - mousePos.current.x
          const dy = dot.y - mousePos.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < HEART_RADIUS * 2) nearestDots.push({ index, dist })
        })
        nearestDots.sort((a, b) => a.dist - b.dist)
        nearestDots = nearestDots.slice(0, HEART_COUNT)
      }

      const nearestIndices = new Set(nearestDots.map((d) => d.index))
      const now = Date.now()

      ctx.font = 'bold 10px "SF Mono", "Fira Code", Consolas, monospace'
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      dots.forEach((dot, index) => {
        const breatheX = simplex2D(dot.noiseOffsetX + time.current * BREATHE_SPEED, dot.noiseOffsetY) * BREATHE_AMOUNT * DOT_SPACING
        const breatheY = simplex2D(dot.noiseOffsetX, dot.noiseOffsetY + time.current * BREATHE_SPEED) * BREATHE_AMOUNT * DOT_SPACING

        const targetX = dot.baseX + breatheX - (BREATHE_AMOUNT * DOT_SPACING) / 2
        const targetY = dot.baseY + breatheY - (BREATHE_AMOUNT * DOT_SPACING) / 2

        dot.vx += (targetX - dot.x) * SPRING_STIFFNESS
        dot.vy += (targetY - dot.y) * SPRING_STIFFNESS
        dot.vx *= SPRING_DAMPING
        dot.vy *= SPRING_DAMPING
        dot.x += dot.vx
        dot.y += dot.vy

        let targetOpacity = 0
        const radiusPulse = Math.sin(time.current * 0.002) * 0.15 + 1

        mouseTrail.current.forEach((trailPoint, trailIndex) => {
          const mouseDistX = dot.x - trailPoint.x
          const mouseDistY = dot.y - trailPoint.y
          const distFromPoint = Math.sqrt(mouseDistX * mouseDistX + mouseDistY * mouseDistY)
          const trailStrength = Math.pow(TRAIL_FALLOFF, trailIndex)
          const effectiveRadius = REVEAL_RADIUS * (0.5 + 0.5 * trailStrength) * radiusPulse

          if (distFromPoint < effectiveRadius) {
            const revealFactor = 1 - distFromPoint / effectiveRadius
            const pointOpacity = easeOutCubic(revealFactor) * 0.4 * trailStrength
            targetOpacity = Math.max(targetOpacity, pointOpacity)
          }
        })

        const fadeSpeed = targetOpacity > dot.opacity ? HOVER_FADE_IN : HOVER_FADE_OUT
        dot.opacity = lerp(dot.opacity, targetOpacity, fadeSpeed)

        const isNearestHeart = nearestIndices.has(index)

        if (isNearestHeart) {
          dot.heartUntil = now + 2000 + Math.random() * 3000
          dot.heartAmount = lerp(dot.heartAmount, 1, 0.1)
        } else if (now < dot.heartUntil) {
          dot.heartAmount = lerp(dot.heartAmount, 1, 0.05)
        } else {
          dot.heartAmount = lerp(dot.heartAmount, 0, HEART_FADE_SPEED)
        }

        if (dot.opacity > 0.008) {
          ctx.fillStyle = DOT_COLOR
          ctx.globalAlpha = dot.opacity

          if (dot.heartAmount > 0.5) {
            ctx.fillText("<3", dot.x, dot.y)
          } else {
            ctx.beginPath()
            ctx.arc(dot.x, dot.y, DOT_SIZE, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(render)
    }

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width * CARD_W
      const my = (e.clientY - rect.top) / rect.height * CARD_H
      realMousePos.current = { x: mx, y: my }

      // If no sweep is blending, drive mousePos directly from cursor
      if (!sweepActive.current) {
        mousePos.current = { x: mx, y: my }
      }

      if (!isHovering) {
        isHovering = true
        // Cancel any scheduled (not yet started) sweep
        if (sweepTimer) clearTimeout(sweepTimer)
      }
    }

    const handlePointerLeave = () => {
      mousePos.current = { x: -1000, y: -1000 }
      realMousePos.current = { x: -1000, y: -1000 }
      isHovering = false
      sweepActive.current = false
      if (sweepRef.current) cancelAnimationFrame(sweepRef.current)
      scheduleSweep()
    }

    initDots()
    render()

    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerLeave)
    container.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      cancelAnimationFrame(animationRef.current)
      if (sweepRef.current) cancelAnimationFrame(sweepRef.current)
      if (sweepTimer) clearTimeout(sweepTimer)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerLeave)
      container.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [])

  return (
    <div style={{
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
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "default",
          touchAction: "none",
          zIndex: 1,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  )
}
