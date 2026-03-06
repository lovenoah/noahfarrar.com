"use client"

import { useRef, useEffect, useState } from "react"

const SPRITE_FRAMES = 8
const SPRITE_FRAME_DURATION = 100
const SPRITE_W = 39
const SPRITE_H = 43

export default function SpriteAssemblyLoader({ size = 1 }) {
  const frameRef = useRef(1)
  const frameTimerRef = useRef(0)
  const rafRef = useRef(0)
  const [frame, setFrame] = useState(1)

  useEffect(() => {
    let lastTime = 0

    const tick = (ts) => {
      if (!lastTime) lastTime = ts
      const dt = ts - lastTime
      lastTime = ts

      frameTimerRef.current += dt
      if (frameTimerRef.current >= SPRITE_FRAME_DURATION) {
        frameTimerRef.current -= SPRITE_FRAME_DURATION
        frameRef.current = (frameRef.current % SPRITE_FRAMES) + 1
        setFrame(frameRef.current)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <img
      src={`/sprites/00${frame}.svg`}
      alt=""
      width={SPRITE_W * size}
      height={SPRITE_H * size}
      style={{
        imageRendering: "pixelated",
        display: "block",
      }}
    />
  )
}
