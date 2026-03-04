"use client"

import { useRef, useEffect, useState } from "react"

const PALETTE = [
  "#F983CE", "#09885E", "#5CA466", "#A1C8CC", "#544434", "#FA8D11", "#F6E08C", "#6C541C",
  "#965103", "#B2D4AF", "#7A5F20", "#E49C2A", "#FCA874", "#AC6C0E", "#544CAC", "#C7BFDC",
  "#513827", "#0484D4", "#FCFCE4", "#0A847F", "#5AA46C", "#B4D0AC", "#0B8E89", "#FACA27",
  "#FADD8B", "#826503", "#D4D4D4", "#967403", "#B2C81B", "#F18B91", "#647424", "#788712",
  "#F4F4EB", "#5C3C3C", "#11BBC1", "#92E1F4", "#048C84", "#80A258", "#A4C4CE", "#26464C", "#2F52BA"
]

const shuffleArray = (arr) => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const VIBRANT = PALETTE.filter(c => {
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 166
})

function colorFor(text) {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i)
    h |= 0
  }
  return VIBRANT[Math.abs(h) % VIBRANT.length]
}

const CODE = [
  'import { useRef, useCallback } from "react"',
  'import { PALETTE } from "./effects.js"',
  '',
  'const CARD_W = 440',
  'const CARD_H = 270',
  'const STRIP_LEFT = 20',
  'const STRIP_TOP = 210',
  'const STRIP_W = 400',
  'const STRIP_H = 40',
  'const STRIP_COLS = 40',
  'const STRIP_ROWS = 4',
  'const PHOTO_LEFT = 40',
  'const PHOTO_TOP = 40',
  'const PHOTO_W = 100',
  'const PHOTO_H = 100',
  '',
  'export default function IDCardWeb() {',
  '  const cardRef = useRef(null)',
  '  const isHoveringRef = useRef(false)',
  '  const glowRadiusRef = useRef(0)',
  '  const timeRef = useRef(0)',
  '',
  '  const stripMouseRef = useRef({',
  '    x: 0, y: 0, active: false',
  '  })',
  '',
  '  return (',
  '    <div ref={cardRef} style={{',
  '      position: "relative",',
  '      width: CARD_W,',
  '      height: CARD_H,',
  '      borderRadius: 16,',
  '      overflow: "hidden",',
  '    }}>',
  '',
  '    {/* Strip gradient cells */}',
  '    <div style={{',
  '      position: "absolute",',
  '      left: STRIP_LEFT,',
  '      top: STRIP_TOP,',
  '      width: STRIP_W,',
  '      height: STRIP_H,',
  '    }}>',
  '',
  '    {/* Photo frame */}',
  '    <div style={{',
  '      left: PHOTO_LEFT,',
  '      top: PHOTO_TOP,',
  '      width: PHOTO_W,',
  '      height: PHOTO_H,',
  '      overflow: "hidden",',
  '      border: "0.5px solid #EAECF2"',
  '    }}>',
  '',
  '    fontSize: 10,',
  '    color: "rgba(0,0,0,0.5)",',
  '    letterSpacing: "-0.2px",',
  '    fontWeight: 600,',
  '',
  '    fontSize: 12,',
  '    color: "black",',
  '    letterSpacing: "-0.24px",',
  '    </div>',
  '  )',
  '}',
]

const KW = new Set([
  'import', 'from', 'export', 'default', 'function', 'const', 'let', 'var',
  'return', 'if', 'else', 'for', 'while', 'new', 'true', 'false', 'null',
])

function tokenize(line) {
  const tokens = []
  let i = 0
  while (i < line.length) {
    if (line[i] === ' ') {
      let j = i
      while (j < line.length && line[j] === ' ') j++
      tokens.push({ text: line.slice(i, j), color: null })
      i = j
      continue
    }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]
      let j = i + 1
      while (j < line.length && line[j] !== q) j++
      const text = line.slice(i, j + 1)
      tokens.push({ text, color: colorFor(text) })
      i = j + 1
      continue
    }
    if (line.slice(i, i + 3) === '{/*') {
      const end = line.indexOf('*/}', i)
      const j = end === -1 ? line.length : end + 3
      tokens.push({ text: line.slice(i, j), color: 'rgba(0,0,0,0.3)' })
      i = j
      continue
    }
    if (/\d/.test(line[i]) && (i === 0 || /[\s=:,({[\-+]/.test(line[i - 1]))) {
      let j = i
      while (j < line.length && /[\d.]/.test(line[j])) j++
      tokens.push({ text: line.slice(i, j), color: colorFor(line.slice(i, j)) })
      i = j
      continue
    }
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++
      const word = line.slice(i, j)
      tokens.push({ text: word, color: KW.has(word) ? colorFor(word) : null })
      i = j
      continue
    }
    if (line[i] === '<') {
      let j = i + 1
      if (j < line.length && line[j] === '/') j++
      while (j < line.length && /[a-zA-Z]/.test(line[j])) j++
      if (j > i + 1) {
        tokens.push({ text: line.slice(i, j), color: colorFor(line.slice(i, j)) })
        i = j
        continue
      }
    }
    tokens.push({ text: line[i], color: null })
    i++
  }
  return tokens
}

const CHAR_MAPS = CODE.map(line => {
  const tokens = tokenize(line)
  const chars = []
  for (const t of tokens) for (const ch of t.text) chars.push({ ch, color: t.color })
  return chars
})

const CHAR_MIN = 30
const CHAR_MAX = 55
const LINE_PAUSE = 100
const RESTART_PAUSE = 1800
const PAD_TOP = 8
const PAD_LEFT = 12

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

// Generate text cycle keyframes
const textCycleShuffled = shuffleArray(VIBRANT)
const loopedTextCycle = [...textCycleShuffled, textCycleShuffled[0]]
const textCycleSteps = loopedTextCycle.map((color, idx) => `${(idx / (loopedTextCycle.length - 1)) * 100}% { color: ${color}; }`).join(" ")
const TEXT_CYCLE_KF = `@keyframes twtextCycle { ${textCycleSteps} }`

function buildHtml(chars, count) {
  let html = ''
  let i = 0
  let spanIdx = 0
  while (i < count) {
    const color = chars[i].color
    let j = i
    while (j < count && chars[j].color === color) j++
    const text = chars.slice(i, j).map(c => c.ch).join('')
    if (color) {
      const delay = (spanIdx * 7.3) % 80
      html += `<span style="color:${color};animation:twtextCycle 80s linear infinite;animation-delay:-${delay.toFixed(1)}s">${esc(text)}</span>`
      spanIdx++
    } else {
      html += esc(text)
    }
    i = j
  }
  return html
}

// Visible area dimensions
const VIEW_W = 380
const VIEW_H = 200

export default function Typewriter() {
  const containerRef = useRef(null)
  const outerRef = useRef(null)
  const abortRef = useRef(false)
  const timerRef = useRef(null)
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

  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    abortRef.current = false

    const inner = outer.querySelector('[data-inner]')
    if (!inner) return

    const visibleH = VIEW_H - PAD_TOP * 2

    function sleep(ms) {
      return new Promise(resolve => { timerRef.current = setTimeout(resolve, ms) })
    }

    async function run() {
      while (!abortRef.current) {
        inner.innerHTML = ''
        inner.style.transition = 'none'
        inner.style.transform = ''

        for (let lineIdx = 0; lineIdx < CODE.length; lineIdx++) {
          if (abortRef.current) return

          const lineDiv = document.createElement('div')
          lineDiv.style.cssText = 'min-height:14px;line-height:14px;word-break:break-all;'
          inner.appendChild(lineDiv)

          const totalH = inner.scrollHeight
          if (totalH > visibleH) {
            inner.style.transition = 'transform 0.15s ease-out'
            inner.style.transform = `translateY(-${totalH - visibleH}px)`
          }

          const chars = CHAR_MAPS[lineIdx]
          if (chars.length === 0) {
            await sleep(LINE_PAUSE)
            continue
          }

          for (let c = 1; c <= chars.length; c++) {
            if (abortRef.current) return
            lineDiv.innerHTML = buildHtml(chars, c)
            const h = inner.scrollHeight
            if (h > visibleH) {
              inner.style.transition = 'transform 0.15s ease-out'
              inner.style.transform = `translateY(-${h - visibleH}px)`
            }
            await sleep(CHAR_MIN + Math.random() * (CHAR_MAX - CHAR_MIN))
          }

          await sleep(LINE_PAUSE)
        }

        await sleep(RESTART_PAUSE)
      }
    }

    run()

    return () => {
      abortRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const viewW = Math.min(VIEW_W, containerW - 60)

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
      }}
    >
      <style>{TEXT_CYCLE_KF}</style>
      <div
        ref={outerRef}
        style={{
          position: "relative",
          width: viewW,
          height: VIEW_H,
          overflow: "hidden",
          fontFamily: "'Geist Mono', monospace",
          fontSize: 11,
          lineHeight: "14px",
          color: "rgba(0,0,0,0.8)",
          padding: `${PAD_TOP}px ${PAD_LEFT}px`,
          boxSizing: "border-box",
        }}
      >
        <div data-inner style={{ position: "relative" }} />
        {/* Top fade */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 16,
          background: "linear-gradient(to bottom, white 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }} />
        {/* Bottom fade */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 16,
          background: "linear-gradient(to top, white 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }} />
      </div>
    </div>
  )
}
