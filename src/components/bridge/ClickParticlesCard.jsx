"use client"

import { useRef, useCallback, useEffect, useState } from "react"

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

const CARD_W = 440
const CARD_H = 240

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

export default function Cllick() {
  const cardRef = useRef(null)
  const clickLayerRef = useRef(null)
  const occupiedCellsRef = useRef(new Set())
  const cachedRectRef = useRef(null)
  const [containerW, setContainerW] = useState(440)
  const containerWRef = useRef(440)

  useEffect(() => {
    const el = cardRef.current
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

  const handleClick = useCallback((e) => {
    if (!cardRef.current || !clickLayerRef.current) return
    const rect = cachedRectRef.current || cardRef.current.getBoundingClientRect()
    const cw = containerWRef.current
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cardX = (x / rect.width) * cw
    const cardY = (y / rect.height) * CARD_H
    const gridX = Math.floor(cardX / 10) * 10
    const gridY = Math.floor(cardY / 10) * 10

    const occupied = new Set(occupiedCellsRef.current)
    const clusterPositions = generateStarburstCluster(gridX, gridY, occupied, cw, CARD_H)
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
      const dispersePath = generateDispersionPath(pos.x, pos.y, occupied, cw, CARD_H)
      const stepDuration = 150 + Math.random() * 60

      const el = document.createElement("div")
      el.style.cssText = `position:absolute;left:0;top:0;width:10px;height:10px;background-color:${color};opacity:${pos.opacity};transition:opacity 0.12s ease-out;transform:translate3d(${pos.x}px,${pos.y}px,0);will-change:transform,opacity;`
      container.appendChild(el)

      cellData.push({ el, pos, dispersePath, stepDuration })

      const disperseDelay = pos.ring * 40
      dispersePath.forEach((step, stepIdx) => {
        const t = disperseDelay + stepIdx * stepDuration
        setTimeout(() => {
          el.style.transform = `translate3d(${step.x}px,${step.y}px,0)`
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

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onPointerDown={() => { if (cardRef.current) cachedRectRef.current = cardRef.current.getBoundingClientRect() }}
      onPointerLeave={() => { cachedRectRef.current = null }}
      style={{
        width: "100%",
        height: CARD_H,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        touchAction: "none",
      }}
    >
      {/* 10×10 pixel grid covering the whole card, snapped to whole cells */}
      <div style={{
        position: "absolute",
        top: 0,
        left: (containerW - Math.floor(containerW / 10) * 10) / 2,
        width: Math.floor(containerW / 10) * 10,
        height: CARD_H,
        pointerEvents: "none",
        opacity: 0.7,
        backgroundImage: "linear-gradient(to right, #EAECF2 0.5px, transparent 0.5px), linear-gradient(to bottom, #EAECF2 0.5px, transparent 0.5px)",
        backgroundSize: "10px 10px",
      }} />

      {/* Click effects layer */}
      <div ref={clickLayerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />
    </div>
  )
}
