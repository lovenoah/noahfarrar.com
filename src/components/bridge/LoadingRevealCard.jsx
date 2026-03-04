"use client"

import { useRef, useEffect, useState } from "react"

const CARD_H = 240

// Mini ID card dimensions (design-time maximums)
const MINI_W = 220
const MINI_H = 155
const MINI_R = 20
const BORDER_W = 10

export default function Loadin() {
  const containerRef = useRef(null)
  const miniCardRef = useRef(null)
  const overlayRef = useRef(null)
  const borderRef = useRef(null)
  const shadowRef = useRef(null)
  const revealedRef = useRef(false)
  const cycleTimerRef = useRef(null)
  const [containerW, setContainerW] = useState(440)

  // Track container width for responsive reflow
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

  // Responsive horizontal dimensions — heights stay fixed
  const miniW = Math.min(MINI_W, Math.max(100, containerW * 0.5))
  const innerRight = miniW - BORDER_W - 8

  // Faux element widths: clamp to available space, hide below 6px to avoid slivers
  const clampW = (orig, left) => { const a = innerRight - left; return a >= 6 ? Math.min(orig, a) : 0 }
  const photoW = clampW(50, 20)
  const label1W = clampW(28, 80)
  const value1W = clampW(56, 80)
  const label2W = clampW(36, 80)
  const value2W = clampW(44, 80)

  // Ref for triggerReveal to read current miniW
  const miniWRef = useRef(miniW)
  miniWRef.current = miniW

  function triggerReveal() {
    const overlay = overlayRef.current
    const miniCard = miniCardRef.current
    if (!overlay || !miniCard) return

    const currentMiniW = miniWRef.current

    overlay.style.display = ""
    overlay.style.background = "none"
    revealedRef.current = false

    miniCard.style.transition = "none"
    miniCard.style.transform = "scale(0.9)"

    if (borderRef.current) {
      borderRef.current.style.transition = "none"
      borderRef.current.style.opacity = "0"
    }
    if (shadowRef.current) {
      shadowRef.current.style.transition = "none"
      shadowRef.current.style.opacity = "0"
    }

    while (overlay.firstChild) overlay.removeChild(overlay.firstChild)

    const cols = Math.ceil(currentMiniW / 14)
    const rows = Math.ceil(MINI_H / 14)
    const centerX = (cols - 1) / 2
    const centerY = (rows - 1) / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)

    const cells = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const el = document.createElement("div")
        const dx = col - centerX
        const dy = row - centerY
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist
        const dither = ((col * 7 + row * 13) % 17) / 17 * 0.3
        const delay = dist * 500 + dither * 160
        el.style.cssText = `position:absolute;left:${col * 14}px;top:${row * 14}px;width:14px;height:14px;background:white;opacity:1;transition:opacity 0.35s ease-out;transition-delay:${delay.toFixed(0)}ms;`
        overlay.appendChild(el)
        cells.push(el)
      }
    }

    const minDelay = new Promise(resolve => setTimeout(resolve, 250))

    minDelay.then(() => {
      if (!overlayRef.current) return
      miniCard.style.transition = "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)"
      miniCard.style.transform = "scale(1)"
      cells.forEach(el => { el.style.opacity = "0" })

      if (borderRef.current) {
        borderRef.current.style.transition = "opacity 0.6s ease-out 0.15s"
        borderRef.current.style.opacity = "1"
      }
      if (shadowRef.current) {
        shadowRef.current.style.transition = "opacity 0.6s ease-out 0.15s"
        shadowRef.current.style.opacity = "1"
      }
      setTimeout(() => {
        if (overlayRef.current) overlayRef.current.style.display = "none"
        revealedRef.current = true
      }, 1000)
    })
  }

  useEffect(() => {
    triggerReveal()
    cycleTimerRef.current = setInterval(() => { triggerReveal() }, 5000)
    return () => { if (cycleTimerRef.current) clearInterval(cycleTimerRef.current) }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: CARD_H,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <style>{`
        @keyframes loadingShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Mini ID Card */}
      <div
        ref={miniCardRef}
        style={{
          position: "relative",
          width: miniW,
          height: MINI_H,
          borderRadius: MINI_R,
          overflow: "hidden",
          backgroundColor: "white",
          boxShadow: "0px 16px 28px -8px rgba(0,0,0,0.15)",
          transform: "scale(0.9)",
        }}
      >
        {/* Grid background */}
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.6,
          backgroundImage: "linear-gradient(to right, #EAECF2 0.5px, transparent 0.5px), linear-gradient(to bottom, #EAECF2 0.5px, transparent 0.5px)",
          backgroundSize: "10px 10px",
        }} />

        {/* Faux photo frame — stays at grid position (20,20), width clamps */}
        {photoW > 0 && <div style={{
          position: "absolute",
          left: 20,
          top: 20,
          width: photoW,
          height: 50,
          borderRadius: 4,
          backgroundColor: "#F0F1F5",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            filter: "blur(8px)",
            animation: "loadingShimmer 2.4s ease-in-out infinite",
          }} />
        </div>}

        {/* Faux text group — left positions fixed, widths clamp as border nears */}
        {/* Label 1 */}
        {label1W > 0 && <div style={{
          position: "absolute",
          left: 80,
          top: 20,
          width: label1W,
          height: 7,
          borderRadius: 3,
          backgroundColor: "#ECEDF2",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)",
            animation: "loadingShimmer 2.4s ease-in-out infinite",
            animationDelay: "0.15s",
          }} />
        </div>}
        {/* Value 1 */}
        {value1W > 0 && <div style={{
          position: "absolute",
          left: 80,
          top: 33,
          width: value1W,
          height: 9,
          borderRadius: 4,
          backgroundColor: "#E8E9EF",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)",
            animation: "loadingShimmer 2.4s ease-in-out infinite",
            animationDelay: "0.25s",
          }} />
        </div>}
        {/* Label 2 */}
        {label2W > 0 && <div style={{
          position: "absolute",
          left: 80,
          top: 48,
          width: label2W,
          height: 7,
          borderRadius: 3,
          backgroundColor: "#ECEDF2",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)",
            animation: "loadingShimmer 2.4s ease-in-out infinite",
            animationDelay: "0.35s",
          }} />
        </div>}
        {/* Value 2 */}
        {value2W > 0 && <div style={{
          position: "absolute",
          left: 80,
          top: 61,
          width: value2W,
          height: 9,
          borderRadius: 4,
          backgroundColor: "#E8E9EF",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            filter: "blur(4px)",
            animation: "loadingShimmer 2.4s ease-in-out infinite",
            animationDelay: "0.45s",
          }} />
        </div>}

        {/* Faux strip — flush to inner edge of border frame, naturally responsive */}
        <div style={{
          position: "absolute",
          left: BORDER_W,
          bottom: BORDER_W,
          right: BORDER_W,
          height: 25,
          overflow: "hidden",
          backgroundColor: "#ECEDF2",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
            filter: "blur(12px)",
            animation: "loadingShimmer 2.8s ease-in-out infinite",
            animationDelay: "0.2s",
          }} />
        </div>

        {/* Gradient border overlay */}
        <div
          ref={borderRef}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: MINI_R,
            pointerEvents: "none",
            boxSizing: "border-box",
            zIndex: 15,
            opacity: 0,
            background: `linear-gradient(to bottom, #ffffff, #E9ECF0) border-box`,
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: BORDER_W,
          }}
        />
        {/* Inner shadow */}
        <div
          ref={shadowRef}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: MINI_R,
            pointerEvents: "none",
            boxSizing: "border-box",
            boxShadow: "inset 0 -1px 3px rgba(0,0,0,0.12)",
            zIndex: 16,
            opacity: 0,
          }}
        />

        {/* Loading overlay */}
        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 19,
            pointerEvents: "none",
            overflow: "hidden",
            background: "white",
            borderRadius: MINI_R,
          }}
        />
      </div>
    </div>
  )
}
