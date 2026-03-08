"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240
const SPRITE_W = 39
const SPRITE_H = 43
const FRAMES = 8
const FRAME_DURATION = 100

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    setMobile(mq.matches)
    const handler = (e) => setMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return mobile
}

export default function FrameSheetCard() {
  const [activeFrame, setActiveFrame] = useState(1)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const accumRef = useRef(0)
  const isMobile = useIsMobile()

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

  const gap = isMobile ? 4 : 6
  const scale = isMobile ? 1.2 : 1.8
  const largeScale = isMobile ? 1.2 : 1.5
  const frameW = SPRITE_W * scale
  const frameH = SPRITE_H * scale

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
        width: SPRITE_W * largeScale,
        height: SPRITE_H * largeScale,
      }}>
        <img
          src={`/sprites/00${activeFrame}.svg`}
          alt=""
          width={SPRITE_W * largeScale}
          height={SPRITE_H * largeScale}
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
          backgroundSize: `${8 * largeScale}px ${8 * largeScale}px`,
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
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
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
