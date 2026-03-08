"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const FRAMES = 8
const FRAME_DURATION = 100

export default function FrameSheetCard() {
  const [activeFrame, setActiveFrame] = useState(1)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const accumRef = useRef(0)

  useEffect(() => {
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts
      accumRef.current += Math.min(ts - lastRef.current, 100)
      lastRef.current = ts
      if (accumRef.current >= FRAME_DURATION) {
        accumRef.current -= FRAME_DURATION
        setActiveFrame(prev => (prev % FRAMES) + 1)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const gap = 6
  const scale = 1.8
  const frameW = SPRITE_W * scale
  const frameH = SPRITE_H * scale
  const totalW = FRAMES * frameW + (FRAMES - 1) * gap

  return (
    <div style={{
      width: "100%",
      height: CARD_H,
      backgroundColor: "#FFFFFF",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    }}>
      {/* Active frame large */}
      <div style={{
        position: "relative",
        width: SPRITE_W * 1.5,
        height: SPRITE_H * 1.5,
      }}>
        <img
          src={`/sprites/00${activeFrame}.svg`}
          alt=""
          width={SPRITE_W * 1.5}
          height={SPRITE_H * 1.5}
          style={{ imageRendering: "pixelated", display: "block" }}
        />
        {/* 8px grid overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.04) 0.5px, transparent 0.5px),
            linear-gradient(to bottom, rgba(0,0,0,0.04) 0.5px, transparent 0.5px)
          `,
          backgroundSize: `${8 * 1.5}px ${8 * 1.5}px`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Frame strip */}
      <div style={{
        display: "flex",
        gap,
        alignItems: "center",
        overflow: "hidden",
        maxWidth: "100%",
        padding: "0 16px",
      }}>
        {Array.from({ length: FRAMES }, (_, i) => {
          const frame = i + 1
          const isActive = frame === activeFrame
          return (
            <div
              key={frame}
              style={{
                width: frameW / 2,
                height: frameH / 2,
                flexShrink: 0,
                opacity: isActive ? 1 : 0.2,
                transition: "opacity 80ms",
                position: "relative",
              }}
            >
              <img
                src={`/sprites/00${frame}.svg`}
                alt=""
                width={frameW / 2}
                height={frameH / 2}
                style={{ imageRendering: "pixelated", display: "block" }}
              />
            </div>
          )
        })}
      </div>

      {/* Frame counter */}
      <span style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 10,
        color: "rgba(0,0,0,0.3)",
        letterSpacing: "-0.02em",
      }}>
        frame {activeFrame} / {FRAMES}
      </span>
    </div>
  )
}
