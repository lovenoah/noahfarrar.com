"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BreathingDots from "@/components/breathing-dots";

const MAX_PARTICLES = 120;
const PARTICLE_LIFE = 90;

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  size: number; rotation: number; rotationSpeed: number;
  opacity: number; life: number; scale: number; desktop: boolean;
};

function createParticle(x: number, y: number): Particle {
  const desktop = window.innerWidth >= 600;
  const angle = Math.random() * Math.PI * 2;
  const speed = desktop ? 3.5 + Math.random() * 5.5 : 2.5 + Math.random() * 4.5;
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (desktop ? 3 : 2.5),
    size: 25, rotation: (Math.random() - 0.5) * 0.4,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    opacity: 1, life: PARTICLE_LIFE, scale: 0.3, desktop,
  };
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const skullRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animatingRef = useRef(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dprRef = useRef(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const buzzRafRef = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return;
    }
    if (typeof AudioContext === "undefined") return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 4000;
    filter.Q.value = 8;
    audioFilterRef.current = filter;

    const gain = ctx.createGain();
    audioGainRef.current = gain;
    filter.connect(gain);
    gain.connect(ctx.destination);

    const duration = 0.004;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
    }
    audioBufferRef.current = buffer;
  }, []);

  const playClick = useCallback((intensity: number) => {
    const ctx = audioCtxRef.current;
    const filter = audioFilterRef.current;
    const gain = audioGainRef.current;
    const buffer = audioBufferRef.current;
    if (!ctx || !filter || !gain || !buffer) return;

    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
    }

    gain.gain.value = 0.5 * intensity;
    const freq = 2000 + intensity * 2000;
    const variation = 1 + (Math.random() - 0.5) * 0.3;
    filter.frequency.value = freq * variation;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(filter);
    source.onended = () => source.disconnect();
    source.start();
  }, []);

  const playBuzz = useCallback(() => {
    ensureAudio();

    if (buzzRafRef.current !== null) {
      cancelAnimationFrame(buzzRafRef.current);
      buzzRafRef.current = null;
    }

    const intensity = 1;
    const buzzDuration = 1000;
    const clickInterval = 16;
    let startTime = -1;
    let lastClickTime = -1;

    const tick = (timestamp: number) => {
      if (startTime === -1) {
        startTime = timestamp;
        lastClickTime = timestamp;
        playClick(intensity);
      }

      const elapsed = timestamp - startTime;
      if (elapsed >= buzzDuration) {
        buzzRafRef.current = null;
        return;
      }

      if (timestamp - lastClickTime >= clickInterval) {
        playClick(intensity);
        lastClickTime = timestamp;
      }

      buzzRafRef.current = requestAnimationFrame(tick);
    };

    buzzRafRef.current = requestAnimationFrame(tick);
  }, [ensureAudio, playClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/mini-skull.svg";
    imgRef.current = img;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const drag = p.desktop ? 0.98 : 0.97;
      p.vx *= drag;
      p.vy *= drag;
      p.vy += p.desktop ? 0.07 : 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.rotationSpeed *= 0.98;
      p.life--;

      if (p.life > PARTICLE_LIFE - 8) {
        p.scale += (1 - p.scale) * 0.35;
      }
      if (p.life < 30) {
        p.opacity = p.life / 30;
        p.scale *= 0.98;
      }
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const img = imgRef.current;
      if (!img || !img.complete) continue;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x * dpr, p.y * dpr);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);
      const s = p.size * dpr;
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
      ctx.restore();
    }

    if (particles.length > 0) {
      animatingRef.current = true;
      requestAnimationFrame(animate);
    } else {
      animatingRef.current = false;
    }
  }, []);

  const burst = useCallback((x: number, y: number) => {
    const particles = particlesRef.current;
    const count = 6;
    while (particles.length + count > MAX_PARTICLES) {
      particles.shift();
    }
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(x, y));
    }
    if (!animatingRef.current) {
      animatingRef.current = true;
      requestAnimationFrame(animate);
    }
  }, [animate]);

  const handleClick = () => {
    const el = skullRef.current;
    if (!el) return;

    playBuzz();
    const rect = el.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);

    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "headshake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both";
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (el) {
        el.style.animation = "rockSkull 3.2s ease-in-out infinite -2.2s, floatSkull 8.5s ease-in-out infinite -4s";
      }
    }, 650);
  };

  return (
    <>
    <BreathingDots />
    <div
      className="flex min-h-dvh justify-center items-center"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <style>{`
        @keyframes rockSkull {
          0%, 100% { rotate: 2deg; }
          50% { rotate: -2.6deg; }
        }
        @keyframes floatSkull {
          0%, 100% { translate: 0px 0px; }
          25% { translate: -0.5px -0.8px; }
          50% { translate: 0.8px 0.5px; }
          75% { translate: -0.3px 0.7px; }
        }
        @keyframes headshake {
          0% { transform: translateX(0) rotate(0); }
          6% { transform: translateX(-6px) rotate(-5deg); }
          18% { transform: translateX(5px) rotate(4deg); }
          30% { transform: translateX(-4px) rotate(-3deg); }
          42% { transform: translateX(3px) rotate(2deg); }
          54% { transform: translateX(-2px) rotate(-1deg); }
          66% { transform: translateX(1px) rotate(0.5deg); }
          100% { transform: translateX(0) rotate(0); }
        }
        @keyframes skullEntrance {
          0% { transform: scale(0); opacity: 0; }
          35% { opacity: 1; }
          45% { transform: scale(1.15); }
          65% { transform: scale(0.94); }
          80% { transform: scale(1.04); }
          92% { transform: scale(0.99); }
          100% { transform: scale(1); }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
      <div className="flex flex-col items-center gap-[12px]">
        <div
          ref={skullRef}
          onClick={handleClick}
          style={{
            width: 100,
            height: 100,
            cursor: "pointer",
            animation: mounted
              ? "skullEntrance 0.8s both, rockSkull 3.2s ease-in-out infinite -2.2s, floatSkull 8.5s ease-in-out infinite -4s"
              : undefined,
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/skull.svg"
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
          />
        </div>
        <p
          className="text-[14px]"
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontWeight: 450,
            color: "#030303",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.4s ease-out 0.5s",
          }}
        >
          404
        </p>
      </div>
    </div>
    </>
  );
}
