"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const FRAMES = 8
const FRAME_DURATION = 100

export default function BubbleCard() {
  const containerRef = useRef(null)
  const spriteRef = useRef(null)
  const bubbleRef = useRef(null)
  const rafRef = useRef(0)
  const [frame, setFrame] = useState(1)
  const frameRef = useRef(1)
  const timerRef = useRef(0)

  useEffect(() => {
    let last = 0
    const bubbleState = { phase: "hidden", timer: 0 }
    const texts = ["Hi!"]
    let textIdx = 0

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

      const el = containerRef.current
      if (!el) { rafRef.current = requestAnimationFrame(tick); return }
      const cw = el.offsetWidth
      const cx = cw / 2 - SPRITE_W / 2
      const cy = CARD_H / 2 - SPRITE_H / 2 + 16

      if (spriteRef.current) {
        spriteRef.current.style.left = `${cx}px`
        spriteRef.current.style.top = `${cy}px`
      }

      // Bubble animation
      bubbleState.timer += dt
      if (bubbleState.phase === "hidden" && bubbleState.timer >= 1500) {
        bubbleState.phase = "showing"
        bubbleState.timer = 0
      } else if (bubbleState.phase === "showing" && bubbleState.timer >= 2200) {
        bubbleState.phase = "hidden"
        bubbleState.timer = 0
        textIdx = (textIdx + 1) % texts.length
      }

      if (bubbleRef.current) {
        const show = bubbleState.phase === "showing"
        const elapsed = ts
        const sway = Math.sin(elapsed * 0.0018) * 3 + Math.sin(elapsed * 0.0031) * 1.5
        const bob = Math.sin(elapsed * 0.0025) * 2 + Math.cos(elapsed * 0.0014) * 1
        const rock = Math.sin(elapsed * 0.002) * 2.5 + Math.cos(elapsed * 0.0035) * 1.5
        bubbleRef.current.style.left = `${cx + SPRITE_W / 2}px`
        bubbleRef.current.style.top = `${cy - 20}px`
        bubbleRef.current.style.opacity = show ? "1" : "0"
        bubbleRef.current.style.transform = show
          ? `translateX(-50%) translateY(${bob}px) rotate(${rock}deg)`
          : "translateX(-50%) translateY(4px) rotate(0deg)"
        bubbleRef.current.textContent = texts[textIdx]
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

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
      <div
        ref={bubbleRef}
        style={{
          position: "absolute",
          top: 0, left: 0,
          transform: "translateX(-50%) translateY(4px)",
          opacity: 0,
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          fontWeight: 400,
          color: "rgba(0,0,0,0.4)",
          letterSpacing: "-0.02em",
        }}
      />
    </div>
  )
}
