"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const FRAMES = 8
const FRAME_DURATION = 100
const RUN_DURATION = 6500
const PAGE_SWITCH_INTERVAL = 3000
const SPARKLE_COLORS = ["#93CEFF", "#FF9FB9", "#FFD0B8", "#76AAFF", "#FFEEE5", "#F983CE", "#FACA27", "#5CA466"]

const PAGES = [
  { name: "/", label: "home" },
  { name: "/work", label: "work" },
  { name: "/thebridge", label: "the bridge" },
]

export default function PersistenceCard() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const [containerW, setContainerW] = useState(440)
  const pageRef = useRef(0)
  const pageSwitchRef = useRef(0)
  const fadeRef = useRef({ t: 0, dir: 0 })

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
    let spawnAccum = 0
    const particlesRef = []
    const frameRef = { current: 1, timer: 0 }

    const tick = (ts) => {
      if (!lastTime) lastTime = ts
      const dt = Math.min(ts - lastTime, 100)
      lastTime = ts

      // Frame cycling
      frameRef.timer += dt
      if (frameRef.timer >= FRAME_DURATION) {
        frameRef.timer -= FRAME_DURATION
        frameRef.current = (frameRef.current % FRAMES) + 1
      }

      // Page switching
      pageSwitchRef.current += dt
      const fade = fadeRef.current
      if (pageSwitchRef.current >= PAGE_SWITCH_INTERVAL - 300 && fade.dir === 0) {
        fade.dir = 1 // start fading out content
        fade.t = 0
      }
      if (fade.dir === 1) {
        fade.t = Math.min(1, fade.t + dt / 300)
        if (fade.t >= 1) {
          pageRef.current = (pageRef.current + 1) % PAGES.length
          pageSwitchRef.current = 0
          fade.dir = -1 // start fading in
          fade.t = 1
        }
      }
      if (fade.dir === -1) {
        fade.t = Math.max(0, fade.t - dt / 300)
        if (fade.t <= 0) fade.dir = 0
      }

      const contentOpacity = 1 - fade.t

      // Sprite position — continuous, never resets
      const pad = 30
      const runW = containerW - pad * 2 - SPRITE_W
      const progress = (ts % RUN_DURATION) / RUN_DURATION
      const triangleWave = progress < 0.5 ? progress * 2 : 2 - progress * 2
      const spriteX = pad + triangleWave * runW
      const spriteLineY = 60
      const spriteY = spriteLineY - SPRITE_H
      const facingRight = progress < 0.5

      // Sparkles
      spawnAccum += dt
      while (spawnAccum >= 40) {
        spawnAccum -= 40
        const behind = facingRight ? -4 : SPRITE_W + 4
        particlesRef.push({
          x: spriteX + behind + (Math.random() - 0.5) * 10,
          y: spriteY + SPRITE_H * 0.55 + (Math.random() - 0.5) * 14,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.5,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          size: 3 + Math.random() * 1.5,
        })
      }

      // Draw
      const dpr = window.devicePixelRatio || 1
      canvas.width = containerW * dpr
      canvas.height = CARD_H * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, containerW, CARD_H)

      // Draw sprite run line
      ctx.fillStyle = "rgba(0,0,0,0.06)"
      ctx.fillRect(pad, spriteLineY, containerW - pad * 2, 1)

      // Draw sparkle particles
      for (let i = particlesRef.length - 1; i >= 0; i--) {
        const p = particlesRef[i]
        p.life -= dt / 1000 / p.maxLife
        if (p.life <= 0) { particlesRef.splice(i, 1); continue }
        ctx.globalAlpha = p.life * p.life * 0.7
        ctx.fillStyle = p.color
        const s = p.size * (0.5 + p.life * 0.5)
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
      }
      ctx.globalAlpha = 1

      // Page content (fading blocks)
      const contentY = spriteLineY + 24
      const page = PAGES[pageRef.current]

      ctx.globalAlpha = contentOpacity

      // Page name
      ctx.font = "500 13px 'Geist', sans-serif"
      ctx.fillStyle = "#030303"
      ctx.textAlign = "left"
      ctx.fillText(page.label, pad, contentY + 14)

      // Skeleton content lines
      const lineColors = ["rgba(0,0,0,0.08)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.06)", "rgba(0,0,0,0.04)"]
      const lineWidths = [0.7, 0.9, 0.5, 0.6]
      const maxLineW = containerW - pad * 2
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = lineColors[i]
        const lw = maxLineW * lineWidths[i]
        const ly = contentY + 32 + i * 16
        ctx.beginPath()
        roundRect(ctx, pad, ly, lw, 6, 3)
        ctx.fill()
      }

      // Page indicator dots at bottom
      ctx.globalAlpha = 1
      const dotY = CARD_H - 24
      const dotGap = 16
      const dotsW = PAGES.length * dotGap - (dotGap - 5)
      const dotsStartX = containerW / 2 - dotsW / 2
      PAGES.forEach((p, i) => {
        ctx.fillStyle = i === pageRef.current ? "#030303" : "rgba(0,0,0,0.12)"
        ctx.beginPath()
        ctx.arc(dotsStartX + i * dotGap + 2.5, dotY, i === pageRef.current ? 2.5 : 2, 0, Math.PI * 2)
        ctx.fill()
      })

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
      {/* Real sprite image layered on top for pixel-perfect rendering */}
      <SpriteLayer containerW={containerW} lineY={60} pad={30} />
    </div>
  )
}

function SpriteLayer({ containerW, lineY, pad }) {
  const spriteRef = useRef(null)
  const rafRef = useRef(0)
  const [frame, setFrame] = useState(1)
  const frameRef = useRef(1)
  const timerRef = useRef(0)

  useEffect(() => {
    let last = 0
    const tick = (ts) => {
      if (!last) last = ts
      const dt = Math.min(ts - last, 100)
      last = ts

      timerRef.current += dt
      if (timerRef.current >= FRAME_DURATION) {
        timerRef.current -= FRAME_DURATION
        frameRef.current = (frameRef.current % FRAMES) + 1
        setFrame(frameRef.current)
      }

      const runW = containerW - pad * 2 - SPRITE_W
      const progress = (ts % RUN_DURATION) / RUN_DURATION
      const tw = progress < 0.5 ? progress * 2 : 2 - progress * 2
      const x = pad + tw * runW
      const facingRight = progress < 0.5

      if (spriteRef.current) {
        spriteRef.current.style.left = `${x}px`
        spriteRef.current.style.top = `${lineY - SPRITE_H}px`
        spriteRef.current.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)"
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerW, lineY, pad])

  return (
    <img
      ref={spriteRef}
      src={`/sprites/00${frame}.svg`}
      alt=""
      width={SPRITE_W}
      height={SPRITE_H}
      style={{
        imageRendering: "pixelated",
        display: "block",
        position: "absolute",
        top: 0, left: 0,
        pointerEvents: "none",
      }}
    />
  )
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
}
