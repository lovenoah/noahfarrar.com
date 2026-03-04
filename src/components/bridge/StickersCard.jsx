"use client"

import { useRef, useCallback, useEffect, useState } from "react"

const portfolioSticker = "https://raw.githubusercontent.com/lovenoah/sticker-assets/main/portfolio_sticker_v2.svg"
const emailSticker = "https://raw.githubusercontent.com/lovenoah/sticker-assets/main/email_sticker_v2.svg"
const socialSticker = "https://raw.githubusercontent.com/lovenoah/sticker-assets/main/social_sticker_v2.svg"

const STICKERS = [
  { src: portfolioSticker, label: "Portfolio", href: "https://noahfarrar.com/portfolio", float: "floatPin", rock: "rockPin", rockDur: "3s", floatDur: "8s", floatDelay: "0s" },
  { src: emailSticker, label: "Email", href: "mailto:hello@noahfarrar.com", float: "floatEmail", rock: "rockEmail", rockDur: "4s", floatDur: "9s", floatDelay: "-3s" },
  { src: socialSticker, label: "Social", href: "https://x.com/NoahFarrar", float: "floatCode", rock: "rockCode", rockDur: "3.5s", floatDur: "7s", floatDelay: "-2s" },
]

const STICKER_W = 92
const MIN_GAP = 8

// Right sticker exits when gap would go below MIN_GAP with 3 stickers
const EXIT_RIGHT = STICKER_W * 3 + MIN_GAP * 2 + 40
// Left sticker exits when gap would go below MIN_GAP with 2 stickers
const EXIT_LEFT = STICKER_W * 2 + MIN_GAP + 40

const KEYFRAMES = `
  @keyframes rockPin {
    0%, 100% { transform: rotate(8.92deg); }
    50% { transform: rotate(12.12deg); }
  }
  @keyframes rockEmail {
    0%, 100% { transform: rotate(3.6deg); }
    50% { transform: rotate(7.2deg); }
  }
  @keyframes rockCode {
    0%, 100% { transform: rotate(-9.41deg); }
    50% { transform: rotate(-3.81deg); }
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

function Sticker({ src, rock, rockDur, float, floatDur, floatDelay, href, visible, exitDir }) {
  const innerRef = useRef(null)
  const filterRef = useRef(null)

  const handleEnter = useCallback(() => {
    if (innerRef.current) innerRef.current.style.transform = "translateY(-8px) scale(1.06)"
    if (filterRef.current) filterRef.current.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.12))"
  }, [])

  const handleLeave = useCallback(() => {
    if (innerRef.current) innerRef.current.style.transform = "translateY(0px) scale(1)"
    if (filterRef.current) filterRef.current.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
  }, [])

  const exitX = exitDir === "left" ? -120 : exitDir === "right" ? 120 : 0

  return (
    <div style={{
      width: visible ? STICKER_W : 0,
      height: 88,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: `${float} ${floatDur} ease-in-out infinite`,
      animationDelay: floatDelay,
      transformOrigin: "center center",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : `translateX(${exitX}px)`,
      transition: "width 0.25s ease",
      overflow: "visible",
      flexShrink: 0,
      pointerEvents: visible ? "auto" : "none",
    }}>
      <div
        ref={innerRef}
        style={{
          transform: "translateY(0px) scale(1)",
          transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
          cursor: "pointer",
          touchAction: "none",
        }}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
      >
        <div
          ref={filterRef}
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            transition: "filter 0.3s ease",
            animation: `${rock} ${rockDur} ease-in-out infinite`,
          }}
        >
          <img src={src} alt="" draggable={false} onContextMenu={e => e.preventDefault()} style={{ width: STICKER_W, height: 88, objectFit: "contain", WebkitTouchCallout: "none", userSelect: "none" }} />
        </div>
      </div>
    </div>
  )
}

export default function Stickers() {
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
    ? Math.min(24, Math.max(MIN_GAP, (containerW - 40 - visibleCount * STICKER_W) / (visibleCount - 1)))
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
      {STICKERS.map((s, i) => (
        <Sticker
          key={i}
          {...s}
          visible={i === 0 ? showLeft : i === 2 ? showRight : true}
          exitDir={i === 0 ? "left" : i === 2 ? "right" : null}
        />
      ))}
    </div>
  )
}
