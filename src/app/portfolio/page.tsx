"use client";

import { useEffect, useRef, useState } from "react";
import BreathingDots from "@/components/breathing-dots";
import Link from "next/link";

const SPRITE_FRAMES = 8;
const SPRITE_FRAME_DURATION = 100;
const SPRITE_W = 39;
const SPRITE_H = 43;

export default function Portfolio() {
  const [mounted, setMounted] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef(1);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      frameRef.current = (frameRef.current % SPRITE_FRAMES) + 1;
      if (imgRef.current) {
        imgRef.current.src = `/sprites/00${frameRef.current}.svg`;
      }
    }, SPRITE_FRAME_DURATION);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <BreathingDots />
      {/* Radial fade: hides breathing dots around the sprite area */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background: "radial-gradient(circle 180px at 50% 50%, #FAFAFA 0%, #FAFAFA 20%, transparent 100%)",
        }}
      />
      <div className="flex min-h-dvh justify-center items-center" style={{ position: "relative", zIndex: 2 }}>
        <Link
          href="/"
          className="inline-flex fixed top-[32px] left-[32px] z-50 text-[14px] tracking-[-0.2px] items-center gap-[6px] hover:opacity-50 transition-opacity duration-75"
          style={{
            color: "rgba(0,0,0,0.35)",
            fontFamily: "var(--font-geist-mono), monospace",
            transition: "opacity 75ms ease-out",
            lineHeight: "14px",
          }}
        >
          &larr;
        </Link>
        <div className="flex flex-col items-center gap-[12px]">
          <div
            style={{
              width: SPRITE_W,
              height: SPRITE_H,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out",
            }}
          >
            <img
              ref={imgRef}
              src="/sprites/001.svg"
              alt=""
              width={SPRITE_W}
              height={SPRITE_H}
              draggable={false}
              style={{
                imageRendering: "pixelated",
                display: "block",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          </div>
          <p
            className="text-[14px]"
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontWeight: 400,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out 0.5s",
            }}
          >
            <span style={{ color: "#030303", opacity: 0.45 }}>(coming soon)</span>
          </p>
        </div>
      </div>
    </>
  );
}
