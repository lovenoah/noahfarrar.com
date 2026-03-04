"use client"

import { useRef, useCallback, useEffect, useState } from "react"

const KEYFRAMES = `
  @keyframes tooltipSwayPin {
    0%, 100% { transform: translate(0px, 0px) rotate(-2deg); }
    33% { transform: translate(2px, -1px) rotate(1deg); }
    66% { transform: translate(-1px, 1px) rotate(-1deg); }
  }
  @keyframes tooltipSwayEmail {
    0%, 100% { transform: translate(0px, 0px) rotate(1deg); }
    33% { transform: translate(-1.5px, 1px) rotate(-2deg); }
    66% { transform: translate(1px, -0.5px) rotate(2deg); }
  }
  @keyframes tooltipSwayCode {
    0%, 100% { transform: translate(0px, 0px) rotate(2deg); }
    33% { transform: translate(1px, 1.5px) rotate(-1deg); }
    66% { transform: translate(-2px, -1px) rotate(1deg); }
  }
  @keyframes tooltipGlow {
    0%, 100% { background-color: #F983CE; }
    16.67% { background-color: #FA8D11; }
    33.33% { background-color: #5CA466; }
    50% { background-color: #0484D4; }
    66.67% { background-color: #FACA27; }
    83.33% { background-color: #92E1F4; }
  }
  @keyframes bounceBall1 {
    0%, 100% { transform: translate(0px, 0px); }
    15% { transform: translate(18px, -3px); }
    32% { transform: translate(35px, 5px); }
    48% { transform: translate(50px, -2px); }
    65% { transform: translate(30px, 6px); }
    82% { transform: translate(12px, 2px); }
  }
  @keyframes bounceBall2 {
    0%, 100% { transform: translate(0px, 0px); }
    18% { transform: translate(22px, 4px); }
    38% { transform: translate(38px, -3px); }
    58% { transform: translate(28px, 5px); }
    78% { transform: translate(10px, -2px); }
  }
  @keyframes bounceBall3 {
    0%, 100% { transform: translate(0px, 0px); }
    20% { transform: translate(15px, -4px); }
    42% { transform: translate(32px, 3px); }
    62% { transform: translate(42px, -2px); }
    80% { transform: translate(20px, 4px); }
  }
  @keyframes floatPin {
    0%, 100% { transform: translate(0px, 0px); }
    25% { transform: translate(1px, -0.7px); }
    50% { transform: translate(0px, 1px); }
    75% { transform: translate(-0.7px, -0.35px); }
  }
  @keyframes floatEmail {
    0%, 100% { transform: translate(0px, 0px); }
    25% { transform: translate(-0.7px, 0.7px); }
    50% { transform: translate(1px, 0px); }
    75% { transform: translate(0px, -1px); }
  }
  @keyframes floatCode {
    0%, 100% { transform: translate(0px, 0px); }
    25% { transform: translate(0.7px, 0.7px); }
    50% { transform: translate(-1px, -0.35px); }
    75% { transform: translate(0.35px, 1px); }
  }
`

const TOOLTIPS = [
  {
    label: "Portfolio",
    sway: "tooltipSwayPin",
    float: "floatPin",
    floatDur: "8s",
    floatDelay: "0s",
    bounce: "bounceBall1",
    bounceDur: "8s",
    glowDelay: "0s",
    href: "https://noahfarrar.com/portfolio",
  },
  {
    label: "Email",
    sway: "tooltipSwayEmail",
    float: "floatEmail",
    floatDur: "9s",
    floatDelay: "-3s",
    bounce: "bounceBall2",
    bounceDur: "9s",
    glowDelay: "-4s",
    href: "mailto:hello@noahfarrar.com",
  },
  {
    label: "Social",
    sway: "tooltipSwayCode",
    float: "floatCode",
    floatDur: "7s",
    floatDelay: "-2s",
    bounce: "bounceBall3",
    bounceDur: "7s",
    glowDelay: "-8s",
    href: "https://x.com/NoahFarrar",
  },
]

function Tooltip({ label, sway, float, floatDur, floatDelay, bounce, bounceDur, glowDelay, href, visible }) {
  const tooltipRef = useRef(null)
  const innerRef = useRef(null)

  const handleEnter = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.transform = "translateY(-8px) scale(1.06)"
    if (innerRef.current) innerRef.current.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.12))"
  }, [])

  const handleLeave = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.transform = "translateY(0px) scale(1)"
    if (innerRef.current) innerRef.current.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
  }, [])

  return (
    <div style={{
      animation: `${float} ${floatDur} ease-in-out infinite`,
      animationDelay: floatDelay,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      width: visible ? "auto" : 0,
      overflow: visible ? "visible" : "hidden",
      transition: "width 0.25s ease",
      flexShrink: 0,
    }}>
      <div
        ref={tooltipRef}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        style={{
          transform: "translateY(0px) scale(1)",
          transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
          cursor: "pointer",
          touchAction: "none",
        }}
      >
        <div
          ref={innerRef}
          style={{
          position: "relative",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid #EAECF2",
          color: "black",
          padding: "8px 16px",
          borderRadius: 16,
          fontSize: 12,
          fontFamily: "'Geist', sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.24px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          transition: "filter 0.3s ease",
          animation: `${sway} 3s ease-in-out infinite`,
        }}>
          <div style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 12,
            height: 12,
            borderRadius: "50%",
            animation: `tooltipGlow 12s ease-in-out infinite ${glowDelay}, ${bounce} ${bounceDur} ease-in-out infinite`,
            zIndex: -1,
            filter: "blur(8px)",
          }} />
          {label}
        </div>
      </div>
    </div>
  )
}

const TOOLTIP_W = 90
const MIN_GAP = 8
const EXIT_RIGHT = TOOLTIP_W * 3 + MIN_GAP * 2 + 40
const EXIT_LEFT = TOOLTIP_W * 2 + MIN_GAP + 40

export default function Tooltips() {
  const containerRef = useRef(null)
  const [containerW, setContainerW] = useState(440)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerW(Math.round(el.offsetWidth))
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width)
        if (w > 0) setContainerW(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showRight = containerW >= EXIT_RIGHT
  const showLeft = containerW >= EXIT_LEFT

  const visibleCount = showRight ? 3 : showLeft ? 2 : 1
  const gap = visibleCount > 1
    ? Math.min(20, Math.max(MIN_GAP, (containerW - 40 - visibleCount * TOOLTIP_W) / (visibleCount - 1)))
    : 0

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: 240,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
      }}
    >
      <style>{KEYFRAMES}</style>
      {TOOLTIPS.map((t, i) => (
        <Tooltip
          key={i}
          {...t}
          visible={i === 0 ? showLeft : i === 2 ? showRight : true}
        />
      ))}
    </div>
  )
}
