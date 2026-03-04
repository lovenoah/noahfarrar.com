"use client"

import { useRef, useCallback, useEffect, useState } from "react"

const CARD_H = 240

const MINI_W = 220
const MINI_H = 155
const MINI_R = 20
const BORDER_W = 10

export default function Tilt() {
  const outerRef = useRef(null)
  const miniRef = useRef(null)
  const coordRef = useRef(null)
  const cachedRect = useRef(null)
  const [containerW, setContainerW] = useState(440)

  // Track container width for responsive reflow
  useEffect(() => {
    const el = outerRef.current
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
  // Coord text: compute how many monospace chars fit in available space
  const CHAR_W = 4.8
  const coordSpace = miniW - BORDER_W * 2 - 70
  const maxCharsRef = useRef(19)
  maxCharsRef.current = Math.max(0, Math.floor(coordSpace / CHAR_W))

  const clampW = (orig, left) => { const a = innerRight - left; return a >= 6 ? Math.min(orig, a) : 0 }
  const photoW = clampW(50, 20)
  const label1W = clampW(28, 80)
  const value1W = clampW(56, 80)
  const label2W = clampW(36, 80)
  const value2W = clampW(44, 80)


  const handlePointerMove = useCallback((e) => {
    const rect = cachedRect.current
    if (!rect || !miniRef.current) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -8
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8

    miniRef.current.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`

    if (coordRef.current) {
      const full = `x: ${rotateY.toFixed(2)}°  y: ${rotateX.toFixed(2)}°`
      coordRef.current.textContent = full.slice(-maxCharsRef.current)
    }
  }, [])

  const handlePointerEnter = useCallback(() => {
    if (outerRef.current) cachedRect.current = outerRef.current.getBoundingClientRect()
    if (miniRef.current) miniRef.current.style.transition = "transform 0.12s ease-out"
  }, [])

  const handlePointerLeave = useCallback(() => {
    cachedRect.current = null
    if (miniRef.current) {
      miniRef.current.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      miniRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)"
    }
    if (coordRef.current) {
      const full = "x: 0.00°  y: 0.00°"
      coordRef.current.textContent = full.slice(-maxCharsRef.current)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
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
        cursor: "default",
        touchAction: "none",
      }}
    >
      <style>{`
        @keyframes tiltShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Mini ID card with 3D tilt */}
      <div
        ref={miniRef}
        style={{
          position: "relative",
          width: miniW,
          height: MINI_H,
          borderRadius: MINI_R,
          overflow: "hidden",
          backgroundColor: "white",
          boxShadow: "0px 16px 28px -8px rgba(0,0,0,0.15)",
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)",
          transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
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
            animation: "tiltShimmer 2.4s ease-in-out infinite",
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
            animation: "tiltShimmer 2.4s ease-in-out infinite",
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
            animation: "tiltShimmer 2.4s ease-in-out infinite",
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
            animation: "tiltShimmer 2.4s ease-in-out infinite",
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
            animation: "tiltShimmer 2.4s ease-in-out infinite",
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
            animation: "tiltShimmer 2.8s ease-in-out infinite",
            animationDelay: "0.2s",
          }} />
        </div>

        {/* Gradient border overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: MINI_R,
          pointerEvents: "none",
          boxSizing: "border-box",
          zIndex: 15,
          background: `linear-gradient(to bottom, #ffffff, #E9ECF0) border-box`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: BORDER_W,
        }} />
        {/* Inner shadow */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: MINI_R,
          pointerEvents: "none",
          boxSizing: "border-box",
          boxShadow: "inset 0 -1px 3px rgba(0,0,0,0.12)",
          zIndex: 16,
        }} />

        {/* Coordinate readout — left+right bounds, text shortens as card narrows */}
        <div
          ref={coordRef}
          style={{
            position: "absolute",
            left: BORDER_W,
            right: BORDER_W + 10,
            bottom: 45,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 8,
            color: "rgba(0,0,0,0.35)",
            letterSpacing: "-0.2px",
            lineHeight: "8px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textAlign: "right",
            zIndex: 17,
            overflow: "hidden",
          }}
        >
          {"x: 0.00°  y: 0.00°".slice(-maxCharsRef.current)}
        </div>
      </div>
    </div>
  )
}
