"use client";

import { useRef, useEffect } from "react";

const SPRITE_FRAMES = 8;
const SPRITE_FRAME_DURATION = 100;
const SPRITE_W = 39;
const SPRITE_H = 43;
const SPARKLE_COLORS = ["#93CEFF", "#FF9FB9", "#FFD0B8", "#76AAFF", "#FFEEE5", "#F983CE", "#FACA27", "#5CA466"];
const CELL_SIZE = 3;

type Particle = {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type SpriteCell = {
  x: number; y: number; w: number; h: number;
  color: string;
  scatterX: number; scatterY: number;
  delay: number;
};

const SVG_CELL = 8;
const SVG_COLS = 13;
const SVG_ROWS = 14;
const DISPLAY_CELL = CELL_SIZE;
const DISPLAY_CELL_W = DISPLAY_CELL;
const DISPLAY_CELL_H = DISPLAY_CELL;
const ASSEMBLY_PAD = 80;
const ASSEMBLY_W = SPRITE_W + ASSEMBLY_PAD * 2;
const ASSEMBLY_H = SPRITE_H + ASSEMBLY_PAD * 2;
const ASSEMBLY_DUR = 800;
const ASSEMBLY_DELAY = 300;

const ASSEMBLY_STEPS = 8;
function stepT(t: number) {
  return Math.round(t * ASSEMBLY_STEPS) / ASSEMBLY_STEPS;
}

export default function SpriteWithTrail({ containerWidth, onClick, mounted, showBubble = true, bubbleText = "click me" }: { containerWidth: number; onClick?: () => void; mounted: boolean; showBubble?: boolean; bubbleText?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assemblyRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement>(null);
  const hitboxRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(1);
  const frameTimerRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const bubbleTimer = useRef({ showAt: 4000, hideAt: 0, visible: false });
  const hoveredRef = useRef(false);
  const popRef = useRef({ started: false, waiting: 0, t: 0 });
  const cellsRef = useRef<SpriteCell[]>([]);
  const prevCanvasW = useRef(0);
  const prevCanvasH = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = "/sprites/001.svg";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = 104;
      off.height = 112;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.drawImage(img, 0, 0, 104, 112);
      const cells: SpriteCell[] = [];
      for (let row = 0; row < SVG_ROWS; row++) {
        for (let col = 0; col < SVG_COLS; col++) {
          const px = octx.getImageData(col * SVG_CELL + SVG_CELL / 2, row * SVG_CELL + SVG_CELL / 2, 1, 1).data;
          if (px[3] < 128) continue;
          if (px[0] > 245 && px[1] > 245 && px[2] > 245) continue;
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 80;
          cells.push({
            x: col * DISPLAY_CELL_W,
            y: row * DISPLAY_CELL_H,
            w: Math.ceil(DISPLAY_CELL_W),
            h: Math.ceil(DISPLAY_CELL_H),
            color: `rgb(${px[0]},${px[1]},${px[2]})`,
            scatterX: Math.cos(angle) * dist,
            scatterY: Math.sin(angle) * dist - 30,
            delay: Math.random() * 0.25,
          });
        }
      }
      cellsRef.current = cells;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const runDuration = 6500;
    const maxX = containerWidth - SPRITE_W;
    let lastTime = 0;
    let spawnAccum = 0;
    let elapsed = 0;

    const tick = (ts: number) => {
      if (!lastTime) lastTime = ts;
      const dt = Math.min(ts - lastTime, 100);
      lastTime = ts;
      elapsed += dt;

      frameTimerRef.current += dt;
      if (frameTimerRef.current >= SPRITE_FRAME_DURATION) {
        frameTimerRef.current -= SPRITE_FRAME_DURATION;
        frameRef.current = (frameRef.current % SPRITE_FRAMES) + 1;
        if (spriteRef.current) {
          spriteRef.current.src = `/sprites/00${frameRef.current}.svg`;
        }
      }

      const progress = ((ts % runDuration) / runDuration);
      const triangleWave = progress < 0.5 ? progress * 2 : 2 - progress * 2;
      const spriteX = triangleWave * maxX;
      const facingRight = progress < 0.5;

      const pop = popRef.current;
      if (!pop.started && mounted) {
        pop.started = true;
        pop.waiting = ASSEMBLY_DELAY;
        pop.t = 0;
      }
      if (pop.started && pop.waiting > 0) {
        pop.waiting -= dt;
      } else if (pop.started && pop.t < 1) {
        pop.t = Math.min(1, pop.t + dt / ASSEMBLY_DUR);
      }
      const assembling = pop.started && pop.t < 1;
      const assembled = pop.started && pop.t >= 1;

      if (spriteRef.current) {
        spriteRef.current.style.left = `${spriteX}px`;
        spriteRef.current.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)";
        const fadeIn = assembled ? 1 : pop.t > 0.7 ? (pop.t - 0.7) / 0.3 : 0;
        spriteRef.current.style.opacity = String(fadeIn);
        if (elapsed % 200 < dt) {
          const rect = spriteRef.current.getBoundingClientRect();
          (window as any).__spritePos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      }

      if (hitboxRef.current) {
        hitboxRef.current.style.left = `${spriteX - 10}px`;
      }

      const aCvs = assemblyRef.current;
      if (aCvs) {
        const aCtx = aCvs.getContext("2d");
        if (aCtx && assembling && cellsRef.current.length > 0 && pop.waiting <= 0) {
          const dpr = window.devicePixelRatio || 1;
          const bw = ASSEMBLY_W * dpr;
          const bh = ASSEMBLY_H * dpr;
          if (aCvs.width !== bw || aCvs.height !== bh) {
            aCvs.width = bw;
            aCvs.height = bh;
          }
          aCtx.setTransform(1, 0, 0, 1, 0, 0);
          aCtx.scale(dpr, dpr);
          aCtx.clearRect(0, 0, ASSEMBLY_W, ASSEMBLY_H);

          cellsRef.current.forEach((cell) => {
            const rawT = Math.max(0, Math.min(1, (pop.t - cell.delay) / (1 - cell.delay)));
            const cellT = stepT(rawT);
            const ease = 1 - Math.pow(1 - cellT, 3);
            const scatter = 1 - ease;
            const cx = ASSEMBLY_PAD + cell.x + scatter * cell.scatterX;
            const cy = ASSEMBLY_PAD + cell.y + scatter * cell.scatterY;
            const s = 0.6 + 0.4 * ease;
            const w = cell.w * s;
            const h = cell.h * s;
            aCtx.globalAlpha = 0.2 + 0.8 * ease;
            aCtx.fillStyle = cell.color;
            aCtx.fillRect(cx + (cell.w - w) / 2, cy + (cell.h - h) / 2, w, h);
          });

          aCvs.style.left = `${spriteX - ASSEMBLY_PAD}px`;
          aCvs.style.display = "block";
        } else {
          aCvs.style.display = "none";
        }
      }

      if (showBubble) {
        const bt = bubbleTimer.current;
        if (assembled) {
          if (!bt.visible && elapsed >= bt.showAt) {
            bt.visible = true;
            bt.hideAt = elapsed + 2200;
          } else if (bt.visible && elapsed >= bt.hideAt) {
            bt.visible = false;
            bt.showAt = elapsed + 8000 + Math.random() * 4000;
          }
        }
        if (bubbleRef.current) {
          const show = bt.visible || hoveredRef.current;
          const sway = Math.sin(elapsed * 0.0018) * 3 + Math.sin(elapsed * 0.0031) * 1.5;
          const bob = Math.sin(elapsed * 0.0025) * 2 + Math.cos(elapsed * 0.0014) * 1;
          const rock = Math.sin(elapsed * 0.002) * 2.5 + Math.cos(elapsed * 0.0035) * 1.5;
          bubbleRef.current.style.left = `${spriteX + SPRITE_W / 2}px`;
          bubbleRef.current.style.opacity = show ? "1" : "0";
          bubbleRef.current.style.transform = show
            ? `translateX(calc(-50% + ${sway}px)) translateY(${bob}px) rotate(${rock}deg)`
            : "translateX(-50%) translateY(4px) rotate(0deg)";
        }
      }

      if (!assembled) { spawnAccum = 0; }
      else { spawnAccum += dt; }
      const spawnInterval = 40;
      while (spawnAccum >= spawnInterval) {
        spawnAccum -= spawnInterval;
        const behindOffset = facingRight ? -4 : SPRITE_W + 4;
        particlesRef.current.push({
          x: spriteX + behindOffset + (Math.random() - 0.5) * 10,
          y: SPRITE_H * 0.55 + (Math.random() - 0.5) * 14,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.5,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          size: CELL_SIZE + Math.random() * 1.5,
        });
      }

      const dpr = window.devicePixelRatio || 1;
      const cw = containerWidth * dpr;
      const ch = (SPRITE_H + 20) * dpr;
      if (prevCanvasW.current !== cw || prevCanvasH.current !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        prevCanvasW.current = cw;
        prevCanvasH.current = ch;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, containerWidth, SPRITE_H + 20);

      const particles = particlesRef.current;
      let len = particles.length;
      for (let i = len - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt / 1000 / p.maxLife;
        if (p.life <= 0) {
          particles[i] = particles[--len];
          continue;
        }
        ctx.globalAlpha = p.life * p.life * 0.7;
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + p.life * 0.5);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      particles.length = len;
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [containerWidth, mounted, showBubble]);

  function handleActivate() {
    if (bubbleRef.current) {
      bubbleRef.current.style.transition = "none";
      bubbleRef.current.style.opacity = "0";
    }
    hoveredRef.current = false;
    onClick?.();
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: containerWidth,
          height: SPRITE_H + 20,
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={assemblyRef}
        style={{
          position: "absolute",
          bottom: -ASSEMBLY_PAD,
          left: 0,
          width: ASSEMBLY_W,
          height: ASSEMBLY_H,
          pointerEvents: "none",
          display: "none",
        }}
      />
      <img
        ref={spriteRef}
        src="/sprites/001.svg"
        alt=""
        width={SPRITE_W}
        height={SPRITE_H}
        style={{
          imageRendering: "pixelated",
          display: "block",
          position: "absolute",
          bottom: 0,
          left: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <div
        ref={hitboxRef}
        onClick={() => handleActivate()}
        onTouchEnd={(e) => { e.preventDefault(); handleActivate(); }}
        onMouseEnter={() => { hoveredRef.current = true; }}
        onMouseLeave={() => { hoveredRef.current = false; }}
        style={{
          position: "absolute",
          bottom: -4,
          left: 0,
          width: SPRITE_W + 20,
          height: SPRITE_H + 20,
          cursor: onClick ? "pointer" : "default",
          zIndex: 3,
          WebkitTapHighlightColor: "transparent",
        }}
      ></div>
      {showBubble && <div
        ref={bubbleRef}
        style={{
          position: "absolute",
          bottom: SPRITE_H + 6,
          left: 0,
          transform: "translateX(-50%) translateY(4px)",
          opacity: 0,
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          fontWeight: 400,
          color: "rgba(0,0,0,0.4)",
          letterSpacing: "-0.02em",
        }}
      >
        {bubbleText}
      </div>}
    </>
  );
}

export { SPRITE_H, SPRITE_W };
