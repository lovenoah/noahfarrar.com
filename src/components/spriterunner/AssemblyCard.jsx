"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const SVG_CELL = 8
const SVG_COLS = 13
const SVG_ROWS = 14
const CELL_SIZE = 3
const ASSEMBLY_PAD = 80
const ASSEMBLY_W = SPRITE_W + ASSEMBLY_PAD * 2
const ASSEMBLY_H = SPRITE_H + ASSEMBLY_PAD * 2
const ASSEMBLY_DUR = 800
const HOLD_DUR = 1200
const SCATTER_DUR = 600
const CYCLE = ASSEMBLY_DUR + HOLD_DUR + SCATTER_DUR

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

export default function AssemblyCard() {
  const assemblyRef = useRef(null)
  const spriteRef = useRef(null)
  const cellsRef = useRef([])
  const rafRef = useRef(0)
  const containerRef = useRef(null)
  const [containerW, setContainerW] = useState(440)
  const frameRef = useRef(1)
  const frameTimerRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerW(el.offsetWidth)
    const ro = new ResizeObserver(([e]) => setContainerW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = "/sprites/001.svg"
    img.onload = () => {
      const off = document.createElement("canvas")
      off.width = 104; off.height = 112
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
            x: col * CELL_SIZE, y: row * CELL_SIZE,
            w: Math.ceil(CELL_SIZE), h: Math.ceil(CELL_SIZE),
            color: `rgb(${px[0]},${px[1]},${px[2]})`,
            scatterX: Math.cos(angle) * dist, scatterY: Math.sin(angle) * dist - 30,
            delay: Math.random() * 0.25,
          })
        }
      }
      cellsRef.current = cells
    }
  }, [])

  useEffect(() => {
    let lastTime = 0
    let cycleStart = 0
    let inited = false

    const tick = (ts) => {
      if (!lastTime) lastTime = ts
      const dt = Math.min(ts - lastTime, 100)
      lastTime = ts

      if (!inited) { cycleStart = ts; inited = true }

      // Frame cycling
      frameTimerRef.current += dt
      if (frameTimerRef.current >= 100) {
        frameTimerRef.current -= 100
        frameRef.current = (frameRef.current % 8) + 1
        if (spriteRef.current) spriteRef.current.src = '/sprites/00' + frameRef.current + '.svg'
      }

      let ce = (ts - cycleStart) % CYCLE
      const prevCe = (ts - dt - cycleStart) % CYCLE
      if (prevCe > ce + 100) reshuffleCells(cellsRef.current)

      const centerX = containerW / 2 - SPRITE_W / 2
      const centerY = CARD_H / 2 - SPRITE_H / 2

      let assemblyT, scatterT = 0
      if (ce < ASSEMBLY_DUR) {
        assemblyT = ce / ASSEMBLY_DUR
      } else if (ce < ASSEMBLY_DUR + HOLD_DUR) {
        assemblyT = 1
      } else {
        assemblyT = 1
        scatterT = (ce - ASSEMBLY_DUR - HOLD_DUR) / SCATTER_DUR
      }

      // During scatter phase, reverse the assembly
      const effectiveT = scatterT > 0 ? 1 - scatterT : assemblyT
      const isAssembling = effectiveT < 1

      if (spriteRef.current) {
        spriteRef.current.style.left = `${centerX}px`
        spriteRef.current.style.top = `${centerY}px`
        let opacity = effectiveT >= 1 ? 1 : effectiveT > 0.7 ? (effectiveT - 0.7) / 0.3 : 0
        spriteRef.current.style.opacity = String(opacity)
      }

      const aCvs = assemblyRef.current
      if (aCvs) {
        const aCtx = aCvs.getContext("2d")
        if (aCtx && isAssembling && cellsRef.current.length > 0) {
          const dpr = window.devicePixelRatio || 1
          const bw = ASSEMBLY_W * dpr
          const bh = ASSEMBLY_H * dpr
          if (aCvs.width !== bw || aCvs.height !== bh) {
            aCvs.width = bw; aCvs.height = bh
          }
          aCtx.setTransform(1, 0, 0, 1, 0, 0)
          aCtx.scale(dpr, dpr)
          aCtx.clearRect(0, 0, ASSEMBLY_W, ASSEMBLY_H)

          cellsRef.current.forEach((cell) => {
            const rawT = Math.max(0, Math.min(1, (effectiveT - cell.delay) / (1 - cell.delay)))
            const cellT = stepT(rawT)
            const ease = 1 - Math.pow(1 - cellT, 3)
            const scatter = 1 - ease
            const cx = ASSEMBLY_PAD + cell.x + scatter * cell.scatterX
            const cy = ASSEMBLY_PAD + cell.y + scatter * cell.scatterY
            const s = 0.6 + 0.4 * ease
            const w = cell.w * s; const h = cell.h * s
            aCtx.globalAlpha = 0.2 + 0.8 * ease
            aCtx.fillStyle = cell.color
            aCtx.fillRect(cx + (cell.w - w) / 2, cy + (cell.h - h) / 2, w, h)
          })

          aCvs.style.left = `${centerX - ASSEMBLY_PAD}px`
          aCvs.style.top = `${centerY - ASSEMBLY_PAD}px`
          aCvs.style.display = "block"
        } else {
          aCvs.style.display = "none"
        }
      }

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
        ref={assemblyRef}
        style={{
          position: "absolute", left: 0, top: 0,
          width: ASSEMBLY_W, height: ASSEMBLY_H,
          pointerEvents: "none", display: "none",
        }}
      />
      <img
        ref={spriteRef}
        src="/sprites/001.svg"
        alt=""
        width={SPRITE_W}
        height={SPRITE_H}
        style={{
          imageRendering: "pixelated", display: "block",
          position: "absolute", top: 0, left: 0, opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
