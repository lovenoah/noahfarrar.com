"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const FRAMES = 8
const FRAME_DURATION = 100
const SPARKLE_COLORS = ["#93CEFF", "#FF9FB9", "#FFD0B8", "#76AAFF", "#FFEEE5", "#F983CE", "#FACA27", "#5CA466"]
const CELL_SIZE = 3

export default function SparkleCard() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const spriteRef = useRef(null)
  const rafRef = useRef(0)
  const frameRef = useRef(1)
  const frameTimerRef = useRef(0)
  const particlesRef = useRef([])
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
    let spawnAccum = 0
    const runDuration = 6500
    const pad = 40

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

      const maxX = containerW - pad * 2 - SPRITE_W
      const progress = (ts % runDuration) / runDuration
      const triangleWave = progress < 0.5 ? progress * 2 : 2 - progress * 2
      const spriteX = pad + triangleWave * maxX
      const spriteY = CARD_H / 2 - SPRITE_H / 2
      const facingRight = progress < 0.5

      if (spriteRef.current) {
        spriteRef.current.style.left = `${spriteX}px`
        spriteRef.current.style.top = `${spriteY}px`
        spriteRef.current.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)"
      }

      // Spawn particles
      spawnAccum += dt
      const spawnInterval = 30
      while (spawnAccum >= spawnInterval) {
        spawnAccum -= spawnInterval
        const behindOffset = facingRight ? -4 : SPRITE_W + 4
        particlesRef.current.push({
          x: spriteX + behindOffset + (Math.random() - 0.5) * 12,
          y: spriteY + SPRITE_H * 0.55 + (Math.random() - 0.5) * 16,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.5,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          size: CELL_SIZE + Math.random() * 2,
        })
      }

      // Draw
      const dpr = window.devicePixelRatio || 1
      canvas.width = containerW * dpr
      canvas.height = CARD_H * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, containerW, CARD_H)

      // Draw color palette legend
      const legendY = CARD_H - 28
      const dotSize = 6
      const dotGap = 12
      const legendW = SPARKLE_COLORS.length * dotGap - (dotGap - dotSize)
      const legendStartX = containerW / 2 - legendW / 2
      SPARKLE_COLORS.forEach((color, i) => {
        ctx.fillStyle = color
        ctx.globalAlpha = 0.5
        ctx.fillRect(legendStartX + i * dotGap, legendY, dotSize, dotSize)
      })
      ctx.globalAlpha = 1

      // Particles
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt / 1000 / p.maxLife
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.globalAlpha = p.life * p.life * 0.7
        ctx.fillStyle = p.color
        const s = p.size * (0.5 + p.life * 0.5)
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
      }
      ctx.globalAlpha = 1

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
