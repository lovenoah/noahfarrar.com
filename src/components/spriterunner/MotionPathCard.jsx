"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const FRAMES = 8
const FRAME_DURATION = 100
const RUN_DURATION = 6500
const PAD_X = 40
const PATH_Y = 140
const TRAIL_DOTS = 60

export default function MotionPathCard() {
  const containerRef = useRef(null)
  const spriteRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const frameRef = useRef(1)
  const frameTimerRef = useRef(0)
  const [frame, setFrame] = useState(1)
  const [containerW, setContainerW] = useState(440)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerW(el.offsetWidth)
    const ro = new ResizeObserver(([e]) => setContainerW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let lastTime = 0
    const trailHistory = []

    const tick = (ts) => {
      if (!lastTime) lastTime = ts
      const dt = Math.min(ts - lastTime, 100)
      lastTime = ts

      frameTimerRef.current += dt
      if (frameTimerRef.current >= FRAME_DURATION) {
        frameTimerRef.current -= FRAME_DURATION
        frameRef.current = (frameRef.current % FRAMES) + 1
        setFrame(frameRef.current)
      }

      const maxX = containerW - PAD_X * 2 - SPRITE_W
      const progress = (ts % RUN_DURATION) / RUN_DURATION
      const triangleWave = progress < 0.5 ? progress * 2 : 2 - progress * 2
      const spriteX = PAD_X + triangleWave * maxX
      const facingRight = progress < 0.5

      if (spriteRef.current) {
        spriteRef.current.style.left = `${spriteX}px`
        spriteRef.current.style.top = `${PATH_Y - SPRITE_H}px`
        spriteRef.current.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)"
      }

      // Trail history
      trailHistory.push({ x: spriteX + SPRITE_W / 2, t: ts })
      while (trailHistory.length > TRAIL_DOTS) trailHistory.shift()

      // Draw
      const dpr = window.devicePixelRatio || 1
      canvas.width = containerW * dpr
      canvas.height = CARD_H * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, containerW, CARD_H)

      // Draw triangle wave path
      ctx.beginPath()
      ctx.strokeStyle = "rgba(0,0,0,0.06)"
      ctx.lineWidth = 1
      const steps = 200
      for (let i = 0; i <= steps; i++) {
        const p = i / steps
        const tw = p < 0.5 ? p * 2 : 2 - p * 2
        const px = PAD_X + tw * maxX + SPRITE_W / 2
        if (i === 0) ctx.moveTo(px, PATH_Y)
        else ctx.lineTo(px, PATH_Y)
      }
      ctx.stroke()

      // Draw turn markers
      ctx.fillStyle = "rgba(0,0,0,0.08)"
      ctx.beginPath()
      ctx.arc(PAD_X + SPRITE_W / 2, PATH_Y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(PAD_X + maxX + SPRITE_W / 2, PATH_Y, 3, 0, Math.PI * 2)
      ctx.fill()

      // Draw motion trail dots
      const now = ts
      for (let i = 0; i < trailHistory.length; i++) {
        const dot = trailHistory[i]
        const age = (now - dot.t) / 1000
        const alpha = Math.max(0, 1 - age * 2) * 0.3
        if (alpha <= 0) continue
        ctx.globalAlpha = alpha
        ctx.fillStyle = "#93CEFF"
        const size = 2 + alpha * 2
        ctx.fillRect(dot.x - size / 2, PATH_Y - size / 2, size, size)
      }
      ctx.globalAlpha = 1

      // Labels
      ctx.font = "9px 'Geist Mono', monospace"
      ctx.fillStyle = "rgba(0,0,0,0.2)"
      ctx.textAlign = "center"
      ctx.fillText("scaleX(-1)", PAD_X + SPRITE_W / 2, PATH_Y + 16)
      ctx.fillText("scaleX(1)", PAD_X + maxX + SPRITE_W / 2, PATH_Y + 16)

      // Progress indicator
      ctx.fillStyle = "rgba(0,0,0,0.15)"
      ctx.textAlign = "center"
      ctx.fillText(`${Math.round(progress * 100)}%`, containerW / 2, CARD_H - 20)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerW])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: CARD_H,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: CARD_H,
          pointerEvents: "none",
        }}
      />
      <img
        ref={spriteRef}
        src={`/sprites/00${frame}.svg`}
        alt=""
        width={SPRITE_W}
        height={SPRITE_H}
        style={{
          imageRendering: "pixelated", display: "block",
          position: "absolute", top: 0, left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
