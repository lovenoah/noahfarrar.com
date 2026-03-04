"use client"

import { useRef, useEffect, useCallback, useState } from "react"

const BALL_CONFIGS = [
  { fill: "#F983CE", delay: 0 },
  { fill: "#F983CE", delay: -0.5 },
  { fill: "#F983CE", delay: -1 },
  { fill: "#F983CE", delay: -1.5 },
  { fill: "#F983CE", delay: -2 },
  { fill: "#F983CE", delay: -2.5 },
  { fill: "#F983CE", delay: -3 },
  { fill: "#F983CE", delay: -3.5 },
  { fill: "#F983CE", delay: -4 },
  { fill: "#F983CE", delay: -4.5 },
]

const CARD_H = 240
const BALL_COUNT = BALL_CONFIGS.length
const BALL_R = 9
const BALL_D = BALL_R * 2
const ROW_GAP = 6

// Breakpoint: when 10 balls no longer fit in one row with margins
const STACK_THRESHOLD = BALL_COUNT * BALL_D + 80

const BALL_KEYFRAMES = `
  @keyframes ballColorCycle {
    0%, 100% { fill: #F983CE; stroke: #F983CE; }
    12.5% { fill: #FA8D11; stroke: #FA8D11; }
    25% { fill: #5CA466; stroke: #5CA466; }
    37.5% { fill: #F18B91; stroke: #F18B91; }
    50% { fill: #0484D4; stroke: #0484D4; }
    62.5% { fill: #FACA27; stroke: #FACA27; }
    75% { fill: #544CAC; stroke: #544CAC; }
    87.5% { fill: #D4D4D4; stroke: #D4D4D4; }
  }
`

export default function Balls() {
  const containerRef = useRef(null)
  const ballElsRef = useRef([])
  const ballAnimRef = useRef(null)
  const ballDataRef = useRef(
    BALL_CONFIGS.map((_, i) => ({
      x: i * BALL_D, y: 0, vx: 0, vy: 0,
      floating: false, returnTime: 0,
      homeX: i * BALL_D, homeY: 0,
    }))
  )
  const [containerW, setContainerW] = useState(440)
  const containerWRef = useRef(440)
  const layoutRef = useRef({ stacked: false, positions: [], groupX: 0, groupY: 0 })
  const prevStackedRef = useRef(false)
  const cachedRectRef = useRef(null)

  // Track container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const w = Math.round(el.offsetWidth)
    setContainerW(w)
    containerWRef.current = w
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width)
        if (w > 0) { setContainerW(w); containerWRef.current = w }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Compute layout: single row vs stacked two rows
  const stacked = containerW < STACK_THRESHOLD
  const perRow = stacked ? 5 : 10

  const rowSpan = (perRow - 1) * BALL_D
  const totalH = stacked ? BALL_D + ROW_GAP : 0
  const groupX = (containerW - rowSpan) / 2
  const groupY = stacked ? -totalH / 2 : 0

  // Build position map for each ball
  const positions = BALL_CONFIGS.map((_, i) => ({
    x: (i % perRow) * BALL_D,
    y: Math.floor(i / perRow) * (BALL_D + ROW_GAP),
  }))

  // Snapshot previous layout before overwriting
  const prevLayout = layoutRef.current
  layoutRef.current = { stacked, positions, groupX, groupY }

  // Smooth reflow when layout switches between 1-row and 2-row
  useEffect(() => {
    if (prevStackedRef.current === stacked) return
    prevStackedRef.current = stacked

    const balls = ballDataRef.current
    const els = ballElsRef.current
    const { positions: newPositions, groupX: newGX, groupY: newGY } = layoutRef.current
    const oldPositions = prevLayout.positions
    if (!oldPositions.length) return

    const oldGX = prevLayout.groupX
    const oldGY = prevLayout.groupY

    els.forEach((el, i) => {
      if (!el || balls[i].floating) return

      const oldPos = oldPositions[i]
      const newPos = newPositions[i]

      // Compensate for group transform shift — ball stays visually in place
      const startX = (oldGX + oldPos.x) - newGX
      const startY = (oldGY + oldPos.y) - newGY

      const delay = Math.random() * 400
      const duration = 0.7 + Math.random() * 0.3

      el.style.transition = "none"
      el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${duration.toFixed(2)}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay.toFixed(0)}ms`
          el.style.transform = `translate3d(${newPos.x}px, ${newPos.y}px, 0)`
        })
      })
    })
  }, [stacked])

  // Ball physics
  useEffect(() => {
    let lastTime = performance.now()

    const animate = (now) => {
      const delta = Math.min((now - lastTime) / 16.67, 2)
      lastTime = now

      const balls = ballDataRef.current
      let hasFloating = false
      const currentTime = Date.now()

      const cw = containerWRef.current
      const { groupX: gx, groupY: gy } = layoutRef.current
      const boundsLeft = BALL_R - gx
      const boundsRight = cw - gx - BALL_R
      const boundsTop = -(CARD_H / 2 + gy) + BALL_R
      const boundsBottom = (CARD_H / 2 - gy) - BALL_R

      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i]
        if (!ball.floating) continue

        if (currentTime >= ball.returnTime) {
          ball.floating = false
          ball.vx = 0
          ball.vy = 0
          const pos = layoutRef.current.positions[i]
          ball.homeX = pos.x
          ball.homeY = pos.y
          const el = ballElsRef.current[i]
          if (el) {
            el.style.transition = "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)"
            el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
            setTimeout(() => { if (el) el.style.animationPlayState = "running" }, 1000)
          }
          continue
        }

        hasFloating = true

        ball.vy += 0.015 * delta
        const drag = 1 - 0.005 * delta
        ball.vx *= drag
        ball.vy *= drag

        ball.x += ball.vx * delta
        ball.y += ball.vy * delta

        if (ball.x < boundsLeft) { ball.x = boundsLeft; ball.vx = Math.abs(ball.vx) * 0.5 }
        if (ball.x > boundsRight) { ball.x = boundsRight; ball.vx = -Math.abs(ball.vx) * 0.5 }
        if (ball.y < boundsTop) { ball.y = boundsTop; ball.vy = Math.abs(ball.vy) * 0.5 }
        if (ball.y > boundsBottom) { ball.y = boundsBottom; ball.vy = -Math.abs(ball.vy) * 0.6 }

        const el = ballElsRef.current[i]
        if (el) {
          el.style.transform = `translate3d(${ball.x}px, ${ball.y}px, 0)`
        }
      }

      if (hasFloating) {
        ballAnimRef.current = requestAnimationFrame(animate)
      } else {
        ballAnimRef.current = null
      }
    }

    ballDataRef.current._animate = animate

    return () => {
      if (ballAnimRef.current) cancelAnimationFrame(ballAnimRef.current)
    }
  }, [])

  const handleBallHover = useCallback((i) => {
    const balls = ballDataRef.current
    if (balls[i].floating) return

    const pos = layoutRef.current.positions[i]
    const angle = (Math.random() - 0.5) * Math.PI * 1.2
    const speed = 0.8 + Math.random() * 0.6

    balls[i].floating = true
    balls[i].x = pos.x
    balls[i].y = pos.y
    balls[i].returnTime = Date.now() + 4000 + Math.random() * 2000
    balls[i].vx = Math.sin(angle) * speed * 1.8
    balls[i].vy = -Math.abs(Math.cos(angle)) * speed * 1.2 - 0.5

    const el = ballElsRef.current[i]
    if (el) {
      el.style.transition = "none"
      el.style.animationPlayState = "paused"
    }

    if (!ballAnimRef.current && ballDataRef.current._animate) {
      ballAnimRef.current = requestAnimationFrame(ballDataRef.current._animate)
    }
  }, [])

  const handlePointerMove = useCallback((e) => {
    const container = containerRef.current
    if (!container) return
    if (!cachedRectRef.current) cachedRectRef.current = container.getBoundingClientRect()
    const rect = cachedRectRef.current
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const { groupX: gx, groupY: gy, positions } = layoutRef.current
    const balls = ballDataRef.current

    for (let i = 0; i < balls.length; i++) {
      if (balls[i].floating) continue
      const bx = gx + positions[i].x
      const by = CARD_H / 2 + gy + positions[i].y
      const dx = px - bx
      const dy = py - by
      if (dx * dx + dy * dy < (BALL_R + 6) * (BALL_R + 6)) {
        handleBallHover(i)
      }
    }
  }, [handleBallHover])

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => { if (containerRef.current) cachedRectRef.current = containerRef.current.getBoundingClientRect() }}
      onPointerLeave={() => { cachedRectRef.current = null }}
      style={{
        width: "100%",
        maxWidth: 440,
        height: CARD_H,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
      }}
    >
      <style>{BALL_KEYFRAMES}</style>
      <svg
        style={{
          width: "100%",
          height: CARD_H,
          overflow: "visible",
          pointerEvents: "none",
        }}
        viewBox={`0 0 ${containerW} ${CARD_H}`}
      >
        <g transform={`translate(${groupX}, ${CARD_H / 2 + groupY})`}>
          {BALL_CONFIGS.map((config, i) => {
            const pos = positions[i]
            return (
              <circle
                key={`ball-${i}`}
                ref={el => { ballElsRef.current[i] = el }}
                cx={0}
                cy={0}
                r={BALL_R}
                fill={config.fill}
                stroke={config.fill}
                strokeWidth={1}
                onPointerEnter={() => handleBallHover(i)}
                style={{
                  pointerEvents: "auto",
                  cursor: "pointer",
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                  transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  willChange: "transform",
                  animation: `ballColorCycle 24s ease-in-out infinite ${config.delay}s`,
                }}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}
