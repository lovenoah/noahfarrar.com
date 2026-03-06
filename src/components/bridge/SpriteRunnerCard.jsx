"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_FRAMES = 8
const SPRITE_FRAME_DURATION = 100
const SPRITE_W = 39
const SPRITE_H = 43
const SPARKLE_COLORS = ["#93CEFF", "#FF9FB9", "#FFD0B8", "#76AAFF", "#FFEEE5", "#F983CE", "#FACA27", "#5CA466"]
const CELL_SIZE = 3

const SVG_CELL = 8
const SVG_COLS = 13
const SVG_ROWS = 14
const DISPLAY_CELL = CELL_SIZE
const DISPLAY_CELL_W = DISPLAY_CELL
const DISPLAY_CELL_H = DISPLAY_CELL
const ASSEMBLY_PAD = 80
const ASSEMBLY_W = SPRITE_W + ASSEMBLY_PAD * 2
const ASSEMBLY_H = SPRITE_H + ASSEMBLY_PAD * 2
const ASSEMBLY_DUR = 800

// Phase durations
const RUN_DUR = 4000

// Quantize to N steps so cells jump in chunky 8-bit increments
const ASSEMBLY_STEPS = 8
function stepT(t) {
  return Math.round(t * ASSEMBLY_STEPS) / ASSEMBLY_STEPS
}

function reshuffleCells(cells) {
  cells.forEach((cell) => {
    const angle = Math.random() * Math.PI * 2
    const dist = 40 + Math.random() * 80
    cell.scatterX = Math.cos(angle) * dist
    cell.scatterY = Math.sin(angle) * dist - 30
    cell.delay = Math.random() * 0.25
  })
}

export default function SpriteRunnerCard() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const assemblyRef = useRef(null)
  const spriteRef = useRef(null)
  const rafRef = useRef(0)
  const frameRef = useRef(1)
  const frameTimerRef = useRef(0)
  const particlesRef = useRef([])
  const cellsRef = useRef([])
  const [frame, setFrame] = useState(1)
  const [containerW, setContainerW] = useState(400)

  // Phase state: "assembling" | "running"
  const phaseRef = useRef({ name: "assembling", elapsed: 0 })

  // Extract cell data from first frame
  useEffect(() => {
    const img = new Image()
    img.src = "/sprites/001.svg"
    img.onload = () => {
      const off = document.createElement("canvas")
      off.width = 104
      off.height = 112
      const octx = off.getContext("2d")
      if (!octx) return
      octx.drawImage(img, 0, 0, 104, 112)
      const cells = []
      for (let row = 0; row < SVG_ROWS; row++) {
        for (let col = 0; col < SVG_COLS; col++) {
          const px = octx.getImageData(col * SVG_CELL + SVG_CELL / 2, row * SVG_CELL + SVG_CELL / 2, 1, 1).data
          if (px[3] < 128) continue
          if (px[0] > 245 && px[1] > 245 && px[2] > 245) continue
          const angle = Math.random() * Math.PI * 2
          const dist = 40 + Math.random() * 80
          cells.push({
            x: col * DISPLAY_CELL_W,
            y: row * DISPLAY_CELL_H,
            w: Math.ceil(DISPLAY_CELL_W),
            h: Math.ceil(DISPLAY_CELL_H),
            color: `rgb(${px[0]},${px[1]},${px[2]})`,
            scatterX: Math.cos(angle) * dist,
            scatterY: Math.sin(angle) * dist - 30,
            delay: Math.random() * 0.25,
          })
        }
      }
      cellsRef.current = cells
    }
  }, [])

  // Track container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerW(el.offsetWidth)
    const ro = new ResizeObserver(([entry]) => setContainerW(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const runDuration = 6500
    let lastTime = 0
    let spawnAccum = 0
    const phase = phaseRef.current

    const tick = (ts) => {
      if (!lastTime) lastTime = ts
      const dt = ts - lastTime
      lastTime = ts

      const cw = containerW
      const PAD = 80
      const maxX = cw - SPRITE_W - PAD * 2
      const spriteY = CARD_H / 2 - SPRITE_H / 2

      // Frame cycling
      frameTimerRef.current += dt
      if (frameTimerRef.current >= SPRITE_FRAME_DURATION) {
        frameTimerRef.current -= SPRITE_FRAME_DURATION
        frameRef.current = (frameRef.current % SPRITE_FRAMES) + 1
        setFrame(frameRef.current)
      }

      // Sprite position
      const progress = (ts % runDuration) / runDuration
      const triangleWave = progress < 0.5 ? progress * 2 : 2 - progress * 2
      const spriteX = PAD + triangleWave * maxX
      const facingRight = progress < 0.5

      // Phase state machine
      phase.elapsed += dt

      if (phase.name === "assembling" && phase.elapsed >= ASSEMBLY_DUR) {
        phase.name = "running"
        phase.elapsed = 0
      } else if (phase.name === "running" && phase.elapsed >= RUN_DUR) {
        phase.name = "assembling"
        phase.elapsed = 0
        reshuffleCells(cellsRef.current)
      }

      // Compute assembly progress
      let assemblyT = 0
      if (phase.name === "assembling") {
        assemblyT = Math.min(1, phase.elapsed / ASSEMBLY_DUR)
      } else {
        assemblyT = 1
      }

      const isAssembling = phase.name === "assembling"
      const isAssembled = assemblyT >= 1

      // Sprite is always visible once first assembly reaches crossfade point
      if (spriteRef.current) {
        spriteRef.current.style.left = `${spriteX}px`
        spriteRef.current.style.top = `${spriteY}px`
        spriteRef.current.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)"
        let spriteOpacity = isAssembled ? 1 : 0
        if (isAssembling && assemblyT > 0.7) spriteOpacity = (assemblyT - 0.7) / 0.3
        spriteRef.current.style.opacity = String(spriteOpacity)
      }

      // Assembly canvas overlay
      const aCvs = assemblyRef.current
      if (aCvs) {
        const aCtx = aCvs.getContext("2d")
        if (aCtx && isAssembling && cellsRef.current.length > 0) {
          const dpr = window.devicePixelRatio || 1
          const bw = ASSEMBLY_W * dpr
          const bh = ASSEMBLY_H * dpr
          if (aCvs.width !== bw || aCvs.height !== bh) {
            aCvs.width = bw
            aCvs.height = bh
          }
          aCtx.setTransform(1, 0, 0, 1, 0, 0)
          aCtx.scale(dpr, dpr)
          aCtx.clearRect(0, 0, ASSEMBLY_W, ASSEMBLY_H)

          cellsRef.current.forEach((cell) => {
            const rawT = Math.max(0, Math.min(1, (assemblyT - cell.delay) / (1 - cell.delay)))
            const cellT = stepT(rawT)
            const ease = 1 - Math.pow(1 - cellT, 3)
            const scatter = 1 - ease
            const cx = ASSEMBLY_PAD + cell.x + scatter * cell.scatterX
            const cy = ASSEMBLY_PAD + cell.y + scatter * cell.scatterY
            const s = 0.6 + 0.4 * ease
            const w = cell.w * s
            const h = cell.h * s
            aCtx.globalAlpha = 0.2 + 0.8 * ease
            aCtx.fillStyle = cell.color
            aCtx.fillRect(cx + (cell.w - w) / 2, cy + (cell.h - h) / 2, w, h)
          })

          aCvs.style.left = `${spriteX - ASSEMBLY_PAD}px`
          aCvs.style.top = `${spriteY - ASSEMBLY_PAD}px`
          aCvs.style.display = "block"
        } else {
          aCvs.style.display = "none"
        }
      }

      // Sparkle particles (only while assembled)
      if (!isAssembled) { spawnAccum = 0 }
      else { spawnAccum += dt }
      const spawnInterval = 40
      while (spawnAccum >= spawnInterval) {
        spawnAccum -= spawnInterval
        const behindOffset = facingRight ? -4 : SPRITE_W + 4
        particlesRef.current.push({
          x: spriteX + behindOffset + (Math.random() - 0.5) * 10,
          y: spriteY + SPRITE_H * 0.55 + (Math.random() - 0.5) * 14,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.5,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          size: CELL_SIZE + Math.random() * 1.5,
        })
      }

      // Draw sparkle particles
      const dpr = window.devicePixelRatio || 1
      canvas.width = cw * dpr
      canvas.height = CARD_H * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, cw, CARD_H)

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
        maxWidth: 440,
        height: CARD_H,
        backgroundColor: "#FFFFFF",
        borderRadius: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: CARD_H,
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={assemblyRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ASSEMBLY_W,
          height: ASSEMBLY_H,
          pointerEvents: "none",
          display: "none",
        }}
      />
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
          top: 0,
          left: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
