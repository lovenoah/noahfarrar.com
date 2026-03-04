"use client"

import { useRef, useCallback, useEffect, useMemo } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// Inlined from effects.js
// ─────────────────────────────────────────────────────────────────────────────

// ─── Color Palettes ─────────────────────────────────────────────────────────
const PALETTE = [
  "#F983CE", "#09885E", "#5CA466", "#A1C8CC", "#544434", "#FA8D11", "#F6E08C", "#6C541C",
  "#965103", "#B2D4AF", "#7A5F20", "#E49C2A", "#FCA874", "#AC6C0E", "#544CAC", "#C7BFDC",
  "#513827", "#0484D4", "#FCFCE4", "#0A847F", "#5AA46C", "#B4D0AC", "#0B8E89", "#FACA27",
  "#FADD8B", "#826503", "#D4D4D4", "#967403", "#B2C81B", "#F18B91", "#647424", "#788712",
  "#F4F4EB", "#5C3C3C", "#11BBC1", "#92E1F4", "#048C84", "#80A258", "#A4C4CE", "#26464C", "#2F52BA"
]

const CLICK_HUE_FAMILIES = [
  ["#F9E8EF", "#F5A0D0", "#C93175", "#6B1035", "#E080B0", "#D65090", "#FFD0E8", "#8B1045"],
  ["#E8F0F9", "#A0C8F5", "#3175C9", "#103560", "#80B0E0", "#5090D6", "#D0E8FF", "#104580"],
  ["#E8F9EE", "#A0F5B8", "#31C975", "#106B35", "#80E0A0", "#50D680", "#D0FFE0", "#108B45"],
  ["#F9F0E8", "#F5C8A0", "#C97531", "#6B3510", "#E0B080", "#D69050", "#FFE8D0", "#8B4510"],
  ["#F0E8F9", "#C8A0F5", "#7531C9", "#35106B", "#B080E0", "#9050D6", "#E8D0FF", "#45108B"],
  ["#E8F9F7", "#A0F5ED", "#31C9B8", "#106B60", "#80E0D0", "#50D6C0", "#D0FFFA", "#108B80"],
  ["#F9E8E8", "#F5A0A0", "#C93131", "#6B1010", "#E08080", "#D65050", "#FFD0D0", "#8B1010"],
  ["#F9F7E8", "#F5E8A0", "#C9B031", "#6B5810", "#E0D080", "#D6C050", "#FFFAD0", "#8B7010"],
]

const SUBTLE_PALETTE = [
  "#DFE1E8", "#E8EBF2", "#D8DAE2", "#EEF1F8", "#D5D8E0",
  "#F2F5FC", "#D2D5DD", "#E5E9F1", "#DCDFEA", "#EBEFF7",
  "#D9DCE6", "#F0F3FA", "#D6D9E3", "#E3E7F0", "#DEE2EC",
  "#F4F7FE", "#D3D6DF", "#E6EAF3", "#DADEE8", "#ECF0F9",
  "#D7DBE5", "#F1F4FB", "#D4D7E1", "#E4E8F2", "#DDE1EB"
]

// ─── Helpers ────────────────────────────────────────────────────────────────
const shuffleArray = (arr) => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ─── Ball Configs ───────────────────────────────────────────────────────────
const BALL_CONFIGS = [
  { fill: "#F983CE", stroke: "#F983CE", delay: 0 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -0.5 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -1 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -1.5 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -2 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -2.5 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -3 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -3.5 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -4 },
  { fill: "#F983CE", stroke: "#F983CE", delay: -4.5 },
]

// ─── Flower Pattern ─────────────────────────────────────────────────────────
const FLOWER_PIXELS = [
  [0, 0], [10, 10], [0, 20], [10, 30], [20, 20], [30, 30], [30, 0], [40, 10],
  [40, 20], [50, 10], [50, 20], [40, 30], [50, 30], [40, 40], [30, 50], [40, 50],
  [50, 40], [50, 50], [60, 30], [60, 0], [70, 20], [80, 10], [90, 10], [80, 20],
  [70, 40], [80, 50], [90, 40], [80, 70], [90, 80], [90, 90], [80, 80], [10, 80],
  [10, 50], [0, 40], [0, 50], [20, 60], [70, 60], [10, 70], [20, 90], [30, 80],
  [60, 80], [30, 90], [60, 90], [40, 60], [50, 60], [40, 70], [50, 70], [40, 80], [50, 80]
]

// ─── Dither Pattern Generation ──────────────────────────────────────────────
function generateDitherPattern(cols, rows) {
  const pattern = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * 10
      const y = row * 10
      const dither1 = ((x * 7 + y * 13) % 17) / 17
      const dither2 = ((x * 11 + y * 23) % 19) / 19
      const dither3 = ((x * 3 + y * 7) % 13) / 13
      const dither = (dither1 + dither2 + dither3) / 3
      const phase = ((x * 17 + y * 31) % 100) / 100 * Math.PI * 2
      const speed = 0.8 + ((x * 13 + y * 7) % 20) / 20 * 0.6
      pattern.push({ x, y, cx: x + 5, cy: y + 5, dither, phase, speed })
    }
  }
  return pattern
}

// ─── Reveal Computations ────────────────────────────────────────────────────
function computeStripReveal(radius, mx, my, time, ditherPattern) {
  if (radius < 1) return null
  const revealed = new Map()
  const maxDist = radius
  const maxDistCheck = maxDist * 2.2
  const maxDistCheckSq = maxDistCheck * maxDistCheck
  const globalPulse = Math.sin(time * 2) * 0.06 + Math.sin(time * 3.7) * 0.04
  const breathe = 1 + Math.sin(time * 1.5) * 0.15
  const breatheRadius = maxDist * breathe * 2.2

  for (let i = 0; i < ditherPattern.length; i++) {
    const cell = ditherPattern[i]
    const dx = cell.cx - mx
    const dy = cell.cy - my
    const distSq = dx * dx + dy * dy
    if (distSq > maxDistCheckSq) continue
    const dist = Math.sqrt(distSq)
    const cellPulse = Math.sin(time * cell.speed + cell.phase) * 0.2
    const normalizedDist = dist / breatheRadius
    const falloff = Math.exp(-normalizedDist * normalizedDist * 1.5)
    if (falloff < 0.02) continue
    const angle = Math.atan2(dy, dx)
    const flowWobble = Math.sin(angle * 3 + time * 0.4 + dist * 0.08) * 0.2 +
                       Math.cos(angle * 5 + time * 0.25 - dist * 0.05) * 0.15 +
                       Math.sin(angle * 2 - time * 0.2 + dist * 0.12) * 0.12 +
                       Math.cos(angle * 7 + time * 0.5) * 0.08
    const threshold = (falloff + globalPulse + cellPulse * falloff) * (1.3 + flowWobble)
    const revealStrength = Math.max(0, Math.min(1, (threshold - cell.dither) * 4))
    if (revealStrength < 0.02) continue
    const edgeFalloff = Math.pow(falloff, 0.6)
    const opacity = Math.min(1, edgeFalloff * 1.1 * revealStrength)
    revealed.set(i, opacity)
  }
  return revealed
}

function computePhotoReveal(radius, mx, my, time, photoDitherPattern) {
  if (radius < 1) return null
  const revealed = new Map()
  const maxDist = radius
  const maxDistCheck = maxDist * 2.2
  const maxDistCheckSq = maxDistCheck * maxDistCheck
  const globalPulse = Math.sin(time * 2) * 0.06 + Math.sin(time * 3.7) * 0.04
  const breathe = 1 + Math.sin(time * 1.5) * 0.15
  const breatheRadius = maxDist * breathe * 2.2

  for (let i = 0; i < photoDitherPattern.length; i++) {
    const cell = photoDitherPattern[i]
    const dx = cell.cx - mx
    const dy = cell.cy - my
    const distSq = dx * dx + dy * dy
    if (distSq > maxDistCheckSq) continue
    const dist = Math.sqrt(distSq)
    const cellPulse = Math.sin(time * cell.speed * 0.7 + cell.phase) * 0.12
    const normalizedDist = dist / breatheRadius
    const falloff = Math.exp(-normalizedDist * normalizedDist * 1.2)
    if (falloff < 0.02) continue
    const angle = Math.atan2(dy, dx)
    const flowWobble = Math.sin(angle * 3 + time * 0.3 + dist * 0.06) * 0.15 +
                       Math.cos(angle * 5 + time * 0.18 - dist * 0.04) * 0.1 +
                       Math.sin(angle * 2 - time * 0.15 + dist * 0.08) * 0.08
    const threshold = (falloff + globalPulse + cellPulse * falloff) * (1.3 + flowWobble)
    const revealStrength = Math.max(0, Math.min(1, (threshold - cell.dither) * 2.5))
    if (revealStrength < 0.02) continue
    const baseOpacity = falloff * 0.9
    const individualVariation = 0.75 + cell.dither * 0.5
    const opacity = Math.min(1, baseOpacity * individualVariation * revealStrength)
    if (opacity < 0.02) continue
    revealed.set(i, opacity)
  }
  return revealed
}

// ─── Click Effect Helpers ───────────────────────────────────────────────────
const getCellKey = (x, y) => `${Math.floor(x / 10) * 10},${Math.floor(y / 10) * 10}`

function generateDispersionPath(startX, startY, occupied, maxW, maxH) {
  const path = []
  let currentX = startX
  let currentY = startY
  const steps = 4 + Math.floor(Math.random() * 3)
  const dirX = (Math.random() - 0.5) * 2
  const dirY = (Math.random() - 0.5) * 2

  for (let i = 0; i < steps; i++) {
    const nextX = currentX + (dirX + (Math.random() - 0.5)) * 20
    const nextY = currentY + (dirY + (Math.random() - 0.5)) * 20
    const snappedX = Math.floor(nextX / 10) * 10
    const snappedY = Math.floor(nextY / 10) * 10
    if (snappedX >= 0 && snappedX < maxW && snappedY >= 0 && snappedY < maxH) {
      if (snappedX !== currentX || snappedY !== currentY) {
        path.push({ x: snappedX, y: snappedY })
        currentX = snappedX
        currentY = snappedY
      }
    }
  }
  return path
}

function generateStarburstCluster(centerX, centerY, occupied, maxW, maxH) {
  const cells = []
  const rays = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
  ]

  const centerKey = getCellKey(centerX, centerY)
  if (!occupied.has(centerKey) && centerX >= 0 && centerX < maxW && centerY >= 0 && centerY < maxH) {
    cells.push({ x: centerX, y: centerY, opacity: 1, ring: 0 })
    occupied.add(centerKey)
  }

  for (let ring = 1; ring <= 5; ring++) {
    const baseOpacity = 1 - (ring / 6) * 0.85
    const skipChance = ring * 0.12
    for (const ray of rays) {
      if (Math.random() < skipChance) continue
      const cellX = centerX + ray.dx * ring * 10
      const cellY = centerY + ray.dy * ring * 10
      if (cellX < 0 || cellX >= maxW || cellY < 0 || cellY >= maxH) continue
      const cellKey = getCellKey(cellX, cellY)
      if (occupied.has(cellKey)) continue
      cells.push({ x: cellX, y: cellY, opacity: baseOpacity, ring })
      occupied.add(cellKey)
    }
  }
  return cells
}

// ─── Keyframes Generation ───────────────────────────────────────────────────
function generateKeyframesCSS(cellAnimations, prefix = '') {
  const subtleCellKeyframes = cellAnimations.map((anim, i) => {
    const loopedColors = [...anim.colorsSubtle, anim.colorsSubtle[0]]
    const steps = loopedColors
      .map((color, idx) => {
        const percent = (idx / (loopedColors.length - 1)) * 100
        return `${percent}% { background-color: ${color}; }`
      })
      .join(" ")
    return `@keyframes ${prefix}cellSubtle${i} { ${steps} }`
  }).join("\n")

  const vibrantCellKeyframes = cellAnimations.map((anim, i) => {
    const loopedColors = [...anim.colorsVibrant, anim.colorsVibrant[0]]
    const steps = loopedColors
      .map((color, idx) => {
        const percent = (idx / (loopedColors.length - 1)) * 100
        return `${percent}% { background-color: ${color}; }`
      })
      .join(" ")
    return `@keyframes ${prefix}cellVibrant${i} { ${steps} }`
  }).join("\n")

  const subtleStripShuffled = shuffleArray(SUBTLE_PALETTE)
  const loopedSubtleStrip = [...subtleStripShuffled, subtleStripShuffled[0]]
  const subtleStripSteps = loopedSubtleStrip
    .map((color, idx) => {
      const percent = (idx / (loopedSubtleStrip.length - 1)) * 100
      return `${percent}% { background-color: ${color}; }`
    })
    .join(" ")
  const subtleStripKeyframe = `@keyframes ${prefix}stripSubtle { ${subtleStripSteps} }`

  const vibrantStripShuffled = shuffleArray(PALETTE)
  const loopedVibrantStrip = [...vibrantStripShuffled, vibrantStripShuffled[0]]
  const vibrantStripSteps = loopedVibrantStrip
    .map((color, idx) => {
      const percent = (idx / (loopedVibrantStrip.length - 1)) * 100
      return `${percent}% { background-color: ${color}; }`
    })
    .join(" ")
  const vibrantStripKeyframe = `@keyframes ${prefix}stripVibrant { ${vibrantStripSteps} }`

  const ballColorKeyframes = `
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

  const stickerKeyframes = `
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
  `

  const linkStyles = `
    .id-card-link, .id-card-link:visited {
      color: #1988FF;
      text-decoration: none;
      transition: color 0.1s cubic-bezier(0.44, 0, 0.56, 1);
    }
    .id-card-link:hover {
      color: #68AAFF;
    }
  `

  return subtleCellKeyframes + "\n" + vibrantCellKeyframes + "\n" + subtleStripKeyframe + "\n" + vibrantStripKeyframe + "\n" + ballColorKeyframes + "\n" + stickerKeyframes + "\n" + linkStyles
}

function generateCellAnimations(count) {
  const animations = []
  for (let i = 0; i < count; i++) {
    const shuffledVibrant = shuffleArray(PALETTE)
    const shuffledSubtle = shuffleArray(SUBTLE_PALETTE)
    const duration = 60 + Math.random() * 40
    const delay = Math.random() * -duration
    animations.push({
      colorsVibrant: shuffledVibrant,
      colorsSubtle: shuffledSubtle,
      duration,
      delay
    })
  }
  return animations
}

// ─── Sticker URLs ───────────────────────────────────────────────────────────
const portfolioSticker = "https://raw.githubusercontent.com/lovenoah/sticker-assets/main/portfolio_sticker_v2.svg"
const emailSticker = "https://raw.githubusercontent.com/lovenoah/sticker-assets/main/email_sticker_v2.svg"
const socialSticker = "https://raw.githubusercontent.com/lovenoah/sticker-assets/main/social_sticker_v2.svg"

// ─────────────────────────────────────────────────────────────────────────────
// Inlined from ViewTerminal.jsx
// ─────────────────────────────────────────────────────────────────────────────

// ─── Vibrant colors visible on light background (filter out pale/light ones)
const VIBRANT = PALETTE.filter(c => {
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 166
})

// ─── Deterministic color from text content (same token → same color)
function colorFor(text) {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i)
    h |= 0
  }
  return VIBRANT[Math.abs(h) % VIBRANT.length]
}

// ─── Actual source code from the card component ─────────────────────────────
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

// ─── JS/JSX keywords
const KW = new Set([
  'import', 'from', 'export', 'default', 'function', 'const', 'let', 'var',
  'return', 'if', 'else', 'for', 'while', 'new', 'true', 'false', 'null',
])

// ─── Simple tokenizer → splits line into { text, color } tokens
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

// ─── Pre-tokenize into per-character color maps (computed once)
const CHAR_MAPS = CODE.map(line => {
  const tokens = tokenize(line)
  const chars = []
  for (const t of tokens) {
    for (const ch of t.text) chars.push({ ch, color: t.color })
  }
  return chars
})

// ─── Timing (ms)
const CHAR_MIN = 30
const CHAR_MAX = 55
const LINE_PAUSE = 100
const RESTART_PAUSE = 1800
const PAD_TOP = 3

// ─── HTML helpers
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHtml(chars, count) {
  let html = ''
  let i = 0
  while (i < count) {
    const color = chars[i].color
    let j = i
    while (j < count && chars[j].color === color) j++
    const text = chars.slice(i, j).map(c => c.ch).join('')
    html += color
      ? `<span style="color:${color}">${esc(text)}</span>`
      : esc(text)
    i = j
  }
  return html
}

// ─── ViewTerminal Component ────────────────────────────────────────────────
function ViewTerminal() {
  const outerRef = useRef(null)
  const abortRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    abortRef.current = false

    const inner = outer.querySelector('[data-inner]')
    if (!inner) return

    const visibleH = 60 - PAD_TOP * 2 // content area height

    function sleep(ms) {
      return new Promise(resolve => {
        timerRef.current = setTimeout(resolve, ms)
      })
    }

    async function run() {
      while (!abortRef.current) {
        inner.innerHTML = ''
        inner.style.transition = 'none'
        inner.style.transform = ''

        for (let lineIdx = 0; lineIdx < CODE.length; lineIdx++) {
          if (abortRef.current) return

          const lineDiv = document.createElement('div')
          lineDiv.style.cssText = 'white-space:nowrap;height:9px;line-height:9px;'
          inner.appendChild(lineDiv)

          // Smooth scroll to keep newest line visible (computed, avoids layout read)
          const totalH = (lineIdx + 1) * 9
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

  return (
    <div
      ref={outerRef}
      style={{
        position: "relative",
        width: "100%",
        height: 60,
        overflow: "hidden",
        fontFamily: "'Geist Mono', monospace",
        fontSize: 7,
        lineHeight: "9px",
        color: "rgba(0,0,0,0.8)",
        padding: `${PAD_TOP}px 3px`,
        boxSizing: "border-box",
      }}
    >
      <div data-inner style={{ position: "relative" }} />
      {/* Top fade → gentle gradient into card background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: "linear-gradient(to bottom, white 0%, rgba(255,255,255,0) 100%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />
    </div>
  )
}

// ─── Mobile Card Constants ──────────────────────────────────────────────────
const CARD_W = 310
const CARD_H = 440

// Strip: vertical, right side → 5 cols x 40 rows = 200 cells
const STRIP_COLS = 5
const STRIP_ROWS = 40
const STRIP_CELLS = STRIP_COLS * STRIP_ROWS
const STRIP_LEFT = 240
const STRIP_TOP = 20
const STRIP_W = 50
const STRIP_H = 400

// Photo frame
const PHOTO_LEFT = 40
const PHOTO_TOP = 40
const PHOTO_SIZE = 100
const PHOTO_COLS = 10
const PHOTO_ROWS = 10
const PHOTO_CELLS = PHOTO_COLS * PHOTO_ROWS

// Balls
const BALL_SVG_LEFT = 40
const BALL_SVG_TOP = 310

// View frame
const VIEW_LEFT = 40
const VIEW_TOP = 360

export default function IDCardMobile() {
  const cardRef = useRef(null)
  const isHoveringRef = useRef(false)
  const hoverStartRef = useRef(0)

  // Strip/photo mouse positions → refs to avoid re-renders during hover
  const stripMouseRef = useRef({ x: 0, y: 0, active: false })
  const photoMouseRef = useRef({ x: 0, y: 0, active: false })

  // Glow state → refs for direct DOM updates, no React re-renders
  const glowRadiusRef = useRef(0)
  const photoGlowRadiusRef = useRef(0)
  const timeRef = useRef(0)
  const glowAnimRef = useRef(null)
  const startGlowLoopRef = useRef(null)

  // Direct DOM refs for strip/flower/photo vibrant overlays
  const stripVibrantRefs = useRef([])
  const flowerVibrantData = useRef([])
  const photoOverlayRefs = useRef([])

  // Opacity tracking to minimize DOM writes
  const lastStripOpacity = useRef(new Float32Array(STRIP_CELLS))
  const lastPhotoOpacity = useRef(new Float32Array(PHOTO_CELLS))
  const stripRevealedSet = useRef(new Set())

  // Dither pattern for strip glow → 5 cols x 40 rows
  const ditherPattern = useMemo(() => generateDitherPattern(STRIP_COLS, STRIP_ROWS), [])

  // Dither pattern for photo frame → 10x10 grid
  const photoDitherPattern = useMemo(() => generateDitherPattern(PHOTO_COLS, PHOTO_ROWS), [])

  // Generate cell animations for strip cells
  const cellAnimations = useMemo(() => generateCellAnimations(STRIP_CELLS), [])

  // Generate keyframes CSS → prefixed to avoid collision with web
  const keyframesCSS = useMemo(() => generateKeyframesCSS(cellAnimations, 'm'), [cellAnimations])

  // Ball positions stored in ref (no re-renders during physics)
  const ballDataRef = useRef(
    BALL_CONFIGS.map((_, i) => ({
      x: i * 10, y: 0, vx: 0, vy: 0,
      floating: false, returnTime: 0,
      homeX: i * 10, homeY: 0,
    }))
  )
  const ballElsRef = useRef([])
  const ballAnimationRef = useRef(null)

  // Sticker hover → direct DOM refs (no useState, zero re-renders)
  const pinInnerRef = useRef(null)
  const pinFilterRef = useRef(null)
  const pinTooltipRef = useRef(null)
  const emailInnerRef = useRef(null)
  const emailFilterRef = useRef(null)
  const emailTooltipRef = useRef(null)
  const codeInnerRef = useRef(null)
  const codeFilterRef = useRef(null)
  const codeTooltipRef = useRef(null)

  // Border highlight → specular reflection effect
  const highlightGradRef = useRef(null)
  const highlightRectRef = useRef(null)

  // Click effects → direct DOM (no React state/re-renders)
  const clickLayerRef = useRef(null)
  const occupiedCellsRef = useRef(new Set())

  // Cached bounding rect → updated on enter, avoids layout thrash on every move
  const cachedRectRef = useRef(null)

  // Tilt lerp → smooth follow toward target, no delay
  const currentTiltRef = useRef({ rx: 0, ry: 0 })
  const targetTiltRef = useRef({ rx: 0, ry: 0 })
  const tiltLoopRef = useRef(null)

  // Active sticker tooltip tracking → tap to show, tap again to navigate
  const activeStickerRef = useRef(null)
  const longPressTimerRef = useRef(null)

  // Ambient photo sweep → idle reveal effect
  const ambientTimerRef = useRef(null)
  const ambientAnimRef = useRef(null)
  const scheduleAmbientRef = useRef(null)

  // No overlay on mobile — entrance animation handled by parent CSS
  const overlayRef = useRef(null)
  const revealedRef = useRef(true)

  useEffect(() => {
    if (overlayRef.current) overlayRef.current.style.display = "none"
  }, [])

  // Ball physics animation
  useEffect(() => {
    let lastTime = performance.now()

    const animate = (now) => {
      const delta = Math.min((now - lastTime) / 16.67, 2)
      lastTime = now

      const balls = ballDataRef.current
      let hasFloating = false
      const currentTime = Date.now()

      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i]
        if (!ball.floating) continue

        if (currentTime >= ball.returnTime) {
          ball.floating = false
          ball.vx = 0
          ball.vy = 0
          const el = ballElsRef.current[i]
          if (el) {
            el.style.transition = "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)"
            el.style.transform = `translate3d(${ball.homeX}px, ${ball.homeY}px, 0)`
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

        if (ball.x < -20) { ball.x = -20; ball.vx = Math.abs(ball.vx) * 0.5 }
        if (ball.x > 190) { ball.x = 190; ball.vx = -Math.abs(ball.vx) * 0.5 }
        if (ball.y < -290) { ball.y = -290; ball.vy = Math.abs(ball.vy) * 0.5 }
        if (ball.y > 100) { ball.y = 100; ball.vy = -Math.abs(ball.vy) * 0.6 }

        const el = ballElsRef.current[i]
        if (el) {
          el.style.transform = `translate3d(${ball.x}px, ${ball.y}px, 0)`
        }
      }

      if (hasFloating) {
        ballAnimationRef.current = requestAnimationFrame(animate)
      } else {
        ballAnimationRef.current = null
      }
    }

    ballDataRef.current._animate = animate

    return () => {
      if (ballAnimationRef.current) {
        cancelAnimationFrame(ballAnimationRef.current)
      }
    }
  }, [])

  const handleBallHover = useCallback((i) => {
    const balls = ballDataRef.current
    if (balls[i].floating) return

    const angle = (Math.random() - 0.5) * Math.PI * 1.2
    const speed = 0.8 + Math.random() * 0.6

    balls[i].floating = true
    balls[i].x = balls[i].homeX
    balls[i].y = balls[i].homeY
    balls[i].returnTime = Date.now() + 4000 + Math.random() * 2000
    balls[i].vx = Math.sin(angle) * speed * 1.8
    balls[i].vy = -Math.abs(Math.cos(angle)) * speed * 1.2 - 0.5

    const el = ballElsRef.current[i]
    if (el) {
      el.style.transition = "none"
      el.style.animationPlayState = "paused"
    }

    if (!ballAnimationRef.current && ballDataRef.current._animate) {
      ballAnimationRef.current = requestAnimationFrame(ballDataRef.current._animate)
    }
  }, [])

  // Click effects
  const handleCardClick = useCallback((e) => {
    if (activeStickerRef.current) {
      dismissActiveSticker()
      return
    }
    if (!revealedRef.current) return
    if (!cardRef.current || !clickLayerRef.current) return
    const rect = cachedRectRef.current || cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cardX = (x / rect.width) * CARD_W
    const cardY = (y / rect.height) * CARD_H
    const gridX = Math.floor(cardX / 10) * 10
    const gridY = Math.floor(cardY / 10) * 10

    const isOnPictureFrame = cardX >= 15 && cardX <= 125 && cardY >= 15 && cardY <= 125
    const isOnSticker1 = cardX >= 130 && cardX <= 230 && cardY >= 15 && cardY <= 120
    const isOnSticker2 = cardX >= 140 && cardX <= 240 && cardY >= 225 && cardY <= 310
    const isOnSticker3 = cardX >= 90 && cardX <= 200 && cardY >= 340 && cardY <= 440

    if (isOnPictureFrame || isOnSticker1 || isOnSticker2 || isOnSticker3) {
      return
    }

    const occupied = new Set(occupiedCellsRef.current)
    const clusterPositions = generateStarburstCluster(gridX, gridY, occupied, CARD_W, CARD_H)
    const hueFamily = CLICK_HUE_FAMILIES[Math.floor(Math.random() * CLICK_HUE_FAMILIES.length)]
    const adjacentIndex = (CLICK_HUE_FAMILIES.indexOf(hueFamily) + (Math.random() > 0.5 ? 1 : -1) + CLICK_HUE_FAMILIES.length) % CLICK_HUE_FAMILIES.length
    const adjacentFamily = CLICK_HUE_FAMILIES[adjacentIndex]

    const container = clickLayerRef.current
    const cellData = []

    clusterPositions.forEach((pos) => {
      const newKey = getCellKey(pos.x, pos.y)
      occupiedCellsRef.current.add(newKey)
      const color = Math.random() < 0.15
        ? adjacentFamily[Math.floor(Math.random() * adjacentFamily.length)]
        : hueFamily[Math.floor(Math.random() * hueFamily.length)]
      const dispersePath = generateDispersionPath(pos.x, pos.y, occupied, CARD_W, CARD_H)
      const stepDuration = 150 + Math.random() * 60

      const el = document.createElement("div")
      el.style.cssText = `position:absolute;left:${pos.x}px;top:${pos.y}px;width:10px;height:10px;background-color:${color};opacity:${pos.opacity};transition:opacity 0.12s ease-out;`
      container.appendChild(el)

      cellData.push({ el, pos, dispersePath, stepDuration })

      const disperseDelay = pos.ring * 40
      dispersePath.forEach((step, stepIdx) => {
        const t = disperseDelay + stepIdx * stepDuration
        setTimeout(() => {
          el.style.left = step.x + "px"
          el.style.top = step.y + "px"
          const totalPathTime = dispersePath.length * stepDuration
          const disperseAge = (stepIdx + 1) * stepDuration
          const pathProgress = disperseAge / totalPathTime
          const easedProgress = pathProgress * pathProgress
          el.style.opacity = (pos.opacity || 1) * (1 - easedProgress * 0.7)
        }, t)
      })

      const pathEndTime = disperseDelay + dispersePath.length * stepDuration
      setTimeout(() => {
        el.style.transition = "opacity 0.6s cubic-bezier(0.4, 0, 1, 1)"
        el.style.opacity = 0
      }, pathEndTime)
    })

    const totalDuration = 5 * 40 + 8 * 210 + 800 + 500
    setTimeout(() => {
      cellData.forEach(({ el, pos, dispersePath }) => {
        if (el.parentNode) el.parentNode.removeChild(el)
        occupiedCellsRef.current.delete(getCellKey(pos.x, pos.y))
        dispersePath.forEach(p => occupiedCellsRef.current.delete(getCellKey(p.x, p.y)))
      })
    }, totalDuration)
  }, [])

  const startTiltLoop = useCallback(() => {
    if (tiltLoopRef.current) return
    function tick() {
      const cur = currentTiltRef.current
      const tgt = targetTiltRef.current
      cur.rx += (tgt.rx - cur.rx) * 0.15
      cur.ry += (tgt.ry - cur.ry) * 0.15
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${cur.rx}deg) rotateY(${cur.ry}deg) translateZ(0)`
      }
      if (Math.abs(cur.rx - tgt.rx) > 0.01 || Math.abs(cur.ry - tgt.ry) > 0.01) {
        tiltLoopRef.current = requestAnimationFrame(tick)
      } else {
        cur.rx = tgt.rx
        cur.ry = tgt.ry
        tiltLoopRef.current = null
      }
    }
    tiltLoopRef.current = requestAnimationFrame(tick)
  }, [])

  const handleInteraction = useCallback((clientX, clientY, isTouch = false) => {
    if (!revealedRef.current) return
    if (!cardRef.current) return
    const rect = cachedRectRef.current || cardRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    targetTiltRef.current.rx = ((y - rect.height / 2) / (rect.height / 2)) * -4
    targetTiltRef.current.ry = ((x - rect.width / 2) / (rect.width / 2)) * 4
    startTiltLoop()

    const cardX = (x / rect.width) * CARD_W
    const cardY = (y / rect.height) * CARD_H

    if (highlightGradRef.current) {
      highlightGradRef.current.setAttribute("cx", cardX)
      highlightGradRef.current.setAttribute("cy", cardY)
    }

    const sm = stripMouseRef.current
    sm.x = cardX - STRIP_LEFT
    sm.y = cardY - STRIP_TOP
    sm.active = cardX >= STRIP_LEFT && cardX <= STRIP_LEFT + STRIP_W &&
                cardY >= STRIP_TOP && cardY <= STRIP_TOP + STRIP_H

    const pm = photoMouseRef.current
    const onPhoto = cardX >= PHOTO_LEFT && cardX <= PHOTO_LEFT + PHOTO_SIZE &&
                    cardY >= PHOTO_TOP && cardY <= PHOTO_TOP + PHOTO_SIZE

    if (onPhoto) {
      if (ambientAnimRef.current) { cancelAnimationFrame(ambientAnimRef.current); ambientAnimRef.current = null }
      if (ambientTimerRef.current) { clearTimeout(ambientTimerRef.current); ambientTimerRef.current = null }
      pm.x = cardX - PHOTO_LEFT
      pm.y = cardY - PHOTO_TOP
      pm.active = true
    } else if (!ambientAnimRef.current) {
      pm.x = cardX - PHOTO_LEFT
      pm.y = cardY - PHOTO_TOP
      pm.active = false
      if (!ambientTimerRef.current) scheduleAmbientRef.current?.()
    }

    startGlowLoopRef.current?.()

    if (isTouch) {
      const ballAreaY = cardY - BALL_SVG_TOP
      if (ballAreaY >= -5 && ballAreaY <= 15 && cardX >= BALL_SVG_LEFT && cardX <= BALL_SVG_LEFT + 100) {
        const ballIndex = Math.floor((cardX - BALL_SVG_LEFT) / 10)
        if (ballIndex >= 0 && ballIndex < 10) {
          handleBallHover(ballIndex)
        }
      }
    }
  }, [handleBallHover])

  const lastMoveRef = useRef(0)
  const handleMouseMove = useCallback((e) => {
    const now = performance.now()
    if (now - lastMoveRef.current < 16) return
    lastMoveRef.current = now
    handleInteraction(e.clientX, e.clientY, false)
  }, [handleInteraction])

  const handleTouchMove = useCallback((e) => {
    const now = performance.now()
    if (now - lastMoveRef.current < 16) return
    lastMoveRef.current = now
    const touch = e.touches[0]
    if (touch) {
      handleInteraction(touch.clientX, touch.clientY, true)
    }
  }, [handleInteraction])

  const handleTouchStart = useCallback((e) => {
    isHoveringRef.current = true
    if (cardRef.current) {
      cachedRectRef.current = cardRef.current.getBoundingClientRect()
      cardRef.current.style.transition = "none"
    }
    const touch = e.touches[0]
    if (touch) {
      handleInteraction(touch.clientX, touch.clientY, true)
    }
  }, [handleInteraction])

  const handleTouchEnd = useCallback(() => {
    isHoveringRef.current = false
    cachedRectRef.current = null
    targetTiltRef.current.rx = 0
    targetTiltRef.current.ry = 0
    startTiltLoop()
    stripMouseRef.current.active = false
    if (!ambientAnimRef.current) {
      photoMouseRef.current.active = false
      if (!ambientTimerRef.current) scheduleAmbientRef.current?.()
    }
    if (highlightRectRef.current) highlightRectRef.current.style.opacity = "0"
    startGlowLoopRef.current?.()
  }, [])

  // Glow animation
  useEffect(() => {
    const dp = ditherPattern
    const pdp = photoDitherPattern

    const startGlowLoop = () => {
      if (glowAnimRef.current) return

      let lastTime = performance.now()
      let frameCount = 0

      const animate = (now) => {
        const delta = (now - lastTime) / 1000
        lastTime = now
        frameCount++
        timeRef.current += delta

        const targetRadius = stripMouseRef.current.active ? 85 : 0
        const photoTargetRadius = photoMouseRef.current.active ? 65 : 0

        const glowDiff = targetRadius - glowRadiusRef.current
        if (Math.abs(glowDiff) >= 0.5) {
          glowRadiusRef.current += glowDiff * (targetRadius > glowRadiusRef.current ? 0.08 : 0.06)
        } else {
          glowRadiusRef.current = targetRadius
        }

        const photoDiff = photoTargetRadius - photoGlowRadiusRef.current
        if (Math.abs(photoDiff) >= 0.5) {
          photoGlowRadiusRef.current += photoDiff * (photoTargetRadius > photoGlowRadiusRef.current ? 0.14 : 0.08)
        } else {
          photoGlowRadiusRef.current = photoTargetRadius
        }

        if (frameCount % 2 === 0) {
          const stripRevealed = computeStripReveal(
            glowRadiusRef.current,
            stripMouseRef.current.x,
            stripMouseRef.current.y,
            timeRef.current, dp
          )

          for (let i = 0; i < STRIP_CELLS; i++) {
            const el = stripVibrantRefs.current[i]
            if (!el) continue
            const newOpacity = stripRevealed ? (stripRevealed.get(i) ?? 0) : 0
            const quantized = Math.round(newOpacity * 50) / 50
            if (quantized === lastStripOpacity.current[i]) continue
            lastStripOpacity.current[i] = quantized

            if (newOpacity > 0 && !stripRevealedSet.current.has(i)) {
              el.style.transition = "opacity 0.3s ease"
              stripRevealedSet.current.add(i)
            } else if (newOpacity === 0 && stripRevealedSet.current.has(i)) {
              el.style.transition = "opacity 0.12s ease"
              stripRevealedSet.current.delete(i)
            }
            el.style.opacity = newOpacity
          }

          for (const entry of flowerVibrantData.current) {
            if (!entry?.el) continue
            const opacity = stripRevealed ? (stripRevealed.get(entry.cellIndex) ?? 0) : 0
            const quantized = Math.round(opacity * 50) / 50
            if (quantized === entry.lastOpacity) continue
            entry.lastOpacity = quantized
            if (opacity > 0 && !entry.wasRevealed) {
              entry.el.style.transition = "opacity 0.3s ease"
              entry.wasRevealed = true
            } else if (opacity === 0 && entry.wasRevealed) {
              entry.el.style.transition = "opacity 0.12s ease"
              entry.wasRevealed = false
            }
            entry.el.style.opacity = opacity
          }

          const photoRevealed = computePhotoReveal(
            photoGlowRadiusRef.current,
            photoMouseRef.current.x,
            photoMouseRef.current.y,
            timeRef.current, pdp
          )

          for (let i = 0; i < PHOTO_CELLS; i++) {
            const el = photoOverlayRefs.current[i]
            if (!el) continue
            const newOpacity = photoRevealed ? (photoRevealed.get(i) ?? 0) : 0
            const quantized = Math.round(newOpacity * 50) / 50
            if (quantized === lastPhotoOpacity.current[i]) continue
            lastPhotoOpacity.current[i] = quantized
            el.style.opacity = newOpacity
          }
        }

        const stillAnimating =
          Math.abs(targetRadius - glowRadiusRef.current) >= 0.5 ||
          Math.abs(photoTargetRadius - photoGlowRadiusRef.current) >= 0.5 ||
          targetRadius !== 0 || photoTargetRadius !== 0

        if (stillAnimating) {
          glowAnimRef.current = requestAnimationFrame(animate)
        } else {
          glowAnimRef.current = null
        }
      }

      glowAnimRef.current = requestAnimationFrame(animate)
    }

    startGlowLoopRef.current = startGlowLoop

    return () => {
      if (glowAnimRef.current) {
        cancelAnimationFrame(glowAnimRef.current)
        glowAnimRef.current = null
      }
    }
  }, [ditherPattern, photoDitherPattern])

  // Ambient photo sweep
  useEffect(() => {
    function scheduleNextSweep() {
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current)
      const delay = 4000 + Math.random() * 6000
      ambientTimerRef.current = setTimeout(runSweep, delay)
    }
    scheduleAmbientRef.current = scheduleNextSweep

    function runSweep() {
      if (ambientAnimRef.current) return
      if (!revealedRef.current) {
        scheduleNextSweep()
        return
      }

      const edge = Math.floor(Math.random() * 4)
      let startX, startY, endX, endY
      if (edge === 0) {
        startX = -10; startY = 20 + Math.random() * 60
        endX = 110; endY = 20 + Math.random() * 60
      } else if (edge === 1) {
        startX = 20 + Math.random() * 60; startY = -10
        endX = 20 + Math.random() * 60; endY = 110
      } else if (edge === 2) {
        startX = 110; startY = 20 + Math.random() * 60
        endX = -10; endY = 20 + Math.random() * 60
      } else {
        startX = 20 + Math.random() * 60; startY = 110
        endX = 20 + Math.random() * 60; endY = -10
      }

      const duration = 1500 + Math.random() * 1000
      const sweepStart = performance.now()
      let started = false

      function animateSweep(now) {
        const elapsed = now - sweepStart
        const rawT = Math.min(1, elapsed / duration)
        const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2

        const pm = photoMouseRef.current
        pm.x = startX + (endX - startX) * t
        pm.y = startY + (endY - startY) * t
        pm.active = true

        if (!started) {
          startGlowLoopRef.current?.()
          started = true
        }

        if (rawT < 1) {
          ambientAnimRef.current = requestAnimationFrame(animateSweep)
        } else {
          pm.active = false
          startGlowLoopRef.current?.()
          ambientAnimRef.current = null
          scheduleNextSweep()
        }
      }

      ambientAnimRef.current = requestAnimationFrame(animateSweep)
    }

    const initTimer = setTimeout(() => {
      scheduleNextSweep()
    }, 2000)

    return () => {
      clearTimeout(initTimer)
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current)
      if (ambientAnimRef.current) cancelAnimationFrame(ambientAnimRef.current)
    }
  }, [])

  // Generate strip gradient cells
  const stripGradientCells = useMemo(() => {
    const cells = []
    for (let i = 0; i < STRIP_CELLS; i++) {
      const col = i % STRIP_COLS
      const row = Math.floor(i / STRIP_COLS)
      const x = col * 10
      const y = row * 10
      const animIdx = i % cellAnimations.length
      const anim = cellAnimations[animIdx]

      cells.push(
        <div
          key={`strip-${i}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 10,
            height: 10,
            contain: "strict",
            transform: "translate3d(0,0,0)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              animation: `mcellSubtle${animIdx} ${anim.duration}s linear infinite`,
              animationDelay: `${anim.delay}s`,
            }}
          />
          <div
            ref={el => { stripVibrantRefs.current[i] = el }}
            style={{
              position: "absolute",
              inset: 0,
              animation: `mcellVibrant${animIdx} ${anim.duration}s linear infinite`,
              animationDelay: `${anim.delay}s`,
              opacity: 0,
              transition: "opacity 0.12s ease",
            }}
          />
        </div>
      )
    }
    return cells
  }, [cellAnimations])

  // Generate flower pattern overlay
  const flowerPattern = useMemo(() => {
    const flowers = []
    const verticalOffsets = [0, 100, 200, 300]
    let flowerIdx = 0

    verticalOffsets.forEach((offsetY, groupIdx) => {
      FLOWER_PIXELS.forEach((p, i) => {
        const scaledX = Math.floor(p[0] / 20) * 10
        const scaledY = Math.floor(p[1] / 10) * 10

        if (scaledX < STRIP_W && scaledY < 20 && offsetY + scaledY < STRIP_H) {
          const col = Math.floor(scaledX / 10)
          const row = Math.floor((offsetY + scaledY) / 10)
          const cellIndex = row * STRIP_COLS + col

          if (cellIndex < STRIP_CELLS) {
            const idx = flowerIdx++

            flowers.push(
              <div
                key={`flower-${groupIdx}-${i}`}
                style={{
                  position: "absolute",
                  left: scaledX,
                  top: offsetY + scaledY,
                  width: 10,
                  height: 10,
                  contain: "strict",
                  transform: "translate3d(0,0,0)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    animation: "mstripSubtle 80s linear infinite",
                  }}
                />
                <div
                  ref={el => {
                    if (el) {
                      flowerVibrantData.current[idx] = { cellIndex, el, lastOpacity: 0, wasRevealed: false }
                    }
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    animation: "mstripVibrant 80s linear infinite",
                    opacity: 0,
                    transition: "opacity 0.12s ease",
                  }}
                />
              </div>
            )
          }
        }
      })
    })
    return flowers
  }, [])

  // Sticker hover handlers
  const handlePinEnter = useCallback(() => {
    if (pinInnerRef.current) pinInnerRef.current.style.transform = "translateY(-8px) scale(1.06)"
    if (pinFilterRef.current) pinFilterRef.current.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.12))"
    if (pinTooltipRef.current) {
      pinTooltipRef.current.style.visibility = "visible"
      pinTooltipRef.current.style.opacity = "1"
    }
  }, [])
  const handlePinLeave = useCallback(() => {
    if (pinInnerRef.current) pinInnerRef.current.style.transform = "translateY(0px) scale(1)"
    if (pinFilterRef.current) pinFilterRef.current.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
    if (pinTooltipRef.current) {
      pinTooltipRef.current.style.opacity = "0"
      const ref = pinTooltipRef.current
      setTimeout(() => { if (ref && ref.style.opacity === "0") ref.style.visibility = "hidden" }, 220)
    }
  }, [])

  const handleEmailEnter = useCallback(() => {
    if (emailInnerRef.current) emailInnerRef.current.style.transform = "translateY(-8px) scale(1.06)"
    if (emailFilterRef.current) emailFilterRef.current.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.12))"
    if (emailTooltipRef.current) {
      emailTooltipRef.current.style.visibility = "visible"
      emailTooltipRef.current.style.opacity = "1"
    }
  }, [])
  const handleEmailLeave = useCallback(() => {
    if (emailInnerRef.current) emailInnerRef.current.style.transform = "translateY(0px) scale(1)"
    if (emailFilterRef.current) emailFilterRef.current.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
    if (emailTooltipRef.current) {
      emailTooltipRef.current.style.opacity = "0"
      const ref = emailTooltipRef.current
      setTimeout(() => { if (ref && ref.style.opacity === "0") ref.style.visibility = "hidden" }, 220)
    }
  }, [])

  const handleCodeEnter = useCallback(() => {
    if (codeInnerRef.current) codeInnerRef.current.style.transform = "translateY(-8px) scale(1.06)"
    if (codeFilterRef.current) codeFilterRef.current.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.12))"
    if (codeTooltipRef.current) {
      codeTooltipRef.current.style.visibility = "visible"
      codeTooltipRef.current.style.opacity = "1"
    }
  }, [])
  const handleCodeLeave = useCallback(() => {
    if (codeInnerRef.current) codeInnerRef.current.style.transform = "translateY(0px) scale(1)"
    if (codeFilterRef.current) codeFilterRef.current.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
    if (codeTooltipRef.current) {
      codeTooltipRef.current.style.opacity = "0"
      const ref = codeTooltipRef.current
      setTimeout(() => { if (ref && ref.style.opacity === "0") ref.style.visibility = "hidden" }, 220)
    }
  }, [])

  const dismissActiveSticker = useCallback(() => {
    const active = activeStickerRef.current
    if (active === "pin") handlePinLeave()
    else if (active === "email") handleEmailLeave()
    else if (active === "code") handleCodeLeave()
    activeStickerRef.current = null
  }, [handlePinLeave, handleEmailLeave, handleCodeLeave])

  const makeStickerTouchHandlers = useCallback((name, enterFn, url, isMailto) => ({
    onTouchStart: (e) => {
      e.stopPropagation()
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = setTimeout(() => {
        dismissActiveSticker()
        activeStickerRef.current = name
        enterFn()
        longPressTimerRef.current = null
      }, 200)
    },
    onTouchEnd: (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
        if (isMailto) {
          window.location.href = url
        } else {
          window.open(url, "_blank")
        }
      } else {
        dismissActiveSticker()
      }
    },
    onTouchMove: (e) => {
      e.stopPropagation()
    },
  }), [dismissActiveSticker])

  const pinTouchHandlers = useMemo(() =>
    makeStickerTouchHandlers("pin", handlePinEnter, "https://noahfarrar.com/portfolio", false),
    [makeStickerTouchHandlers, handlePinEnter]
  )
  const emailTouchHandlers = useMemo(() =>
    makeStickerTouchHandlers("email", handleEmailEnter, "mailto:hello@noahfarrar.com", true),
    [makeStickerTouchHandlers, handleEmailEnter]
  )
  const codeTouchHandlers = useMemo(() =>
    makeStickerTouchHandlers("code", handleCodeEnter, "https://x.com/NoahFarrar", false),
    [makeStickerTouchHandlers, handleCodeEnter]
  )

  return (
    <div
      ref={cardRef}
      data-no-dots="true"
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => {
        hoverStartRef.current = Date.now()
        if (cardRef.current) {
          cachedRectRef.current = cardRef.current.getBoundingClientRect()
          cardRef.current.style.transition = "none"
          const rect = cachedRectRef.current
          targetTiltRef.current.rx = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -4
          targetTiltRef.current.ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4
          startTiltLoop()
        }
        if (highlightRectRef.current) highlightRectRef.current.style.opacity = "1"
        setTimeout(() => {
          isHoveringRef.current = true
        }, 150)
      }}
      onMouseLeave={() => {
        isHoveringRef.current = false
        hoverStartRef.current = 0
        cachedRectRef.current = null
        if (highlightRectRef.current) highlightRectRef.current.style.opacity = "0"
        targetTiltRef.current.rx = 0
        targetTiltRef.current.ry = 0
        startTiltLoop()
        stripMouseRef.current.active = false
        if (!ambientAnimRef.current) {
          photoMouseRef.current.active = false
          if (!ambientTimerRef.current) scheduleAmbientRef.current?.()
        }
        startGlowLoopRef.current?.()
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        backgroundColor: "white",
        borderRadius: 40,
        overflow: "hidden",
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)",
        transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transformStyle: "preserve-3d",
        boxShadow: "0px 24px 32px -8px rgba(0,0,0,0.15)",
        touchAction: "none",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400&display=swap');\n` + keyframesCSS}</style>

      {/* Strip Gradient (vertical, right side) */}
      <div
        style={{
          position: "absolute",
          left: STRIP_LEFT,
          top: STRIP_TOP,
          width: STRIP_W,
          height: STRIP_H,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {stripGradientCells}
      </div>

      {/* Strip Flower Pattern */}
      <div
        style={{
          position: "absolute",
          left: STRIP_LEFT,
          top: STRIP_TOP,
          width: STRIP_W,
          height: STRIP_H,
          overflow: "hidden",
          cursor: "pointer",
          pointerEvents: "none",
        }}
      >
        {flowerPattern}
      </div>

      {/* Main Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.7,
          backgroundImage: "linear-gradient(to right, #EAECF2 0.5px, transparent 0.5px), linear-gradient(to bottom, #EAECF2 0.5px, transparent 0.5px)",
          backgroundSize: "10px 10px",
        }}
      />

      {/* Click Effects Layer */}
      <div ref={clickLayerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />

      {/* Picture Frame */}
      <div
        style={{
          position: "absolute",
          left: PHOTO_LEFT,
          top: PHOTO_TOP,
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          overflow: "hidden",
          border: "0.5px solid #EAECF2",
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      >
        <img
          src="https://raw.githubusercontent.com/lovenoah/skeleton/main/new%20pfp%20(skeleton).svg"
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <img
          src="https://raw.githubusercontent.com/lovenoah/skeleton/main/new%20pfp.svg"
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {photoDitherPattern.map((cell, i) => (
          <div
            key={`photo-reveal-${i}`}
            ref={el => { photoOverlayRefs.current[i] = el }}
            style={{
              position: "absolute",
              left: cell.x,
              top: cell.y,
              width: 10,
              height: 10,
              pointerEvents: "none",
              backgroundImage: `url("https://raw.githubusercontent.com/lovenoah/skeleton/main/new%20pfp%20(skeleton).svg")`,
              backgroundSize: "100px 100px",
              backgroundPosition: `${-cell.x}px ${-cell.y}px`,
              opacity: 0,
              transition: "opacity 0.15s ease",
            }}
          />
        ))}
      </div>

      {/* Text Content */}
      <div style={{ position: "absolute", left: 40, top: 150, fontFamily: "Geist, sans-serif" }}>
        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", letterSpacing: "-0.2px", textTransform: "uppercase", lineHeight: "10px" }}>Name</div>
        <div style={{ marginTop: 7, fontSize: 12, color: "black", letterSpacing: "-0.24px", lineHeight: "10px" }}>Noah Farrar</div>
      </div>

      <div style={{ position: "absolute", left: 40, top: 190, fontFamily: "Geist, sans-serif" }}>
        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", letterSpacing: "-0.2px", textTransform: "uppercase", lineHeight: "10px" }}>Place and year issued</div>
        <div style={{ marginTop: 7, fontSize: 12, color: "black", letterSpacing: "-0.24px", lineHeight: "10px" }}>
          <a href="https://en.wikipedia.org/wiki/Minnesota" target="_blank" rel="noopener noreferrer" className="id-card-link">Minnesota</a>, USA 1997
        </div>
      </div>

      <div style={{ position: "absolute", left: 40, top: 230, fontFamily: "Geist, sans-serif" }}>
        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", letterSpacing: "-0.2px", textTransform: "uppercase", lineHeight: "10px" }}>Location</div>
        <div style={{ marginTop: 7, fontSize: 12, color: "black", letterSpacing: "-0.24px", lineHeight: "10px" }}>London, UK</div>
      </div>

      <div style={{ position: "absolute", left: 40, top: 270, fontFamily: "Geist, sans-serif" }}>
        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", letterSpacing: "-0.2px", textTransform: "uppercase", lineHeight: "10px" }}>Bio</div>
        <div style={{ marginTop: 7, fontSize: 12, color: "black", letterSpacing: "-0.24px", lineHeight: "10px" }}>
          Senior Illustrator, <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="id-card-link">Base</a> <span style={{ color: "rgba(0,0,0,0.5)" }}>(prev <a href="https://aave.com" target="_blank" rel="noopener noreferrer" className="id-card-link">Aave</a>)</span>
        </div>
      </div>

      {/* Balls */}
      <svg
        style={{ position: "absolute", left: BALL_SVG_LEFT, top: BALL_SVG_TOP, width: CARD_W, height: CARD_H - BALL_SVG_TOP, overflow: "visible", pointerEvents: "none", zIndex: 2 }}
        viewBox={`0 0 ${CARD_W} ${CARD_H - BALL_SVG_TOP}`}
      >
        {BALL_CONFIGS.map((config, i) => (
          <circle
            key={`ball-${i}`}
            ref={el => { ballElsRef.current[i] = el }}
            cx={5} cy={5} r={4.5}
            fill={config.fill} stroke={config.stroke} strokeWidth={1}
            onMouseEnter={() => handleBallHover(i)}
            style={{
              pointerEvents: "auto",
              transform: `translate3d(${i * 10}px, 0px, 0)`,
              transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              willChange: "transform",
              animation: `ballColorCycle 24s ease-in-out infinite ${config.delay}s`,
            }}
          />
        ))}
      </svg>

      {/* View frame */}
      <div style={{ position: "absolute", left: VIEW_LEFT, top: VIEW_TOP - 20, width: 100, height: 60, zIndex: 1, overflow: "hidden" }}>
        <ViewTerminal />
      </div>

      {/* Portfolio Sticker */}
      <div style={{ position: "absolute", left: 183, top: 84, width: 84, height: 67, display: "flex", alignItems: "center", justifyContent: "center", animation: "floatPin 8s ease-in-out infinite", transformOrigin: "center center", zIndex: 2 }}>
        <div ref={pinInnerRef} style={{ transform: "translateY(0px) scale(1)", transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }} onMouseEnter={handlePinEnter} onMouseLeave={handlePinLeave} {...pinTouchHandlers}>
          <div ref={pinFilterRef} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))", transition: "filter 0.3s ease", animation: "rockPin 3s ease-in-out infinite" }}>
            <img src={portfolioSticker} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", WebkitTouchCallout: "none", userSelect: "none" }} />
          </div>
        </div>
      </div>

      {/* Email Sticker */}
      <div style={{ position: "absolute", left: 153, top: 317, width: 79, height: 76, display: "flex", alignItems: "center", justifyContent: "center", animation: "floatEmail 9s ease-in-out infinite", animationDelay: "-3s", transformOrigin: "center center", zIndex: 2 }}>
        <div ref={emailInnerRef} style={{ transform: "translateY(0px) scale(1)", transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }} onMouseEnter={handleEmailEnter} onMouseLeave={handleEmailLeave} {...emailTouchHandlers}>
          <div ref={emailFilterRef} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))", transition: "filter 0.3s ease", animation: "rockEmail 4s ease-in-out infinite", animationDelay: "-1.5s" }}>
            <img src={emailSticker} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", WebkitTouchCallout: "none", userSelect: "none" }} />
          </div>
        </div>
      </div>

      {/* Social Sticker */}
      <div style={{ position: "absolute", left: 171, top: 187, width: 77, height: 75, display: "flex", alignItems: "center", justifyContent: "center", animation: "floatCode 7s ease-in-out infinite", animationDelay: "-2s", transformOrigin: "center center", zIndex: 2 }}>
        <div ref={codeInnerRef} style={{ transform: "translateY(0px) scale(1)", transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }} onMouseEnter={handleCodeEnter} onMouseLeave={handleCodeLeave} {...codeTouchHandlers}>
          <div ref={codeFilterRef} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))", transition: "filter 0.3s ease", animation: "rockCode 3.5s ease-in-out infinite", animationDelay: "-0.8s" }}>
            <img src={socialSticker} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", WebkitTouchCallout: "none", userSelect: "none" }} />
          </div>
        </div>
      </div>

      {/* Tooltips */}
      <div style={{ position: "absolute", left: 202, top: 27, zIndex: 10, pointerEvents: "none", animation: "floatPin 8s ease-in-out infinite" }}>
        <div ref={pinTooltipRef} style={{ position: "relative", backgroundColor: "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid #EAECF2", color: "black", padding: "8px 16px", borderRadius: 16, fontSize: 12, fontFamily: "Geist, sans-serif", fontWeight: 400, letterSpacing: "-0.24px", whiteSpace: "nowrap", opacity: 0, visibility: "hidden", transition: "opacity 0.2s ease", overflow: "hidden", transform: "translateX(-50%)", animation: "tooltipSwayPin 3s ease-in-out infinite" }}>
          <div style={{ position: "absolute", top: 8, left: 8, width: 12, height: 12, borderRadius: "50%", animation: "tooltipGlow 12s ease-in-out infinite 0s, bounceBall1 8s ease-in-out infinite", zIndex: -1, filter: "blur(8px)" }} />
          Portfolio
        </div>
      </div>

      <div style={{ position: "absolute", left: 192, top: 273, zIndex: 10, pointerEvents: "none", animation: "floatEmail 9s ease-in-out infinite", animationDelay: "-3s" }}>
        <div ref={emailTooltipRef} style={{ position: "relative", backgroundColor: "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid #EAECF2", color: "black", padding: "8px 16px", borderRadius: 16, fontSize: 12, fontFamily: "Geist, sans-serif", fontWeight: 400, letterSpacing: "-0.24px", whiteSpace: "nowrap", opacity: 0, visibility: "hidden", transition: "opacity 0.2s ease", overflow: "hidden", transform: "translateX(-50%)", animation: "tooltipSwayEmail 3s ease-in-out infinite" }}>
          <div style={{ position: "absolute", top: 8, left: 8, width: 12, height: 12, borderRadius: "50%", animation: "tooltipGlow 12s ease-in-out infinite -4s, bounceBall2 9s ease-in-out infinite", zIndex: -1, filter: "blur(8px)" }} />
          Email
        </div>
      </div>

      <div style={{ position: "absolute", left: 210, top: 140, zIndex: 10, pointerEvents: "none", animation: "floatCode 7s ease-in-out infinite", animationDelay: "-2s" }}>
        <div ref={codeTooltipRef} style={{ position: "relative", backgroundColor: "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid #EAECF2", color: "black", padding: "8px 16px", borderRadius: 16, fontSize: 12, fontFamily: "Geist, sans-serif", fontWeight: 400, letterSpacing: "-0.24px", whiteSpace: "nowrap", opacity: 0, visibility: "hidden", transition: "opacity 0.2s ease", overflow: "hidden", transform: "translateX(-50%)", animation: "tooltipSwayCode 3.5s ease-in-out infinite" }}>
          <div style={{ position: "absolute", top: 8, left: 8, width: 12, height: 12, borderRadius: "50%", animation: "tooltipGlow 12s ease-in-out infinite -8s, bounceBall3 7s ease-in-out infinite", zIndex: -1, filter: "blur(8px)" }} />
          Social
        </div>
      </div>

      {/* Loading overlay */}
      <div ref={overlayRef} style={{ position: "absolute", inset: 0, zIndex: 19, pointerEvents: "none", overflow: "hidden", background: "white" }} />

      {/* Card border frame overlay */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 20, transform: "translate3d(0,0,0)" }}
        viewBox="0 0 310 440"
        fill="none"
      >
        <defs>
          <linearGradient id="borderGradMobile" x1="155" y1="0" x2="155" y2="440" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#E9ECF0" />
          </linearGradient>
          <filter id="innerShadowMobile" x="-2" y="-3" width="314" height="446" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="bg" />
            <feBlend in="SourceGraphic" in2="bg" result="shape" />
            <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="alpha" />
            <feOffset dy="-1" />
            <feGaussianBlur stdDeviation="1" />
            <feComposite in2="alpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0" />
            <feBlend in2="shape" />
          </filter>
          <radialGradient ref={highlightGradRef} id="highlightGradMobile" cx="155" cy="220" r="220" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="10" y="10" width="290" height="420" rx="30" stroke="url(#borderGradMobile)" strokeWidth="20" filter="url(#innerShadowMobile)" />
        <rect ref={highlightRectRef} x="10" y="10" width="290" height="420" rx="30" stroke="url(#highlightGradMobile)" strokeWidth="20" fill="none" style={{ opacity: 0, transition: "opacity 0.3s ease" }} />
      </svg>
    </div>
  )
}
