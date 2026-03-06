"use client"

import { useEffect, useRef } from "react"

const config = {
    dotSpacing: 20,
    revealRadius: 180,
    trailLength: 12,
    trailFalloff: 0.7,
    dotColor: "#BBBBBB",
    backgroundColor: "#FAFAFA",
    breatheSpeed: 0.0006,
    breatheAmount: 0.12,
    hoverFadeIn: 0.06,
    hoverFadeOut: 0.025,
    heartCount: 5,
    heartRadius: 50,
    heartFadeSpeed: 0.04,
    springStiffness: 0.02,
    springDamping: 0.9,
    dotSize: 1.5,
}

const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const simplex2D = (x, y) => {
    const n =
        Math.sin(x * 0.5 + y * 0.3) * Math.cos(y * 0.5 - x * 0.2) +
        Math.sin(x * 0.3 - y * 0.5) * 0.5 +
        Math.cos(x * 0.2 + y * 0.4) * 0.3
    return (n + 1) / 2
}

export default function BreathingDots() {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const mousePos = useRef({ x: -1000, y: -1000 })
    const mouseTrail = useRef([])
    const time = useRef(0)
    const dotsRef = useRef([])
    const dimFactor = useRef(1)
    const dimTarget = useRef(1)
    const dimRectsRef = useRef([])

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d")

        const initDots = () => {
            const width = container.clientWidth
            const height = container.clientHeight

            const dpr = window.devicePixelRatio || 1
            canvas.width = width * dpr
            canvas.height = height * dpr
            canvas.style.width = width + "px"
            canvas.style.height = height + "px"
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)

            dotsRef.current = []
            const cols = Math.ceil(width / config.dotSpacing) + 1
            const rows = Math.ceil(height / config.dotSpacing) + 1

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    dotsRef.current.push({
                        baseX: col * config.dotSpacing,
                        baseY: row * config.dotSpacing,
                        x: col * config.dotSpacing,
                        y: row * config.dotSpacing,
                        vx: 0,
                        vy: 0,
                        opacity: 0,
                        heartAmount: 0,
                        heartUntil: 0,
                        noiseOffsetX: Math.random() * 1000,
                        noiseOffsetY: Math.random() * 1000,
                    })
                }
            }
            mouseTrail.current = []
        }

        const render = () => {
            time.current += 16

            const width = container.clientWidth
            const height = container.clientHeight

            ctx.clearRect(0, 0, width, height)

            // Smoothly interpolate dim factor
            dimFactor.current = lerp(dimFactor.current, dimTarget.current, 0.05)

            if (mousePos.current.x > -500) {
                mouseTrail.current.unshift({
                    x: mousePos.current.x,
                    y: mousePos.current.y,
                })
                if (mouseTrail.current.length > config.trailLength) {
                    mouseTrail.current.pop()
                }
            } else {
                if (mouseTrail.current.length > 0) {
                    mouseTrail.current.pop()
                }
            }

            const dots = dotsRef.current

            let nearestDots = []
            if (mousePos.current.x > -500) {
                dots.forEach((dot, index) => {
                    const dx = dot.x - mousePos.current.x
                    const dy = dot.y - mousePos.current.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < config.heartRadius * 2) {
                        nearestDots.push({ index, dist })
                    }
                })
                nearestDots.sort((a, b) => a.dist - b.dist)
                nearestDots = nearestDots.slice(0, config.heartCount)
            }

            const nearestIndices = new Set(nearestDots.map((d) => d.index))

            dots.forEach((dot, index) => {
                const breatheX =
                    simplex2D(
                        dot.noiseOffsetX + time.current * config.breatheSpeed,
                        dot.noiseOffsetY
                    ) *
                    config.breatheAmount *
                    config.dotSpacing
                const breatheY =
                    simplex2D(
                        dot.noiseOffsetX,
                        dot.noiseOffsetY + time.current * config.breatheSpeed
                    ) *
                    config.breatheAmount *
                    config.dotSpacing

                const targetX =
                    dot.baseX +
                    breatheX -
                    (config.breatheAmount * config.dotSpacing) / 2
                const targetY =
                    dot.baseY +
                    breatheY -
                    (config.breatheAmount * config.dotSpacing) / 2

                const dx = targetX - dot.x
                const dy = targetY - dot.y

                dot.vx += dx * config.springStiffness
                dot.vy += dy * config.springStiffness

                dot.vx *= config.springDamping
                dot.vy *= config.springDamping

                dot.x += dot.vx
                dot.y += dot.vy

                let targetOpacity = 0

                const radiusPulse = Math.sin(time.current * 0.002) * 0.15 + 1

                mouseTrail.current.forEach((trailPoint, trailIndex) => {
                    const mouseDistX = dot.x - trailPoint.x
                    const mouseDistY = dot.y - trailPoint.y
                    const distFromPoint = Math.sqrt(
                        mouseDistX * mouseDistX + mouseDistY * mouseDistY
                    )

                    const trailStrength = Math.pow(
                        config.trailFalloff,
                        trailIndex
                    )
                    const effectiveRadius =
                        config.revealRadius *
                        (0.5 + 0.5 * trailStrength) *
                        radiusPulse

                    if (distFromPoint < effectiveRadius) {
                        const revealFactor = 1 - distFromPoint / effectiveRadius
                        const pointOpacity =
                            easeOutCubic(revealFactor) * 0.4 * trailStrength
                        targetOpacity = Math.max(targetOpacity, pointOpacity)
                    }
                })

                const fadeSpeed =
                    targetOpacity > dot.opacity
                        ? config.hoverFadeIn
                        : config.hoverFadeOut
                dot.opacity = lerp(dot.opacity, targetOpacity, fadeSpeed)

                const isNearestHeart = nearestIndices.has(index)
                const now = Date.now()

                if (isNearestHeart) {
                    const randomLinger = 2000 + Math.random() * 3000
                    dot.heartUntil = now + randomLinger
                    dot.heartAmount = lerp(dot.heartAmount, 1, 0.1)
                } else if (now < dot.heartUntil) {
                    dot.heartAmount = lerp(dot.heartAmount, 1, 0.05)
                } else {
                    dot.heartAmount = lerp(
                        dot.heartAmount,
                        0,
                        config.heartFadeSpeed
                    )
                }

                if (dot.opacity > 0.008) {
                    // Spatial dim: fade dots near dim-zone elements
                    let spatialDim = 1
                    for (const rect of dimRectsRef.current) {
                        const innerPad = rect.wide ? 30 : 8
                        const outerFade = rect.wide ? 200 : 20
                        const dx = Math.max(rect.left - innerPad - dot.x, 0, dot.x - (rect.right + innerPad))
                        const dy = Math.max(rect.top - innerPad - dot.y, 0, dot.y - (rect.bottom + innerPad))
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist === 0) {
                            spatialDim = Math.min(spatialDim, 0.05)
                        } else if (dist < outerFade) {
                            const t = dist / outerFade
                            const fade = t * t * t
                            spatialDim = Math.min(spatialDim, 0.05 + 0.95 * fade)
                        }
                    }

                    ctx.fillStyle = config.dotColor
                    ctx.globalAlpha = dot.opacity * dimFactor.current * spatialDim

                    if (dot.heartAmount > 0.5) {
                        ctx.font =
                            'bold 10px "SF Mono", "Fira Code", Consolas, monospace'
                        ctx.textAlign = "center"
                        ctx.textBaseline = "middle"
                        ctx.fillText("<3", dot.x, dot.y)
                    } else {
                        ctx.beginPath()
                        ctx.arc(dot.x, dot.y, config.dotSize, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            })

            ctx.globalAlpha = 1
            animationRef.current = requestAnimationFrame(render)
        }

        const handleMouseMove = (e) => {
            // Check all elements at mouse position for the data-no-dots attribute
            const elements = document.elementsFromPoint(e.clientX, e.clientY)
            const isOverExcluded = elements.some((el) => {
                // Check the element itself and traverse up its parents
                let current = el
                while (current && current !== document.body) {
                    if (
                        current.getAttribute &&
                        current.getAttribute("data-no-dots") === "true"
                    ) {
                        return true
                    }
                    current = current.parentElement
                }
                return false
            })

            if (isOverExcluded) {
                mousePos.current = { x: -1000, y: -1000 }
                return
            }

            // Check for dim zones
            const isOverDimmed = elements.some((el) => {
                let current = el
                while (current && current !== document.body) {
                    if (
                        current.getAttribute &&
                        current.getAttribute("data-dim-dots") === "true"
                    ) {
                        return true
                    }
                    current = current.parentElement
                }
                return false
            })
            dimTarget.current = isOverDimmed ? 0.25 : 1

            const rect = container.getBoundingClientRect()
            mousePos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
        }

        const handleMouseLeave = () => {
            mousePos.current = { x: -1000, y: -1000 }
        }

        const handleResize = initDots

        const updateDimRects = () => {
            const containerRect = container.getBoundingClientRect()
            const dimEls = document.querySelectorAll('[data-dim-dots]')
            dimRectsRef.current = Array.from(dimEls).map((el) => {
                const r = el.getBoundingClientRect()
                const isWide = el.getAttribute("data-dim-dots") === "wide"
                return {
                    left: r.left - containerRect.left,
                    top: r.top - containerRect.top,
                    right: r.right - containerRect.left,
                    bottom: r.bottom - containerRect.top,
                    wide: isWide,
                }
            })
        }

        initDots()
        updateDimRects()
        render()

        // Listen on window so it works even when behind other elements
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("resize", handleResize)
        window.addEventListener("scroll", updateDimRects, { passive: true })

        return () => {
            cancelAnimationFrame(animationRef.current)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("scroll", updateDimRects)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}
